/**
 * cURL Parser Service
 * 
 * Parses cURL commands into structured HTTP request data.
 * Supports standard cURL flags for HTTP requests.
 */

/**
 * Parsed cURL command result
 */
export interface ParsedRequest {
    /** HTTP method (GET, POST, PUT, DELETE, etc.) */
    method: string;
    /** Full URL including protocol, domain, path, and query parameters */
    url: string;
    /** Array of HTTP headers */
    headers: RequestHeader[];
    /** Request body (if present) */
    body?: string;
}

/**
 * HTTP header key-value pair
 */
export interface RequestHeader {
    /** Header name (e.g., 'Content-Type', 'Authorization') */
    key: string;
    /** Header value (e.g., 'application/json', 'Bearer token123') */
    value: string;
}

/**
 * Error codes for cURL parsing failures
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

/**
 * Custom error for cURL parsing failures
 */
export class CurlParseError extends Error {
    code: CurlParseErrorCode;
    example?: string;

    constructor(code: CurlParseErrorCode, message: string, example?: string) {
        super(message);
        this.name = 'CurlParseError';
        this.code = code;
        this.example = example;
    }
}

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
     */
    parse(input: string): ParsedRequest {
        // Validate input
        if (!input || input.trim().length === 0) {
            throw new CurlParseError(
                CurlParseErrorCode.EMPTY_INPUT,
                'Please enter a cURL command'
            );
        }

        // Normalize input (remove line continuations)
        const normalized = this.normalize(input);

        // Extract components
        const method = this.extractMethod(normalized);
        const url = this.extractUrl(normalized);
        const headers = this.extractHeaders(normalized);
        const body = this.extractBody(normalized);

        return {
            method,
            url,
            headers,
            body
        };
    }

    /**
     * Normalize cURL input by removing line continuations and extra whitespace
     * 
     * @param input - Raw cURL command string
     * @returns Normalized string
     */
    private normalize(input: string): string {
        // Remove backslash line continuations
        let normalized = input.replace(/\\\s*\n\s*/g, ' ');

        // Trim and collapse multiple spaces (but preserve spaces in quoted strings)
        normalized = normalized.trim();

        return normalized;
    }

    /**
     * Extract HTTP method from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns HTTP method (uppercase) or 'GET' if not specified
     */
    private extractMethod(input: string): string {
        // Match -X or --request flag
        const methodMatch = input.match(/(?:^|\s)(?:-X|--request)\s+([A-Z]+)/i);

        if (methodMatch && methodMatch[1]) {
            return methodMatch[1].toUpperCase();
        }

        // Default to GET
        return 'GET';
    }

    /**
     * Extract URL from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns URL string
     * @throws CurlParseError if no URL found
     */
    private extractUrl(input: string): string {
        // Remove 'curl' command if present
        let cleaned = input.replace(/^\s*curl\s+/i, '');

        // Try to find URL pattern (http:// or https://)
        const urlMatch = cleaned.match(/https?:\/\/[^\s'"]+/);

        if (urlMatch && urlMatch[0]) {
            return urlMatch[0];
        }

        // Try to find first non-flag argument
        const parts = cleaned.split(/\s+/);
        for (const part of parts) {
            // Skip flags and their values
            if (part.startsWith('-')) {
                continue;
            }
            // Skip quoted strings that might be flag values
            if (part.startsWith('"') || part.startsWith("'")) {
                continue;
            }
            // If it looks like a URL or domain
            if (part.includes('.') || part.includes('/')) {
                return part;
            }
        }

        throw new CurlParseError(
            CurlParseErrorCode.NO_URL,
            'Unable to find URL in cURL command',
            'curl https://api.example.com'
        );
    }

    /**
     * Extract headers from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns Array of headers
     */
    private extractHeaders(input: string): RequestHeader[] {
        const headers: RequestHeader[] = [];

        // Match all -H or --header flags
        const headerRegex = /(?:-H|--header)\s+(['"])(.*?)\1/g;
        let match;

        while ((match = headerRegex.exec(input)) !== null) {
            const headerValue = match[2];

            // Parse "Key: Value" format
            const colonIndex = headerValue.indexOf(':');
            if (colonIndex > 0) {
                const key = headerValue.substring(0, colonIndex).trim();
                const value = headerValue.substring(colonIndex + 1).trim();

                headers.push({ key, value });
            }
        }

        return headers;
    }

    /**
     * Extract request body from cURL command
     * 
     * @param input - Normalized cURL string
     * @returns Body string or undefined
     */
    private extractBody(input: string): string | undefined {
        // Match -d, --data, or --data-raw flags
        const bodyRegex = /(?:-d|--data|--data-raw)\s+(['"])(.*?)\1/s;
        const match = input.match(bodyRegex);

        if (match && match[2]) {
            return this.unquote(match[2]);
        }

        return undefined;
    }

    /**
     * Remove quotes from a string value
     * Handles single quotes, double quotes, and escaped quotes
     * 
     * @param value - Quoted string
     * @returns Unquoted string
     */
    private unquote(value: string): string {
        // Already unquoted by regex, but handle escaped quotes
        return value
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
    }
}

