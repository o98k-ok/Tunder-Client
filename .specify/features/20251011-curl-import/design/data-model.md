# Data Model: cURL Import

**Feature**: cURL Import  
**Date**: 2025-10-11  
**Status**: Complete

---

## Overview

This document defines all data structures and interfaces used in the cURL import feature.

---

## Core Interfaces

### ParsedRequest

Represents the result of parsing a cURL command.

```typescript
/**
 * Result of parsing a cURL command
 */
export interface ParsedRequest {
    /**
     * HTTP method (GET, POST, PUT, DELETE, etc.)
     * Default: 'GET' if not specified
     */
    method: string;
    
    /**
     * Full URL including protocol, domain, path, and query parameters
     * Example: 'https://api.example.com/v1/users?limit=10'
     */
    url: string;
    
    /**
     * Array of HTTP headers
     * Each header is a key-value pair
     */
    headers: RequestHeader[];
    
    /**
     * Request body (if present)
     * Typically JSON string for POST/PUT requests
     * undefined for GET requests
     */
    body?: string;
}
```

### RequestHeader

Represents a single HTTP header.

```typescript
/**
 * HTTP header key-value pair
 */
export interface RequestHeader {
    /**
     * Header name (e.g., 'Content-Type', 'Authorization')
     */
    key: string;
    
    /**
     * Header value (e.g., 'application/json', 'Bearer token123')
     */
    value: string;
}
```

### CurlParseError

Custom error type for parsing failures.

```typescript
/**
 * Error thrown when cURL parsing fails
 */
export class CurlParseError extends Error {
    /**
     * Error code for programmatic handling
     */
    code: CurlParseErrorCode;
    
    /**
     * User-friendly error message
     */
    message: string;
    
    /**
     * Example of valid cURL syntax (optional)
     */
    example?: string;
    
    constructor(code: CurlParseErrorCode, message: string, example?: string) {
        super(message);
        this.name = 'CurlParseError';
        this.code = code;
        this.example = example;
    }
}

/**
 * Error codes for different parsing failures
 */
export enum CurlParseErrorCode {
    /** No URL found in cURL command */
    NO_URL = 'NO_URL',
    
    /** Invalid cURL syntax */
    INVALID_SYNTAX = 'INVALID_SYNTAX',
    
    /** Empty input */
    EMPTY_INPUT = 'EMPTY_INPUT',
    
    /** Unsupported cURL feature */
    UNSUPPORTED_FEATURE = 'UNSUPPORTED_FEATURE'
}
```

---

## Existing Interfaces (No Changes)

These interfaces are already defined in the project and will be reused without modification.

### Request

Defined in `src/models/request.ts`:

```typescript
export interface Request {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    body: string;
    folderId: string;
    created_at: number;
    updated_at: number;
}
```

**Mapping from ParsedRequest to Request**:

```typescript
function convertToRequest(
    parsed: ParsedRequest,
    folderId: string,
    name: string
): Request {
    return {
        id: generateId(), // Use existing ID generation
        name,
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        body: parsed.body || '',
        folderId,
        created_at: Date.now(),
        updated_at: Date.now()
    };
}
```

---

## Service Interface

### CurlParserService

New service for parsing cURL commands.

```typescript
/**
 * Service for parsing cURL commands into structured request data
 */
export class CurlParserService {
    /**
     * Parse a cURL command string into a ParsedRequest object
     * 
     * @param input - Raw cURL command string
     * @returns Parsed request data
     * @throws CurlParseError if parsing fails
     * 
     * @example
     * const parsed = curlParser.parse('curl -X POST https://api.com -H "Content-Type: application/json" -d \'{"key":"value"}\'');
     * // Returns: { method: 'POST', url: 'https://api.com', headers: [...], body: '{"key":"value"}' }
     */
    parse(input: string): ParsedRequest;
    
    /**
     * Normalize cURL input by removing line continuations and extra whitespace
     * 
     * @param input - Raw cURL command string
     * @returns Normalized string
     * 
     * @example
     * normalize('curl \\\n  https://api.com')
     * // Returns: 'curl https://api.com'
     */
    private normalize(input: string): string;
    
    /**
     * Extract HTTP method from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns HTTP method (uppercase) or 'GET' if not specified
     */
    private extractMethod(input: string): string;
    
    /**
     * Extract URL from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns URL string
     * @throws CurlParseError if no URL found
     */
    private extractUrl(input: string): string;
    
    /**
     * Extract headers from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns Array of headers
     */
    private extractHeaders(input: string): RequestHeader[];
    
    /**
     * Extract request body from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns Body string or undefined
     */
    private extractBody(input: string): string | undefined;
    
    /**
     * Remove quotes from a string value
     * Handles single quotes, double quotes, and escaped quotes
     * 
     * @param value - Quoted string
     * @returns Unquoted string
     */
    private unquote(value: string): string;
}
```

---

## Helper Functions

### Request Name Generation

```typescript
/**
 * Generate a descriptive request name from method and URL
 * 
 * @param method - HTTP method
 * @param url - Full URL
 * @returns Formatted request name
 * 
 * @example
 * generateRequestName('POST', 'https://api.com/v1/users')
 * // Returns: 'POST /v1/users'
 * 
 * generateRequestName('GET', 'https://api.com/')
 * // Returns: 'GET /'
 * 
 * generateRequestName('GET', 'https://api.com/search?q=test')
 * // Returns: 'GET /search'
 */
export function generateRequestName(method: string, url: string): string {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;
        
        // Handle root path
        if (!path || path === '/') {
            return `${method.toUpperCase()} /`;
        }
        
        // Remove trailing slash (unless root)
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        return `${method.toUpperCase()} ${path}`;
    } catch (error) {
        // Fallback if URL parsing fails
        return `${method.toUpperCase()} Request`;
    }
}
```

