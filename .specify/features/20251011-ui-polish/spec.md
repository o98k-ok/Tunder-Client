# Feature Specification: UI Polish - Method Badge and Body Editor

## Overview

**Feature Name**: UI Polish - Method Badge Size and Body Editor Background

**Created**: 2025-10-11

**Status**: Draft

**Priority**: Medium

## Problem Statement

Two visual inconsistencies affect the user experience in the Tunder Client interface:

1. **Method Badge Size**: The HTTP method badges (GET, POST, PUT, etc.) in the sidebar request list are too small, making them difficult to read and visually understand at a glance.

2. **Body Editor Background**: The request body editor has a black background that visually conflicts with the rest of the interface, creating an inconsistent and jarring user experience.

These issues reduce the overall polish and professionalism of the interface, making it harder for users to quickly identify request types and work comfortably with the editor.

## User Scenarios & Testing

### Scenario 1: Viewing Request List

**Actor**: API Developer

**Goal**: Quickly identify request types in the sidebar

**Steps**:
1. User opens Tunder Client sidebar with multiple requests
2. User scans the list to find a specific request type (e.g., POST requests)
3. User should immediately recognize method types by their badges

**Expected Outcome**: 
- Method badges are clearly visible and readable
- Badge size is proportional to the text and row height
- User can distinguish between different methods without squinting

**Current Issue**: Badges are too small and require closer inspection

---

### Scenario 2: Editing Request Body

**Actor**: API Developer

**Goal**: Compose and edit request body content

**Steps**:
1. User creates or opens a request
2. User navigates to the Body tab
3. User types or pastes JSON/text content
4. User switches between different tabs (Headers, Body, Params, Response)

**Expected Outcome**:
- Body editor background matches the overall interface theme
- No jarring color transitions when switching tabs
- Consistent visual experience across all editor areas

**Current Issue**: Black background creates visual inconsistency

---

## Functional Requirements

### FR-1: Enlarge Method Badge Icons

**Description**: Increase the size of HTTP method badge icons in the sidebar request list to improve visibility and readability.

**Details**:
- Target size: Double the current dimensions (width and height)
- All method badges should scale uniformly (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Badge text should remain crisp and readable at the new size
- Row height should accommodate the larger badges without clipping
- Maintain adequate spacing between badges and request names

**Acceptance Criteria**:
- Badge width and height are doubled from current size
- All 7 method types display correctly at the new size
- No visual clipping or overlap with adjacent elements
- Text within badges remains legible and centered
- Row spacing adjusts automatically if needed

---

### FR-2: Adjust Body Editor Background

**Description**: Change the request body editor background color to match the interface theme and maintain visual consistency.

**Details**:
- Background should align with VS Code theme settings
- Should respect both light and dark themes
- Monaco editor styling should inherit appropriate theme colors
- No hardcoded black background colors
- Maintain syntax highlighting visibility

**Acceptance Criteria**:
- Body editor background matches the surrounding interface
- Editor respects user's VS Code theme (light/dark)
- Syntax highlighting remains visible and clear
- No jarring color transitions between tabs
- Editor maintains professional appearance in both themes

---

## Success Criteria

1. **Improved Readability**: Users can identify request methods 50% faster when scanning the sidebar (subjective assessment through testing)

2. **Visual Consistency**: Body editor background seamlessly integrates with the rest of the interface - no color mismatch visible to the user

3. **Theme Compatibility**: Editor appearance adapts correctly to both light and dark VS Code themes

4. **No Regression**: All existing functionality remains intact - badge color coding, editor features, and layout

5. **User Satisfaction**: Visual polish improves perceived quality of the extension

---

## Assumptions

1. **SVG Icons**: Method badges are currently implemented as SVG files that can be resized
2. **Editor Framework**: Body editor uses Monaco editor with customizable themes
3. **Theme Access**: Extension has access to VS Code theme API for background color detection
4. **No Breaking Changes**: Size changes won't break existing layouts or overflow containers

---

## Dependencies

- Existing SVG badge files in `media/method-badges/*.svg`
- Monaco editor configuration in `HttpClientPanel.ts`
- VS Code theme API for color detection

---

## Scope

### In Scope

- Doubling the size of all HTTP method badge SVG icons
- Adjusting sidebar row height/spacing if needed for larger badges
- Changing body editor background to match interface theme
- Testing visual changes in both light and dark themes

### Out of Scope

- Changing badge colors or design style
- Modifying other UI elements beyond badges and body editor
- Adding theme customization preferences
- Implementing responsive badge sizing based on sidebar width
- Modifying response editor or other editors

---

## Edge Cases

1. **Very Long Request Names**: Ensure larger badges don't cause text truncation or overlap
2. **High DPI Displays**: Verify badge sharpness on retina displays
3. **Custom VS Code Themes**: Test with popular custom themes to ensure compatibility
4. **Syntax Highlighting**: Verify all language syntax colors remain visible on new background

---

## Notes

- This is a polish refinement of the recently implemented sidebar UI refactor
- Changes should be minimal and focused on visual improvements only
- No new functionality is being added
- Testing should focus on visual appearance across different environments

