# Implementation Tasks: cURL Import

**Feature**: cURL Import  
**Branch**: `feature/20251011-curl-import`  
**Status**: Ready for Implementation

---

## Task Overview

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 0: Setup | 2 | 30 min |
| Phase 1: Core Implementation | 12 | 3-4 hours |
| Phase 2: Error Handling | 6 | 2-3 hours |
| Phase 3: Testing | 8 | 2-3 hours |
| **Total** | **28** | **8-12 hours** |

---

## Phase 0: Setup & Prerequisites

### Task 0.1: Verify Project Dependencies
- [x] **ID**: SETUP-001
- [ ] **Description**: Ensure all required dependencies are installed
- [ ] **Files**: `package.json`
- [ ] **Actions**:
  - Verify TypeScript is installed
  - Verify VSCode extension dependencies are present
  - Run `npm install` if needed
- [ ] **Validation**: `npm run compile` succeeds
- [ ] **Parallel**: No

### Task 0.2: Create Service File Structure
- [x] **ID**: SETUP-002
- [ ] **Description**: Create directory and file for cURL parser service
- [ ] **Files**: `src/services/curlParserService.ts` (NEW)
- [ ] **Actions**:
  - Create file with basic TypeScript structure
  - Add imports for VSCode types
  - Export placeholder interfaces
- [ ] **Validation**: File compiles without errors
- [ ] **Parallel**: No
- [ ] **Dependencies**: SETUP-001

---

## Phase 1: Core Implementation

### Task 1.1: Define Data Interfaces
- [ ] **ID**: CORE-001
- [ ] **Description**: Define TypeScript interfaces for parsed cURL data
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Define `ParsedRequest` interface
  - Define `RequestHeader` interface
  - Define `CurlParseError` class
  - Define `CurlParseErrorCode` enum
- [ ] **Validation**: Interfaces compile without errors
- [ ] **Parallel**: No
- [ ] **Dependencies**: SETUP-002

### Task 1.2: Implement Input Normalization
- [ ] **ID**: CORE-002
- [ ] **Description**: Implement method to normalize cURL input (remove line continuations, trim whitespace)
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `normalize(input: string): string` method
  - Handle backslash line continuations (`\\\n`)
  - Remove extra whitespace
  - Preserve quoted strings
- [ ] **Validation**: Test with multi-line cURL commands
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-001

### Task 1.3: Implement Method Extraction
- [ ] **ID**: CORE-003
- [ ] **Description**: Extract HTTP method from cURL command
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `extractMethod(input: string): string` method
  - Match `-X` or `--request` flag
  - Default to 'GET' if not specified
  - Convert to uppercase
- [ ] **Validation**: Test with various method flags
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-001

### Task 1.4: Implement URL Extraction
- [ ] **ID**: CORE-004
- [ ] **Description**: Extract URL from cURL command
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `extractUrl(input: string): string` method
  - Find first non-flag argument (not starting with `-`)
  - Validate URL format
  - Throw `CurlParseError` if no URL found
- [ ] **Validation**: Test with various URL formats
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-001

### Task 1.5: Implement Headers Extraction
- [ ] **ID**: CORE-005
- [ ] **Description**: Extract headers from cURL command
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `extractHeaders(input: string): RequestHeader[]` method
  - Match all `-H` or `--header` flags
  - Handle multiple headers
  - Parse key-value pairs
  - Handle quoted values
- [ ] **Validation**: Test with multiple headers
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-001

### Task 1.6: Implement Body Extraction
- [ ] **ID**: CORE-006
- [ ] **Description**: Extract request body from cURL command
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `extractBody(input: string): string | undefined` method
  - Match `-d`, `--data`, or `--data-raw` flags
  - Handle quoted JSON
  - Return undefined if no body
- [ ] **Validation**: Test with JSON body
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-001

### Task 1.7: Implement Quote Handling
- [ ] **ID**: CORE-007
- [ ] **Description**: Handle single quotes, double quotes, and escaped quotes
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `unquote(value: string): string` method
  - Handle single quotes (literal)
  - Handle double quotes (with escapes)
  - Handle escaped quotes (`\'`, `\"`)
- [ ] **Validation**: Test with mixed quote styles
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-001

