import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Request, RequestModel } from '../models/request';

export class RequestService {
    private context: vscode.ExtensionContext;
    private requests: Map<string, Request>;
    private storageFile: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.requests = new Map<string, Request>();
        
        // 确保存储目录存在
        const storagePath = context.globalStoragePath;
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        
        // 设置请求存储文件路径
        this.storageFile = path.join(storagePath, 'requests.json');
        console.log('请求存储文件路径:', this.storageFile);
        
        this.loadRequests();
        console.log('RequestService初始化完成，当前请求列表:', Array.from(this.requests.values()));
    }

    private loadRequests() {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8')) as Request[];
                console.log('从文件加载请求:', data);
                data.forEach(request => {
                    this.requests.set(request.id, request);
                });
            } else {
                console.log('请求存储文件不存在，将创建新文件');
                this.saveRequests(); // 创建空文件
            }
        } catch (error) {
            console.error('加载请求失败:', error);
        }
    }

    private saveRequests() {
        try {
            const data = Array.from(this.requests.values());
            console.log('保存请求到文件:', data);
            fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('保存请求失败:', error);
        }
    }

    createRequest(data: Partial<Request>): Request | null {
        try {
            console.log('开始创建请求:', data);
            const request = new RequestModel(data);
            const requestData = request.toJSON();
            console.log('创建的请求对象:', requestData);
            this.requests.set(request.id, requestData);
            this.saveRequests();
            return requestData;
        } catch (error) {
            console.error('创建请求失败:', error);
            return null;
        }
    }

    getRequest(id: string): Request | null {
        return this.requests.get(id) || null;
    }

    getRequestsByFolder(folderId?: string): Request[] {
        return Array.from(this.requests.values())
            .filter(request => request.folder_id === folderId);
    }

    updateRequest(id: string, data: Partial<Request>): Request | null {
        console.log('开始更新请求:', { id, data });
        const existingRequest = this.requests.get(id);
        if (!existingRequest) {
            console.log('未找到要更新的请求:', id);
            return null;
        }

        try {
            const updatedRequest = {
                ...existingRequest,
                ...data,
                updated_at: Date.now()
            };
            console.log('更新后的请求对象:', updatedRequest);
            this.requests.set(id, updatedRequest);
            this.saveRequests();
            return updatedRequest;
        } catch (error) {
            console.error('更新请求失败:', error);
            return null;
        }
    }

    deleteRequest(id: string): boolean {
        const deleted = this.requests.delete(id);
        if (deleted) {
            this.saveRequests();
        }
        return deleted;
    }

    deleteRequestsByFolder(folderId: string): boolean {
        const requests = this.getRequestsByFolder(folderId);
        requests.forEach(request => {
            this.requests.delete(request.id);
        });
        this.saveRequests();
        return true;
    }

    /**
     * 复制请求
     * @param id 要复制的请求ID
     * @returns 新创建的请求对象，失败返回null
     */
    copyRequest(id: string): Request | null {
        try {
            console.log('开始复制请求:', id);
            const existingRequest = this.requests.get(id);
            if (!existingRequest) {
                console.log('未找到要复制的请求:', id);
                return null;
            }

            // 创建新请求，复制原请求的属性（除了id、created_at和updated_at）
            const newRequest = this.createRequest({
                name: `${existingRequest.name} (复制)`,
                method: existingRequest.method,
                url: existingRequest.url,
                headers: existingRequest.headers,
                body: existingRequest.body,
                folder_id: existingRequest.folder_id
            });

            return newRequest;
        } catch (error) {
            console.error('复制请求失败:', error);
            return null;
        }
    }

    /**
     * 获取所有请求
     */
    public getAllRequests(): Request[] {
        try {
            const requests = Array.from(this.requests.values());
            console.log('获取所有请求:', requests);
            return requests;
        } catch (error) {
            console.error('获取所有请求失败:', error);
            return [];
        }
    }
}