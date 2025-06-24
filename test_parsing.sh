#!/bin/bash

# Extract package names in order
packages=($(grep "> @.*@.*test" test-output.log | sed 's/> \(@[^@]*\)@.*/\1/'))
packages+=($(grep "> extremexp.*@.*test" test-output.log | sed 's/> \([^@]*\)@.*/\1/'))

# Extract test suite results in order
test_results=($(grep "Test Suites:" test-output.log))

echo "=== Test Results by Package ==="
result_index=0
for package in "${packages[@]}"; do
  if [ $result_index -lt ${#test_results[@]} ]; then
    # Get the full line with Test Suites results
    full_line=$(grep "Test Suites:" test-output.log | sed -n "$((result_index+1))p")
    if [[ $full_line =~ "failed" ]]; then
      echo "- ❌ **$package**: $full_line"
    else
      echo "- ✅ **$package**: $full_line"
    fi
    ((result_index++))
  fi
done

echo ""
echo "=== Overall Summary ==="
total_passed=$(grep -o "[0-9]* passed" test-output.log | awk '{sum += $1} END {print sum}')
total_failed=$(grep -o "[0-9]* failed" test-output.log | awk '{sum += $1} END {print sum}')
echo "Passed tests: $total_passed"
echo "Failed tests: $total_failed"
