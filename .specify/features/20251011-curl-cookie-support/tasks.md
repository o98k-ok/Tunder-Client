# Implementation Tasks: cURL Cookie Support

**Feature**: cURL Cookie Support (-b parameter)  
**Branch**: `feature/20251011-curl-cookie-support`  
**Status**: Ready for Implementation

---

## Task Overview

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Implementation | 3 | 30-45 min |
| Phase 2: Testing | 5 | 15-30 min |
| Phase 3: Documentation | 1 | 15 min |
| **Total** | **9** | **1-2 hours** |

---

## Phase 1: Implementation

### Task 1.1: Add `extractCookies()` Method
- [x] **ID**: IMPL-001
- [ ] **Description**: Implement method to extract cookies from cURL command
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Add `extractCookies(input: string): string[]` private method
  - Match `-b` or `--cookie` flags using regex
  - Extract cookie values (name=value format)
  - Handle multiple cookie flags
  - Handle quoted and unquoted values
- [ ] **Validation**: Method compiles and extracts cookies correctly
- [ ] **Parallel**: No

### Task 1.2: Add `mergeCookiesIntoHeaders()` Method
- [x] **ID**: IMPL-002
- [ ] **Description**: Implement method to merge cookies into headers array
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Add `mergeCookiesIntoHeaders(cookies: string[], headers: RequestHeader[]): void` private method
  - Combine multiple cookies with `; ` separator
  - Check for existing `Cookie` header (case-insensitive)
  - Merge with existing Cookie header if present
  - Add new Cookie header if not present
- [ ] **Validation**: Cookies are correctly merged into headers
- [ ] **Parallel**: No
- [ ] **Dependencies**: IMPL-001

### Task 1.3: Modify `parse()` Method
- [x] **ID**: IMPL-003
- [ ] **Description**: Update parse method to call cookie extraction and merging
- [ ] **Files**: `src/services/curlParserService.ts`
- [ ] **Actions**:
  - Call `extractCookies()` after `extractHeaders()`
  - Call `mergeCookiesIntoHeaders()` if cookies exist
  - Ensure headers array is updated
- [ ] **Validation**: `npm run compile` succeeds
- [ ] **Parallel**: No
- [ ] **Dependencies**: IMPL-001, IMPL-002

---

## Phase 2: Testing

### Task 2.1: Unit Test - Single Cookie
- [x] **ID**: TEST-001
- [ ] **Description**: Test parsing cURL with single `-b` flag
- [ ] **Files**: `src/test/suite/curlParserService.test.ts`
- [ ] **Actions**:
  - Test: `curl https://api.com -b "session=abc123"`
  - Verify Cookie header exists
  - Verify value is `session=abc123`
- [ ] **Validation**: Test passes
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: IMPL-003

### Task 2.2: Unit Test - Multiple Cookies
- [x] **ID**: TEST-002
- [ ] **Description**: Test parsing cURL with multiple `-b` flags
- [ ] **Files**: `src/test/suite/curlParserService.test.ts`
- [ ] **Actions**:
  - Test: `curl https://api.com -b "session=abc" -b "user=john"`
  - Verify Cookie header value is `session=abc; user=john`
- [ ] **Validation**: Test passes
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: IMPL-003

### Task 2.3: Unit Test - Long Form Flag
- [x] **ID**: TEST-003
- [ ] **Description**: Test parsing cURL with `--cookie` flag
- [ ] **Files**: `src/test/suite/curlParserService.test.ts`
- [ ] **Actions**:
  - Test: `curl https://api.com --cookie "session=abc123"`
  - Verify Cookie header exists
- [ ] **Validation**: Test passes
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: IMPL-003

### Task 2.4: Unit Test - Cookie with Other Headers
- [x] **ID**: TEST-004
- [ ] **Description**: Test parsing cURL with both cookies and headers
- [ ] **Files**: `src/test/suite/curlParserService.test.ts`
- [ ] **Actions**:
  - Test: `curl https://api.com -H "Auth: token" -b "session=abc"`
  - Verify both Auth and Cookie headers exist
- [ ] **Validation**: Test passes
- [ ] **Parallel**: Yes [P]
- [ ] **Dependencies**: IMPL-003

### Task 2.5: Regression Test
- [x] **ID**: TEST-005
- [ ] **Description**: Verify existing tests still pass
- [ ] **Files**: All test files
- [ ] **Actions**:
  - Run `npm test`
  - Ensure all existing tests pass
  - No regressions in other functionality
- [ ] **Validation**: All tests pass
- [ ] **Parallel**: No
- [ ] **Dependencies**: TEST-001, TEST-002, TEST-003, TEST-004

---

## Phase 3: Documentation

### Task 3.1: Update README
- [x] **ID**: DOC-001
- [ ] **Description**: Document cookie support in README
- [ ] **Files**: `README.md`
- [ ] **Actions**:
  - Add `-b`/`--cookie` to supported cURL options list
  - Add example with cookie
  - Update feature list if needed
- [ ] **Validation**: README is clear and accurate
- [ ] **Parallel**: No
- [ ] **Dependencies**: TEST-005

---

## Task Execution Order

### Sequential Execution (Must Complete in Order)
1. **Phase 1**: IMPL-001 → IMPL-002 → IMPL-003
2. **Phase 2 Tests**: (TEST-001 || TEST-002 || TEST-003 || TEST-004) → TEST-005
3. **Phase 3**: DOC-001

### Parallel Execution (Can Run Simultaneously)
- **TEST-001, TEST-002, TEST-003, TEST-004** [P] (after IMPL-003)

---

## Acceptance Criteria Mapping

Each task maps to acceptance criteria from `spec.md`:

| Task | Acceptance Criteria |
|------|---------------------|
| IMPL-001, IMPL-003 | FR-1: Correctly parses `-b "session=abc123"` |
| IMPL-001, IMPL-003 | FR-1: Correctly parses `--cookie "user=john"` |
| IMPL-001, IMPL-002 | FR-1: Handles multiple `-b` flags |
| IMPL-002 | FR-2: Single cookie format `Cookie: name=value` |
| IMPL-002 | FR-2: Multiple cookies format `Cookie: name1=value1; name2=value2` |
| TEST-005 | FR-3: Existing tests pass without modification |

---

## Progress Tracking

**Overall Progress**: 9/9 tasks completed (100%)

### Phase Completion
- [x] Phase 1: Implementation (3/3)
- [x] Phase 2: Testing (5/5)
- [x] Phase 3: Documentation (1/1)

---

## Notes

- **Simple Enhancement**: Only modifies `curlParserService.ts`
- **No Breaking Changes**: Purely additive functionality
- **Quick Implementation**: Estimated 1-2 hours total
- **High Test Coverage**: 5 test tasks for thorough validation

---

**Ready to begin implementation!** 🚀

