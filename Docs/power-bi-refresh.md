# Power BI Scheduled Refresh

This app already exports Power BI-ready CSV files for training load reporting. The recommended first automation path is:

1. Users log training and wellness in the app.
2. A coach uploads the Power BI export files to OneDrive from Settings.
3. Power BI reads those OneDrive files.
4. Power BI Service refreshes the semantic model on a schedule.

This keeps Firebase as the app database and uses OneDrive as the reporting source Power BI can refresh reliably.

## What The App Exports

The Power BI export creates these files:

- `fact_gym_sets.csv`
- `fact_activity.csv`
- `fact_sessions.csv`
- `fact_wellness.csv`
- `fact_sports_load.csv`
- `fact_football_load.csv`
- `dim_exercise.csv`
- `dim_athlete.csv`
- `export_meta.json`

Power BI reports should treat these filenames and columns as the stable reporting contract.

## One-Time App Setup

The OneDrive upload uses Microsoft Graph from the browser, so you need an Azure app registration:

1. Go to `https://portal.azure.com`.
2. Open Azure Active Directory, then App registrations.
3. Create a new registration named `TrainingLog Export`.
4. Use account type `Accounts in any organizational directory and personal Microsoft accounts`, unless your organization requires a narrower setting.
5. Add a Single-page application redirect URI for the deployed app URL, plus `/auth-redirect.html`.
   - GitHub Pages example: `https://johanneslie1.github.io/Traininglog/auth-redirect.html`
   - Local development example: `http://localhost:3000/auth-redirect.html`
6. Copy the Application (client) ID.
7. Add Microsoft Graph delegated permission `Files.ReadWrite`.
8. Paste the client ID into Settings in the app.

## Coach Workflow

1. Open Settings.
2. Choose the export scope: own data, one athlete, selected athletes, one team, or all coached athletes.
3. Choose a date range. Use `All time` for the first Power BI load.
4. Click `Upload to OneDrive (Power BI Auto-Refresh)`.
5. Sign in to Microsoft when prompted.

The app writes the CSV files to `/TrainingLog/` in the signed-in OneDrive account.

For routine refreshes, use the same scope and date range so Power BI sees the same file names and schema each time.

## Power BI Setup

1. Open Power BI Desktop.
2. Connect to the files in the `/TrainingLog/` OneDrive folder.
3. Build relationships around the shared keys:
   - `athlete_id`
   - `session_id`
   - `exercise_id`
   - date fields such as `logged_date` and `date`
4. Publish the report to Power BI Service.
5. In Power BI Service, open the semantic model settings.
6. Configure data source credentials for OneDrive.
7. Turn on scheduled refresh.

Power BI Pro supports up to 8 scheduled refreshes per day. Premium Per User, Premium, or Fabric capacity can support more frequent scheduled refresh.

## Limits Of This First Version

This workflow is automatic from Power BI's side, but the CSV upload is still user-triggered from the app. A browser-only React app cannot reliably run a scheduled export while nobody has the app open.

If fully unattended refresh becomes required, the next step should be a backend reporting job:

- Firebase Cloud Function or scheduled server job reads Firestore with the Admin SDK.
- The job writes the same fact/dimension files to a reporting source, or exposes stable HTTPS endpoints.
- Power BI refreshes that backend-managed source.

Keep the current CSV schemas as the contract when moving to a backend job so existing Power BI reports do not break.
