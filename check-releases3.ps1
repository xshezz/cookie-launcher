$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\releases3.json' | ConvertFrom-Json
foreach ($r in $json) {
    Write-Host ("Release: " + $r.tag_name + " - Assets: " + $r.assets.Count)
}