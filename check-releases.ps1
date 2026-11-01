$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\releases.json' | ConvertFrom-Json
foreach ($r in $json) {
    Write-Host ("Release: " + $r.tag_name + " - " + $r.name)
    foreach ($a in $r.assets) {
        Write-Host ("  Asset: " + $a.name + " (" + [math]::Round($a.size/1MB, 2) + " MB)")
    }
}