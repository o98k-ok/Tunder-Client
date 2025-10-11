# Implementation Plan: cURL Cookie Support

**Feature**: cURL Cookie Support (-b parameter)  
**Spec**: [spec.md](./spec.md)  
**Branch**: `feature/20251011-curl-cookie-support`  
**Parent Feature**: [cURL Import](../20251011-curl-import/)

---

## Status

- **Status**: Planning
- **Created**: 2025-10-11
- **Estimated Time**: 1-2 hours

---

## Technical Context

### Architecture Overview

This is an **incremental enhancement** to the existing cURL import feature. Changes are localized to the `CurlParserService`.

```
┌─────────────────────────────────────────────────────────┐
│  CurlParserService (MODIFY)                             │
├─────────────────────────────────────────────────────────┤
│  parse(input: string): ParsedRequest                    │
│  ├─ extractMethod()         [NO CHANGE]                 │
│  ├─ extractUrl()            [NO CHANGE]                 │
│  ├─ extractHeaders()        [NO CHANGE]                 │
│  ├─ extractBody()           [NO CHANGE]                 │
│  └─ extractCookies()        [NEW METHOD]                │
│     └─ Merge with headers                               │
└─────────────────────────────────────────────────────────┘
```

### Key Changes

1. **Add `extractCookies()` method** to `CurlParserService`
   - Parse `-b` and `--cookie` flags
   - Extract cookie name-value pairs
   - Return array of cookies

2. **Modify `parse()` method** to call `extractCookies()`
   - Convert cookies to `Cookie` header
   - Merge with existing headers
   - Maintain header order

3. **No changes to**:
   - `extension.ts` (command handlers)
   - `package.json` (UI)
   - Other services
   - Data interfaces

### Cookie Format

**cURL Format**:
```bash
-b "name=value"
--cookie "name=value"
```

**HTTP Header Format**:
```
Cookie: name=value
Cookie: name1=value1; name2=value2  # Multiple cookies
```

---

## Constitution Check

### Principle Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| **1. 接口文档完整性** | ✅ PASS | cURL `-b` flag is well-documented |
| **2. 执行明确性** | ✅ PASS | Clear requirements and acceptance criteria |
| **3. 业务理解** | ✅ PASS | Cookie support is a common API testing need |
| **4. 代码复用** | ✅ PASS | Extends existing parser, no duplication |
| **5. 测试规范** | ✅ PASS | Test cases defined in spec |
| **6. 架构一致性** | ✅ PASS | Follows existing parser pattern |
| **7. 知识诚实** | ✅ PASS | Cookie format is standard HTTP |
| **8. 重构谨慎** | ✅ PASS | Additive change, no refactoring |

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Breaking existing functionality** | Low | Comprehensive tests, isolated changes |
| **Cookie format edge cases** | Low | Follow HTTP spec, handle encoding |
| **Multiple cookie handling** | Low | Use standard semicolon separator |

### Gates

- ✅ **Gate 1**: Requirements are clear and testable
- ✅ **Gate 2**: No breaking changes to existing code
- ✅ **Gate 3**: Constitution principles satisfied
- ✅ **Gate 4**: Implementation is simple and focused

**Decision**: Proceed with implementation

---

## Implementation Phases

### Phase 0: Research & Design (15 minutes)

**Objective**: Understand cookie format and parsing strategy

**Tasks**:
1. Review HTTP Cookie header specification
2. Review cURL `-b` flag documentation
3. Design regex pattern for cookie extraction
4. Plan cookie-to-header conversion logic

**Deliverables**:
- `design/research.md`: Technical decisions
- Cookie parsing regex pattern

---

### Phase 1: Implementation (30-45 minutes)

#### Task 1.1: Add `extractCookies()` Method

**File**: `src/services/curlParserService.ts`

**Implementation**:
```typescript
/**
 * Extract cookies from cURL command
 * 
 * @param input - Normalized cURL string
 * @returns Array of cookie strings (name=value format)
 */
private extractCookies(input: string): string[] {
    const cookies: string[] = [];
    
    // Match -b or --cookie flags
    const cookieRegex = /(?:-b|--cookie)\s+(['"])(.*?)\1/g;
    let match;
    
    while ((match = cookieRegex.exec(input)) !== null) {
        const cookieValue = match[2];
        cookies.push(cookieValue);
    }
    
    return cookies;
}
```

#### Task 1.2: Modify `parse()` Method

**File**: `src/services/curlParserService.ts`

