create or replace function public.finalize_ipc_period(
  p_project_id uuid,
  p_supplier_id uuid,
  p_period_start date,
  p_period_end date,
  p_selected_plant_ids uuid[],
  p_tax_percent numeric,
  p_lines jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_org_id uuid;
  v_ipc_period_id uuid;
  v_inserted_line_count integer;
  v_tax_percent numeric := coalesce(p_tax_percent, 0);
begin
  if p_selected_plant_ids is null or coalesce(array_length(p_selected_plant_ids, 1), 0) = 0 then
    raise exception 'selected plant list cannot be empty';
  end if;

  if p_period_end < p_period_start then
    raise exception 'period_end must be greater than or equal to period_start';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'line items are required';
  end if;

  select p.organization_id
  into v_org_id
  from projects p
  where p.id = p_project_id;

  if v_org_id is null then
    raise exception 'project not found';
  end if;

  if not exists (
    select 1 from suppliers s where s.id = p_supplier_id and s.organization_id = v_org_id
  ) then
    raise exception 'supplier does not belong to project organization';
  end if;


  if exists (
    select 1
    from unnest(p_selected_plant_ids) plant_id
    left join plants p on p.id = plant_id
    where p.id is null
  ) then
    raise exception 'one or more selected plants do not exist';
  end if;

  if exists (
    select 1
    from plants p
    where p.id = any(p_selected_plant_ids)
      and (p.project_id <> p_project_id or p.supplier_id <> p_supplier_id or p.organization_id <> v_org_id)
  ) then
    raise exception 'selected plants must belong to supplier/project/organization';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_lines) as l(plant_id uuid, log_id uuid, log_date date, hours numeric, rate numeric, subtotal numeric, tax_amount numeric, total numeric)
    where l.plant_id is null or l.log_id is null or l.log_date is null
      or l.hours is null or l.rate is null or l.subtotal is null or l.tax_amount is null or l.total is null
      or not (l.plant_id = any(p_selected_plant_ids))
  ) then
    raise exception 'line items must include required fields and only selected plants';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_lines) as l(plant_id uuid, log_id uuid, log_date date)
    left join plant_logs pl on pl.id = l.log_id
    where pl.id is null
      or pl.project_id <> p_project_id
      or pl.plant_id <> l.plant_id
      or pl.date <> l.log_date
      or pl.date < p_period_start
      or pl.date > p_period_end
      or pl.ipc_period_id is not null
  ) then
    raise exception 'line items must map to unlocked logs in selected period/project/plants';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_lines) as l(plant_id uuid, log_date date, rate numeric)
    left join lateral (
      select pr.rate
      from plant_rates pr
      where pr.supplier_id = p_supplier_id
        and pr.plant_id = l.plant_id
        and pr.effective_from <= l.log_date
        and (pr.effective_to is null or pr.effective_to >= l.log_date)
      order by pr.effective_from desc
      limit 1
    ) matched_rate on true
    where matched_rate.rate is null
      or matched_rate.rate <> l.rate
  ) then
    raise exception 'missing or mismatched effective rates detected';
  end if;

  insert into ipc_periods (
    organization_id, project_id, supplier_id, period_start, period_end, status, subtotal, tax_total, total
  )
  values (
    v_org_id,
    p_project_id,
    p_supplier_id,
    p_period_start,
    p_period_end,
    'finalized',
    (select coalesce(sum((x->>'subtotal')::numeric), 0) from jsonb_array_elements(p_lines) x),
    (select coalesce(sum((x->>'tax_amount')::numeric), 0) from jsonb_array_elements(p_lines) x),
    (select coalesce(sum((x->>'total')::numeric), 0) from jsonb_array_elements(p_lines) x)
  )
  returning id into v_ipc_period_id;

  insert into ipc_period_plants (ipc_period_id, plant_id)
  select v_ipc_period_id, unnest(p_selected_plant_ids);

  insert into ipc_lines (ipc_period_id, plant_id, log_id, log_date, hours, rate, subtotal, tax_amount, total)
  select v_ipc_period_id, l.plant_id, l.log_id, l.log_date, l.hours, l.rate, l.subtotal, l.tax_amount, l.total
  from jsonb_to_recordset(p_lines) as l(plant_id uuid, log_id uuid, log_date date, hours numeric, rate numeric, subtotal numeric, tax_amount numeric, total numeric);

  get diagnostics v_inserted_line_count = row_count;

  update plant_logs pl
  set ipc_period_id = v_ipc_period_id
  where pl.id in (
    select l.log_id from jsonb_to_recordset(p_lines) as l(log_id uuid)
  );

  if v_inserted_line_count = 0 then
    raise exception 'no line items inserted';
  end if;

  return v_ipc_period_id;
end;
$$;
