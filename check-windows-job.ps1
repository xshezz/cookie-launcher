$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\jobs3.json' | ConvertFrom-Json
foreach ($j in $json.jobs) {
    if ($j.name -like '*windows*') {
        Write-Host ("Windows Job ID: " + $j.id)
        Write-Host ("Log URL: " + $j.logs_url)
    }
}