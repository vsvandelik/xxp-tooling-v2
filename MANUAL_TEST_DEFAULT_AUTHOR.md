# Manual Test for Default Author Functionality

## Test Summary
This describes how to manually test the new default author functionality for workflow uploads.

## Setup
1. Install and run the VS Code extension in development mode
2. Ensure you have at least one workflow repository configured

## Test Cases

### Test Case 1: First-time author entry (no default set)
1. Open a `.xxp` or `.espace` file in VS Code
2. Right-click and select "Upload Current File as Workflow" (or use command palette)
3. Enter workflow metadata when prompted
4. When prompted for "Author name", the input field should be empty with placeholder "Your Name"
5. Enter an author name (e.g., "John Doe") and complete the upload
6. Expected: The author name should be stored as the default for future uploads

### Test Case 2: Subsequent uploads (default exists)
1. Open another `.xxp` or `.espace` file in VS Code  
2. Right-click and select "Upload Current File as Workflow"
3. Enter workflow metadata when prompted
4. When prompted for "Author name", the input field should be pre-populated with the previously entered author name
5. Press Enter to accept the default, or modify if needed
6. Expected: The default author should be pre-filled, allowing quick entry

### Test Case 3: Manual configuration change
1. Open VS Code settings (Ctrl+,)
2. Search for "extremexp.workflows.defaultAuthor"
3. Set a different author name (e.g., "Jane Smith")
4. Upload another workflow file
5. When prompted for author, the field should be pre-populated with "Jane Smith"

## Configuration Location
The default author is stored in VS Code settings under:
- Setting: `extremexp.workflows.defaultAuthor`
- Default value: "" (empty string)
- Scope: Global (applies to all workspaces)

## Implementation Notes
- The default author is stored after the first successful entry when no default exists
- The value field is pre-populated with the stored default for faster entry
- Users can still modify the author for individual workflows as needed
- The setting can be manually configured via VS Code settings UI