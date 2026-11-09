$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
$previousDatabaseUrl = $env:DATABASE_URL
$secureUrl = Read-Host "Paste the NEW Render EXTERNAL Database URL" -AsSecureString
$urlPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)

try {
    $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($urlPointer)
    Push-Location $backendRoot
    & npx prisma db push
    if ($LASTEXITCODE -ne 0) {
        throw "Prisma db push failed with exit code $LASTEXITCODE."
    }
    Write-Host "Database schema push completed."
}
finally {
    if ((Get-Location).Path -eq $backendRoot) {
        Pop-Location
    }
    if ($null -eq $previousDatabaseUrl) {
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    }
    else {
        $env:DATABASE_URL = $previousDatabaseUrl
    }
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($urlPointer)
}