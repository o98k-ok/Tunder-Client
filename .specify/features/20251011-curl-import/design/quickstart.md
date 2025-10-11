# Quickstart Guide: cURL Import Development

**Feature**: cURL Import  
**Date**: 2025-10-11  
**Audience**: Developers implementing this feature

---

## Overview

This guide helps developers quickly set up their environment and understand the implementation workflow for the cURL import feature.

---

## Prerequisites

### Required Tools
- **Node.js**: v16+ (for VSCode extension development)
- **VSCode**: Latest stable version
- **TypeScript**: v4.9+ (installed via npm)
- **Git**: For version control

### Required Knowledge
- TypeScript/JavaScript
- VSCode Extension API
- Regex (for cURL parsing)
- Basic HTTP concepts

---

## Project Structure

```
Tunder-Client/
├── src/
│   ├── extension.ts                    # Main extension entry (MODIFY)
│   ├── services/
│   │   ├── curlParserService.ts        # NEW: cURL parser
│   │   ├── requestService.ts           # EXISTING: Request CRUD
│   │   └── directoryService.ts         # EXISTING: Directory management
│   ├── models/
│   │   └── request.ts                  # EXISTING: Request interface
│   ├── views/
│   │   └── DirectoryTreeProvider.ts    # EXISTING: Tree view
│   └── HttpClientPanel.ts              # EXISTING: Main UI panel
├── package.json                        # MODIFY: Add commands
└── .specify/features/20251011-curl-import/
    ├── spec.md                         # Feature specification
    ├── plan.md                         # Implementation plan
    └── design/
        ├── research.md                 # Technical decisions
        ├── data-model.md               # Interface definitions
        └── quickstart.md               # This file
```

---

## Setup Instructions

### 1. Clone and Install

```bash
# Navigate to project root
cd /Users/shadow/Documents/code/Tunder-Client

# Ensure you're on the correct branch
git checkout feature/20251011-curl-import

# Install dependencies (if not already done)
npm install

# Compile TypeScript
npm run compile
```

### 2. Open in VSCode

```bash
# Open project in VSCode
code .
```

### 3. Run Extension in Debug Mode

1. Press **F5** to launch Extension Development Host
2. A new VSCode window will open with the extension loaded
3. Open the HTTP Client view (sidebar icon)
4. Test existing functionality to ensure setup is correct

---

## Development Workflow

### Phase 1: Implement cURL Parser

#### Step 1.1: Create CurlParserService

**File**: `src/services/curlParserService.ts`

```typescript
// Skeleton to get started
export interface ParsedRequest {
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    body?: string;
}

export class CurlParserService {
    parse(input: string): ParsedRequest {
        // TODO: Implement parsing logic
        throw new Error('Not implemented');
    }
}
```

**Implementation Checklist**:
- [ ] Create file `src/services/curlParserService.ts`
- [ ] Define `ParsedRequest` interface
- [ ] Implement `parse()` method
- [ ] Implement `normalize()` helper (remove line continuations)
- [ ] Implement `extractMethod()` helper
- [ ] Implement `extractUrl()` helper
- [ ] Implement `extractHeaders()` helper
- [ ] Implement `extractBody()` helper
- [ ] Implement `unquote()` helper
- [ ] Add error handling (throw `CurlParseError`)

**Testing**:
```bash
# Run tests (after writing test file)
npm test -- --grep "CurlParserService"
```

---

#### Step 1.2: Add Commands to extension.ts

**File**: `src/extension.ts`

**Add Imports**:
```typescript
import { CurlParserService } from './services/curlParserService';
```

