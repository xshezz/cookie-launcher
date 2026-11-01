$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\run7.json' | ConvertFrom-Json
Write-Host ("Head SHA: " + $json.head_sha)
Write-Host ("Head Branch: " + $json.head_branch)