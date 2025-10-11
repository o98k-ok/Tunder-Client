# Feature Specification: cURL Import

**Version**: 1.0  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-11  
**Status**: Draft

---

## Overview

### Feature Summary

Enable users to quickly create HTTP requests by importing cURL commands. Users can paste or type cURL commands into a dialog, which are then parsed and converted into HTTP requests that are automatically saved to the selected directory.

### Problem Statement

Users frequently work with cURL commands in terminal, documentation, or API testing tools. Currently, they must manually transcribe these commands into the HTTP client by copying each component (URL, method, headers, body) separately. This process is time-consuming, error-prone, and frustrating when working with complex requests that have multiple headers or large request bodies.

### Target Users

- **API Developers**: Need to test API endpoints documented with cURL examples
- **DevOps Engineers**: Use cURL commands from logs or monitoring tools to debug issues
- **Technical Writers**: Import cURL examples from API documentation for testing
- **QA Engineers**: Convert cURL commands from bug reports into reproducible test cases

---

## Goals and Success Criteria

### Primary Goals

1. Allow users to import cURL commands with a single paste action
2. Automatically parse and extract all HTTP request components from cURL
3. Save imported requests to user-selected directories
4. Reduce request creation time by 80% for cURL-based workflows

### Success Criteria

1. **Import Speed**: Users can import a cURL command and have a ready-to-send request in under 10 seconds
2. **Parsing Accuracy**: 95% of standard cURL commands are parsed correctly without manual correction
3. **User Satisfaction**: Users rate the import feature as "valuable" or "essential" in feedback surveys
4. **Adoption Rate**: 40% of new requests are created via cURL import within 30 days of feature launch
5. **Error Handling**: Users receive clear, actionable error messages for 100% of unparseable cURL commands

### Non-Goals

- Supporting cURL options unrelated to HTTP requests (e.g., FTP, file transfers)
- Importing multiple cURL commands in a single operation
- Real-time cURL preview/validation as users type
- Exporting requests back to cURL format (future feature)

---

## User Scenarios & Testing

### Primary Flow: Import cURL Command

**Actor**: API Developer  
**Scenario**: Import a POST request with JSON body and authentication header

**Steps**:
1. User right-clicks on a directory in the HTTP Collections sidebar
2. User clicks "Import cURL" button (next to "Create Request")
3. Dialog opens with large text area labeled "Paste cURL command here"
4. User pastes cURL command:
   ```bash
   curl -X POST https://api.example.com/v1/users \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer abc123" \
     -d '{"name":"John","email":"john@example.com"}'
   ```
5. User clicks "Import" button
6. System parses the cURL command
7. System creates a new request named "POST /v1/users" (auto-generated from URL path)
8. System saves the request to the selected directory
9. System opens the request in the main panel
10. User sees the request pre-filled with:
    - Method: POST
    - URL: https://api.example.com/v1/users
    - Headers: Content-Type, Authorization
    - Body: JSON data

**Expected Outcome**: Request is immediately ready to send without manual editing

### Alternative Flow: Import Simple GET Request

**Actor**: QA Engineer  
**Scenario**: Import a GET request with query parameters

**Steps**:
1. User clicks the "Import cURL" toolbar button in the HTTP Collections title bar
2. Dialog opens
3. User pastes: `curl https://api.example.com/search?q=test&limit=10`
4. User clicks "Import"
5. System creates request named "GET /search"
6. Request opens with URL including query parameters

**Expected Outcome**: Query parameters are preserved in the URL

### Edge Case: Malformed cURL Command

**Scenario**: User pastes invalid cURL syntax

**Steps**:
1. User opens import dialog
2. User pastes: `curl this is not valid`
3. User clicks "Import"
4. System displays error message: "Unable to parse cURL command. Please check the syntax and try again."
5. Dialog remains open with user's input preserved

**Expected Outcome**: User can correct the input without re-pasting

### Edge Case: Empty Input

**Scenario**: User clicks Import without pasting anything

