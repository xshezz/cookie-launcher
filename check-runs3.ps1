$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\runs3.json' | ConvertFrom-Json
$r = $json.workflow_runs[0]
Write-Host ("Latest Run: #" + $r.run_number + " - Status: " + $r.status + " - SHA: " + $r.head_sha.Substring(0,7))