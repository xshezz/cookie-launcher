$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\runs9.json' | ConvertFrom-Json
$r = $json.workflow_runs[0]
Write-Host ("Run #" + $r.run_number + " - Status: " + $r.status + " - Conclusion: " + $r.conclusion)