**Steps**:
1. User opens import dialog
2. User clicks "Import" with empty text area
3. System displays validation message: "Please enter a cURL command"
4. Import button remains disabled until text is entered

**Expected Outcome**: User is prevented from importing empty commands

---

## Functional Requirements

### FR-1: Import Dialog

**Description**: Provide a dedicated dialog for cURL import

**Requirements**:
- FR-1.1: Dialog must have a multi-line text input area (minimum 8 rows)
- FR-1.2: Dialog must include "Import" and "Cancel" buttons
- FR-1.3: "Import" button must be enabled only when text area is not empty
- FR-1.4: Dialog must preserve user input when errors occur (no clearing)
- FR-1.5: Dialog must support keyboard shortcuts (Enter to import, Esc to cancel)
- FR-1.6: Text area must support syntax highlighting for cURL commands
- FR-1.7: Dialog title must be "Import cURL Command"

**Acceptance Criteria**:
- [ ] Dialog opens with empty text area focused
- [ ] Import button is disabled when text area is empty
- [ ] Pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows) triggers import
- [ ] Pressing Esc closes the dialog

### FR-2: cURL Parsing

**Description**: Extract HTTP request components from cURL command

**Requirements**:
- FR-2.1: Parse HTTP method from `-X` or `--request` flag (default: GET)
- FR-2.2: Parse URL from the first positional argument after flags
- FR-2.3: Parse headers from `-H` or `--header` flags (support multiple headers)
- FR-2.4: Parse request body from `-d`, `--data`, or `--data-raw` flags
- FR-2.5: Support single quotes, double quotes, and escaped quotes in values
- FR-2.6: Support line continuations with backslash (`\`)
- FR-2.7: Ignore unsupported cURL flags (e.g., `-v`, `--verbose`, `-k`, `--insecure`)
- FR-2.8: Extract query parameters from URL and preserve them

**Acceptance Criteria**:
- [ ] Correctly parses `curl -X POST https://api.com -H "Content-Type: application/json" -d '{"key":"value"}'`
- [ ] Correctly parses `curl https://api.com` (GET with no headers)
- [ ] Handles multi-line cURL with backslash continuations
- [ ] Ignores `-v`, `-k`, and other non-HTTP flags
- [ ] Preserves query parameters in URL

**Supported cURL Options**:
- `-X`, `--request`: HTTP method
- `-H`, `--header`: Request headers
- `-d`, `--data`, `--data-raw`: Request body
- First non-flag argument: URL

**Unsupported Options** (ignored gracefully):
- `-v`, `--verbose`: Verbose output
- `-k`, `--insecure`: Skip SSL verification
- `-u`, `--user`: Authentication (users can add headers manually)
- `-b`, `--cookie`: Cookies (users can add as headers)
- `-A`, `--user-agent`: User agent (users can add as headers)

### FR-3: Request Creation

**Description**: Create and save HTTP request from parsed cURL data

**Requirements**:
- FR-3.1: Auto-generate request name from HTTP method and URL path
  - Format: `{METHOD} {path}`
  - Example: `curl https://api.com/v1/users` → "GET /v1/users"
  - Example: `curl https://api.com/` → "GET /"
- FR-3.2: Store request in the directory where import was triggered
- FR-3.3: If import triggered from toolbar (no directory selected), prompt user to select a directory
- FR-3.4: Assign unique ID to the request (same as manual creation)
- FR-3.5: Set `created_at` and `updated_at` timestamps
- FR-3.6: Save request to persistent storage immediately after import

**Acceptance Criteria**:
- [ ] Request name reflects method and path
- [ ] Request is saved to correct directory
- [ ] Request has unique ID and timestamps
- [ ] Request appears in directory tree immediately after import

### FR-4: User Interface Integration

**Description**: Add import entry points in the UI

**Requirements**:
- FR-4.1: Add "Import cURL" button to directory context menu
- FR-4.2: Add "Import cURL" button to HTTP Collections toolbar (next to "Create Folder")
- FR-4.3: Both buttons must use an appropriate icon (e.g., clipboard with arrow)
- FR-4.4: Button tooltip must read "Import cURL Command"
- FR-4.5: Button must be visible at all times (no hidden menus)

**Acceptance Criteria**:
- [ ] "Import cURL" appears in directory right-click menu
- [ ] "Import cURL" appears in toolbar next to "Create Folder"
- [ ] Clicking either button opens the import dialog
- [ ] Toolbar button works when no directory is selected (prompts for directory)

### FR-5: Post-Import Behavior

**Description**: Automatically open imported request for immediate use

**Requirements**:
- FR-5.1: Open imported request in main panel immediately after successful import
- FR-5.2: Display success notification: "Request imported successfully"
- FR-5.3: Focus the request name field if request name needs adjustment
- FR-5.4: Close the import dialog after successful import

**Acceptance Criteria**:
- [ ] Imported request opens in main panel
- [ ] Success notification appears
- [ ] Dialog closes automatically
- [ ] User can send request immediately without additional clicks

### FR-6: Error Handling

**Description**: Provide clear feedback for parsing failures

**Requirements**:
- FR-6.1: Display inline error message in dialog for parsing errors
- FR-6.2: Error message must indicate what went wrong (e.g., "Missing URL", "Invalid syntax")
- FR-6.3: Keep dialog open and preserve user input on errors
- FR-6.4: Highlight problematic sections if possible
- FR-6.5: Provide example of valid cURL command in error cases

**Error Scenarios**:
1. **No URL found**: "Unable to find URL in cURL command. Example: `curl https://api.com`"
2. **Invalid syntax**: "Unable to parse cURL command. Please check the syntax."
3. **Empty input**: "Please enter a cURL command"
4. **Directory selection cancelled**: "Request import cancelled - no directory selected"

**Acceptance Criteria**:
- [ ] Error messages are clear and actionable
- [ ] User input is not cleared on error
- [ ] Dialog stays open for correction
- [ ] Error message disappears when user edits text

---

## Technical Constraints

### Platform Requirements

- Must work within VSCode extension environment
- Must use VSCode's native dialog/input APIs
- Must integrate with existing `RequestService` and `DirectoryService`

### Performance Requirements

- Parse cURL command in under 200ms for typical requests (< 2KB)
- UI must remain responsive during parsing (no blocking)

### Security Requirements

- Do not log or transmit cURL commands to external services
- Sanitize input to prevent XSS or injection attacks in stored requests

---

## Dependencies

### Internal Dependencies

- `RequestService`: To create and save new requests
- `DirectoryService`: To validate target directory and retrieve directory tree
- `HttpClientPanel`: To open newly imported request
- `DirectoryTreeProvider`: To refresh UI after import

### External Dependencies

- VSCode Extension API: `vscode.window.showInputBox` or custom webview for dialog
- No external NPM packages required for basic parsing (use regex/string manipulation)

---

## Assumptions

1. Users are familiar with basic cURL syntax (common in API documentation)
2. Most imported cURL commands will be standard HTTP requests (not FTP, SMTP, etc.)
3. Users can manually adjust requests after import if needed
4. cURL commands are typically less than 10KB in size
5. VSCode's input APIs provide sufficient UI flexibility for the dialog
6. Users are responsible for managing sensitive data (API keys, tokens) in imported cURL commands; documentation will include security best practices

---

## Open Questions

None. All clarifications have been resolved.

---

## Out of Scope

- Exporting requests to cURL format (future enhancement)
- Importing multiple cURL commands at once (batch import)
- Real-time validation/preview of cURL as user types
- Support for cURL config files (`~/.curlrc`)
- Import from file (vs. paste from clipboard)
- Support for non-HTTP protocols (FTP, SMTP, etc.)
- Advanced cURL features: cookies, authentication schemes, proxy configuration

---

## Future Enhancements

- Batch import: Import multiple cURL commands from a file
- Smart naming: Use API endpoint names from OpenAPI/Swagger specs if available
- Export to cURL: Generate cURL commands from existing requests
- History: Show recently imported cURL commands for quick re-import
- Templates: Save frequently imported cURL patterns as templates

