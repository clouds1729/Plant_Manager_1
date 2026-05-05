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
