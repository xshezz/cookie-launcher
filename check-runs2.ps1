$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\runs2.json' | ConvertFrom-Json
$runs = $json.workflow_runs | Select-Object -First 3
foreach ($r in $runs) {
    Write-Host ("Run #" + $r.run_number + " - Status: " + $r.status + " - Conclusion: " + $r.conclusion + " - Event: " + $r.event)
}