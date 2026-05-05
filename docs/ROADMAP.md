## `docs/DATABASE.md`

```md
# Database Design

## Core Tables

### organizations

Represents a company using the platform.

Fields:

- id
- name
- country
- currency
- logo_url
- created_at
- updated_at

### users

Supabase Auth manages users.

Application-specific user data can be stored in profiles if needed.

### organization_members

Links users to organizations.

Fields:

- id
- organization_id
- user_id
- role
- status
- created_at

Roles:

- owner
- admin
- project_manager
- finance
- foreman
- viewer
- supplier_viewer

### projects

Fields:

- id
- organization_id
- name
- location
- client_name
- contractor_name
- start_date
- end_date
- status
- created_at
- updated_at

### suppliers

Fields:

- id
- organization_id
- name
- contact_name
- phone
- email
- tax_id
- address
- created_at
- updated_at

### plants

Fields:

- id
- organization_id
- project_id
- supplier_id
- type
- registration_number
- category
- photo_url
- contract_start
- contract_end
- status
- created_at
- updated_at

### plant_logs

Fields:

- id
- organization_id
- project_id
- plant_id
- date
- start_time
- end_time
- lunch_hours
- unproductive_hours
- unproductive_type
- breakdown_hours
- billable_hours
- remarks
- source
- approval_status
- created_by
- approved_by
- approved_at
- created_at
- updated_at

Possible sources:

- manual
- excel
- scan
- correction

Approval statuses:

- draft
- submitted
- approved
- locked

### plant_rates

Fields:

- id
- organization_id
- supplier_id
- plant_id
- rate
- unit
- effective_from
- effective_to
- note
- created_by
- created_at

Units:

- hour
- day
- month
- fixed

### ipc_periods

Fields:

- id
- organization_id
- project_id
- supplier_id
- period_start
- period_end
- ipc_number
- status
- subtotal
- tax_total
- total
- created_by
- approved_by
- approved_at
- created_at

Statuses:

- draft
- submitted
- approved
- paid
- void

### ipc_period_plants

Fields:

- id
- ipc_period_id
- plant_id

### ipc_lines

Fields:

- id
- ipc_period_id
- plant_id
- hours
- rate
- subtotal
- tax_amount
- total

### imports

Fields:

- id
- organization_id
- project_id
- source_type
- file_url
- status
- created_by
- created_at

Source types:

- excel
- scan

Statuses:

- uploaded
- parsed
- reviewed
- committed
- cancelled

### import_rows

Fields:

- id
- import_id
- plant_match_id
- raw_data
- parsed_data
- validation_status
- conflict_status
- resolution_action
- committed_log_id
- created_at

### audit_logs

Fields:

- id
- organization_id
- actor_id
- entity_type
- entity_id
- action
- before_json
- after_json
- created_at
