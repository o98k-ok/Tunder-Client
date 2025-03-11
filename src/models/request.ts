import * as crypto from 'crypto';

export interface Request {
    id: string;
    name: string;
    method: string;
    url: string;
    headers?: { [key: string]: string };
    body?: string;
    folder_id?: string;
    created_at: number;
    updated_at: number;
}

export class RequestModel implements Request {
    id: string;
    name: string;
    method: string;
    url: string;
    headers?: { [key: string]: string };
    body?: string;
    folder_id?: string;
    created_at: number;
    updated_at: number;

    constructor(data: Partial<Request>) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name || '新建请求';
        this.method = data.method || 'GET';
        this.url = data.url || '';
        this.headers = data.headers || {};
        this.body = data.body;
        this.folder_id = data.folder_id;
        this.created_at = data.created_at || Date.now();
        this.updated_at = data.updated_at || Date.now();
    }

    toJSON(): Request {
        return {
            id: this.id,
            name: this.name,
            method: this.method,
            url: this.url,
            headers: this.headers,
            body: this.body,
            folder_id: this.folder_id,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}