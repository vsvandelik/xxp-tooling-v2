---
title: Workflow Repositories
group: Documentation
category: User Guide
parent: static/user_documentation.md
---

# Workflow Repositories

ExtremeXP provides comprehensive workflow repository management for sharing, discovering, and collaborating on experimental workflows. The system supports both local and remote repositories, enabling teams to maintain centralized workflow collections while providing individual developers with local workflow management capabilities.

## Repository Overview

### Repository Types

#### Local Repositories

  * **Purpose**: Personal or team-local workflow storage on your file system.
  * **Use cases**: Private workflows, development environments, offline access.
  * **Benefits**: Full control over your files, no network dependencies, fast access.
  * **Location**: Configured local file system directories.

#### Remote Repositories

  * **Purpose**: Shared workflow storage accessible over a network.
  * **Use cases**: Team collaboration, sharing workflows across distributed teams, centralized access.
  * **Benefits**: Centralized access, facilitates sharing, accessible from multiple locations.
  * **Location**: Network-accessible servers with HTTP/HTTPS endpoints.

### Repository Features

#### Core Capabilities

  * **Workflow Storage**: Store your XXP and ESPACE workflow definition files.
  * **Metadata Management**: Store essential information like author, descriptions, and version associated with workflows.
  * **Search and Discovery**: Easily find workflows by name, author, or keywords across configured repositories.
  * **Access Control**: Secure access to remote repositories through authentication.
  * **Attachment Support**: Store supplementary files and resources along with your main workflow definitions.

## User Interface Components

### Workflow Repository Tree View

The "Workflow Repositories" tree view provides a hierarchical overview of your configured local and remote repositories and their contents within the VS Code Explorer sidebar.

#### Location and Access

  * **Panel**: Located in the VS Code Explorer sidebar, typically named "WORKFLOW REPOSITORIES".
  * **Visibility**: Its visibility is controlled by the `extremexp.workflows.enabled` setting.
  * **Default state**: Visible when the ExtremeXP extension is active.

#### Tree Structure

  * ##### Repository Nodes

      * **Icon**: Local repositories are represented by a folder icon, while remote repositories use a globe icon.
      * **Name**: Displays the configured display name of the repository (e.g., "My Local Repo", "Public Demo Repo").
      * **Context**: Right-clicking a repository node reveals a context menu with repository-specific commands.

  * ##### Workflow Nodes

      * **Icon**: Individual workflows are shown with a standard file icon.
      * **Metadata Display**: Alongside the workflow name, additional information such as its version (e.g., `[1.0.0]`) and author (e.g., `Author: John Doe`) may be displayed.
      * **Context**: Right-clicking a workflow node provides a context menu for workflow operations (e.g., Open, Download, Upload Attachment).

  * ##### Attachment Nodes

      * **Icon**: Attachments associated with a workflow are visible as child nodes under the workflow, typically with a paperclip or file icon.
      * **Context**: Right-clicking an attachment node reveals a context menu with attachment-specific operations (e.g., Download Attachment, Open Attachment).

### Repository Management Commands

These commands allow you to manage your workflow repositories and their content directly from VS Code. Commands are generally accessible via the Command Palette or right-click context menus in the "Workflow Repositories" tree view. Icons are provided for visual reference.

#### Repository-Level Commands

  * ##### ExtremeXP: Add Repository (`extremexp.workflows.addRepository`)

      * **Purpose**: Add a new workflow repository (local or remote) to your ExtremeXP configuration.
      * **Access**: Command Palette, or a plus icon (➕) in the "Workflow Repositories" tree view title bar.
      * **Workflow**: Guides you through selecting the repository type and providing connection details.

  * ##### ExtremeXP: Remove Repository (`extremexp.workflows.removeRepository`)

      * **Purpose**: Remove a repository from your ExtremeXP configuration.
      * **Access**: Right-click context menu on a repository node in the tree view, or Command Palette.
      * **Safety**: Requires confirmation before removal.

  * ##### ExtremeXP: Set Default Repository (`extremexp.workflows.setDefaultRepository`)

      * **Purpose**: Designate a repository as the default for operations like uploading new workflows.
      * **Access**: Right-click context menu on a repository node in the tree view, or Command Palette.
      * **Effect**: The default repository might be indicated visually (e.g., on hover or in context menu) and will be pre-selected for relevant operations.

  * ##### ExtremeXP: Refresh Repositories (`extremexp.workflows.refreshRepositories`)

      * **Purpose**: Reconnects to all configured repositories to verify their connection status and fetch their latest content. This updates the tree view display.
      * **Access**: Command Palette, or a refresh icon (🔄) in the "Workflow Repositories" tree view title bar.

