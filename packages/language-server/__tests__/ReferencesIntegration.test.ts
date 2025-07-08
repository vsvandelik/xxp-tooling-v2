import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SimpleLSPClient, Location, Range } from './SimpleLSPClient';

interface TestCase {
  name: string;
  files: Map<string, string>;
  requestPosition: { line: number; character: number };
  requestFileName: string;
  expectedDefinition: LocationWithFile | null;
  expectedReferences: LocationWithFile[];
}

interface LocationWithFile {
  fileName: string;
  range: Range;
}

interface TestFile {
  content: string;
  requestPosition: { line: number; character: number };
}

describe('Language Server Definition and References Tests (LSP)', () => {
  let client: SimpleLSPClient;
  let baseTempDir: string;

  beforeAll(async () => {
    baseTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsp-def-ref-tests-'));
    client = new SimpleLSPClient();
    
    // Start the language server using the built server.js
    const serverPath = path.join(__dirname, '../dist/server.js');
    console.log(`Starting language server: ${serverPath}`);
    await client.start('node', [serverPath, '--stdio']);
  }, 30000);

  afterAll(async () => {
    if (client) {
      await client.stop();
    }
    // Clean up base temp directory
    if (fs.existsSync(baseTempDir)) {
      fs.rmSync(baseTempDir, { recursive: true, force: true });
    }
  }, 20000);

  // Dynamic test cases from files
  const testCasesDir = path.join(__dirname, 'references-test-cases');
  let testCaseFiles: string[] = [];
  
  if (fs.existsSync(testCasesDir)) {
    const specificTestCase = process.env['TEST_CASE'];
    
    if (specificTestCase) {
      // Run only the specified test case
      const specificTestFile = path.join(testCasesDir, `${specificTestCase}.test`);
      if (fs.existsSync(specificTestFile)) {
        testCaseFiles = [specificTestFile];
        console.log(`Running single test case: ${specificTestCase}`);
      } else {
        console.error(`Test case file not found: ${specificTestFile}`);
        // Create a test that will fail to indicate the missing file
        testCaseFiles = [];
      }
    } else {
      // Run all test cases (existing behavior)
      testCaseFiles = fs.readdirSync(testCasesDir)
        .filter(file => file.endsWith('.test'))
        .map(file => path.join(testCasesDir, file));
      console.log(`Running all test cases: ${testCaseFiles.length} found`);
    }
  }

  // Handle case where specific test case was requested but not found
  if (process.env['TEST_CASE'] && testCaseFiles.length === 0) {
    it(`should find the specified test case file: ${process.env['TEST_CASE']}.test`, () => {
      const expectedFile = path.join(testCasesDir, `${process.env['TEST_CASE']}.test`);
      expect(fs.existsSync(expectedFile)).toBe(true);
    });
    return; // Exit early since we can't run the missing test
  }

  if (testCaseFiles.length === 0) {
    it('should find at least one test case file when test cases directory exists', () => {
      if (fs.existsSync(testCasesDir)) {
        expect(testCaseFiles.length).toBeGreaterThan(0);
      } else {
        // Skip this test if directory doesn't exist
        expect(true).toBe(true);
      }
    });
  }

  // Parse each test case file and create dynamic tests
  testCaseFiles.forEach(testCaseFile => {
    const testCase = parseTestCaseFile(testCaseFile);
    it(`should provide definition and references for ${testCase.name}`, async () => {
      // Create a unique subdirectory for this test
      const testTempDir = fs.mkdtempSync(path.join(baseTempDir, `${testCase.name}-`));
      const createdFiles = new Map<string, string>();
      const openedDocuments: string[] = [];

      try {
        // Create temporary files for this test case
        for (const [fileName, content] of testCase.files) {
          const filePath = path.join(testTempDir, fileName);
          const dirPath = path.dirname(filePath);
          
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          fs.writeFileSync(filePath, content, 'utf8');
          createdFiles.set(fileName, filePath);
        }

        // Small delay to ensure filesystem operations complete
        await new Promise(resolve => setTimeout(resolve, 50));

        // Open all documents via LSP
        for (const [fileName, filePath] of createdFiles) {
          const content = testCase.files.get(fileName)!;
          const uri = `file:///${filePath.replace(/\\/g, '/')}`;
        
          await client.openDocument(uri, content);
          openedDocuments.push(uri);
          
          // Small delay between document opens
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Additional delay for server processing and inheritance resolution
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find the main file to test on
        const mainFileName = testCase.requestFileName;
        if (!createdFiles.has(mainFileName)) {
          throw new Error(`Request file ${mainFileName} not found in created files`);
        }
        
        const mainFilePath = createdFiles.get(mainFileName)!;
        const mainFileUri = `file:///${mainFilePath.replace(/\\/g, '/')}`;

        // Request definition
        const definitionResult = await client.requestDefinition(mainFileUri, testCase.requestPosition);

        // Request references
        const referencesResult = await client.requestReferences(mainFileUri, testCase.requestPosition);
        
        // Validate definition
        if (testCase.expectedDefinition === null) {
          expect(definitionResult).toBeNull();
        } else {
          expect(definitionResult).not.toBeNull();
          
          // Handle both single location and array of locations
          const definitions = Array.isArray(definitionResult) ? definitionResult : [definitionResult as Location];
          expect(definitions.length).toBeGreaterThan(0);
          
          // Find the expected file URI
          const expectedFileUri = getFileUriFromCreatedFiles(testCase.expectedDefinition.fileName, createdFiles);
          if (!expectedFileUri) {
            throw new Error(`Expected definition file ${testCase.expectedDefinition.fileName} not found in created files`);
          }
          
          // Find a definition that matches our expected range and file
          const matchingDef = definitions.find(def => 
            normalizeUri(def.uri) === normalizeUri(expectedFileUri) && 
            rangesEqual(def.range, testCase.expectedDefinition!.range)
          );
          
          if (!matchingDef) {
            console.error(`❌ No matching definition found!`);
            console.error(`Expected: ${locationWithFileToString(testCase.expectedDefinition)} (URI: ${normalizeUri(expectedFileUri)})`);
            console.error(`Available definitions:`);
            definitions.forEach((def, i) => {
              console.error(`  [${i}] ${rangeToString(def.range)} in ${normalizeUri(def.uri)}`);
            });
            throw new Error(`Definition test failed - no matching definition found. Expected: ${locationWithFileToString(testCase.expectedDefinition)} (URI: ${normalizeUri(expectedFileUri)})`);
          } 
        }

        // Validate references
        if (testCase.expectedReferences.length === 0) {
          expect(referencesResult).toBeNull();
        } else {
          expect(referencesResult).not.toBeNull();
          expect(Array.isArray(referencesResult)).toBe(true);
          
          const references = referencesResult as Location[];
          
          // Group expected references by file
          const expectedByFile = new Map<string, LocationWithFile[]>();
          for (const expected of testCase.expectedReferences) {
            if (!expectedByFile.has(expected.fileName)) {
              expectedByFile.set(expected.fileName, []);
            }
            expectedByFile.get(expected.fileName)!.push(expected);
          }
          
          // Check that each expected reference is found
          const missingReferences: LocationWithFile[] = [];
          let foundReferences = 0;
          
          for (const [fileName, expectedRefs] of expectedByFile) {
            const expectedFileUri = getFileUriFromCreatedFiles(fileName, createdFiles);
            if (!expectedFileUri) {
              console.error(`❌ Expected reference file ${fileName} not found in created files`);
              missingReferences.push(...expectedRefs);
              continue;
            }
            
            const fileReferences = references.filter(ref => normalizeUri(ref.uri) === normalizeUri(expectedFileUri));
            
            for (const expectedRef of expectedRefs) {
              const matchingRef = fileReferences.find(ref => rangesEqual(ref.range, expectedRef.range));
              if (matchingRef) {
                foundReferences++;
              } else {
                console.error(`❌ Missing expected reference at ${locationWithFileToString(expectedRef)}`);
                missingReferences.push(expectedRef);
              }
            }
          }
          
          if (missingReferences.length > 0) {
            const missingRefsStr = missingReferences.map(locationWithFileToString).join(', ');
            throw new Error(`References test failed - missing expected references at: ${missingRefsStr}`);
          } else if (foundReferences !== testCase.expectedReferences.length) {
            throw new Error(`References test failed - expected ${testCase.expectedReferences.length} references, found ${foundReferences}`);
          }
        }
      } catch (error) {
        console.error(`📊 Test ${testCase.name} failed: ${error}`);
        throw error; // Re-throw to fail the test
      } finally {
        // Close all opened documents
        try {
          for (const uri of openedDocuments) {
            await client.closeDocument(uri);
          }
        } catch (error) {
          console.warn('Error closing documents:', error);
        }
        // Clean up test directory and files
        try {
          if (fs.existsSync(testTempDir)) {
            fs.rmSync(testTempDir, { recursive: true, force: true });
          }
        } catch (error) {
          console.warn('Error cleaning up test directory:', error);
        }
      }
    }, 20000);
  });
});

/**
 * Parse a test case file and extract file contents, request position, and expected results
 */
function parseTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  let expectedDefinition: LocationWithFile | null = null;
  const expectedReferences: LocationWithFile[] = [];
  let requestPosition: { line: number; character: number } = { line: 0, character: 0 };
  let requestFileName = '';

  // Split content by === markers
  const sections = content.split(/^=== (.+?) ===$/gm);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'DEFINITION') {
      expectedDefinition = parseLocationWithFileFromContent(sectionContent);
    } else if (sectionName === 'REFERENCES') {
      expectedReferences.push(...parseLocationsWithFileFromContent(sectionContent));
    } else {
      // This is a file section - process marker
      const processedFile = processFileWithMarker(sectionContent);
      files.set(sectionName, processedFile.content);
      if (sectionContent.includes('###')) {
        requestPosition = processedFile.requestPosition;
        requestFileName = sectionName;
      }
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  // If no request file was found, use the first file
  if (!requestFileName) {
    requestFileName = Array.from(files.keys())[0] || '';
  }

  return {
    name: testName,
    files,
    requestPosition,
    requestFileName,
    expectedDefinition,
    expectedReferences
  };
}

