# setup-env.ps1
# Secure Backup and Restore for SkillShare Environment Credentials

$BackupPath = "$Home\.skillshare-env-backup"
$EnvFilePath = "$PSScriptRoot\frontend\.env.local"

# Ensure the frontend folder exists
if (!(Test-Path "$PSScriptRoot\frontend")) {
    New-Item -ItemType Directory -Force -Path "$PSScriptRoot\frontend" | Out-Null
}

if (Test-Path $BackupPath) {
    Write-Host "[SUCCESS] Secure local backup found at $BackupPath" -ForegroundColor Green
    Write-Host "Restoring credentials to frontend/.env.local..." -ForegroundColor Cyan
    Copy-Item -Path $BackupPath -Destination $EnvFilePath -Force
    Write-Host "Environment variables setup completed successfully!" -ForegroundColor Green
} 
elseif (Test-Path $EnvFilePath) {
    Write-Host "[INFO] Found existing frontend/.env.local. Creating local backup..." -ForegroundColor Yellow
    Copy-Item -Path $EnvFilePath -Destination $BackupPath -Force
    Write-Host "[SUCCESS] Secure backup created successfully at $BackupPath" -ForegroundColor Green
    Write-Host "(This folder is in your home directory and will NOT be committed to Git)" -ForegroundColor DarkGray
} 
else {
    Write-Host "[WARN] No local backup or frontend/.env.local found." -ForegroundColor Yellow
    Write-Host "Please enter your configuration to set them up and create a backup:" -ForegroundColor Cyan
    
    $SupabaseUrl = Read-Host "Enter your VITE_SUPABASE_URL"
    $SupabaseAnonKey = Read-Host "Enter your VITE_SUPABASE_ANON_KEY"
    $Theme = Read-Host "Enter your VITE_THEME [Default: warm-sunset]"
    if ([string]::IsNullOrEmpty($Theme)) { $Theme = "warm-sunset" }

    $EnvContent = @"
# Supabase Configuration
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$SupabaseAnonKey

# Professional Styling Toggle
VITE_THEME=$Theme
"@

    Set-Content -Path $EnvFilePath -Value $EnvContent -Force
    Set-Content -Path $BackupPath -Value $EnvContent -Force

    Write-Host "[SUCCESS] Created frontend/.env.local and saved backup to $BackupPath!" -ForegroundColor Green
}
