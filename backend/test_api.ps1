# Login as admin
$loginBody = @{
    email = "admin@university.edu"
    password = "admin"
} | ConvertTo-Json

Write-Host "Logging in as admin..."
$loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

$token = $loginResponse.token
Write-Host "Login successful! Token obtained."
Write-Host ""

# Test the pending links endpoint
Write-Host "Fetching pending links..."
$headers = @{
    "x-auth-token" = $token
}

try {
    $pendingLinks = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/links/pending" -Method Get -Headers $headers
    Write-Host "Successfully fetched pending links:"
    Write-Host ($pendingLinks | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "Error fetching pending links:"
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}
