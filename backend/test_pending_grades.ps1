# Test pending grades endpoint
$loginBody = @{
    email    = "admin@university.edu"
    password = "admin"
} | ConvertTo-Json

Write-Host "Logging in as admin..."
$loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

$token = $loginResponse.token
Write-Host "Login successful!"
Write-Host ""

# Test the pending grades endpoint
Write-Host "Fetching pending grades for approval..."
$headers = @{
    "x-auth-token" = $token
}

try {
    $pendingGrades = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/grades/pending-approval" -Method Get -Headers $headers
    Write-Host "Successfully fetched pending grades:"
    Write-Host "Count: $($pendingGrades.Count)"
    if ($pendingGrades.Count -gt 0) {
        Write-Host ($pendingGrades | ConvertTo-Json -Depth 3)
    }
    else {
        Write-Host "No pending grades found (this is normal if no teachers have submitted grades yet)"
    }
}
catch {
    Write-Host "Error fetching pending grades:"
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}