### Task 1.8: Implement Main Parse Method
- [ ] **ID**: CORE-008
- [ ] **Description**: Implement main parse method that orchestrates all extraction methods
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Implement `parse(input: string): ParsedRequest` method
  - Call `normalize()` first
  - Call all extraction methods
  - Validate result
  - Throw appropriate errors
- [ ] **Validation**: Test with complete cURL commands
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-002, CORE-003, CORE-004, CORE-005, CORE-006, CORE-007

### Task 1.9: Implement Request Name Generation
- [ ] **ID**: CORE-009
- [ ] **Description**: Generate descriptive request names from method and URL
- [ ] **Files**: `src/extension.ts`
- [ ] **Actions**:
  - Implement `generateRequestName(method: string, url: string): string` function
  - Extract path from URL
  - Handle root path (`/`)
  - Remove trailing slashes
  - Strip query parameters from name
  - Format as `{METHOD} {path}`
- [ ] **Validation**: Test with various URL formats
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: None

### Task 1.10: Implement Import Dialog
- [ ] **ID**: CORE-010
- [ ] **Description**: Create input dialog for cURL command entry
- [ ] **Files**: `src/extension.ts`
- [ ] **Actions**:
  - Use `vscode.window.showInputBox()`
  - Set multi-line prompt
  - Add placeholder text with example
  - Implement validation (non-empty check)
  - Set `ignoreFocusOut: true`
- [ ] **Validation**: Dialog opens and accepts input
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: None

### Task 1.11: Implement Import Command Handler (Context Menu)
- [ ] **ID**: CORE-011
- [ ] **Description**: Implement command handler for importing from directory context menu
- [ ] **Files**: `src/extension.ts`
- [ ] **Actions**:
  - Register `httpClient.importCurl` command
  - Get `folderId` from directory parameter
  - Show import dialog
  - Parse cURL command
  - Generate request name
  - Create request object
  - Save via `requestService.createRequest()`
  - Refresh directory tree
  - Open request in `HttpClientPanel`
  - Show success notification
  - Handle errors gracefully
- [ ] **Validation**: Import from context menu works
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-008, CORE-009, CORE-010

### Task 1.12: Implement Import Command Handler (Toolbar)
- [ ] **ID**: CORE-012
- [ ] **Description**: Implement command handler for importing from toolbar
- [ ] **Files**: `src/extension.ts`
- [ ] **Actions**:
  - Register `httpClient.importCurlFromToolbar` command
  - Show directory picker (`vscode.window.showQuickPick`)
  - Get selected `folderId`
  - Call same import logic as CORE-011
  - Handle cancellation
- [ ] **Validation**: Import from toolbar works
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-011

---

## Phase 2: UI Integration & Error Handling

### Task 2.1: Update package.json - Add Commands
- [ ] **ID**: UI-001
- [ ] **Description**: Register new commands in package.json
- [ ] **Files**: `package.json`
- [ ] **Actions**:
  - Add `httpClient.importCurl` command definition
  - Add `httpClient.importCurlFromToolbar` command definition
  - Set command titles and icons
  - Add tooltips
- [ ] **Validation**: Commands appear in Command Palette
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-011, CORE-012

### Task 2.2: Update package.json - Add Context Menu
- [ ] **ID**: UI-002
- [ ] **Description**: Add "Import cURL" to directory context menu
- [ ] **Files**: `package.json`
- [ ] **Actions**:
  - Add to `menus.view/item/context`
  - Set `when` condition: `view == httpClientDirectories && viewItem == directory`
  - Set group: `inline@2`
- [ ] **Validation**: "Import cURL" appears in directory right-click menu
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: UI-001

### Task 2.3: Update package.json - Add Toolbar Button
- [ ] **ID**: UI-003
- [ ] **Description**: Add "Import cURL" button to HTTP Collections toolbar
- [ ] **Files**: `package.json`
- [ ] **Actions**:
  - Add to `menus.view/title`
  - Set `when` condition: `view == httpClientDirectories`
  - Set group: `navigation@3`
  - Use icon: `$(file-symlink-file)`
- [ ] **Validation**: Button appears in toolbar
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: UI-001

