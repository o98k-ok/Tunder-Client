# Technical Research: cURL Import

**Feature**: cURL Import  
**Date**: 2025-10-11  
**Status**: Complete

---

## Overview

This document captures technical research and decisions for implementing the cURL import feature. All unknowns from the Technical Context have been resolved.

---

## Research Areas

### 1. cURL Parsing Strategy

#### Decision: **Regex-based Parser with Tokenization**

#### Rationale:
- **Simplicity**: cURL syntax is relatively simple for HTTP requests
- **No Dependencies**: Avoids adding external parsing libraries
- **Performance**: Regex is fast for typical cURL commands (< 2KB)
- **Maintainability**: Easy to understand and extend

#### Alternatives Considered:
1. **Full Tokenizer/Lexer**
   - ❌ Overkill for our use case
   - ❌ Adds complexity without significant benefit
   - ✅ Would handle more edge cases

2. **External Library** (e.g., `yargs-parser`, `shell-quote`)
   - ❌ Adds dependency
   - ❌ May not handle cURL-specific syntax
   - ✅ Battle-tested parsing

3. **Regex-based Parser** (CHOSEN)
   - ✅ No dependencies
   - ✅ Fast and simple
   - ✅ Sufficient for 95% of use cases
   - ⚠️ Requires careful handling of quotes and escapes

#### Implementation Approach:

```typescript
// Parsing algorithm:
1. Normalize input (remove line continuations: \\\n → space)
2. Extract method: Match -X|--request followed by value
3. Extract URL: Find first non-flag argument (not starting with -)
4. Extract headers: Match all -H|--header flags and their values
5. Extract body: Match -d|--data|--data-raw and their values
6. Handle quotes: Support single quotes, double quotes, escaped quotes
```

**Key Regex Patterns**:

```typescript
// Method extraction
const methodRegex = /(?:^|\s)(?:-X|--request)\s+([A-Z]+)/;

// URL extraction (first non-flag argument)
const urlRegex = /(?:^|\s)(?!-)[^\s]+(?:\/\/[^\s]+)/;

// Headers extraction (multiple matches)
const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;

// Body extraction
const bodyRegex = /(?:-d|--data|--data-raw)\s+['"](.+?)['"]/s;

// Line continuation removal
const lineContinuationRegex = /\\\s*\n\s*/g;
```

**Quote Handling Strategy**:
- Single quotes: `'...'` → literal string (no escaping)
- Double quotes: `"..."` → allow escaped quotes `\"`
- Escaped quotes: `\'` or `\"` → remove backslash

**Edge Cases Handled**:
- Multi-line commands with `\` continuations
- Mixed quote styles in same command
- Headers without values (e.g., `-H "Accept:"`)
- Body with JSON containing quotes
- URL with query parameters
- Unsupported flags (ignored silently)

---

### 2. Dialog Implementation

#### Decision: **VSCode InputBox API (Phase 1)**

#### Rationale:
- **Native Integration**: Consistent with VSCode UX
- **Fast Implementation**: Built-in API, no custom UI needed
- **Sufficient for MVP**: Supports multi-line input and validation
- **Upgrade Path**: Can migrate to Webview later if needed

#### Alternatives Considered:
1. **Custom Webview**
   - ❌ More complex implementation
   - ❌ Requires HTML/CSS/JS for dialog
   - ✅ Full control over UI/UX
   - ✅ Can add syntax highlighting
   - 💡 Consider for Phase 4 (polish)

2. **VSCode InputBox** (CHOSEN)
   - ✅ Native VSCode component
   - ✅ Quick to implement
   - ✅ Supports multi-line input
   - ✅ Built-in validation
   - ⚠️ Limited styling options

#### Implementation:

```typescript
const curlInput = await vscode.window.showInputBox({
    prompt: 'Paste your cURL command here',
    placeHolder: 'curl -X POST https://api.example.com -H "Content-Type: application/json" -d \'{"key":"value"}\'',
    ignoreFocusOut: true,
    validateInput: (value) => {
        if (!value || value.trim().length === 0) {
            return 'Please enter a cURL command';
        }
        return null; // Valid
    }
});
```

**Limitations**:
- No syntax highlighting (acceptable for MVP)
- No real-time parsing feedback (acceptable for MVP)
- Limited error display (can show via notifications)

**Future Enhancement** (Phase 4):
- Upgrade to custom Webview with Monaco Editor
- Add syntax highlighting for cURL
- Show real-time parsing preview

---

### 3. Request Naming Algorithm

#### Decision: **Extract Path from URL + HTTP Method**

#### Rationale:
- **Descriptive**: Users can identify requests at a glance
- **Consistent**: Same format as manual request creation
- **Automatic**: No user input required

#### Algorithm:

```typescript
function generateRequestName(method: string, url: string): string {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        
        // Handle edge cases
        if (!path || path === '/') {
            path = '/';
        }
        
        // Remove trailing slash (unless root)
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        // Format: "METHOD /path"
        return `${method.toUpperCase()} ${path}`;
    } catch (error) {
        // Fallback if URL parsing fails
        return `${method.toUpperCase()} Request`;
    }
}
```

**Examples**:
- `curl https://api.com/v1/users` → `"GET /v1/users"`
- `curl -X POST https://api.com/` → `"POST /"`
- `curl https://api.com/search?q=test` → `"GET /search"` (query params stripped)
- `curl https://api.com/users/` → `"GET /users"` (trailing slash removed)