### ID Generation

```typescript
/**
 * Generate a unique ID for a request
 * Reuses existing ID generation logic
 * 
 * @returns UUID string
 */
export function generateId(): string {
    // Use existing implementation from RequestService
    // Typically: crypto.randomUUID() or similar
    return crypto.randomUUID();
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Input (cURL)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CurlParserService.parse()                       │
│  Input: "curl -X POST https://api.com -H 'CT: json' -d {}"  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    ParsedRequest                             │
│  {                                                           │
│    method: 'POST',                                           │
│    url: 'https://api.com',                                   │
│    headers: [{ key: 'Content-Type', value: 'json' }],       │
│    body: '{}'                                                │
│  }                                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              generateRequestName()                           │
│  Input: method='POST', url='https://api.com'                │
│  Output: 'POST /'                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              convertToRequest()                              │
│  Adds: id, folderId, created_at, updated_at                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Request Object                            │
│  (Compatible with existing RequestService)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          RequestService.createRequest()                      │
│  Saves to persistent storage                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

### ParsedRequest Validation

```typescript
/**
 * Validate a ParsedRequest object
 * 
 * @param parsed - ParsedRequest to validate
 * @throws CurlParseError if validation fails
 */
function validateParsedRequest(parsed: ParsedRequest): void {
    // URL is required
    if (!parsed.url || parsed.url.trim().length === 0) {
        throw new CurlParseError(
            CurlParseErrorCode.NO_URL,
            'No URL found in cURL command',
            'curl https://api.example.com'
        );
    }
    
    // URL must be valid
    try {
        new URL(parsed.url);
    } catch (error) {
        throw new CurlParseError(
            CurlParseErrorCode.INVALID_SYNTAX,
            'Invalid URL format',
            'curl https://api.example.com'
        );
    }
    
    // Method must be valid HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    if (!validMethods.includes(parsed.method.toUpperCase())) {
        throw new CurlParseError(
            CurlParseErrorCode.INVALID_SYNTAX,
            `Invalid HTTP method: ${parsed.method}`,
            'curl -X POST https://api.example.com'
        );
    }
    
    // Headers must have both key and value
    for (const header of parsed.headers) {
        if (!header.key || header.key.trim().length === 0) {
            throw new CurlParseError(
                CurlParseErrorCode.INVALID_SYNTAX,
                'Header key cannot be empty'
            );
        }
    }
}
```

---

## State Transitions

The cURL import feature has a simple state flow:

```
[User Opens Dialog]
       ↓
[Input Empty] ──→ [Import Button Disabled]
       ↓
[User Pastes cURL]
       ↓
[Input Validation] ──→ [Show Error] ──→ [Keep Dialog Open]
       ↓ (valid)
[Parse cURL] ──→ [Parse Error] ──→ [Show Error] ──→ [Keep Dialog Open]
       ↓ (success)
[Generate Name]
       ↓
[Create Request]
       ↓
[Save to Storage]
       ↓
[Refresh Tree View]
       ↓
[Open Request]
       ↓
[Show Success Notification]
       ↓
[Close Dialog]
```

---

## Example Data

### Example 1: Simple GET Request

**Input**:
```bash
curl https://api.example.com/v1/users
```

**ParsedRequest**:
```typescript
{
    method: 'GET',
    url: 'https://api.example.com/v1/users',
    headers: [],
    body: undefined
}
```

**Request Name**: `"GET /v1/users"`

---

### Example 2: POST Request with Headers and Body

**Input**:
```bash
curl -X POST https://api.example.com/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer abc123" \
  -d '{"name":"John","email":"john@example.com"}'
```

**ParsedRequest**:
```typescript
{
    method: 'POST',
    url: 'https://api.example.com/v1/users',
    headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer abc123' }
    ],
    body: '{"name":"John","email":"john@example.com"}'
}
```

**Request Name**: `"POST /v1/users"`

---

### Example 3: GET Request with Query Parameters

**Input**:
```bash
curl https://api.example.com/search?q=test&limit=10
```

**ParsedRequest**:
```typescript
{
    method: 'GET',
    url: 'https://api.example.com/search?q=test&limit=10',
    headers: [],
    body: undefined
}
```

**Request Name**: `"GET /search"` (query params stripped from name, but kept in URL)

---

## Summary

### New Types Created
- `ParsedRequest`: Result of cURL parsing
- `RequestHeader`: HTTP header key-value pair
- `CurlParseError`: Custom error type
- `CurlParseErrorCode`: Error code enum

### Existing Types Reused
- `Request`: From `src/models/request.ts` (no changes)

### Services
- `CurlParserService`: New service for parsing cURL commands

### Helper Functions
- `generateRequestName()`: Create descriptive names
- `generateId()`: Create unique IDs (reuses existing logic)
- `validateParsedRequest()`: Validate parsed data
- `convertToRequest()`: Convert ParsedRequest to Request

---

## Next Steps

1. ✅ Data model defined
2. 🔄 Create quickstart.md (developer guide)
3. ⏳ Implement CurlParserService
4. ⏳ Implement command handlers