### Task 2.4: Enhanced Error Messages
- [ ] **ID**: ERROR-001
- [ ] **Description**: Implement specific error messages for different failure scenarios
- [ ] **Files**: `src/services/curlParserService.ts`, `src/extension.ts`
- [ ] **Actions**:
  - Detect missing URL → "Unable to find URL in cURL command. Example: `curl https://api.com`"
  - Detect invalid syntax → "Unable to parse cURL command. Please check the syntax."
  - Detect empty input → "Please enter a cURL command"
  - Handle directory cancellation → "Request import cancelled - no directory selected"
- [ ] **Validation**: Error messages are clear and helpful
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-008, CORE-011

### Task 2.5: Edge Case - Multi-line cURL
- [ ] **ID**: ERROR-002
- [ ] **Description**: Test and fix multi-line cURL with backslash continuations
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Test with cURL commands spanning multiple lines
  - Ensure backslash continuations are handled
  - Preserve line breaks in JSON bodies
- [ ] **Validation**: Multi-line cURL imports correctly
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-002

### Task 2.6: Edge Case - Query Parameters
- [ ] **ID**: ERROR-003
- [ ] **Description**: Ensure query parameters are preserved in URL
- [ ] **Files**: `src/services/curlParserService.ts`, `src/extension.ts`
- [ ] **Actions**:
  - Test with URLs containing query parameters
  - Ensure query params are preserved in URL
  - Ensure query params are stripped from request name
- [ ] **Validation**: Query parameters work correctly
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: CORE-004, CORE-009

---

## Phase 3: Testing & Validation

### Task 3.1: Unit Tests - Parser Service
- [ ] **ID**: TEST-001
- [ ] **Description**: Write comprehensive unit tests for CurlParserService
- [ ] **Files**: `src/test/suite/curlParserService.test.ts` (NEW)
- [ ] **Actions**:
  - Test simple GET request
  - Test POST with headers and body
  - Test method extraction
  - Test URL extraction
  - Test headers extraction
  - Test body extraction
  - Test quote handling
  - Test line continuations
  - Test error cases (no URL, invalid syntax)
  - Test unsupported flags (should ignore)
- [ ] **Validation**: All tests pass, coverage > 90%
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-008

### Task 3.2: Integration Tests - Command Handlers
- [ ] **ID**: TEST-002
- [ ] **Description**: Write integration tests for import commands
- [ ] **Files**: `src/test/suite/extension.test.ts`
- [ ] **Actions**:
  - Test import from context menu
  - Test import from toolbar
  - Test request is saved correctly
  - Test request appears in tree view
  - Test request opens in panel
  - Test success notification
- [ ] **Validation**: All integration tests pass
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-011, CORE-012

### Task 3.3: Manual Testing - Real-world cURL Examples
- [ ] **ID**: TEST-003
- [ ] **Description**: Test with real-world cURL examples from popular APIs
- [ ] **Files**: N/A (manual testing)
- [ ] **Actions**:
  - Test GitHub API cURL examples
  - Test Stripe API cURL examples
  - Test OpenAI API cURL examples
  - Test with various HTTP methods (GET, POST, PUT, DELETE, PATCH)
  - Test with authentication headers
  - Test with JSON bodies
- [ ] **Validation**: All real-world examples import correctly
- [ ] **Parallel**: No
- [ ] **Dependencies**: CORE-011, CORE-012

### Task 3.4: Manual Testing - Error Scenarios
- [ ] **ID**: TEST-004
- [ ] **Description**: Test error handling and edge cases
- [ ] **Files**: N/A (manual testing)
- [ ] **Actions**:
  - Test with empty input
  - Test with malformed cURL
  - Test with missing URL
  - Test with unsupported flags
  - Test canceling directory selection
  - Test with very long cURL commands
- [ ] **Validation**: Error messages are clear and helpful
- [ ] **Parallel**: No
- [ ] **Dependencies**: ERROR-001

### Task 3.5: Compile and Build
- [ ] **ID**: TEST-005
- [ ] **Description**: Ensure project compiles without errors
- [ ] **Files**: All TypeScript files
- [ ] **Actions**:
  - Run `npm run compile`
  - Fix any TypeScript errors
  - Fix any linter warnings
- [ ] **Validation**: `npm run compile` succeeds with no errors
- [ ] **Parallel**: No
- [ ] **Dependencies**: All CORE tasks, All UI tasks, All ERROR tasks

