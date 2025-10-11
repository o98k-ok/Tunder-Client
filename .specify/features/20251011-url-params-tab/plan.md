# Implementation Plan: URL Parameters Tab

**Version**: 1.0  
**Created**: 2025-10-11  
**Feature**: [spec.md](./spec.md)

---

## Implementation Strategy

### Approach

**Incremental Enhancement**: Add Params tab to existing HttpClientPanel without disrupting current functionality.

**Key Principles**:
1. Reuse existing tab UI pattern (Body/Headers)
2. Leverage browser URLSearchParams API for parsing
3. Maintain bidirectional sync with URL field
4. No external dependencies needed

---

## Technical Architecture

### Technology Stack

- **Language**: TypeScript
- **UI**: HTML/CSS in VSCode Webview
- **Parsing**: Browser URLSearchParams API
- **Sync**: Event-driven updates

### File Structure

```
src/
├── HttpClientPanel.ts          # Main implementation file
│   ├── Add Params tab HTML
│   ├── Add URL parsing logic
│   ├── Add parameter CRUD functions
│   └── Add bidirectional sync
```

### Key Components

1. **Params Tab UI** (HTML/CSS)
   - Tab button in tab bar
   - Parameter table (Key, Value, Actions columns)
   - Add parameter button
   - Delete parameter buttons

2. **URL Parser** (JavaScript)
   - Parse URL query string
   - Extract parameters as array
   - Handle edge cases (empty values, no values, duplicates)

3. **Parameter Manager** (JavaScript)
   - Add parameter
   - Update parameter
   - Delete parameter
   - Rebuild URL from parameters

4. **Sync Logic** (JavaScript)
   - URL input → Params tab
   - Params tab → URL input
   - Debounced updates

---

## Implementation Phases

### Phase 1: UI Structure (30 min)
- Add Params tab button
- Create parameter table HTML
- Style table to match Headers table
- Add empty state message

### Phase 2: URL Parsing (30 min)
- Implement parseUrlParams() function
- Handle edge cases (empty, no value, duplicates)
- URL decode values for display
- Test with various URL formats

### Phase 3: Parameter CRUD (45 min)
- Implement addParameter()
- Implement updateParameter()
- Implement deleteParameter()
- Implement rebuildUrl()
- URL encode values

### Phase 4: Bidirectional Sync (30 min)
- URL input change → update Params tab
- Params tab change → update URL input
- Debounce to prevent loops
- Preserve cursor position

### Phase 5: Testing & Polish (30 min)
- Test all user scenarios
- Test edge cases
- Fix any bugs
- Code cleanup

**Total Estimated Time**: 2.5 hours

---

## Risk Assessment

### Low Risk
- ✅ No new dependencies
- ✅ Isolated feature (doesn't affect existing functionality)
- ✅ Browser URLSearchParams is well-supported

### Medium Risk
- ⚠️ Bidirectional sync could cause update loops
  - **Mitigation**: Use flags to prevent circular updates
- ⚠️ URL encoding edge cases
  - **Mitigation**: Rely on browser APIs, test thoroughly

---

## Testing Strategy

### Manual Testing
1. Parse various URL formats
2. Add/edit/delete parameters
3. Test URL encoding/decoding
4. Test duplicate keys
5. Test empty values
6. Test sync in both directions

### Edge Cases to Test
- URL without parameters
- URL with one parameter
- URL with many parameters (50+)
- Parameters with special characters
- Duplicate parameter keys
- Empty parameter values
- Parameters without values (flags)

---

## Success Metrics

- All 6 functional requirements implemented
- All user scenarios working
- No regressions in existing functionality
- Code is clean and maintainable

---

## Rollback Plan

If issues arise:
1. Feature is isolated in Params tab
2. Can hide tab with CSS if needed
3. Existing URL field functionality unchanged
4. Easy to revert commit

---

## Dependencies

### Internal
- HttpClientPanel.ts (modify)
- Existing tab switching logic
- Existing URL input field

### External
- None

---

## Notes

- URLSearchParams API handles most parsing/encoding
- Reuse Headers table CSS for consistency
- Keep implementation simple and maintainable
- Focus on core functionality first

