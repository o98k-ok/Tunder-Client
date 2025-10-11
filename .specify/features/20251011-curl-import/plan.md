# Implementation Plan: cURL Import

## Feature

**Feature**: cURL Import  
**Spec**: [spec.md](./spec.md)  
**Branch**: `feature/20251011-curl-import`

---

## Status

- **Status**: Planning
- **Created**: 2025-10-11
- **Last Updated**: 2025-10-11

---

## Technical Context

### Architecture Overview

The cURL import feature integrates into the existing Tunder HTTP Client extension architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    VSCode Extension                      │
├─────────────────────────────────────────────────────────┤
│  extension.ts                                           │
│  ├─ Command: httpClient.importCurl                      │
│  └─ Command: httpClient.importCurlFromToolbar           │
├─────────────────────────────────────────────────────────┤
│  services/                                              │
│  ├─ curlParserService.ts (NEW)                          │
│  │  └─ parseCurlCommand(input: string): ParsedRequest  │
│  ├─ requestService.ts (EXISTING)                        │
│  │  └─ createRequest(request: Request): void           │
│  └─ directoryService.ts (EXISTING)                      │
│     └─ getAllDirectories(): Directory[]                │
├─────────────────────────────────────────────────────────┤
│  views/                                                 │
│  └─ DirectoryTreeProvider.ts (MODIFY)                   │
│     └─ Add context menu item for import                │
├─────────────────────────────────────────────────────────┤
│  HttpClientPanel.ts (EXISTING)                          │
│  └─ loadRequest(request: Request): void                │
└─────────────────────────────────────────────────────────┘
```

### Key Components

1. **cURL Parser Service** (NEW)
   - Responsibility: Parse cURL command strings into structured request data
   - Input: Raw cURL command string
   - Output: `ParsedRequest` object with method, URL, headers, body
   - Dependencies: None (pure string parsing)

2. **Import Dialog** (NEW)
   - Implementation: VSCode `InputBox` API or custom Webview
   - Features: Multi-line input, validation, error display
   - Integration: Triggered by commands in `extension.ts`

3. **Command Handlers** (NEW)
   - `httpClient.importCurl`: Import from directory context menu
   - `httpClient.importCurlFromToolbar`: Import from toolbar (prompts for directory)

4. **Request Service** (EXISTING - NO CHANGES)
   - Already handles request creation and persistence
   - Will be reused without modification

5. **Directory Tree Provider** (MODIFY)
   - Add "Import cURL" to context menu for directory items
   - Register new command in `package.json`

### Data Flow

```
User Action
    ↓
[Import Dialog Opens]
    ↓
User Pastes cURL Command
    ↓
[Validate Input]
    ↓
[Parse cURL] → curlParserService.parseCurlCommand()
    ↓
[Generate Request Name] → extractPathFromUrl()
    ↓
[Create Request] → requestService.createRequest()
    ↓
[Save to Storage] → (handled by RequestService)
    ↓
[Refresh Tree View] → directoryTreeProvider.refresh()
    ↓
[Open Request] → HttpClientPanel.createOrShow()
    ↓
