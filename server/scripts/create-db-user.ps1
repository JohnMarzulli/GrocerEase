<#
Create a contained database user for an Azure Managed Identity and grant roles.

Usage (Azure Cloud Shell recommended):
  ./create-db-user.ps1 -ManagedIdentityName "grocerease-id-891f" -Server "grocerease.database.windows.net" -Database "grocerease"

This script uses your Azure CLI login (az login) to acquire an access token and runs the SQL via Invoke-Sqlcmd with -AccessToken.
#>

param(
    [Parameter(Mandatory = $true)] [string] $ManagedIdentityName,
    [Parameter(Mandatory = $true)] [string] $Server,
    [Parameter(Mandatory = $true)] [string] $Database
)

try {
    Write-Host "Acquiring Azure AD access token for Azure SQL..." -ForegroundColor Cyan
    $token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
    if (-not $token) { throw "Failed to acquire access token. Run 'az login' and try again." }

    $createUserSql = @"
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'$ManagedIdentityName')
  BEGIN
    CREATE USER [$ManagedIdentityName] FROM EXTERNAL PROVIDER;
  END

IF NOT EXISTS (SELECT * FROM sys.database_role_members m JOIN sys.database_principals r ON m.role_principal_id = r.principal_id WHERE r.name = 'db_datareader' AND m.member_principal_id = USER_ID(N'$ManagedIdentityName'))
  BEGIN
    ALTER ROLE db_datareader ADD MEMBER [$ManagedIdentityName];
  END

IF NOT EXISTS (SELECT * FROM sys.database_role_members m JOIN sys.database_principals r ON m.role_principal_id = r.principal_id WHERE r.name = 'db_datawriter' AND m.member_principal_id = USER_ID(N'$ManagedIdentityName'))
  BEGIN
    ALTER ROLE db_datawriter ADD MEMBER [$ManagedIdentityName];
  END
"@

    Write-Host "Running SQL against $Server/$Database..." -ForegroundColor Cyan

    $maxAttempts = 5
    $attempt = 0
    $success = $false
    while (-not $success -and $attempt -lt $maxAttempts) {
        $attempt++
        try {
            Write-Host "Attempt ${attempt}: executing SQL..." -ForegroundColor Cyan
            Invoke-Sqlcmd -ServerInstance "tcp:$Server,1433" -Database $Database -AccessToken $token -Query $createUserSql -ConnectionTimeout 120 -QueryTimeout 120 -ErrorAction Stop
            $success = $true
            Write-Host "Done: managed identity user created / roles granted (idempotent)." -ForegroundColor Green
        }
        catch {
            Write-Warning "Attempt ${attempt} failed: $($_.Exception.Message)"
            if ($attempt -lt $maxAttempts) {
                $delay = 5 * $attempt
                Write-Host "Retrying in $delay seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds $delay
            }
            else {
                Write-Error "All attempts failed. Please check network/firewall settings and that your AAD admin has access to the database."
                throw
            }
        }
    }
}
catch {
    Write-Error "Error: $($_.Exception.Message)"
    throw
}
