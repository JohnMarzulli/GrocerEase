<#
PowerShell script to run SQL DDL against an Azure SQL DB using Azure AD token.
Usage:
  - In Cloud Shell (az login already configured): ./run-init.ps1 -ServerName "your-server.database.windows.net" -Database "GrocerEaseDB" -SqlFile "sql/ddl/init.sql"
  - Locally: run `az login` first and ensure your IP is allowed in the DB firewall, then run the script.

Requires: Azure CLI (az), PowerShell, SqlServer module (for Invoke-Sqlcmd).
#>

param(
  [Parameter(Mandatory=$true)][string] $ServerName,
  [Parameter(Mandatory=$true)][string] $Database,
  [Parameter(Mandatory=$true)][string] $SqlFile
)

# Ensure SqlServer module is available
if (-not (Get-Module -ListAvailable -Name SqlServer)) {
  Write-Host "SqlServer module not found. Installing to current user..." -ForegroundColor Yellow
  Install-Module -Name SqlServer -Scope CurrentUser -Force -AllowClobber
}

# Get access token for Azure SQL
$token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
if (-not $token) { throw "Failed to acquire access token. Ensure you are logged in (az login) and have appropriate permissions." }

Write-Host "Executing SQL file against $ServerName/$Database..." -ForegroundColor Green
Invoke-Sqlcmd -ServerInstance "tcp:$ServerName,1433" -Database $Database -AccessToken $token -InputFile $SqlFile -ErrorAction Stop

Write-Host "DDL applied successfully." -ForegroundColor Green