function parseLocationWithFileFromContent(content: string): LocationWithFile | null {
  const line = content.trim();
  if (!line) return null;
  
  const match = line.match(/^(.+?):(\d+):(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid location format: ${line}. Expected format: filename:line:start-end`);
  }
  
  const [, fileName, lineNum, startChar, endChar] = match;
  // Convert from 1-indexed (test format) to 0-indexed (LSP format)
  return {
    fileName: fileName!,
    range: {
      start: { line: parseInt(lineNum!) - 1, character: parseInt(startChar!) - 1 },
      end: { line: parseInt(lineNum!) - 1, character: parseInt(endChar!) - 1 }
    }
  };
}

function parseLocationsWithFileFromContent(content: string): LocationWithFile[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const locations: LocationWithFile[] = [];
  
  for (const line of lines) {
    const location = parseLocationWithFileFromContent(line);
    if (location) {
      locations.push(location);
    }
  }
  
  return locations;
}

function processFileWithMarker(content: string): TestFile {
  const markerStart = '###';
  const markerEnd = '###';
  
  const startIndex = content.indexOf(markerStart);
  const endIndex = content.indexOf(markerEnd, startIndex + markerStart.length);
  
  if (startIndex === -1 || endIndex === -1) {
    return {
      content,
      requestPosition: { line: 0, character: 0 }
    };
  }

  // Remove the markers from content
  const beforeMarker = content.substring(0, startIndex);
  const markedContent = content.substring(startIndex + markerStart.length, endIndex);
  const afterMarker = content.substring(endIndex + markerEnd.length);
  const cleanContent = beforeMarker + markedContent + afterMarker;

  // Calculate request position - position in the middle of the marked content
  const beforeCursor = beforeMarker;
  const lines = beforeCursor.split('\n');
  const line = lines.length - 1;
  const lastLine = lines[lines.length - 1];
  const baseCharacter = lastLine ? lastLine.length : 0;
  
  // Position in the middle of the marked content
  const character = baseCharacter + Math.floor(markedContent.length / 2);

  return {
    content: cleanContent,
    requestPosition: { line, character }
  };
}

function rangesEqual(range1: Range, range2: Range): boolean {
  return range1.start.line === range2.start.line &&
         range1.start.character === range2.start.character &&
         range1.end.line === range2.end.line &&
         range1.end.character === range2.end.character;
}

function rangeToString(range: Range): string {
  // Convert back to 1-indexed for display
  return `${range.start.line + 1}:${range.start.character + 1}-${range.end.character + 1}`;
}

function normalizeUri(uri: string): string {
  // Normalize URI for comparison by converting to lowercase and using forward slashes
  return uri.toLowerCase().replace(/\\/g, '/');
}

function locationWithFileToString(location: LocationWithFile): string {
  // Convert back to 1-indexed for display
  return `${location.fileName}:${location.range.start.line + 1}:${location.range.start.character + 1}-${location.range.end.character + 1}`;
}

function getFileUriFromCreatedFiles(fileName: string, createdFiles: Map<string, string>): string | null {
  const filePath = createdFiles.get(fileName);
  if (!filePath) {
    return null;
  }
  return `file:///${filePath.replace(/\\/g, '/')}`;
}