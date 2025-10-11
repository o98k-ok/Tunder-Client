# Feature Specification: URL Parameters Tab

**Version**: 1.0  
**Created**: 2025-10-11  
**Status**: Draft

---

## Overview

### Feature Summary

Add a dedicated "Params" tab to the request editor that parses and displays URL query parameters in a structured table format. This improves readability and editability for requests with long URLs containing many parameters.

### Problem Statement

When working with APIs that have many query parameters, the URL becomes very long and difficult to read in a single input field. Users must manually parse the URL to understand which parameters are being sent, and editing individual parameters is error-prone (risk of breaking URL encoding, missing `&` separators, etc.).

### Target Users

- **API Developers**: Testing endpoints with multiple query parameters
- **QA Engineers**: Modifying test parameters frequently
- **Backend Developers**: Debugging API calls with complex parameter combinations

---

## Goals and Success Criteria

### Primary Goals

1. Provide a structured view of URL query parameters
2. Allow users to add/edit/delete parameters without manually editing the URL
3. Automatically sync parameters between URL field and Params tab
4. Improve user experience when working with long URLs

### Success Criteria

1. **Parsing Accuracy**: 100% of valid URL query parameters are correctly parsed and displayed
2. **Sync Reliability**: URL and Params tab remain synchronized in real-time
3. **User Efficiency**: Users can modify parameters 50% faster than editing raw URL
4. **Error Reduction**: 90% reduction in URL formatting errors (missing `?`, `&`, encoding issues)
5. **User Satisfaction**: Users rate Params tab as "useful" or "essential" in feedback

### Non-Goals

- Path parameter parsing (e.g., `/users/:id`)
- URL fragment handling (e.g., `#section`)
- Advanced URL encoding/decoding UI
- Parameter validation against API schema

---

## User Scenarios & Testing

### Primary Flow: View and Edit Parameters

**Actor**: API Developer  
**Scenario**: Testing an API endpoint with multiple query parameters

**Steps**:
1. User opens a request with URL: `https://api.example.com/search?q=test&limit=10&offset=0&sort=desc`
2. User clicks "Params" tab (next to "Body" and "Headers")
3. System displays parameters in a table:
   | Key | Value |
   |-----|-------|
   | q | test |
   | limit | 10 |
   | offset | 0 |
   | sort | desc |
4. User changes `limit` value from `10` to `20`
5. System automatically updates URL to: `https://api.example.com/search?q=test&limit=20&offset=0&sort=desc`
6. User sends request with updated parameters

**Expected Outcome**: Parameters are easy to read and modify; URL is automatically updated

### Alternative Flow: Add New Parameter

**Scenario**: User needs to add a new query parameter

**Steps**:
1. User is on Params tab
2. User clicks "Add Parameter" button (or fills empty row at bottom)
3. User enters key: `filter`, value: `active`
4. System adds parameter to URL: `...&filter=active`
5. Parameter appears in table

**Expected Outcome**: New parameter is added without manual URL editing

### Alternative Flow: Delete Parameter

**Scenario**: User wants to remove a query parameter

**Steps**:
1. User is on Params tab
2. User clicks delete icon (❌) next to a parameter row
3. System removes parameter from URL
4. Row disappears from table

**Expected Outcome**: Parameter is cleanly removed from URL

### Alternative Flow: URL Without Parameters

**Scenario**: User opens a request with no query parameters

**Steps**:
1. User opens request with URL: `https://api.example.com/users`
2. User clicks Params tab
3. System shows empty table with "Add Parameter" option
4. User adds first parameter: `page=1`
5. System updates URL to: `https://api.example.com/users?page=1`

**Expected Outcome**: User can add parameters to URL without manually typing `?`

### Edge Case: URL Encoding

**Scenario**: Parameter value contains special characters

**Steps**:
1. User adds parameter: `name=John Doe`
2. System encodes value in URL: `name=John%20Doe`
3. Params tab displays decoded value: `John Doe`
4. User edits in Params tab, system maintains proper encoding

**Expected Outcome**: Users work with readable values; system handles encoding

### Edge Case: Duplicate Parameter Keys

**Scenario**: URL has duplicate parameter keys (e.g., `?tag=red&tag=blue`)

**Steps**:
1. User opens URL with: `?tag=red&tag=blue`
2. System displays both parameters in table
3. User can edit or delete each independently

**Expected Outcome**: Duplicate keys are supported (common in APIs)

---

## Functional Requirements

### FR-1: Params Tab UI

**Description**: Add a new tab to the request editor

**Requirements**:
- FR-1.1: Add "Params" tab next to "Body" and "Headers" tabs
- FR-1.2: Tab displays a table with columns: "Key", "Value", "Actions"
- FR-1.3: Table has "Add Parameter" button or empty row at bottom
- FR-1.4: Each row has delete button (❌ icon)
- FR-1.5: Empty state shows helpful message: "No parameters. Add one to get started."
- FR-1.6: Tab is visible for all HTTP methods (GET, POST, etc.)

