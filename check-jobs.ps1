$json = Get-Content 'C:\Users\ders\Documents\cookie-launcher-custom\jobs.json' | ConvertFrom-Json
foreach ($j in $json.jobs) {
    Write-Host ("Job: " + $j.name + " - Status: " + $j.status + " - Conclusion: " + $j.conclusion)
    foreach ($s in $j.steps) {
        if ($s.conclusion -eq "failure") {
            Write-Host ("  FAILED STEP: " + $s.name)
        }
    }
}