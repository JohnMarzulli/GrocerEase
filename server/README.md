# GrocerEase Server (Azure Functions)

## Publishing

From the `server` sub folder:

```powershell
az functionapp config appsettings delete `
  --resource-group RG-GrocerEase `
  --name fa-grocerease `
  --setting-names WEBSITE_RUN_FROM_PACKAGE
```

### DB Setup

```tsql
CREATE USER [fa-grocerease] FROM EXTERNAL PROVIDER
ALTER ROLE db_datareader ADD MEMBER [fa-grocerease]
ALTER ROLE db_datawriter ADD MEMBER [fa-grocerease]
```


## Background

This folder contains a minimal Azure Functions project that exposes these HTTP endpoints:

- GET /api/lists -> list summaries
- GET /api/lists/{id} -> full list with items
- POST /api/lists/upload -> upload a full local list (create list + items)

Configuration

- For local dev you can set `AZURE_SQL_CONNECTION` in `local.settings.json` with an ADO.NET connection string (SQL auth) to test DB integration.
- If you use Managed Identity / AAD-only auth in Azure, the functions will acquire a token with `@azure/identity` and pass it to the DB driver. To enable Managed Identity:

  1. Assign a system-assigned or user-assigned Managed Identity to your Function App.
  2. Connect to the DB as an admin and run:

     ```sql
     CREATE USER [<your-function-app-name>] FROM EXTERNAL PROVIDER;
     ALTER ROLE db_datareader ADD MEMBER [<your-function-app-name>];
     ALTER ROLE db_datawriter ADD MEMBER [<your-function-app-name>];
     ```

  3. Ensure the Function App's identity has access to the database and the Function app runs in the same subscription or has cross-tenant permissions set.

  Locally you can keep `AZURE_SQL_CONNECTION` set to: `Server=tcp:grocerease.database.windows.net,1433;Initial Catalog=grocerease;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication=Active Directory Default;` and use `az login` to authenticate.

How to run locally

- Install Azure Functions Core Tools and Node 18+.
- From `server/` run `npm install`, then `func start`.
- To run against your Azure SQL from local, add `AZURE_SQL_CONNECTION` to `local.settings.json` and ensure your IP is allowed in the DB firewall.

Notes

- This implementation attempts to use AZURE_SQL_CONNECTION (recommended for local testing). If unset, the functions use an in-memory store so endpoints are usable for local front-end development without a DB.
- Later: I can add Managed Identity DB connection support once you confirm running in Azure Function with assigned identity.