**Changes**:
```typescript
parse(input: string): ParsedRequest {
    // ... existing code ...
    
    const headers = this.extractHeaders(normalized);
    const cookies = this.extractCookies(normalized);
    
    // Convert cookies to Cookie header
    if (cookies.length > 0) {
        const cookieHeader = cookies.join('; ');
        
        // Check if Cookie header already exists
        const existingCookieIndex = headers.findIndex(
            h => h.key.toLowerCase() === 'cookie'
        );
        
        if (existingCookieIndex >= 0) {
            // Merge with existing Cookie header
            headers[existingCookieIndex].value += '; ' + cookieHeader;
        } else {
            // Add new Cookie header
            headers.push({ key: 'Cookie', value: cookieHeader });
        }
    }
    
    // ... rest of code ...
}
```

---

### Phase 2: Testing (15-30 minutes)

#### Task 2.1: Unit Tests

**File**: `src/test/suite/curlParserService.test.ts`

**Test Cases**:
```typescript
test('Parse cURL with single cookie', () => {
    const input = 'curl https://api.com -b "session=abc123"';
    const result = parser.parse(input);
    
    const cookieHeader = result.headers.find(h => h.key === 'Cookie');
    assert.strictEqual(cookieHeader?.value, 'session=abc123');
});

test('Parse cURL with multiple cookies', () => {
    const input = 'curl https://api.com -b "session=abc" -b "user=john"';
    const result = parser.parse(input);
    
    const cookieHeader = result.headers.find(h => h.key === 'Cookie');
    assert.strictEqual(cookieHeader?.value, 'session=abc; user=john');
});

test('Parse cURL with cookie and headers', () => {
    const input = 'curl https://api.com -H "Auth: token" -b "session=abc"';
    const result = parser.parse(input);
    
    assert.strictEqual(result.headers.length, 2);
    assert.ok(result.headers.some(h => h.key === 'Auth'));
    assert.ok(result.headers.some(h => h.key === 'Cookie'));
});

test('Parse cURL with --cookie flag', () => {
    const input = 'curl https://api.com --cookie "session=abc123"';
    const result = parser.parse(input);
    
    const cookieHeader = result.headers.find(h => h.key === 'Cookie');
    assert.strictEqual(cookieHeader?.value, 'session=abc123');
});

test('Parse cURL with encoded cookie value', () => {
    const input = 'curl https://api.com -b "data=value%3Dencoded"';
    const result = parser.parse(input);
    
    const cookieHeader = result.headers.find(h => h.key === 'Cookie');
    assert.strictEqual(cookieHeader?.value, 'data=value%3Dencoded');
});
```

#### Task 2.2: Integration Tests

**Manual Testing**:
1. Import cURL with `-b "session=abc123"`
2. Verify Cookie header appears in request
3. Send request and verify cookie is sent
4. Import cURL with multiple `-b` flags
5. Verify cookies are combined correctly

---

### Phase 3: Documentation (15 minutes)

#### Task 3.1: Update README

**File**: `README.md`

**Changes**:
- Add `-b`/`--cookie` to supported cURL options list
- Add example with cookie

**Example**:
```markdown
**支持的 cURL 选项**：
- `-X`, `--request`: HTTP 方法
- `-H`, `--header`: 请求头
- `-d`, `--data`, `--data-raw`: 请求体
- `-b`, `--cookie`: Cookies (自动转换为 Cookie 头部)
- URL 和查询参数
```

---

## Total Estimated Time

| Phase | Duration |
|-------|----------|
| Phase 0: Research | 15 min |
| Phase 1: Implementation | 30-45 min |
| Phase 2: Testing | 15-30 min |
| Phase 3: Documentation | 15 min |
| **Total** | **1-2 hours** |

---

## Success Metrics

### Implementation Metrics
- [ ] `extractCookies()` method implemented
- [ ] `parse()` method updated
- [ ] All unit tests pass
- [ ] No regression in existing tests

### User Metrics
- [ ] cURL with `-b` flag imports correctly
- [ ] Cookie header is properly formatted
- [ ] Multiple cookies are combined correctly
- [ ] Backward compatibility maintained

---

## Acceptance Criteria

From spec.md:

### FR-1: Cookie Parameter Parsing
- [ ] Correctly parses `-b "session=abc123"`
- [ ] Correctly parses `--cookie "user=john"`
- [ ] Handles multiple `-b` flags
- [ ] Preserves encoded characters

### FR-2: Cookie to Header Conversion
- [ ] Single cookie: `Cookie: name=value`
- [ ] Multiple cookies: `Cookie: name1=value1; name2=value2`
- [ ] Merges with existing `-H "Cookie: ..."` if present

### FR-3: Backward Compatibility
- [ ] Existing tests pass without modification
- [ ] cURL without `-b` imports correctly
- [ ] No regression in other flag parsing

---

## Next Steps

1. ✅ Complete this implementation plan
2. 🔄 **Execute Phase 0**: Create research.md
3. ⏳ Execute Phase 1: Implement cookie support
4. ⏳ Execute Phase 2: Write and run tests
5. ⏳ Execute Phase 3: Update documentation

**Ready to proceed to Phase 0 research.**