[Show Success Notification]
```

### Technology Stack

- **Language**: TypeScript
- **Framework**: VSCode Extension API
- **UI**: VSCode native `InputBox` API (Phase 1) or custom Webview (Phase 2)
- **Storage**: Existing file-based storage via `RequestService`
- **Testing**: VSCode Extension Test Runner

### Integration Points

1. **package.json**
   - Add new commands: `httpClient.importCurl`, `httpClient.importCurlFromToolbar`
   - Add command to directory context menu
   - Add command to toolbar (view/title)
   - Add icon for import button

2. **extension.ts**
   - Register new commands
   - Handle directory selection logic
   - Coordinate between parser, request service, and UI

3. **DirectoryTreeProvider.ts**
   - No code changes needed (menu configured in `package.json`)
   - May need to expose `refresh()` method if not already public

4. **HttpClientPanel.ts**
   - No changes needed (already has `loadRequest()` method)

---

## Constitution Check

### Principle Compliance

| Principle | Status | Notes |
|-----------|--------|-------|
| **1. 接口文档完整性** | ✅ PASS | VSCode Extension API is well-documented; cURL syntax is standardized |
| **2. 执行明确性** | ✅ PASS | Spec provides clear acceptance criteria for all 6 functional requirements |
| **3. 业务理解** | ✅ PASS | User scenarios clearly defined; clarification (sensitive data) resolved |
| **4. 代码复用** | ✅ PASS | Reuses existing `RequestService`, `DirectoryService`, `HttpClientPanel` |
| **5. 测试规范** | ✅ PASS | Testing plan included (Phase 3); acceptance criteria defined |
| **6. 架构一致性** | ✅ PASS | Follows existing service-based architecture; no breaking changes |
| **7. 知识诚实** | ✅ PASS | Research phase addresses unknowns (dialog implementation, parsing strategy) |
| **8. 重构谨慎** | ✅ PASS | No refactoring of existing code; purely additive changes |

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Parsing complexity** | Medium | Use well-tested regex patterns; handle edge cases explicitly |
| **Dialog UX limitations** | Low | Start with VSCode InputBox; upgrade to Webview if needed |
| **Existing code integration** | Low | Minimal changes to existing services; well-defined interfaces |
| **Performance** | Low | Parsing is synchronous but fast (< 200ms); no blocking operations |

### Gates

- ✅ **Gate 1**: All functional requirements have acceptance criteria
- ✅ **Gate 2**: No breaking changes to existing services
- ✅ **Gate 3**: Constitution principles satisfied
- ✅ **Gate 4**: Testing strategy defined

**Decision**: Proceed to Phase 0 (Research)

---

## Implementation Phases

### Phase 0: Research & Design (CURRENT PHASE)

**Objective**: Resolve technical unknowns and design core components

**Tasks**:
1. Research cURL parsing strategies
   - Evaluate regex vs. tokenizer approaches
   - Identify edge cases (quotes, escapes, line continuations)
   - Document parsing algorithm

2. Design dialog implementation
   - Evaluate VSCode InputBox vs. custom Webview
   - Define UI/UX for error display
   - Plan keyboard shortcut handling

3. Define data model for parsed requests
   - Create `ParsedRequest` interface
   - Define error types for parsing failures

4. Design request naming algorithm
   - Extract path from URL (handle query params, trailing slashes)
   - Format: `{METHOD} {path}`

**Deliverables**:
- `design/research.md`: Technical decisions and rationale
- `design/data-model.md`: Interface definitions
- `design/quickstart.md`: Developer setup guide

**Duration**: 1-2 hours

---

### Phase 1: Core Implementation

**Objective**: Implement cURL parser and basic import flow

**Tasks**:

#### Task 1.1: Create cURL Parser Service
- [ ] Create `src/services/curlParserService.ts`
- [ ] Implement `parseCurlCommand(input: string): ParsedRequest`
- [ ] Handle method parsing (`-X`, `--request`)
- [ ] Handle URL extraction (first non-flag argument)
- [ ] Handle headers parsing (`-H`, `--header`)
- [ ] Handle body parsing (`-d`, `--data`, `--data-raw`)
- [ ] Handle line continuations (backslash)
- [ ] Handle quote escaping (single, double, escaped)
- [ ] Ignore unsupported flags (`-v`, `-k`, etc.)
- [ ] Write unit tests for parser

#### Task 1.2: Implement Import Dialog
- [ ] Create dialog using `vscode.window.showInputBox` (multi-line)
- [ ] Add input validation (non-empty check)
- [ ] Display parsing errors inline
- [ ] Preserve input on error
- [ ] Handle keyboard shortcuts (Cmd+Enter, Esc)

#### Task 1.3: Add Commands to extension.ts
- [ ] Register `httpClient.importCurl` command
- [ ] Register `httpClient.importCurlFromToolbar` command
- [ ] Implement directory selection logic
- [ ] Call parser service
- [ ] Generate request name from URL
- [ ] Call `requestService.createRequest()`
- [ ] Refresh directory tree
- [ ] Open request in `HttpClientPanel`
- [ ] Show success notification

#### Task 1.4: Update package.json
- [ ] Add command definitions
- [ ] Add to directory context menu (`view/item/context`)
- [ ] Add to toolbar (`view/title`)
- [ ] Add icon for import button (use `$(file-symlink-file)` or custom SVG)
- [ ] Add command tooltips

**Deliverables**:
- Working cURL import from directory context menu
- Working cURL import from toolbar
- Unit tests for parser

**Duration**: 3-4 hours

---

### Phase 2: Error Handling & Edge Cases

**Objective**: Robust error handling and edge case coverage

**Tasks**:

#### Task 2.1: Enhanced Error Messages
- [ ] Detect missing URL and show specific error
- [ ] Detect invalid syntax and show example
- [ ] Handle empty input gracefully
- [ ] Handle directory selection cancellation

#### Task 2.2: Edge Case Handling
- [ ] Test multi-line cURL with backslash continuations
- [ ] Test cURL with query parameters
- [ ] Test cURL with various quote styles
- [ ] Test cURL with unsupported flags (should ignore)
- [ ] Test cURL with no method (should default to GET)
- [ ] Test cURL with root path `/` (naming)

#### Task 2.3: Request Naming Edge Cases
- [ ] Handle URLs with no path (use `/`)
- [ ] Handle URLs with query params (strip from name)
- [ ] Handle URLs with trailing slashes
- [ ] Handle very long paths (truncate if needed)

**Deliverables**:
- Comprehensive error handling
- Edge case test suite

**Duration**: 2-3 hours

---

### Phase 3: Testing & Documentation

**Objective**: Ensure quality and provide user documentation

**Tasks**:

#### Task 3.1: Automated Testing
- [ ] Unit tests for `curlParserService` (all supported flags)
- [ ] Integration tests for command handlers
- [ ] Test error scenarios
- [ ] Test with real-world cURL examples

#### Task 3.2: Manual Testing
- [ ] Test import from directory context menu
- [ ] Test import from toolbar
- [ ] Test with various cURL formats
- [ ] Test error messages
- [ ] Test request opening after import
- [ ] Test directory tree refresh

#### Task 3.3: Documentation
- [ ] Update README with cURL import feature
- [ ] Add usage examples
- [ ] Document supported cURL flags
- [ ] Document limitations (unsupported flags)
- [ ] Add security best practices (sensitive data)

**Deliverables**:
- Test suite with >90% coverage
- Updated README
- User documentation

**Duration**: 2-3 hours

---

### Phase 4: Polish & Release (Optional Enhancements)

**Objective**: Improve UX and add nice-to-have features

**Tasks**:

#### Task 4.1: UI Enhancements (if time permits)
- [ ] Upgrade to custom Webview for better dialog UX
- [ ] Add syntax highlighting for cURL in dialog
- [ ] Add real-time validation feedback
- [ ] Add "Paste from Clipboard" button

#### Task 4.2: Advanced Features (future)
- [ ] Export to cURL (reverse operation)
- [ ] Import history (recently imported cURL commands)
- [ ] Batch import from file

**Deliverables**:
- Enhanced dialog UI (optional)
- Feature roadmap for future enhancements

**Duration**: 2-4 hours (optional)

---

## Total Estimated Time

| Phase | Duration |
|-------|----------|
| Phase 0: Research & Design | 1-2 hours |
| Phase 1: Core Implementation | 3-4 hours |
| Phase 2: Error Handling | 2-3 hours |
| Phase 3: Testing & Documentation | 2-3 hours |
| Phase 4: Polish (Optional) | 2-4 hours |
| **Total (Required)** | **8-12 hours** |
| **Total (with Polish)** | **10-16 hours** |

---

## Success Metrics

### Implementation Metrics
- [ ] All 6 functional requirements implemented
- [ ] All acceptance criteria met
- [ ] Test coverage > 90% for parser service
- [ ] Zero breaking changes to existing code

### User Metrics (Post-Launch)
- [ ] Import speed < 10 seconds (from spec)
- [ ] Parsing accuracy > 95% (from spec)
- [ ] User satisfaction rating > 4/5
- [ ] Adoption rate > 40% within 30 days (from spec)

---

## Next Steps

1. ✅ Complete this implementation plan
2. 🔄 **Execute Phase 0**: Generate research.md, data-model.md, quickstart.md
3. ⏳ Execute Phase 1: Core implementation
4. ⏳ Execute Phase 2: Error handling
5. ⏳ Execute Phase 3: Testing & documentation
6. ⏳ (Optional) Execute Phase 4: Polish

**Ready to proceed to Phase 0 research tasks.**
