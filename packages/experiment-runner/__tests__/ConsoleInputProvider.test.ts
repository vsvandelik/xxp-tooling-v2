import { ConsoleInputProvider } from '../src/userInput/ConsoleInputProvider.js';

// Mock readline
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('ConsoleInputProvider', () => {
  let consoleInputProvider: ConsoleInputProvider;
  let mockReadline: any;
  let mockRl: any;

  beforeEach(async () => {
    consoleInputProvider = new ConsoleInputProvider();
    
    // Get the mock readline module
    mockReadline = await import('readline');
    mockRl = {
      question: jest.fn(),
      close: jest.fn(),
    };
    mockReadline.createInterface.mockReturnValue(mockRl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInput', () => {
    it('should get user input from console', async () => {
      const testPrompt = 'Enter your name:';
      const testAnswer = 'John Doe';

      // Mock the question method to call the callback with test answer
      mockRl.question.mockImplementation((prompt: string, callback: (answer: string) => void) => {
        expect(prompt).toBe(testPrompt + ' ');
        callback(testAnswer);
      });

      const result = await consoleInputProvider.getInput(testPrompt);

      expect(result).toBe(testAnswer);
      expect(mockReadline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
      expect(mockRl.question).toHaveBeenCalledWith(
        testPrompt + ' ',
        expect.any(Function)
      );
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should handle empty input', async () => {
      const testPrompt = 'Press enter to continue:';
      const testAnswer = '';

      mockRl.question.mockImplementation((prompt: string, callback: (answer: string) => void) => {
        callback(testAnswer);
      });

      const result = await consoleInputProvider.getInput(testPrompt);

      expect(result).toBe('');
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should add space after prompt', async () => {
      const testPrompt = 'Enter value';
      
      mockRl.question.mockImplementation((prompt: string, callback: (answer: string) => void) => {
        expect(prompt).toBe('Enter value '); // Should add space
        callback('test');
      });

      await consoleInputProvider.getInput(testPrompt);

      expect(mockRl.question).toHaveBeenCalledWith(
        'Enter value ',
        expect.any(Function)
      );
    });

    it('should handle multiple consecutive calls', async () => {
      const prompts = ['First prompt:', 'Second prompt:'];
      const answers = ['first answer', 'second answer'];

      // Set up mock to return different answers for each call
      mockRl.question
        .mockImplementationOnce((prompt: string, callback: (answer: string) => void) => {
          callback(answers[0]!);
        })
        .mockImplementationOnce((prompt: string, callback: (answer: string) => void) => {
          callback(answers[1]!);
        });

      const result1 = await consoleInputProvider.getInput(prompts[0]!);
      const result2 = await consoleInputProvider.getInput(prompts[1]!);

      expect(result1).toBe(answers[0]);
      expect(result2).toBe(answers[1]);
      expect(mockRl.close).toHaveBeenCalledTimes(2);
    });
  });
});