#### Workflow Discovery Commands

  * ##### ExtremeXP: Search Workflows (`extremexp.workflows.searchWorkflows`)

      * **Purpose**: Search for workflows across all configured repositories by name, description, or metadata.
      * **Access**: Command Palette.

  * ##### Tree View: Search Workflows (`extremexp.workflows.tree.search`)

      * **Purpose**: Provides an interactive search field within the "Workflow Repositories" tree view to filter displayed workflows.
      * **Access**: Search icon (🔍) in the tree view title bar.

  * ##### Tree View: Reset Search (`extremexp.workflows.tree.resetSearch`)

      * **Purpose**: Clears any active search filters and displays all workflows in the tree view.
      * **Access**: A clear icon (🧹) that appears in the tree view title bar when a search is active.

### Workflow Operations

These commands allow you to interact with individual workflows stored in your repositories.

#### Workflow Access Commands

  * ##### ExtremeXP: Open Workflow (`extremexp.workflows.openWorkflow`)

      * **Purpose**: Open a workflow file from a repository directly in a VS Code editor tab.
      * **Access**: Right-click context menu on a workflow item in the tree view.
      * **Function**: Downloads the workflow to a temporary location if remote, then opens it.

  * ##### ExtremeXP: Download Workflow (`extremexp.workflows.downloadWorkflow`)

      * **Purpose**: Download a workflow from a repository to a specified local file system location.
      * **Access**: Right-click context menu on a workflow item in the tree view.
      * **Options**: Allows you to choose the download location and filename.

  * ##### ExtremeXP: Preview Workflow (`extremexp.workflows.previewWorkflow`)

      * **Purpose**: View the content of a workflow without fully downloading it to your workspace.
      * **Access**: Right-click context menu on a workflow item in the tree view.
      * **Interface**: Opens the preview in a VS Code editor tab or integrated webview.

#### Workflow Management Commands

  * ##### ExtremeXP: Upload Workflow (`extremexp.workflows.uploadWorkflow`)

      * **Purpose**: Upload a local XXP or ESPACE workflow file to a configured repository.
      * **Access**: Command Palette.
      * **Workflow**: Guides you through file selection, choosing the target repository, and entering relevant metadata (e.g., description, author).

  * ##### ExtremeXP: Upload Current File as Workflow (`extremexp.workflows.uploadCurrentFile`)

      * **Purpose**: Quickly upload the currently open `.xxp` or `.espace` file as a new workflow to a repository.
      * **Access**: Available in the editor's right-click context menu when an XXP or ESPACE file is active.

  * ##### ExtremeXP: Delete Workflow (`extremexp.workflows.deleteWorkflow`)

      * **Purpose**: Delete a workflow from a repository.
      * **Access**: Right-click context menu on a workflow item in the tree view.
      * **Safety**: Requires a confirmation dialog and is subject to repository access control checks.

#### Attachment Management

  * ##### ExtremeXP: Upload Attachment (`extremexp.workflows.uploadAttachment`)

      * **Purpose**: Upload additional files (attachments) to an existing workflow in a repository.
      * **Access**: Right-click context menu on a workflow item in the tree view.
      * **Supported**: Supports various file types for supplementary materials.

  * ##### ExtremeXP: Download Attachment (`extremexp.workflows.downloadAttachment`)

      * **Purpose**: Download a workflow attachment to your local system.
      * **Access**: Right-click context menu on an attachment item in the tree view.
      * **Options**: Allows you to choose the download location.

  * ##### ExtremeXP: Open Attachment (`extremexp.workflows.openAttachment`)

      * **Purpose**: Open an attachment file directly in VS Code.
      * **Access**: Right-click context menu on an attachment item in the tree view.
      * **Behavior**: Downloads the attachment if remote and then opens it in the appropriate VS Code editor (e.g., text editor for code, image viewer for images).

### Repository Browser Interface

The `ExtremeXP: Open Workflow Browser` command launches a web-based interface integrated directly within VS Code (as a webview). This browser provides an alternative and often richer way to interact with your workflow repositories.

#### ExtremeXP: Open Workflow Browser (`extremexp.workflows.openBrowser`)

  * **Purpose**: Open the integrated web-based workflow browser interface.
  * **Access**: Command Palette.
  * **Interface**: The browser offers a full-featured web interface for repository management, presented within a VS Code editor tab

#### Browser Features

  * **Rich Browse**: Offers enhanced workflow Browse with advanced filtering and sorting options.
  * **Detailed Previews**: Provides full workflow content previews, often with syntax highlighting for better readability.
  * **Advanced Search**: Supports complex search queries to find workflows based on various criteria.
  * **Integration with VS Code**:
      * **Direct Downloads**: Download workflows directly into your active VS Code workspace.
      * **Opening Workflows**: Open workflows in VS Code with a single click.
      * **Authentication**: Shares authentication status with the VS Code extension for a seamless experience.

## Repository Configuration

### Configuration Structure

Repository configurations are managed within your VS Code settings. While typically handled via UI commands, their underlying structure follows this schema:

```json
{
  "name": "string",            // Repository display name
  "type": "local|remote",      // Repository type
  "path": "string",            // Local repository path (required for local type)
  "url": "string",             // Repository URL (required for remote type)
  "authToken": "string",       // Authentication token (used internally for remote access)
  "isDefault": "boolean"       // Flag indicating if this is the default repository
}
```

