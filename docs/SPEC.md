# Product Specification

## Product Name

Plant Manager

## Summary

Plant Manager is a construction equipment operations and subcontractor payment platform.

It helps construction companies track plant/equipment usage, calculate billable hours, manage supplier rates, generate IPCs, and maintain reliable payment records.

## Target Customers

- Construction companies
- Civil engineering contractors
- Road contractors
- Equipment rental managers
- Project finance/admin teams
- Site engineers and foremen

## Core Problem

Construction equipment hours are often tracked using paper timesheets, Excel files, WhatsApp images, and manual payment calculations.

This creates problems:

- duplicate entries
- missing logs
- disputed hours
- wrong rates
- inconsistent IPC totals
- poor auditability
- messy supplier payment history

Plant Manager solves this by centralizing plant logs, supplier rates, imports, approvals, and IPC generation.

## Core Entities

- Organization
- User
- Project
- Supplier
- Plant
- Plant Log
- Plant Rate
- IPC Period
- IPC Line
- Import
- Audit Log

## Main Workflows

### 1. Project Setup

Admin creates an organization and project.

### 2. Supplier Setup

Admin or finance user creates suppliers.

### 3. Plant Setup

User registers plants/equipment under suppliers and projects.

Each plant has:

- equipment type
- registration number
- supplier
- project
- category
- status
- optional photo

### 4. Daily Logging

Foreman or engineer logs daily equipment usage.

Each log records:

- date
- start time
- end time
- lunch
- unproductive hours
- unproductive type
- breakdown hours
- remarks

The system calculates billable hours.

### 5. Rate Management

Finance/admin users define rate history per plant.

Rates may change over time.

### 6. IPC Generation

Finance user creates IPC for:

- supplier
- project
- date period
- selected plants

The system calculates line items and totals.

### 7. Import

Future phases support:

- Excel import
- AI scan import

Both imports must use staging and conflict detection.

### 8. Approval

Future phases support approval workflows for logs and IPCs.

## Non-Goals for Phase 1

Phase 1 should not implement:

- IPC generation
- Excel import
- Scan import
- Supplier portal
- Billing/subscriptions
- Advanced reports
- Mobile offline mode

## Phase 1 Acceptance Criteria

A user should be able to:

1. Sign in.
2. Create or select an organization.
3. Create a project.
4. Create a supplier.
5. Create a plant.
6. Log daily hours for a plant.
7. See correct billable hours.
8. View basic dashboard totals.
9. Run unit tests for hour calculations.