### Task 3.6: Run Automated Tests
- [ ] **ID**: TEST-006
- [ ] **Description**: Run all automated tests
- [ ] **Files**: Test files
- [ ] **Actions**:
  - Run `npm test`
  - Ensure all tests pass
  - Check test coverage
- [ ] **Validation**: All tests pass, coverage > 90%
- [ ] **Parallel**: No
- [ ] **Dependencies**: TEST-001, TEST-002, TEST-005

### Task 3.7: Update README
- [ ] **ID**: DOC-001
- [ ] **Description**: Document cURL import feature in README
- [ ] **Files**: `README.md`
- [ ] **Actions**:
  - Add "cURL Import" section
  - Provide usage examples
  - Document supported cURL flags
  - Document limitations
  - Add security best practices
- [ ] **Validation**: README is clear and complete
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: None

### Task 3.8: Final Validation
- [ ] **ID**: FINAL-001
- [ ] **Description**: Final end-to-end validation
- [ ] **Files**: N/A (manual testing)
- [ ] **Actions**:
  - Test complete workflow from start to finish
  - Verify all acceptance criteria from spec.md
  - Ensure no regressions in existing functionality
  - Test on fresh VSCode instance
- [ ] **Validation**: All acceptance criteria met
- [ ] **Parallel**: No
- [ ] **Dependencies**: All previous tasks

---

## Task Execution Order

### Sequential Execution (Must Complete in Order)
1. **Phase 0**: SETUP-001 → SETUP-002
2. **Phase 1 Foundation**: CORE-001 → CORE-002 → CORE-008
3. **Phase 1 Integration**: CORE-011 → CORE-012
4. **Phase 2 UI**: UI-001 → (UI-002 || UI-003)
5. **Phase 2 Errors**: ERROR-001 → (ERROR-002 || ERROR-003)
6. **Phase 3 Tests**: TEST-001 → TEST-002 → TEST-005 → TEST-006 → FINAL-001

### Parallel Execution (Can Run Simultaneously)
- **CORE-003, CORE-004, CORE-005, CORE-006, CORE-007** [P] (after CORE-001)
- **CORE-009, CORE-010** [P] (independent)
- **UI-002, UI-003** [P] (after UI-001)
- **ERROR-002, ERROR-003** [P] (after their dependencies)
- **TEST-003, TEST-004, DOC-001** [P] (after core implementation)

---

## Acceptance Criteria Mapping

Each task maps to acceptance criteria from `spec.md`:

| Task | Acceptance Criteria |
|------|---------------------|
| CORE-010, CORE-011 | FR-1: Dialog opens with empty text area focused |
| CORE-010 | FR-1: Import button is disabled when text area is empty |
| CORE-008 | FR-2: Correctly parses cURL commands |
| CORE-002 | FR-2: Handles multi-line cURL with backslash continuations |
| CORE-003, CORE-004, CORE-005, CORE-006 | FR-2: Parses method, URL, headers, body |
| CORE-009 | FR-3: Request name reflects method and path |
| CORE-011, CORE-012 | FR-3: Request is saved to correct directory |
| UI-002, UI-003 | FR-4: "Import cURL" appears in context menu and toolbar |
| CORE-011 | FR-5: Imported request opens in main panel |
| ERROR-001 | FR-6: Error messages are clear and actionable |

---

## Progress Tracking

**Overall Progress**: 0/28 tasks completed (0%)

### Phase Completion
- [ ] Phase 0: Setup (0/2)
- [ ] Phase 1: Core Implementation (0/12)
- [ ] Phase 2: UI & Error Handling (0/6)
- [ ] Phase 3: Testing & Validation (0/8)

---

## Notes

- **TDD Approach**: Tests (TEST-001, TEST-002) should be written alongside implementation
- **Incremental Validation**: Run `npm run compile` after each major task
- **Manual Testing**: Perform manual testing (TEST-003, TEST-004) throughout development
- **Documentation**: Update README (DOC-001) as features are completed

---

## Risk Mitigation

| Risk | Mitigation Task |
|------|-----------------|
| Regex parsing complexity | CORE-002 through CORE-007 (modular approach) |
| Quote handling edge cases | CORE-007, TEST-001 (comprehensive testing) |
| Integration with existing services | TEST-002 (integration tests) |
| User experience issues | TEST-003, TEST-004 (manual testing) |

---

**Ready to begin implementation!** 🚀

