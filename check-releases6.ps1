$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\releases6.json' | ConvertFrom-Json
foreach ($r in $json) {
    Write-Host ("Release: " + $r.tag_name + " - Assets: " + $r.assets.Count)
}