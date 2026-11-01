$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\jobs4.json' | ConvertFrom-Json
foreach ($j in $json.jobs) {
    Write-Host ("Job: " + $j.name + " - Status: " + $j.status + " - Conclusion: " + $j.conclusion)
}