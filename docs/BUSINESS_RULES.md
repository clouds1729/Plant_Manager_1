# Business Rules

## Plant Log Logic

Each plant log represents one plant/equipment record for one date.

Fields:

- date
- start time
- end time
- lunch hours
- unproductive hours
- unproductive type
- breakdown hours
- billable hours
- remarks

## Not On Site Rule

A plant is considered "not on site" only when both start time and end time are missing.

```ts
const notOnSite = !startTime && !endTime;


If start time and end time exist, the plant was on site, even if billable hours become 0.

Gross Hours

Gross hours are calculated from:

end time - start time - lunch hours

Gross hours cannot be negative.

Billable Hours

Billable hours are calculated from:

gross hours - unproductive hours - breakdown hours

Billable hours cannot be negative.

If deductions exceed gross hours, billable hours should be clamped to 0 and the row should show a warning.

Unproductive Time

Unproductive time means the plant was present, but work was prevented by external/site conditions.

Examples:

No Fuel
No Material
Weather Conditions
Other Site Delay

Unproductive time is deducted from billable hours.

Breakdown Time

Breakdown time means the plant was present but could not work because of mechanical failure.

Breakdown is deducted from billable hours.

Breakdown time and unproductive time must remain separate.

Duplicate Log Rule

The normal rule is:

one plant + one date = one primary log

If another row is imported for the same plant and date, it is a conflict.

The user must decide whether to:

keep existing
replace existing
skip imported row
create flagged duplicate
Rate Rule

Rates belong to a supplier and plant.

Rates should support effective dates.

A plant may have different rates over time.

IPC generation must use the correct rate for the log date or IPC period.

IPC Rule

An IPC is generated for:

one supplier
one project
one period
selected plants

IPC amount is based on:

sum of billable hours for selected plants during selected period × applicable rate

Missing rates should block IPC finalization.

Locking Rule

Once a log is included in a finalized or approved IPC, it should not be edited normally.

Corrections should be handled through admin override or correction records.

Audit Rule

Payment-sensitive changes must be audit logged.

Audit these entities:

plant logs
plant rates
suppliers
plants
IPCs
tax settings
approvals