### Configuration Settings

#### Repository List

  * **`extremexp.workflows.repositories`** (array, default: `[]`)
  * **Purpose**: This setting stores the list of all configured workflow repositories.
  * **Management**: It is primarily managed through the VS Code commands (`ExtremeXP: Add Repository`, `ExtremeXP: Remove Repository`) rather than direct manual editing of `settings.json`.
  * **Validation**: Automatic validation ensures the configuration of each repository is correct.

#### Workflow Features Toggle

  * **`extremexp.workflows.enabled`** (boolean, default: `true`)
  * **Purpose**: Allows you to enable or disable all workflow repository features.
  * **Effect**: Controls the visibility of the "Workflow Repositories" tree view and associated commands in VS Code.
  * **Use case**: Can be disabled if workflow repository features are not needed.

#### Default Author

  * **`extremexp.workflows.defaultAuthor`** (string, default: `""`)
  * **Purpose**: Specifies a default author name that will pre-fill the author field when you upload new workflows.
  * **Convenience**: Saves time by avoiding repeated entry of your author information.

### Repository Setup

#### Local Repository Setup

To set up a local workflow repository:

1.  **Choose Directory**: Select an existing local directory or create a new one where you want to store your workflows.
2.  **Add to VS Code**: Use the `ExtremeXP: Add Repository` command. Select "Local Repository" and specify the chosen folder path.
3.  The extension will automatically set up the necessary internal structure within the specified folder.

#### Remote Repository Setup

To connect to a remote workflow repository:

1.  **Obtain URL**: Get the repository server's URL from your administrator or documentation.
2.  **Authentication**: You will provide your username and password through the VS Code UI. For internal communication, this will be securely exchanged for a token, which is transparent to the user.
3.  **Configure Connection**: Use the `ExtremeXP: Add Repository` command, select "Remote Repository," and provide the URL along with your authentication details.
4.  **Test Connection**: The extension will attempt to verify connectivity and access permissions upon configuration.

## Collaboration Features

Workflow repositories facilitate sharing and collaboration by providing a centralized location for your experimental workflows.

### Workflow Sharing

#### Upload Process

When uploading a workflow, you'll provide essential metadata:

  * **Author Information**: Your name or team's name.
  * **Description**: A clear summary of the workflow's purpose and functionality.
  * **Version Information**: A version number (e.g., 1.0.0) and optionally a description of changes.

The system performs validation before upload:

  * **Syntax Checking**: Validates XXP and ESPACE syntax.
  * **Dependency Verification**: Checks for missing imports or references within the workflow.

#### Discovery and Access

  * **Search Capabilities**: Use the search commands (`ExtremeXP: Search Workflows` or the tree view search) to find workflows by name, description, author, or keywords.
  * **Browse Interface**: The integrated web browser interface (accessible via `ExtremeXP: Open Workflow Browser`) provides enhanced Browse with categories and filters.

## Troubleshooting Repository Issues

### Connection Problems

#### Remote Repository Issues

  * **Symptoms**: You cannot connect to a remote repository, or operations fail with network errors.
  * **Solutions**:
      * Verify the repository URL is correct and your network connectivity is stable.
      * Confirm that the repository server is running and accessible.
      * Check your firewall or proxy settings if applicable.

#### Authentication Failures

  * **Symptoms**: You receive "Access Denied" or authentication errors when trying to access a remote repository.
  * **Solutions**:
      * Double-check your username and password.
      * Contact the repository administrator to verify your account permissions and access levels.

### Data Integrity Issues

#### Corrupted Downloads

  * **Symptoms**: Downloaded workflows or attachments are incomplete or corrupted.
  * **Solutions**:
      * Attempt to re-download the workflow/attachment.
      * Ensure network stability during the download process.

## Best Practices

### Repository Organization

#### Workflow Organization

  * **Clear Naming**: Use descriptive and consistent names for your workflows and their attachments.
  * **Category Structure**: Organize workflows into logical categories or subdirectories within your repositories for easier navigation.
  * **Documentation**: Include comprehensive descriptions for each workflow to clarify its purpose, inputs, and outputs.

#### Collaboration Guidelines

  * **Change Documentation**: Always document any modifications you make to workflows, especially before uploading updates.
  * **Testing Before Upload**: Validate and test workflows thoroughly before sharing them or uploading new versions to a shared repository.
  * **Communication**: Coordinate with team members when making significant changes to shared workflows to avoid conflicts.

### Security Considerations

#### Access Control

  * **Minimum Permissions**: Ensure users (and any automated systems) are granted only the minimum necessary access permissions to repositories.
  * **Credential Security**: Keep your authentication credentials (username/password) secure.

## Next Steps

After setting up and familiarizing yourself with workflow repositories:

1.  **Integration**: Explore how ExtremeXP repositories can integrate with your existing development and deployment processes.
2.  **Community**: Participate in workflow sharing communities and contribute to best practice development.
