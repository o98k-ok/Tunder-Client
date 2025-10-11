# Feature Specification: cURL Cookie Support (-b parameter)

**Version**: 1.0  
**Created**: 2025-10-11  
**Status**: Draft  
**Parent Feature**: [cURL Import](../20251011-curl-import/spec.md)

---

## Overview

### Feature Summary

Extend the existing cURL import feature to support the `-b`/`--cookie` parameter, allowing users to import cURL commands that include cookie data. Cookies will be automatically converted to `Cookie` headers in the imported request.

### Problem Statement

Many API requests require cookies for authentication or session management. Currently, cURL commands with `-b` or `--cookie` flags cannot be imported, forcing users to manually extract cookie data and add it as headers. This is tedious and error-prone, especially with multiple cookies.

### Target Users

- **API Developers**: Testing authenticated endpoints with session cookies
- **QA Engineers**: Reproducing bugs that require specific cookie values
- **DevOps Engineers**: Debugging production issues with cookie-based authentication

---

## Goals and Success Criteria

### Primary Goals

1. Support `-b` and `--cookie` flags in cURL import
2. Automatically convert cookie data to `Cookie` header
3. Maintain backward compatibility with existing cURL import functionality

### Success Criteria

1. **Parsing Accuracy**: 100% of cURL commands with `-b` flag are parsed correctly
2. **Cookie Conversion**: Cookie data is correctly formatted as `Cookie` header
3. **Backward Compatibility**: Existing cURL import functionality remains unchanged
4. **User Experience**: No additional user action required for cookie handling

### Non-Goals

- Cookie jar file support (`-b cookies.txt`)
- Cookie management or storage beyond the imported request
- Cookie editing UI

---

## User Scenarios & Testing

### Primary Flow: Import cURL with Single Cookie

**Scenario**: Import a GET request with one cookie

**Steps**:
1. User clicks "Import cURL"
2. User pastes:
   ```bash
   curl https://api.example.com/profile -b "session_id=abc123"
   ```
3. System parses cURL and extracts cookie
4. System creates request with `Cookie: session_id=abc123` header
5. Request is saved and opened

**Expected Outcome**: Request has `Cookie` header with correct value

### Alternative Flow: Multiple Cookies

**Scenario**: Import request with multiple cookies

**Steps**:
1. User pastes:
   ```bash
   curl https://api.example.com/data \
     -b "session_id=abc123" \
     -b "user_pref=dark_mode"
   ```
2. System combines cookies into single `Cookie` header
3. Request has `Cookie: session_id=abc123; user_pref=dark_mode` header

**Expected Outcome**: All cookies are combined with semicolon separator

### Alternative Flow: Cookie with Existing Headers

**Scenario**: Import request with both cookies and headers

**Steps**:
1. User pastes:
   ```bash
   curl https://api.example.com/api \
     -H "Authorization: Bearer token" \
     -b "session=xyz" \
     -H "Content-Type: application/json"
   ```
2. System adds `Cookie` header alongside other headers
3. Request has all headers including `Cookie`

**Expected Outcome**: Cookie header coexists with other headers

### Edge Case: Cookie with Special Characters

**Scenario**: Cookie value contains special characters

**Steps**:
1. User pastes:
   ```bash
   curl https://api.example.com -b "data=value%3Dwith%3Dencoded"
   ```
2. System preserves encoded value
3. Cookie header contains original encoded value

**Expected Outcome**: Special characters are preserved

---

## Functional Requirements

### FR-1: Cookie Parameter Parsing

**Description**: Parse `-b` and `--cookie` flags from cURL commands

**Requirements**:
- FR-1.1: Support `-b "name=value"` format
- FR-1.2: Support `--cookie "name=value"` format
- FR-1.3: Support multiple `-b` flags in same command
- FR-1.4: Handle quoted and unquoted cookie values
- FR-1.5: Preserve special characters and URL encoding

**Acceptance Criteria**:
- [ ] Correctly parses `-b "session=abc123"`
- [ ] Correctly parses `--cookie "user=john"`
- [ ] Handles multiple `-b` flags
- [ ] Preserves encoded characters (`%3D`, `%20`, etc.)

### FR-2: Cookie to Header Conversion

**Description**: Convert parsed cookies to `Cookie` HTTP header

**Requirements**:
- FR-2.1: Create `Cookie` header with format `name=value`
- FR-2.2: Combine multiple cookies with `; ` separator
- FR-2.3: Merge with existing `Cookie` header if present
- FR-2.4: Preserve cookie order from cURL command

**Acceptance Criteria**:
- [ ] Single cookie: `Cookie: name=value`
- [ ] Multiple cookies: `Cookie: name1=value1; name2=value2`
- [ ] Merges with existing `-H "Cookie: ..."` if present

### FR-3: Backward Compatibility

**Description**: Ensure existing cURL import functionality is not affected

**Requirements**:
- FR-3.1: cURL commands without `-b` work as before
- FR-3.2: All existing supported flags continue to work
- FR-3.3: No breaking changes to parser API

**Acceptance Criteria**:
- [ ] Existing tests pass without modification
- [ ] cURL without `-b` imports correctly
- [ ] No regression in other flag parsing

---

## Technical Constraints

### Platform Requirements

- Must integrate with existing `CurlParserService`
- Must maintain TypeScript type safety
- Must not break existing functionality

### Performance Requirements

- Cookie parsing adds < 10ms to total parse time
- No impact on memory usage

---

## Dependencies

### Internal Dependencies

- `CurlParserService`: Extend existing parser
- No changes to other services required

### External Dependencies

- None

---

## Assumptions

1. Cookie values are URL-encoded by the user if needed
2. Cookie jar files (`-b cookies.txt`) are out of scope
3. Users understand HTTP Cookie header format
4. Cookie expiration and domain are not relevant for import

---

## Open Questions

None. All requirements are clear.

---

## Out of Scope

- Cookie jar file support (`-b cookies.txt` or `-b /path/to/cookies`)
- Cookie expiration handling
- Cookie domain/path attributes
- Cookie editing UI
- Cookie persistence across requests

---

## Future Enhancements

- Support for cookie jar files
- Cookie management UI
- Cookie variable substitution
- Cookie export functionality

