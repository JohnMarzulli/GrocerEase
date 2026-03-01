GrocerEase SQL - setup and usage

Files
- `ddl/init.sql` - initial schema (lists, items, indexes)
- `run-init.ps1` - PowerShell runner that uses Azure AD token to execute the SQL file

How to run

1) Using Azure Cloud Shell (recommended for AAD-only DBs)
   - Open Azure Portal -> Cloud Shell (PowerShell)
   - Clone the repo or upload the `sql` folder
   - Run: `./sql/run-init.ps1 -ServerName "<server-name>.database.windows.net" -Database "GrocerEaseDB" -SqlFile "sql/ddl/init.sql"`

2) Locally (PowerShell)
   - Ensure Azure CLI is installed and run `az login` to sign in
   - Ensure your IP is allowed in the SQL server firewall (or use Cloud Shell to avoid firewall issues)
   - Run:
     ```powershell
     ./sql/run-init.ps1 -ServerName "<server-name>.database.windows.net" -Database "GrocerEaseDB" -SqlFile "sql/ddl/init.sql"
     ```

Notes & best practices
- Your server uses Microsoft Entra-only auth. The runner script uses `az account get-access-token` so no SQL username/password is required.
- For automation or production, use a Managed Identity for your App Service/Function and grant it DB access (create a contained user in the DB: `CREATE USER [appName] FROM EXTERNAL PROVIDER;` then add to `db_datareader`/`db_datawriter`).
- Consider using a migration tool (Flyway, Liquibase) if schema evolves over time.

If you want, I can add a GitHub Actions job to run this on merge or provide a SQL migration workflow.