# Data Model: Response Timing Display and JSON Formatting

## Overview

This feature involves minimal data model changes. The existing request/response data structures remain unchanged, but we need to add timing information to the response data and enhance the UI state management for JSON formatting.

## Entities

### ResponseData (Enhanced)
**Purpose**: Represents HTTP response data with timing information

**Fields**:
- `status: number` - HTTP status code (existing)
- `statusText: string` - HTTP status text (existing)
- `headers: object` - Response headers (existing)
- `data: any` - Response body data (existing)
- `duration: number` - Request duration in milliseconds (new)

**Relationships**:
- Belongs to a Request entity
- Used in response display UI

**Validation Rules**:
- Duration must be non-negative number
- Duration should be in milliseconds
- All existing response fields remain unchanged

### TimingDisplay (UI Entity)
**Purpose**: Represents timing display in the response header

**Fields**:
- `duration: number` - Duration in milliseconds
- `formattedText: string` - Human-readable duration text
- `element: HTMLElement` - DOM element for display

**State Transitions**:
- **Initial State**: No timing displayed
- **Request Sent**: Timing measurement starts
- **Response Received**: Timing displayed with formatted text
- **New Request**: Timing reset for new measurement

### JSONFormatButton (UI Entity)
**Purpose**: Represents the JSON formatting button in body editor

**Fields**:
- `button: HTMLButtonElement` - Button DOM element
- `editor: MonacoEditor` - Associated Monaco editor instance
- `isVisible: boolean` - Button visibility state
- `isEnabled: boolean` - Button enabled state

**State Transitions**:
- **Initial State**: Button visible and enabled
- **Invalid JSON**: Button enabled but shows error on click
- **Formatting**: Button temporarily disabled during formatting
- **Format Complete**: Button re-enabled

## State Management

### Timing Display Logic
**Current State**: No timing information displayed

**Required State**:
```javascript
interface TimingState {
    isVisible: boolean;        // Whether timing is displayed
    duration: number;          // Duration in milliseconds
    formattedText: string;     // Display text (e.g., "150ms", "1.25s")
    lastUpdate: number;        // Timestamp of last update
}
```

**State Transitions**:
1. **Request Initiated**: `isVisible: false`, start timing measurement
2. **Response Received**: `isVisible: true`, `duration: measured`, `formattedText: formatted`
3. **New Request**: Reset to initial state

### JSON Formatting Logic
**Current State**: No format button, only auto-formatting

**Required State**:
```javascript
interface FormatButtonState {
    isVisible: boolean;        // Button visibility
    isEnabled: boolean;        // Button enabled state
    lastFormatTime: number;    // Timestamp of last format
    errorMessage: string;      // Current error message (if any)
}
```

**State Transitions**:
1. **Editor Ready**: `isVisible: true`, `isEnabled: true`
2. **Format Clicked**: `isEnabled: false` (temporarily)
3. **Format Success**: `isEnabled: true`, `lastFormatTime: now`
4. **Format Error**: `isEnabled: true`, `errorMessage: error`

## Data Flow

### Timing Measurement Flow
```
User clicks Send
→ Backend: startTime = Date.now()
→ Axios request execution
→ Backend: endTime = Date.now(), duration = endTime - startTime
→ Backend: Send response with duration
→ Frontend: Receive response with duration
→ Frontend: Format duration text
→ Frontend: Display in response header
```

### JSON Formatting Flow
```
User clicks Format button
→ Frontend: Validate JSON syntax
→ If valid: Call Monaco format action
→ If invalid: Show error message
→ Update button state
→ Display formatted JSON
```

## Validation Rules

### Timing Data Validation
- **Duration Range**: 0 to 300,000ms (5 minutes max)
- **Format Rules**: 
  - < 1000ms: Display as "XXXms"
  - ≥ 1000ms: Display as "X.XXs" (2 decimal places)
- **Update Frequency**: Only on new responses

### JSON Formatting Validation
- **Content Type**: Must be JSON language mode
- **Syntax Validation**: Must be valid JSON before formatting
- **Size Limits**: Handle large JSON documents efficiently
- **Error Handling**: Clear error messages for invalid JSON

## Integration Points

### Response Processing Integration
- Existing `responseReceived` message handler enhanced with timing
- Response header HTML structure updated to display timing
- No changes to existing response data structure

### Monaco Editor Integration
- Leverage existing `editor.action.formatDocument` action
- Use existing JSON language detection
- Maintain existing auto-formatting behavior
- Add manual format button as enhancement

### UI State Integration
- Timing display integrates with existing response header
- Format button integrates with existing body editor
- Maintain existing theme compatibility
- Preserve existing accessibility features

## Error Handling

### Timing Display Errors
1. **Missing Duration**: Fallback to "N/A" display
2. **Invalid Duration**: Default to 0ms
3. **Display Update Failure**: Log error, continue normal operation

### JSON Formatting Errors
1. **Invalid JSON**: Show user-friendly error message
2. **Format Action Failure**: Fallback to manual formatting
3. **Large Document**: Show progress indicator or timeout
4. **Editor Not Ready**: Disable button until ready

## Performance Considerations

### Timing Measurement
- **Overhead**: Minimal (Date.now() calls)
- **Memory**: No additional memory usage
- **CPU**: Negligible impact on request processing

### JSON Formatting
- **Monaco Integration**: Uses existing formatting engine
- **Memory**: No additional memory for formatting
- **CPU**: Formatting only on user request
- **Large Documents**: Monaco handles efficiently

## Testing Data

### Timing Display Test Cases
```javascript
// Test case 1: Fast request
const fastRequest = { duration: 45 }; // Expected: "45ms"

// Test case 2: Medium request  
const mediumRequest = { duration: 1250 }; // Expected: "1.25s"

// Test case 3: Slow request
const slowRequest = { duration: 5000 }; // Expected: "5.00s"

// Test case 4: Very fast request
const veryFastRequest = { duration: 1 }; // Expected: "1ms"
```

### JSON Formatting Test Cases
```javascript
// Test case 1: Valid JSON
const validJSON = '{"name":"test","value":123}';
// Expected: Formatted with proper indentation

// Test case 2: Invalid JSON
const invalidJSON = '{"name":"test",}';
// Expected: Error message displayed

// Test case 3: Large JSON
const largeJSON = generateLargeJSON(1000); // 1000 properties
// Expected: Formatted efficiently

// Test case 4: Empty content
const emptyJSON = '';
// Expected: No formatting, no error
```

## Security Considerations

### Timing Data
- **No Sensitive Information**: Timing data is not sensitive
- **No External Exposure**: Timing only displayed in UI
- **No Storage**: Timing data not persisted

### JSON Formatting
- **Content Validation**: Only format valid JSON
- **No Execution**: Formatting is display-only
- **Error Sanitization**: Error messages don't expose content