**Register Commands**:
```typescript
export function activate(context: vscode.ExtensionContext) {
    // ... existing code ...
    
    const curlParser = new CurlParserService();
    
    // Command: Import cURL from directory context menu
    context.subscriptions.push(
        vscode.commands.registerCommand('httpClient.importCurl', async (directory) => {
            const folderId = directory?.id;
            if (!folderId) {
                vscode.window.showErrorMessage('Please select a directory');
                return;
            }
            
            await importCurlCommand(folderId, curlParser, requestService, context.extensionUri);
        })
    );
    
    // Command: Import cURL from toolbar
    context.subscriptions.push(
        vscode.commands.registerCommand('httpClient.importCurlFromToolbar', async () => {
            // Prompt user to select directory
            const directories = directoryService.getAllDirectories();
            const selected = await vscode.window.showQuickPick(
                directories.map(d => ({ label: d.name, id: d.id })),
                { placeHolder: 'Select a directory for the imported request' }
            );
            
            if (!selected) {
                return; // User cancelled
            }
            
            await importCurlCommand(selected.id, curlParser, requestService, context.extensionUri);
        })
    );
}
```

**Implement Helper Function**:
```typescript
async function importCurlCommand(
    folderId: string,
    curlParser: CurlParserService,
    requestService: RequestService,
    extensionUri: vscode.Uri
): Promise<void> {
    // Show input dialog
    const curlInput = await vscode.window.showInputBox({
        prompt: 'Paste your cURL command here',
        placeHolder: 'curl -X POST https://api.example.com -H "Content-Type: application/json" -d \'{"key":"value"}\'',
        ignoreFocusOut: true,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Please enter a cURL command';
            }
            return null;
        }
    });
    
    if (!curlInput) {
        return; // User cancelled
    }
    
    try {
        // Parse cURL
        const parsed = curlParser.parse(curlInput);
        
        // Generate request name
        const name = generateRequestName(parsed.method, parsed.url);
        
        // Create request
        const request: Request = {
            id: crypto.randomUUID(),
            name,
            method: parsed.method,
            url: parsed.url,
            headers: parsed.headers,
            body: parsed.body || '',
            folderId,
            created_at: Date.now(),
            updated_at: Date.now()
        };
        
        // Save request
        requestService.createRequest(request);
        
        // Refresh tree view
        vscode.commands.executeCommand('httpClient.refreshDirectories');
        
        // Open request
        HttpClientPanel.createOrShow(extensionUri, request);
        
        // Show success message
        vscode.window.showInformationMessage('Request imported successfully');
        
    } catch (error) {
        vscode.window.showErrorMessage(
            `Unable to parse cURL command: ${error.message}`
        );
    }
}

function generateRequestName(method: string, url: string): string {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        if (!path || path === '/') {
            return `${method.toUpperCase()} /`;
        }
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return `${method.toUpperCase()} ${path}`;
    } catch (error) {
        return `${method.toUpperCase()} Request`;
    }
}
```

---

#### Step 1.3: Update package.json

**File**: `package.json`

**Add Commands**:
```json
{
  "contributes": {
    "commands": [
      {
        "command": "httpClient.importCurl",
        "title": "Import cURL",
        "icon": "$(file-symlink-file)"
      },
      {
        "command": "httpClient.importCurlFromToolbar",
        "title": "Import cURL Command",
        "icon": "$(file-symlink-file)"
      }
    ],
    "menus": {
      "view/title": [
        {
          "command": "httpClient.importCurlFromToolbar",
          "when": "view == httpClientDirectories",
          "group": "navigation@3"
        }
      ],
      "view/item/context": [
        {
          "command": "httpClient.importCurl",
          "when": "view == httpClientDirectories && viewItem == directory",
          "group": "inline@2"
        }
      ]
    }
  }
}
```

---

### Phase 2: Testing

#### Unit Tests

**File**: `src/test/suite/curlParserService.test.ts` (NEW)

