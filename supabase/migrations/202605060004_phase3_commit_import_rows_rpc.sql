create or replace function commit_import_rows(p_import_id uuid)
returns table(inserted_count integer, updated_count integer, skipped_count integer)
language plpgsql
security definer
as $$
declare
  v_import imports%rowtype;
  v_row import_rows%rowtype;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_log_id uuid;
  v_date date;
  v_existing_log_id uuid;
begin
  select * into v_import from imports where id = p_import_id;
  if not found then
    raise exception 'Import % does not exist', p_import_id;
  end if;

  if v_import.status not in ('parsed', 'reviewed') then
    raise exception 'Import % must be in parsed or reviewed status; current status: %', p_import_id, v_import.status;
  end if;

  for v_row in
    select * from import_rows where import_id = p_import_id order by created_at asc
  loop
    if v_row.import_id <> p_import_id then
      raise exception 'Import row % does not belong to import %', v_row.id, p_import_id;
    end if;

    if v_row.validation_status = 'invalid' then
      raise exception 'Import row % is invalid and cannot be committed', v_row.id;
    end if;

    if v_row.plant_match_id is null then
      raise exception 'Import row % is unmatched and cannot be committed', v_row.id;
    end if;

    if v_row.resolution_action = 'skip_imported' then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_row.resolution_action = 'keep_existing' then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if v_row.resolution_action = 'create_flagged_duplicate' then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    if not (v_row.parsed_data ? 'date') then
      raise exception 'Import row % missing parsed date', v_row.id;
    end if;

    if not (v_row.parsed_data ? 'billable_hours') then
      raise exception 'Import row % missing parsed billable_hours', v_row.id;
    end if;

    begin
      v_date := (v_row.parsed_data ->> 'date')::date;
    exception when others then
      raise exception 'Import row % has invalid parsed date', v_row.id;
    end;

    if v_row.conflict_status = 'conflict' then
      if v_row.resolution_action <> 'replace_existing' then
        raise exception 'Import row % conflict requires replace_existing, keep_existing, skip_imported, or create_flagged_duplicate', v_row.id;
      end if;

      select id into v_existing_log_id
      from plant_logs
      where plant_id = v_row.plant_match_id and date = v_date
      limit 1;

      if v_existing_log_id is null then
        raise exception 'Import row % marked replace_existing but no matching plant/date log exists', v_row.id;
      end if;

      update plant_logs
      set project_id = v_import.project_id,
          date = v_date,
          start_time = nullif(v_row.parsed_data ->> 'start_time', '')::time,
          end_time = nullif(v_row.parsed_data ->> 'end_time', '')::time,
          lunch_hours = coalesce((v_row.parsed_data ->> 'lunch_hours')::numeric, 0),
          unproductive_hours = coalesce((v_row.parsed_data ->> 'unproductive_hours')::numeric, 0),
          breakdown_hours = coalesce((v_row.parsed_data ->> 'breakdown_hours')::numeric, 0),
          billable_hours = coalesce((v_row.parsed_data ->> 'billable_hours')::numeric, 0),
          remarks = v_row.parsed_data ->> 'remarks',
          source = 'excel'
      where id = v_existing_log_id;

      update import_rows set committed_log_id = v_existing_log_id where id = v_row.id;
      v_updated := v_updated + 1;
    else
      if v_row.resolution_action is not null then
        raise exception 'Import row % has non-conflict status but unexpected resolution action %', v_row.id, v_row.resolution_action;
      end if;

      insert into plant_logs (
        organization_id,
        project_id,
        plant_id,
        date,
        start_time,
        end_time,
        lunch_hours,
        unproductive_hours,
        breakdown_hours,
        billable_hours,
        remarks,
        source
      )
      values (
        v_import.organization_id,
        v_import.project_id,
        v_row.plant_match_id,
        v_date,
        nullif(v_row.parsed_data ->> 'start_time', '')::time,
        nullif(v_row.parsed_data ->> 'end_time', '')::time,
        coalesce((v_row.parsed_data ->> 'lunch_hours')::numeric, 0),
        coalesce((v_row.parsed_data ->> 'unproductive_hours')::numeric, 0),
        coalesce((v_row.parsed_data ->> 'breakdown_hours')::numeric, 0),
        coalesce((v_row.parsed_data ->> 'billable_hours')::numeric, 0),
        v_row.parsed_data ->> 'remarks',
        'excel'
      ) returning id into v_log_id;

      update import_rows set committed_log_id = v_log_id where id = v_row.id;
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  update imports set status = 'committed' where id = p_import_id;

  return query select v_inserted, v_updated, v_skipped;
end;
$$;
