# Technical Research: cURL Cookie Support

**Feature**: cURL Cookie Support  
**Date**: 2025-10-11  
**Status**: Complete

---

## Overview

This document captures technical research for adding `-b`/`--cookie` parameter support to the existing cURL parser.

---

## Research Areas

### 1. HTTP Cookie Header Format

#### Specification

**RFC 6265 - HTTP State Management Mechanism**

**Cookie Header Format**:
```
Cookie: name=value
Cookie: name1=value1; name2=value2; name3=value3
```

**Key Points**:
- Multiple cookies are separated by `; ` (semicolon + space)
- Cookie format is `name=value`
- No expiration, domain, or path in Cookie header (those are in Set-Cookie)
- Values may be URL-encoded

**Example**:
```http
GET /api/data HTTP/1.1
Host: example.com
Cookie: session_id=abc123; user_pref=dark_mode; lang=en
```

---

### 2. cURL `-b` Flag Syntax

#### Documentation

**cURL Manual**: `-b, --cookie <data|filename>`

**Supported Formats**:
1. **Name-value pair**: `-b "name=value"`
2. **Multiple cookies**: `-b "name1=value1" -b "name2=value2"`
3. **Cookie file**: `-b cookies.txt` (OUT OF SCOPE)

**Examples**:
```bash
# Single cookie
curl -b "session=abc123" https://api.com

# Multiple cookies (separate flags)
curl -b "session=abc123" -b "user=john" https://api.com

# Long form
curl --cookie "session=abc123" https://api.com

# With other flags
curl -X POST https://api.com \
  -H "Content-Type: application/json" \
  -b "session=abc123" \
  -d '{"key":"value"}'
```

---

### 3. Cookie Parsing Strategy

#### Decision: **Regex-based Extraction**

#### Rationale:
- ✅ Consistent with existing parser implementation
- ✅ Simple and efficient for name-value pairs
- ✅ No additional dependencies
- ✅ Easy to test and maintain

#### Implementation Approach:

```typescript
// Regex pattern for -b or --cookie flags
const cookieRegex = /(?:-b|--cookie)\s+(['"])(.*?)\1/g;

// Example matches:
// -b "session=abc123"     → "session=abc123"
// --cookie "user=john"    → "user=john"
// -b 'data=value%3D'      → "data=value%3D"
```

**Handling Multiple Cookies**:
```typescript
const cookies: string[] = [];
let match;

while ((match = cookieRegex.exec(input)) !== null) {
    cookies.push(match[2]); // Extract cookie value
}

// Combine: cookies.join('; ')
// Result: "session=abc123; user=john"
```

---

### 4. Cookie-to-Header Conversion

#### Decision: **Convert to `Cookie` Header**

#### Rationale:
- ✅ Standard HTTP header format
- ✅ Compatible with existing header handling
- ✅ No special cookie storage needed
- ✅ Works with existing request model

#### Conversion Logic:

```typescript
function convertCookiesToHeader(cookies: string[], existingHeaders: RequestHeader[]): RequestHeader[] {
    if (cookies.length === 0) {
        return existingHeaders;
    }
    
    // Combine all cookies with semicolon separator
    const cookieValue = cookies.join('; ');
    
    // Check if Cookie header already exists
    const cookieHeaderIndex = existingHeaders.findIndex(
        h => h.key.toLowerCase() === 'cookie'
    );
    
    if (cookieHeaderIndex >= 0) {
        // Merge with existing Cookie header
        existingHeaders[cookieHeaderIndex].value += '; ' + cookieValue;
    } else {
        // Add new Cookie header
        existingHeaders.push({ key: 'Cookie', value: cookieValue });
    }
    
    return existingHeaders;
}
```

**Examples**:

| Input | Output Header |
|-------|---------------|
| `-b "session=abc"` | `Cookie: session=abc` |
| `-b "a=1" -b "b=2"` | `Cookie: a=1; b=2` |
| `-H "Cookie: x=y" -b "a=1"` | `Cookie: x=y; a=1` |

---

### 5. Edge Cases

#### Case 1: Cookie with Special Characters

**Input**:
```bash
curl -b "data=value%3Dwith%3Dencoded" https://api.com
```

**Handling**: Preserve as-is (no decoding)

**Rationale**: URL encoding is intentional, should not be modified

---

#### Case 2: Cookie with Spaces

**Input**:
```bash
curl -b "name=value with spaces" https://api.com
```

**Handling**: Preserve as-is (within quotes)

**Note**: Technically invalid per HTTP spec, but cURL allows it

---

#### Case 3: Multiple `-b` Flags

**Input**:
```bash
curl -b "session=abc" -b "user=john" -b "pref=dark" https://api.com
```

**Output**:
```
Cookie: session=abc; user=john; pref=dark
```

**Handling**: Combine in order with `; ` separator

---

#### Case 4: Existing Cookie Header

**Input**:
```bash
curl -H "Cookie: existing=value" -b "new=value" https://api.com
```

**Output**:
```
Cookie: existing=value; new=value
```

**Handling**: Merge with existing header

---

### 6. Testing Strategy

