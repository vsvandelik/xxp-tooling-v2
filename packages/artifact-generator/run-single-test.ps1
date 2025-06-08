# Get the test case name from command line arguments
param(
    [Parameter(Mandatory=$true)]
    [string]$testCase
)

Write-Host "Running single integration test for: $testCase"

# Clear debug-related environment variables
$env:NODE_OPTIONS = $null
$env:NODE_INSPECT = $null
$env:NODE_INSPECT_RESUME_ON_START = $null
$env:TEST_CASE = $testCase

# Run Jest
& npx jest __tests__/SingleIntegration.test.ts --verbose
