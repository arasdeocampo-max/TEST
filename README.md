README.md
Pharmacy Inventory Management System (PIMS) – Demo (No Backend)

Static front-end demo app using **HTML + CSS + vanilla JavaScript** with **LocalStorage** as a fake database.

## How to Run
1. Clone/download this folder.
2. Open `index.html` directly in any modern browser.
3. The app seeds demo data automatically on first load.

## Demo Accounts
- **Admin**: `admin` / `admin123`
- **Staff**: `staff` / `staff123`

## LocalStorage Keys
- `pims_users`
- `pims_medicines`
- `pims_batches`
- `pims_transactions`
- `pims_settings`
- `pims_session`
- `pims_audit` (extra for audit trail)

## Feature Checklist
- [x] Login/logout with role-based UI guarding (admin vs staff)
- [x] Dashboard metrics (Total Items, Low Stock, Near Expiry, Expired)
- [x] Medicine Masterlist CRUD + archive, search, filters
- [x] Batch tracking with FEFO sorting and expiry status
- [x] Stock-In with box/base-unit conversion using `packSize`
- [x] Dispense/Stock-Out with FEFO suggestion and expired-batch prevention
- [x] Rx medicines require prescription verification (configurable in settings)
- [x] Adjustments (expired disposal, damaged, missing, correction)
- [x] Alerts (low stock, near expiry, expired) update after transactions
- [x] Reports:
  - [x] Stock Status table + CSV export
  - [x] Expiry timeline buckets (expired, 0-30, 31-60, 61-90, 90+)
  - [x] Stock Movement report with date/type filters + CSV export
- [x] Audit trail for critical actions
- [x] System settings (Admin only): warningDays, categories, Rx verification toggle
- [x] State persists across refresh via LocalStorage

## Notes
- This is a **demo-only** implementation and not production security.
- Authentication is stored in LocalStorage for simulation purposes only.


## Troubleshooting
- If you do not see the expanded medicine list, refresh once. The app now auto-migrates old LocalStorage seed data to the latest seed version.
- If needed for a clean demo state, clear browser LocalStorage for this page and reload.
