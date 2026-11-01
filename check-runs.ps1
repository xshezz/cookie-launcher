$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\runs.json' | ConvertFrom-Json
foreach ($r in $json.workflow_runs) {
    Write-Host ("Run #" + $r.run_number + " - Status: " + $r.status + " - Conclusion: " + $r.conclusion + " - Event: " + $r.event)
}