**Acceptance Criteria**:
- [ ] Params tab appears in tab bar
- [ ] Table displays with proper columns
- [ ] Add and delete buttons are functional
- [ ] Empty state is user-friendly

### FR-2: URL Parsing

**Description**: Parse query parameters from URL

**Requirements**:
- FR-2.1: Parse parameters when URL contains `?`
- FR-2.2: Split parameters by `&` delimiter
- FR-2.3: Parse key-value pairs split by `=`
- FR-2.4: Decode URL-encoded values for display
- FR-2.5: Handle parameters without values (e.g., `?flag`)
- FR-2.6: Handle duplicate parameter keys
- FR-2.7: Handle empty values (e.g., `?key=`)

**Acceptance Criteria**:
- [ ] Correctly parses `?key1=value1&key2=value2`
- [ ] Decodes `%20` to space, `%3D` to `=`, etc.
- [ ] Handles `?flag` (no value)
- [ ] Handles `?key=` (empty value)
- [ ] Supports duplicate keys

### FR-3: Parameter Editing

**Description**: Allow users to add, edit, and delete parameters

**Requirements**:
- FR-3.1: Users can edit key and value inline in table
- FR-3.2: Changes immediately update the URL field
- FR-3.3: Users can add new parameter via button or empty row
- FR-3.4: Users can delete parameter via delete button
- FR-3.5: System maintains proper URL encoding when updating URL
- FR-3.6: System preserves base URL (protocol, domain, path)

**Acceptance Criteria**:
- [ ] Editing value updates URL in real-time
- [ ] Adding parameter appends to URL with proper `&`
- [ ] Deleting parameter removes from URL
- [ ] First parameter uses `?`, subsequent use `&`
- [ ] Special characters are URL-encoded

### FR-4: Bidirectional Sync

**Description**: Keep URL field and Params tab synchronized

**Requirements**:
- FR-4.1: When user edits URL field, Params tab updates
- FR-4.2: When user edits Params tab, URL field updates
- FR-4.3: Sync happens in real-time (< 100ms delay)
- FR-4.4: Cursor position in URL field is preserved when possible
- FR-4.5: Params tab reflects current URL when switching tabs

**Acceptance Criteria**:
- [ ] URL changes reflect in Params tab
- [ ] Params changes reflect in URL field
- [ ] No noticeable lag
- [ ] Switching tabs shows current state

### FR-5: URL Encoding/Decoding

**Description**: Handle URL encoding transparently

**Requirements**:
- FR-5.1: Display decoded values in Params tab (human-readable)
- FR-5.2: Encode values when updating URL
- FR-5.3: Support common encodings: space (`%20`), `=` (`%3D`), `&` (`%26`), etc.
- FR-5.4: Preserve already-encoded values when possible

**Acceptance Criteria**:
- [ ] `John%20Doe` displays as `John Doe`
- [ ] User enters `John Doe`, URL shows `John%20Doe`
- [ ] Special characters are properly encoded

### FR-6: Empty State and Validation

**Description**: Handle edge cases gracefully

**Requirements**:
- FR-6.1: Show helpful message when no parameters exist
- FR-6.2: Prevent duplicate keys warning (optional, allow duplicates)
- FR-6.3: Allow empty parameter values
- FR-6.4: Allow parameters without values (flags)
- FR-6.5: Trim whitespace from keys and values

**Acceptance Criteria**:
- [ ] Empty state is clear
- [ ] Duplicate keys are allowed
- [ ] Empty values work
- [ ] Whitespace is trimmed

---

## Technical Constraints

### Platform Requirements

- Must integrate with existing request editor UI
- Must work within VSCode Webview
- Must maintain existing URL field functionality

### Performance Requirements

- Parameter parsing: < 50ms for URLs with 100+ parameters
- UI update: < 100ms after user input
- No blocking of main UI thread

---

## Dependencies

### Internal Dependencies

- `HttpClientPanel`: Modify to add Params tab
- Existing URL input field
- Tab switching logic (Body/Headers tabs)

### External Dependencies

- Browser `URLSearchParams` API (or equivalent parsing)
- None (no new external libraries needed)

---

## Assumptions

1. Users understand query parameters and their purpose
2. Most APIs use standard `?key=value&key2=value2` format
3. URL encoding/decoding follows standard RFC 3986
4. Users prefer table view over raw URL for editing
5. Duplicate parameter keys are valid (e.g., `?tag=a&tag=b`)

---

## Open Questions

None. All requirements are clear based on standard URL parameter handling.

---

## Out of Scope

- Path parameter extraction (e.g., `/users/:id`)
- URL fragment handling (e.g., `#section`)
- Parameter validation against API schema
- Parameter autocomplete from history
- Bulk parameter import/export
- Parameter templates or presets

---

## Future Enhancements

- Parameter descriptions/comments
- Parameter type hints (string, number, boolean)
- Parameter validation rules
- Parameter autocomplete from history
- Bulk enable/disable parameters (like Postman)
- Parameter templates for common API patterns

