# Quickstart Guide: Response Copy Button

**Feature**: Response Copy Button  
**For**: Developers implementing this feature

---

## Quick Overview

**What**: Add a copy button to response header for one-click clipboard copy  
**Where**: `src/HttpClientPanel.ts`  
**Time**: ~1 hour  
**Complexity**: Low

---

## Prerequisites

- Basic understanding of HTML/CSS/JavaScript
- Familiarity with async/await
- VSCode extension development basics

---

## Implementation Steps

### Step 1: Add Button HTML (5 min)

**Location**: Response header section in `HttpClientPanel.ts`

```html
<!-- Find response header -->
<div class="response-header">
    <div class="response-info">
        <div class="status-badge" id="status-badge"></div>
        <span class="response-meta" id="response-time"></span>
        <span class="response-meta" id="response-size"></span>
    </div>
    <!-- ADD THIS -->
    <button class="copy-button" id="copy-response-btn">
        <span class="copy-icon">📋</span>
        <span class="copy-text">Copy</span>
    </button>
</div>
```

---

### Step 2: Add Button CSS (10 min)

**Location**: `<style>` section in `HttpClientPanel.ts`

```css
/* Copy button */
.copy-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: var(--button-bg);
    color: var(--button-fg);
    border: none;
    border-radius: var(--border-radius);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.copy-button:hover {
    background: var(--button-hover);
}

.copy-button.copied {
    background: var(--status-success);
}

.copy-button.error {
    background: var(--status-error);
}

.copy-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
```

---

### Step 3: Store Raw Response Data (5 min)

**Location**: Response handling in `<script>` section

```javascript
// Add variable to store raw response
let rawResponseData = null;

// In responseReceived handler
if (message.command === 'responseReceived') {
    const { status, statusText, headers, data } = message.data;
    
    // Store raw response data
    rawResponseData = typeof data === 'string' 
        ? data 
        : JSON.stringify(data, null, 2);
    
    // ... existing response rendering code
}
```

---

### Step 4: Implement Copy Function (15 min)

**Location**: JavaScript section in `HttpClientPanel.ts`

```javascript
// Copy response to clipboard
async function copyResponseToClipboard() {
    const button = document.getElementById('copy-response-btn');
    const icon = button.querySelector('.copy-icon');
    const text = button.querySelector('.copy-text');
    
    if (!rawResponseData) {
        text.textContent = 'No data';
        setTimeout(() => text.textContent = 'Copy', 2000);
        return;
    }
    
    // Update button state: copying
    button.disabled = true;
    icon.textContent = '⏳';
    text.textContent = 'Copying...';
    
    try {
        // Copy to clipboard
        await navigator.clipboard.writeText(rawResponseData);
        
        // Update button state: success
        button.classList.add('copied');
        icon.textContent = '✓';
        text.textContent = 'Copied!';
        
        // Revert after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.disabled = false;
            icon.textContent = '📋';
            text.textContent = 'Copy';
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy:', err);
        
        // Update button state: error
        button.classList.add('error');
        icon.textContent = '✗';
        text.textContent = 'Failed';
        
        // Revert after 2 seconds
        setTimeout(() => {
            button.classList.remove('error');
            button.disabled = false;
            icon.textContent = '📋';
            text.textContent = 'Copy';
        }, 2000);
    }
}

// Bind click event
document.getElementById('copy-response-btn').addEventListener('click', copyResponseToClipboard);
```

---

### Step 5: Hide Button When No Response (5 min)

**Location**: Response handling

```javascript
// Show/hide copy button based on response
function updateCopyButtonVisibility(hasResponse) {
    const button = document.getElementById('copy-response-btn');
    button.style.display = hasResponse ? 'inline-flex' : 'none';
}

// Initially hidden
updateCopyButtonVisibility(false);

// Show when response received
if (message.command === 'responseReceived') {
    // ... existing code
    updateCopyButtonVisibility(true);
}
```

---

## Testing Checklist

### Basic Functionality
- [ ] Button appears when response is received
- [ ] Button is hidden when no response
- [ ] Click copies response to clipboard
- [ ] Paste works in external app

### Visual Feedback
- [ ] Button shows "Copying..." state
- [ ] Button shows "Copied!" on success
- [ ] Button reverts to "Copy" after 2s
- [ ] Button shows "Failed" on error

### Edge Cases
- [ ] Empty response copies successfully
- [ ] Large response (1MB+) copies successfully
- [ ] JSON response is pretty-printed
- [ ] Error handling works

---

## Debugging Tips

### Copy Not Working
```javascript
// Check if Clipboard API is available
if (!navigator.clipboard) {
    console.error('Clipboard API not available');
}

// Check for errors
try {
    await navigator.clipboard.writeText('test');
    console.log('Clipboard works!');
} catch (err) {
    console.error('Clipboard error:', err);
}
```

### Button Not Showing
```javascript
// Check if button exists
const button = document.getElementById('copy-response-btn');
console.log('Button:', button);

// Check if response data exists
console.log('Raw response:', rawResponseData);
```

### State Not Reverting
```javascript
// Check if timeout is being cleared
let copyTimeout = null;

function copyResponse() {
    // Clear previous timeout
    if (copyTimeout) {
        clearTimeout(copyTimeout);
    }
    
    // Set new timeout
    copyTimeout = setTimeout(() => {
        // revert state
    }, 2000);
}
```

---

## Common Issues

### Issue 1: "Clipboard API not available"
**Solution**: Ensure VSCode Webview has clipboard permissions (should be default)

### Issue 2: Copy button not visible
**Solution**: Check CSS `display` property and response data existence

### Issue 3: Button state stuck
**Solution**: Ensure timeout is properly set and not cleared prematurely

---

## File Locations

```
src/HttpClientPanel.ts
├── HTML: Line ~710 (response-header)
├── CSS: Line ~350 (add after existing styles)
└── JavaScript: Line ~1300 (after response handling)
```

---

## Next Steps

1. ✅ Implement basic copy functionality
2. ✅ Add visual feedback
3. ✅ Test in VSCode environment
4. ✅ Handle edge cases
5. 📝 Update documentation

---

## Resources

- [Clipboard API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [VSCode Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)
- Project codebase: `src/HttpClientPanel.ts`

