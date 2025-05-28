# Integration Testing for Artifact Generator

The artifact generator now supports comprehensive integration testing that allows you to define complete test scenarios in single files with multiple input files and expected output.

## Test File Format

Integration tests use a custom file format that combines multiple input files and expected output in a single test file:

```
=== TEST NAME: Test Name ===

=== DESCRIPTION: Optional test description ===

=== FILE: filename1.xxp ===
[content of first workflow file]

=== FILE: filename2.xxp ===
[content of second workflow file]

=== FILE: experiment.espace ===
[content of experiment file]

=== EXPECTED OUTPUT ===
{
  "experiment": "ExperimentName",
  "version": "1.0",
  ...expected JSON output...
}
```

## Section Types

- **TEST NAME**: Optional name for the test case
- **DESCRIPTION**: Optional description of what the test validates
- **FILE: filename**: Content of an input file (can have multiple FILE sections)
- **EXPECTED OUTPUT**: Expected JSON output from artifact generation

## Usage

### Running Integration Tests

Integration tests are automatically included in the Jest test suite:

```bash
# Run all tests including integration tests
npm test

# Run only integration tests  
npm test -- --testNamePattern="Integration Tests"
```

### Creating New Integration Tests

1. Create a new `.test.xxp` file in `__tests__/integration/`
2. Define all required input files using `=== FILE: ===` sections
3. Add the expected JSON output in `=== EXPECTED OUTPUT ===` section
4. The test will automatically be discovered and run

### Example Test File

See `__tests__/integration/basic-workflow.test.xxp` for a complete example that tests:
- Workflow inheritance (A1 from A, A2 from A)
- Parameter configuration and overrides
- Space generation with different strategies
- Control flow generation

## How It Works

1. **Parse Test File**: `IntegrationTestParser` extracts files and expected output
2. **Create Temporary Environment**: Files are written to a temporary directory
3. **Run Generator**: `ArtifactGenerator` processes the .espace file
4. **Compare Output**: Actual output is compared with expected JSON
5. **Clean Up**: Temporary files are removed

## Benefits

- **End-to-End Testing**: Tests complete artifact generation pipeline
- **Realistic Scenarios**: Uses actual XXP and ESPACE syntax
- **Easy Maintenance**: Single file contains entire test case
- **Comprehensive Coverage**: Tests file resolution, parsing, generation, and output

## API Reference

### IntegrationTestRunner

```typescript
const runner = new IntegrationTestRunner({ verbose: false });

// Run test from file
const result = await runner.runTestFromFile('test.test.xxp');

// Run test from parsed case
const testCase = IntegrationTestParser.parse(content);
const result = await runner.runTest(testCase);
```

### IntegrationTestParser

```typescript
// Parse test file content
const testCase = IntegrationTestParser.parse(fileContent);

// Access parsed data
console.log(testCase.files);        // Record<string, string>
console.log(testCase.expectedOutput); // any
console.log(testCase.testName);       // string | undefined
```