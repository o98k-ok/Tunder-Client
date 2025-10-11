# Implementation Tasks: UI Polish - Method Badge and Body Editor

## Overview

**Feature**: UI Polish - Method Badge Size and Body Editor Background  
**Total Tasks**: 10  
**Estimated Time**: 1-2 hours

---

## Task Breakdown

### Phase 1: Preparation (1 task)

#### Task 1.1: Inspect Current Badge Dimensions
- **ID**: PREP-1
- **Description**: Read current SVG badge files to understand existing dimensions
- **Files**: `media/method-badges/*.svg`
- **Actions**:
  - Read all 7 SVG files
  - Note current width, height, rx, font-size values
  - Calculate target dimensions (2x)
- **Status**: [ ] Pending

---

### Phase 2: Badge Size Update (7 tasks)

All badge update tasks can run in parallel [P].

#### Task 2.1: Update GET Badge [P]
- **ID**: BADGE-1
- **Description**: Double the size of GET method badge
- **Files**: `media/method-badges/get.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

#### Task 2.2: Update POST Badge [P]
- **ID**: BADGE-2
- **Description**: Double the size of POST method badge
- **Files**: `media/method-badges/post.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

#### Task 2.3: Update PUT Badge [P]
- **ID**: BADGE-3
- **Description**: Double the size of PUT method badge
- **Files**: `media/method-badges/put.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

#### Task 2.4: Update DELETE Badge [P]
- **ID**: BADGE-4
- **Description**: Double the size of DELETE method badge
- **Files**: `media/method-badges/delete.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

#### Task 2.5: Update PATCH Badge [P]
- **ID**: BADGE-5
- **Description**: Double the size of PATCH method badge
- **Files**: `media/method-badges/patch.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

#### Task 2.6: Update HEAD Badge [P]
- **ID**: BADGE-6
- **Description**: Double the size of HEAD method badge
- **Files**: `media/method-badges/head.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

#### Task 2.7: Update OPTIONS Badge [P]
- **ID**: BADGE-7
- **Description**: Double the size of OPTIONS method badge
- **Files**: `media/method-badges/options.svg`
- **Actions**:
  - Double width and height
  - Double rx (border-radius)
  - Increase font-size to ~24-28px
  - Verify text centering
- **Dependencies**: PREP-1
- **Status**: [ ] Pending

---

### Phase 3: Editor Background Fix (1 task)

#### Task 3.1: Fix Monaco Editor Background
- **ID**: EDITOR-1
- **Description**: Update Monaco editor theme to use VS Code theme colors
- **Files**: `src/HttpClientPanel.ts`
- **Actions**:
  - Locate Monaco editor initialization code
  - Find theme configuration (likely in `getHtmlForWebview` or similar)
  - Replace hardcoded black background with CSS variable `--vscode-editor-background`
  - Ensure proper theme inheritance
  - Test in both light and dark themes
- **Dependencies**: None
- **Status**: [ ] Pending

---

### Phase 4: Compilation & Testing (1 task)

#### Task 4.1: Compile and Visual Test
- **ID**: TEST-1
- **Description**: Compile TypeScript and perform visual testing
- **Files**: N/A
- **Actions**:
  - Run `npm run compile`
  - Launch extension with F5
  - Visual testing checklist:
    - [ ] All 7 method badges display at new size
    - [ ] Text is crisp and centered in badges
    - [ ] No clipping in sidebar
    - [ ] Proper spacing maintained
    - [ ] Editor background matches interface in dark theme
    - [ ] Editor background matches interface in light theme
    - [ ] Syntax highlighting visible and clear
    - [ ] No color mismatches between tabs
  - Test on retina display if available
- **Dependencies**: BADGE-1, BADGE-2, BADGE-3, BADGE-4, BADGE-5, BADGE-6, BADGE-7, EDITOR-1
- **Status**: [ ] Pending

---

## Execution Order

1. **Phase 1**: PREP-1 (sequential)
2. **Phase 2**: BADGE-1 through BADGE-7 (parallel execution) + EDITOR-1 (parallel)
3. **Phase 3**: TEST-1 (sequential, after all previous tasks)

---

## Task Summary

| Phase | Tasks | Parallel? | Estimated Time |
|-------|-------|-----------|----------------|
| Preparation | 1 | No | 5 min |
| Badge Updates | 7 | Yes | 20 min |
| Editor Fix | 1 | Yes (with Phase 2) | 15 min |
| Testing | 1 | No | 20 min |
| **TOTAL** | **10** | - | **1 hour** |

---

## Notes

- Badge tasks are all independent and can be executed in parallel
- Editor background fix is independent and can run parallel to badge updates
- Testing must be sequential and performed after all code changes
- No compilation needed between badge updates (SVG files are static assets)
- Final compilation needed before testing