**Edge Cases**:
- No path: Use `/`
- Query parameters: Strip from name (keep in URL)
- Very long paths: Keep full path (no truncation for now)
- Invalid URL: Fallback to `"{METHOD} Request"`

---

### 4. Error Handling Strategy

#### Decision: **Graceful Degradation with Clear Feedback**

#### Rationale:
- **User-Friendly**: Clear error messages guide users to fix issues
- **Non-Blocking**: Dialog stays open for correction
- **Informative**: Provide examples of valid input

#### Error Types:

| Error | Detection | Message | Action |
|-------|-----------|---------|--------|
| **Empty Input** | `input.trim().length === 0` | "Please enter a cURL command" | Disable import button |
| **No URL Found** | URL regex fails | "Unable to find URL in cURL command. Example: `curl https://api.com`" | Show error, keep dialog open |
| **Invalid Syntax** | Parser throws exception | "Unable to parse cURL command. Please check the syntax." | Show error, keep dialog open |
| **Directory Cancelled** | User cancels directory picker | "Request import cancelled - no directory selected" | Close dialog silently |

#### Implementation:

```typescript
try {
    const parsed = parseCurlCommand(input);
    if (!parsed.url) {
        throw new Error('No URL found');
    }
    // Proceed with import...
} catch (error) {
    vscode.window.showErrorMessage(
        `Unable to parse cURL command: ${error.message}. ` +
        `Example: curl -X POST https://api.com -H "Content-Type: application/json" -d '{"key":"value"}'`
    );
    // Keep dialog open (return early, don't close)
}
```

---

### 5. Integration with Existing Services

#### Decision: **Reuse Existing Services Without Modification**

#### Rationale:
- **Principle 4 (Code Reuse)**: Leverage existing infrastructure
- **Principle 6 (Architecture Consistency)**: No breaking changes
- **Principle 8 (Refactoring Caution)**: Additive changes only

#### Integration Points:

1. **RequestService** (NO CHANGES)
   ```typescript
   // Already has createRequest() method
   requestService.createRequest({
       id: generateId(),
       name: generateRequestName(method, url),
       method,
       url,
       headers,
       body,
       folderId,
       created_at: Date.now(),
       updated_at: Date.now()
   });
   ```

2. **DirectoryService** (NO CHANGES)
   ```typescript
   // Already has getAllDirectories() method
   const directories = directoryService.getAllDirectories();
   ```

3. **HttpClientPanel** (NO CHANGES)
   ```typescript
   // Already has createOrShow() and loadRequest() methods
   HttpClientPanel.createOrShow(extensionUri, importedRequest);
   ```

4. **DirectoryTreeProvider** (MINIMAL CHANGES)
   ```typescript
   // Expose refresh() method if not already public
   public refresh(): void {
       this._onDidChangeTreeData.fire();
   }
   ```

---

### 6. Testing Strategy

#### Decision: **Unit Tests + Integration Tests + Manual Testing**

#### Test Coverage:

**Unit Tests** (curlParserService.ts):
- [ ] Parse GET request with no flags
- [ ] Parse POST request with method flag
- [ ] Parse request with single header
- [ ] Parse request with multiple headers
- [ ] Parse request with JSON body
- [ ] Parse request with query parameters
- [ ] Parse multi-line cURL with backslash continuations
- [ ] Handle single quotes, double quotes, escaped quotes
- [ ] Ignore unsupported flags (-v, -k, etc.)
- [ ] Throw error for missing URL
- [ ] Throw error for invalid syntax

**Integration Tests** (command handlers):
- [ ] Import from directory context menu
- [ ] Import from toolbar with directory selection
- [ ] Request is saved to correct directory
- [ ] Request appears in tree view
- [ ] Request opens in HttpClientPanel
- [ ] Success notification is shown

**Manual Testing Checklist**:
- [ ] Test with real-world cURL examples from popular APIs (GitHub, Stripe, etc.)
- [ ] Test error messages are clear and helpful
- [ ] Test keyboard shortcuts (Cmd+Enter, Esc)
- [ ] Test with very long cURL commands
- [ ] Test with malformed input

---

## Technology Decisions Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Parser** | Regex-based | Simple, fast, no dependencies |
| **Dialog** | VSCode InputBox | Native, quick to implement |
| **Storage** | Existing RequestService | Reuse, no changes needed |
| **Testing** | VSCode Test Runner | Standard for extensions |
| **Language** | TypeScript | Project standard |

---

## Open Questions

None. All technical unknowns have been resolved.

---

## Next Steps

1. ✅ Research complete
2. 🔄 Create data-model.md (define interfaces)
3. ⏳ Create quickstart.md (developer guide)
4. ⏳ Begin Phase 1 implementation

