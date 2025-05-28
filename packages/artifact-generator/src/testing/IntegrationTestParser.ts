/**
 * Parser for integration test files that contain multiple input files and expected output
 */
export interface IntegrationTestCase {
  files: Record<string, string>;
  expectedOutput: any;
  testName?: string | undefined;
  description?: string | undefined;
}

export class IntegrationTestParser {
  /**
   * Parse an integration test file format that contains multiple files and expected output
   * 
   * Format:
   * === FILE: filename.ext ===
   * [file content]
   * 
   * === EXPECTED OUTPUT ===
   * [JSON output]
   */
  static parse(content: string): IntegrationTestCase {
    const files: Record<string, string> = {};
    let expectedOutput: any = null;
    let testName: string | undefined;
    let description: string | undefined;

    // Split by section markers
    const sections = content.split(/^=== /m).filter(section => section.trim());

    for (const section of sections) {
      const lines = section.split('\n');
      const header = lines[0]?.trim();

      if (!header) continue;

      const contentLines = lines.slice(1);
      const sectionContent = contentLines.join('\n').trim();

      if (header.startsWith('FILE: ')) {
        // Extract filename from "FILE: filename.ext ==="
        const fileMatch = header.match(/^FILE:\s*(.+?)\s*===?$/);
        if (fileMatch && fileMatch[1]) {
          const filename = fileMatch[1];
          files[filename] = sectionContent;
        }
      } else if (header.startsWith('EXPECTED OUTPUT')) {
        try {
          expectedOutput = JSON.parse(sectionContent);
        } catch (error) {
          throw new Error(`Failed to parse expected output as JSON: ${error}`);
        }
      } else if (header.startsWith('TEST NAME: ')) {
        const nameMatch = header.match(/^TEST NAME:\s*(.+?)\s*===?$/);
        if (nameMatch && nameMatch[1]) {
          testName = nameMatch[1];
        }
      } else if (header.startsWith('DESCRIPTION: ')) {
        const descMatch = header.match(/^DESCRIPTION:\s*(.+?)\s*===?$/);
        if (descMatch && descMatch[1]) {
          description = descMatch[1];
        }
      }
    }

    if (Object.keys(files).length === 0) {
      throw new Error('No files found in integration test');
    }

    if (!expectedOutput) {
      throw new Error('No expected output found in integration test');
    }

    return {
      files,
      expectedOutput,
      testName,
      description
    };
  }
}