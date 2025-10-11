# Implementation Tasks: URL Parameters Tab

**Feature**: [spec.md](./spec.md)  
**Plan**: [plan.md](./plan.md)  
**Created**: 2025-10-11

---

## Task Overview

**Total Tasks**: 15  
**Estimated Time**: 2.5 hours  
**Complexity**: Medium

---

## Phase 1: UI Structure

### Task 1.1: Add Params Tab Button
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Add "Params" tab button next to Body and Headers tabs  
**Details**:
- Add tab button in HTML
- Add click handler
- Add active state styling
**Acceptance**: Params tab button appears and is clickable

---

### Task 1.2: Create Parameter Table HTML
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Create table structure for parameters  
**Details**:
- Add table with Key, Value, Actions columns
- Add empty row for adding new parameters
- Add "Add Parameter" button
- Add empty state message
**Acceptance**: Table structure is visible when Params tab is active

---

### Task 1.3: Style Parameter Table
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Apply CSS styling to match Headers table  
**Details**:
- Reuse Headers table CSS classes
- Add responsive styling
- Style delete buttons
- Style empty state
**Acceptance**: Table looks consistent with Headers table

---

## Phase 2: URL Parsing

### Task 2.1: Implement parseUrlParams()
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Parse URL query string into parameter array  
**Details**:
```javascript
function parseUrlParams(url) {
    // Extract query string
    // Use URLSearchParams to parse
    // Return array of {key, value} objects
    // Handle edge cases
}
```
**Acceptance**: Function correctly parses all URL formats

---

### Task 2.2: Handle Edge Cases
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Handle special parameter formats  
**Details**:
- Empty values: `?key=`
- No values: `?flag`
- Duplicate keys: `?tag=a&tag=b`
- URL decoding: `%20` → space
**Acceptance**: All edge cases parse correctly

---

### Task 2.3: Implement renderParams()
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Render parameters in table  
**Details**:
- Clear existing rows
- Create row for each parameter
- Add input fields for key and value
- Add delete button
- Show empty state if no parameters
**Acceptance**: Parameters display correctly in table

---

## Phase 3: Parameter CRUD

### Task 3.1: Implement addParameter()
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Add new parameter to URL  
**Details**:
```javascript
function addParameter(key, value) {
    // Get current URL
    // Add parameter with proper delimiter (? or &)
    // URL encode value
    // Update URL field
    // Refresh params table
}
```
**Acceptance**: New parameters are added correctly

---

### Task 3.2: Implement updateParameter()
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Update existing parameter value  
**Details**:
- Find parameter by index
- Update value
- Rebuild URL
- URL encode new value
**Acceptance**: Parameter updates reflect in URL

---

### Task 3.3: Implement deleteParameter()
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Remove parameter from URL  
**Details**:
- Remove parameter by index
- Rebuild URL
- Handle last parameter (remove `?`)
- Refresh params table
**Acceptance**: Parameters are deleted cleanly

---

### Task 3.4: Implement rebuildUrl()
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Reconstruct URL from base + parameters  
**Details**:
```javascript
function rebuildUrl(baseUrl, params) {
    // Preserve protocol, domain, path
    // Add ? if params exist
    // Join params with &
    // URL encode values
    // Return complete URL
}
```
**Acceptance**: URL is correctly rebuilt from parameters

---

## Phase 4: Bidirectional Sync

### Task 4.1: URL Input → Params Tab Sync
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Update Params tab when URL changes  
**Details**:
- Add event listener to URL input
- Parse new URL
- Update params table
- Debounce to prevent excessive updates
**Acceptance**: Params tab updates when URL is edited

---

### Task 4.2: Params Tab → URL Input Sync
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Update URL when parameters change  
**Details**:
- Add event listeners to param inputs
- Rebuild URL on change
- Update URL field
- Prevent circular updates
**Acceptance**: URL updates when params are edited

---

### Task 4.3: Tab Switch Sync
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Refresh params when switching to Params tab  
**Details**:
- Add tab switch event handler
- Parse current URL
- Render params
**Acceptance**: Params tab shows current URL state

---

## Phase 5: Testing & Polish

### Task 5.1: Manual Testing
**Status**: 🔄 Ready for Testing  
**Description**: Test all user scenarios  
**Details**:
- Test primary flow (view/edit)
- Test add parameter
- Test delete parameter
- Test URL without parameters
- Test URL encoding
- Test duplicate keys
**Acceptance**: All scenarios work as expected

---

### Task 5.2: Code Cleanup
**Status**: ✅ Complete  
**File**: `src/HttpClientPanel.ts`  
**Description**: Clean up and optimize code  
**Details**:
- Remove debug logs
- Add comments
- Optimize functions
- Check for code duplication
**Acceptance**: Code is clean and maintainable

---

## Execution Order

**Sequential Tasks** (must run in order):
1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
2. Within each phase, tasks can run in parallel where noted

**Parallel Tasks** [P]:
- Task 1.1, 1.2 can run in parallel
- Task 3.1, 3.2, 3.3 can run in parallel (after 3.4 is done)

---

## Dependencies

- All tasks depend on existing HttpClientPanel.ts
- Phase 2 depends on Phase 1 (need UI to render into)
- Phase 3 depends on Phase 2 (need parsing to work)
- Phase 4 depends on Phase 3 (need CRUD to work)
- Phase 5 depends on all previous phases

---

## Progress Tracking

- ⬜ Pending: Not started
- 🔄 In Progress: Currently working
- ✅ Complete: Finished and tested
- ❌ Blocked: Cannot proceed

**Current Status**: Ready to start Phase 1

