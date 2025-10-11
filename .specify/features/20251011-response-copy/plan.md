# Implementation Plan: Response Copy Button

**Version**: 1.0  
**Created**: 2025-10-11  
**Feature**: [spec.md](./spec.md)

---

## Technical Context

### Technology Stack

- **Language**: TypeScript
- **UI**: HTML/CSS in VSCode Webview
- **API**: Clipboard API (`navigator.clipboard.writeText()`)
- **Framework**: None (vanilla JavaScript)

### Implementation Approach

**Simple Enhancement**: Add copy button to existing response header area.

**Key Principles**:
1. Use browser Clipboard API
2. Minimal UI changes
3. Clear user feedback
4. No external dependencies

---

## Constitution Check

### Alignment with Project Principles

1. ✅ **Simplicity**: One button, one action
2. ✅ **User Value**: Saves time, improves workflow
3. ✅ **No Dependencies**: Uses browser native API
4. ✅ **Maintainability**: Simple, isolated code
5. ✅ **Performance**: < 100ms operation

### Gate Evaluation

- ✅ **Complexity Gate**: Very low complexity
- ✅ **Dependency Gate**: No new dependencies
- ✅ **Value Gate**: High user value for common task

**Decision**: ✅ Proceed with implementation

---

## Implementation Strategy

### Phase 0: Research

**Clipboard API**:
- Modern browsers support `navigator.clipboard.writeText()`
- Requires secure context (HTTPS or localhost)
- VSCode Webview supports Clipboard API
- No fallback needed for VSCode environment

**UI Patterns**:
- Copy button in top-right is standard pattern
- Icon: 📋 (clipboard) or "Copy" text
- Feedback: Temporary state change (✓ Copied!)
- Revert after 2 seconds

**Best Practices**:
- Copy raw response data (not formatted HTML)
- Handle errors gracefully
- Provide immediate visual feedback
- Keep button simple and unobtrusive

---

## Phase 1: Design

### Data Model

No data model changes needed. Operation is stateless.

### UI Components

```
Response Header
├── Status Badge (existing)
├── Response Meta (existing)
└── Copy Button (NEW)
    ├── Icon: 📋
    ├── States: default, copying, copied, error
    └── Position: absolute right
```

### Function Signatures

```javascript
// Copy response to clipboard
async function copyResponseToClipboard() {
    // Get response body text
    // Copy to clipboard
    // Show success feedback
    // Revert after 2s
}

// Update button state
function updateCopyButtonState(state: 'default' | 'copied' | 'error') {
    // Update button text/icon
    // Update button class
}
```

---

## Implementation Phases

### Phase 1: UI Structure (15 min)

**Tasks**:
1. Add copy button HTML to response header
2. Style button to match existing UI
3. Position button in top-right corner
4. Add hover effects

**Files**:
- `src/HttpClientPanel.ts` (HTML/CSS)

---

### Phase 2: Copy Functionality (20 min)

**Tasks**:
1. Implement `copyResponseToClipboard()` function
2. Get raw response data (not formatted HTML)
3. Use Clipboard API to copy
4. Handle errors

**Files**:
- `src/HttpClientPanel.ts` (JavaScript)

---

### Phase 3: User Feedback (15 min)

**Tasks**:
1. Implement button state changes
2. Show "Copied!" feedback
3. Auto-revert after 2 seconds
4. Handle error states

**Files**:
- `src/HttpClientPanel.ts` (JavaScript/CSS)

---

### Phase 4: Testing (10 min)

**Tasks**:
1. Test with JSON responses
2. Test with large responses
3. Test with empty responses
4. Test error handling

---

**Total Estimated Time**: 1 hour

---

## Technical Decisions

### Decision 1: Use Clipboard API

**Rationale**:
- Modern, standard API
- Supported in VSCode Webview
- No dependencies needed
- Async, handles large data

**Alternatives Considered**:
- `document.execCommand('copy')` - deprecated
- External clipboard library - unnecessary

**Choice**: ✅ Clipboard API

---

### Decision 2: Copy Raw Data

**Rationale**:
- Users want raw JSON/text for analysis
- Formatted HTML is not useful outside browser
- Maintains data integrity

**Alternatives Considered**:
- Copy formatted HTML - not useful
- Copy both options - adds complexity

**Choice**: ✅ Copy raw response data

---

### Decision 3: Button Position

**Rationale**:
- Top-right is standard for copy actions
- Doesn't interfere with response content
- Easy to discover

**Alternatives Considered**:
- Bottom of response - less discoverable
- Floating button - too intrusive

**Choice**: ✅ Top-right in response header

---

## Risk Assessment

### Low Risk

- ✅ Simple, isolated feature
- ✅ No dependencies
- ✅ Standard browser API
- ✅ No data model changes

### Mitigation

- Test in VSCode Webview environment
- Handle Clipboard API errors gracefully
- Provide clear error messages

---

## Testing Strategy

### Manual Testing

1. **Basic Copy**: Send request, click copy, paste elsewhere
2. **Large Response**: Copy 1MB+ response
3. **Empty Response**: Copy empty response
4. **Error Handling**: Test clipboard permission denied

### Edge Cases

- Very large responses (> 5MB)
- Special characters in response
- Binary data responses
- Clipboard permission denied

---

## Success Metrics

- ✅ Copy works in < 100ms
- ✅ Clear visual feedback
- ✅ 100% success rate for valid responses
- ✅ No UI regressions

---

## Rollback Plan

If issues arise:
1. Feature is isolated - easy to hide button
2. No data model changes
3. No breaking changes to existing functionality
4. Can revert single commit

---

## File Structure

```
src/
└── HttpClientPanel.ts
    ├── Add copy button HTML (response header)
    ├── Add copy button CSS
    ├── Implement copyResponseToClipboard()
    └── Implement button state management
```

---

## Dependencies

### Internal
- Response container HTML
- Response data storage

### External
- Browser Clipboard API (native)

---

## Notes

- Keep implementation simple
- Focus on core copy functionality
- Clear user feedback is critical
- Test in VSCode environment