```typescript
import * as assert from 'assert';
import { CurlParserService } from '../../services/curlParserService';

suite('CurlParserService', () => {
    let parser: CurlParserService;
    
    setup(() => {
        parser = new CurlParserService();
    });
    
    test('Parse simple GET request', () => {
        const input = 'curl https://api.example.com/users';
        const result = parser.parse(input);
        
        assert.strictEqual(result.method, 'GET');
        assert.strictEqual(result.url, 'https://api.example.com/users');
        assert.strictEqual(result.headers.length, 0);
        assert.strictEqual(result.body, undefined);
    });
    
    test('Parse POST request with headers and body', () => {
        const input = `curl -X POST https://api.example.com/users \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer abc123" \\
            -d '{"name":"John"}'`;
        
        const result = parser.parse(input);
        
        assert.strictEqual(result.method, 'POST');
        assert.strictEqual(result.url, 'https://api.example.com/users');
        assert.strictEqual(result.headers.length, 2);
        assert.strictEqual(result.headers[0].key, 'Content-Type');
        assert.strictEqual(result.headers[0].value, 'application/json');
        assert.strictEqual(result.body, '{"name":"John"}');
    });
    
    // Add more tests...
});
```

**Run Tests**:
```bash
npm test
```

---

#### Manual Testing

1. **Test Import from Context Menu**:
   - Right-click on a directory in HTTP Collections
   - Click "Import cURL"
   - Paste a cURL command
   - Verify request is created and opened

2. **Test Import from Toolbar**:
   - Click "Import cURL" button in toolbar
   - Select a directory
   - Paste a cURL command
   - Verify request is created and opened

3. **Test Error Handling**:
   - Try importing empty input
   - Try importing invalid cURL syntax
   - Try importing cURL without URL
   - Verify error messages are clear

---

## Debugging Tips

### Enable Extension Logging

Add logging to your code:
```typescript
console.log('[cURL Import] Parsing input:', input);
console.log('[cURL Import] Parsed result:', parsed);
```

View logs in **Debug Console** (Cmd+Shift+Y).

### Breakpoints

1. Set breakpoints in `curlParserService.ts` or `extension.ts`
2. Press **F5** to start debugging
3. Trigger import command
4. Execution will pause at breakpoints

### Common Issues

| Issue | Solution |
|-------|----------|
| **Command not appearing** | Check `package.json` command registration |
| **Parser not working** | Add console.log to see regex matches |
| **Request not saving** | Check `requestService.createRequest()` is called |
| **Tree view not refreshing** | Ensure `refresh()` command is executed |

---

## Code Style Guidelines

### TypeScript Conventions
- Use `interface` for data structures
- Use `class` for services
- Use `async/await` for asynchronous operations
- Add JSDoc comments for public methods

### Error Handling
- Throw custom `CurlParseError` for parsing failures
- Show user-friendly error messages via `vscode.window.showErrorMessage()`
- Log errors to console for debugging

### Testing
- Write unit tests for all parser methods
- Test edge cases (empty input, invalid syntax, etc.)
- Aim for >90% code coverage

---

## Useful VSCode Extension API References

### Input/Output
- `vscode.window.showInputBox()`: Show input dialog
- `vscode.window.showQuickPick()`: Show selection dialog
- `vscode.window.showInformationMessage()`: Show success message
- `vscode.window.showErrorMessage()`: Show error message

### Commands
- `vscode.commands.registerCommand()`: Register command handler
- `vscode.commands.executeCommand()`: Execute command programmatically

### Tree View
- `vscode.TreeDataProvider`: Interface for tree view data
- `vscode.TreeItem`: Represents a tree view item

---

## Next Steps

1. ✅ Environment set up
2. 🔄 Implement `CurlParserService`
3. ⏳ Add commands to `extension.ts`
4. ⏳ Update `package.json`
5. ⏳ Write unit tests
6. ⏳ Manual testing
7. ⏳ Code review and polish

---

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [cURL Documentation](https://curl.se/docs/manpage.html)
- [Regex Testing Tool](https://regex101.com/)

---

## Support

If you encounter issues:
1. Check the [spec.md](../spec.md) for requirements
2. Review [research.md](./research.md) for technical decisions
3. Check [data-model.md](./data-model.md) for interface definitions
4. Ask for help in team chat or code review

---

**Happy coding! 🚀**

