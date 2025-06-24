#!/bin/bash

echo "=== Generated Test Summary ==="
GITHUB_STEP_SUMMARY="summary.md"

echo "## 🧪 Test Results Summary" > $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY

if [ -f test-output.log ]; then
  echo "### Test Results by Package" >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  
  # Extract package names in order (exclude root workspace, handle both @-scoped and regular packages)
  packages=($(grep "> @.*@.*test\|> extremexp.*@.*test" test-output.log | grep -v "extremexp@1.0.0 test" | sed 's/> \(@\?[^@]*\)@.*/\1/'))
  
  # Process each package's test results
  result_index=0
  for package in "${packages[@]}"; do
    # Get the corresponding test suite result
    full_line=$(grep "Test Suites:" test-output.log | sed -n "$((result_index+1))p")
    if [ -n "$full_line" ]; then
      if [[ $full_line =~ "failed" ]]; then
        echo "- ❌ **$package**: $full_line" >> $GITHUB_STEP_SUMMARY
      else
        echo "- ✅ **$package**: $full_line" >> $GITHUB_STEP_SUMMARY
      fi
      ((result_index++))
    fi
  done
  
  # Overall summary
  echo "" >> $GITHUB_STEP_SUMMARY
  total_test_lines=$(grep "Tests:" test-output.log | wc -l)
  total_passed=$(grep -o "[0-9]* passed" test-output.log | awk '{sum += $1} END {print sum}')
  total_failed=$(grep -o "[0-9]* failed" test-output.log | awk '{sum += $1} END {print sum}')
  
  if [[ ${total_failed:-0} -gt 0 ]]; then
    echo "🔥 **Overall**: ${total_failed:-0} tests failed, ${total_passed:-0} passed" >> $GITHUB_STEP_SUMMARY
  else
    echo "🎉 **Overall**: All ${total_passed:-0} tests passed!" >> $GITHUB_STEP_SUMMARY
  fi
  
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "📄 **View the detailed test output in the job logs above for more information.**" >> $GITHUB_STEP_SUMMARY
else
  echo "❌ **Test output file not found**" >> $GITHUB_STEP_SUMMARY
fi

# Display the generated summary
cat $GITHUB_STEP_SUMMARY