#### Unit Tests

**Test Coverage**:
1. ✅ Single cookie with `-b`
2. ✅ Single cookie with `--cookie`
3. ✅ Multiple `-b` flags
4. ✅ Cookie with special characters
5. ✅ Cookie with URL encoding
6. ✅ Cookie with existing Cookie header
7. ✅ Cookie with other headers
8. ✅ cURL without cookies (regression test)

#### Integration Tests

**Manual Testing**:
1. Import cURL with cookie
2. Verify Cookie header in request
3. Send request and check cookie is sent
4. Verify with browser DevTools or proxy

---

## Implementation Details

### File Changes

**Only one file needs modification**:
- `src/services/curlParserService.ts`

**Changes**:
1. Add `extractCookies()` private method
2. Modify `parse()` method to call `extractCookies()`
3. Add cookie-to-header conversion logic

**No changes needed**:
- ❌ `extension.ts` (command handlers)
- ❌ `package.json` (UI)
- ❌ Data interfaces
- ❌ Other services

---

### Code Structure

```typescript
export class CurlParserService {
    parse(input: string): ParsedRequest {
        // ... existing code ...
        
        const headers = this.extractHeaders(normalized);
        const cookies = this.extractCookies(normalized); // NEW
        
        // Convert cookies to Cookie header
        if (cookies.length > 0) {
            this.mergeCookiesIntoHeaders(cookies, headers); // NEW
        }
        
        // ... rest of code ...
    }
    
    private extractCookies(input: string): string[] {
        // NEW METHOD
    }
    
    private mergeCookiesIntoHeaders(cookies: string[], headers: RequestHeader[]): void {
        // NEW METHOD
    }
}
```

---

## Performance Impact

### Parsing Performance

**Additional Operations**:
- 1 regex match operation (similar to existing header/body extraction)
- Array join operation (O(n) where n = number of cookies)
- Header merge operation (O(1) or O(n) where n = number of headers)

**Expected Impact**: < 5ms for typical cURL commands

**Conclusion**: Negligible performance impact

---

## Backward Compatibility

### Compatibility Analysis

**Existing Functionality**:
- ✅ cURL without `-b` works as before
- ✅ All existing flags continue to work
- ✅ No changes to parser API
- ✅ No changes to data interfaces

**Risk**: **Very Low**

**Mitigation**:
- Comprehensive regression tests
- Cookie extraction is independent of other parsing
- Only adds new functionality, doesn't modify existing

---

## Alternative Approaches Considered

### Alternative 1: Separate Cookie Field in ParsedRequest

**Approach**: Add `cookies: string[]` to `ParsedRequest` interface

**Pros**:
- ✅ More explicit data model
- ✅ Easier to distinguish cookies from headers

**Cons**:
- ❌ Requires changes to Request interface
- ❌ Requires changes to command handlers
- ❌ More complex implementation
- ❌ Breaking change to existing code

**Decision**: ❌ **Rejected** - Too complex for minimal benefit

---

### Alternative 2: Cookie as Separate Header Type

**Approach**: Store cookies separately in request model

**Pros**:
- ✅ Semantic separation

**Cons**:
- ❌ Requires data model changes
- ❌ Requires UI changes
- ❌ Over-engineering for simple use case

**Decision**: ❌ **Rejected** - Not worth the complexity

---

### Alternative 3: Convert to Cookie Header (CHOSEN)

**Approach**: Convert `-b` flags to `Cookie` header immediately

**Pros**:
- ✅ Simple implementation
- ✅ No data model changes
- ✅ No UI changes
- ✅ Standard HTTP format
- ✅ Works with existing code

**Cons**:
- ⚠️ Loses distinction between cookies and headers (acceptable)

**Decision**: ✅ **CHOSEN** - Best balance of simplicity and functionality

---

## Security Considerations

### Cookie Data Handling

**Concern**: Cookies may contain sensitive data (session tokens, auth tokens)

**Mitigation**:
- ✅ No logging of cookie values
- ✅ No transmission to external services
- ✅ Same security model as existing headers
- ✅ User responsible for sensitive data (per constitution)

**Conclusion**: No additional security risks beyond existing header handling

---

## Summary

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Parsing Strategy** | Regex-based | Consistent with existing parser |
| **Cookie Storage** | Convert to Cookie header | Simple, no data model changes |
| **Multiple Cookies** | Combine with `; ` | HTTP spec compliant |
| **Special Characters** | Preserve as-is | User's responsibility to encode |
| **Backward Compatibility** | Full compatibility | Additive change only |

### Implementation Complexity

- **Complexity**: Low
- **Risk**: Very Low
- **Estimated Time**: 1-2 hours
- **Files Changed**: 1 file (`curlParserService.ts`)
- **Lines of Code**: ~30-40 lines

---

## Next Steps

1. ✅ Research complete
2. 🔄 Implement `extractCookies()` method
3. ⏳ Implement `mergeCookiesIntoHeaders()` method
4. ⏳ Update `parse()` method
5. ⏳ Write unit tests
6. ⏳ Manual testing
7. ⏳ Update README

