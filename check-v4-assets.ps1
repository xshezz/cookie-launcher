$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\releases6.json' | ConvertFrom-Json
foreach ($r in $json) {
    if ($r.tag_name -eq "v4.0.0") {
        foreach ($a in $r.assets) {
            Write-Host ("  Asset: " + $a.name + " (" + [math]::Round($a.size/1MB, 2) + " MB)")
        }
    }
}