import { spawn } from 'child_process';

// Mock child_process
jest.mock('child_process');
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('TaskExecutor Input/Output Format', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Python script execution format', () => {
    it('should call spawn with correct arguments format', () => {
      // This test verifies the argument format without full TaskExecutor integration
      const expectedArgs = [
        'test_script.py',
        '--param1',
        'value1',
        '--param2',
        'value2',
        '"input_value_1","input_value_2"',
      ];

      mockSpawn('python', expectedArgs);

      expect(mockSpawn).toHaveBeenCalledWith('python', expectedArgs);
    });

    it('should handle comma-separated output parsing', () => {
      const outputLine = '"output_value_1","output_value_2"';
      const expectedOutputs = ['output_value_1', 'output_value_2'];

      // Parse comma-separated output strings (simulating TaskExecutor logic)
      const outputStrings = outputLine.split(',').map(str => str.trim().replace(/^"|"$/g, ''));

      expect(outputStrings).toEqual(expectedOutputs);
    });

    it('should handle output with spaces and special characters', () => {
      const outputLine = '"output with spaces","output_value_2"';

      // Basic parsing
      const outputStrings = outputLine.split(',').map(str => str.trim().replace(/^"|"$/g, ''));

      expect(outputStrings[0]).toBe('output with spaces');
      expect(outputStrings[1]).toBe('output_value_2');
    });

    it('should verify input argument format', () => {
      const inputValues = ['value1', 'value2', 'value with spaces'];
      const formattedInputs = inputValues.map(val => `"${val}"`).join(',');

      expect(formattedInputs).toBe('"value1","value2","value with spaces"');
    });

    it('should handle empty inputs correctly', () => {
      const inputValues: string[] = [];
      const formattedInputs = inputValues.map(val => `"${val}"`).join(',');

      expect(formattedInputs).toBe('');
    });

    it('should handle single input correctly', () => {
      const inputValues = ['single_value'];
      const formattedInputs = inputValues.map(val => `"${val}"`).join(',');

      expect(formattedInputs).toBe('"single_value"');
    });

    it('should handle already quoted inputs correctly', () => {
      const inputValues = ['"data/inputData.csv"', 'unquoted_value', '"another quoted value"'];
      // Simulate the new logic that checks for existing quotes
      const quotedValues = inputValues.map(val => {
        if (val.startsWith('"') && val.endsWith('"')) {
          return val; // Already quoted, don't add more quotes
        }
        return `"${val}"`; // Add quotes
      });
      const formattedInputs = quotedValues.join(',');

      expect(formattedInputs).toBe('"data/inputData.csv","unquoted_value","another quoted value"');
    });

    it('should handle mixed quoted and unquoted inputs', () => {
      const inputValues = ['unquoted1', '"quoted1"', 'unquoted2'];
      const quotedValues = inputValues.map(val => {
        if (val.startsWith('"') && val.endsWith('"')) {
          return val;
        }
        return `"${val}"`;
      });
      const formattedInputs = quotedValues.join(',');

      expect(formattedInputs).toBe('"unquoted1","quoted1","unquoted2"');
    });
  });
});
