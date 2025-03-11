import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Directory {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: number;
    updatedAt: number;
}

export class DirectoryService {
    private static readonly STORAGE_FILE = 'directories.json';
    private directories: Map<string, Directory>;
    private storagePath: string;

    constructor(context: vscode.ExtensionContext) {
        this.directories = new Map();
        // 确保存储目录存在
        if (!fs.existsSync(context.globalStoragePath)) {
            fs.mkdirSync(context.globalStoragePath, { recursive: true });
        }
        this.storagePath = path.join(context.globalStoragePath, DirectoryService.STORAGE_FILE);
        this.loadDirectories();
    }

    private loadDirectories(): void {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf-8');
                const dirs = JSON.parse(data);
                this.directories = new Map(Object.entries(dirs));
            }
        } catch (error) {
            console.error('加载目录数据失败:', error);
            vscode.window.showErrorMessage('加载目录数据失败');
        }
    }

    private saveDirectories(): void {
        try {
            // 确保存储目录存在
            const storageDir = path.dirname(this.storagePath);
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }
            const data = Object.fromEntries(this.directories);
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('保存目录数据失败:', error);
            vscode.window.showErrorMessage('保存目录数据失败');
        }
    }

    public createDirectory(name: string, parentId: string | null = null): Directory | null {
        try {
            const id = Date.now().toString();
            const directory: Directory = {
                id,
                name,
                parentId,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            this.directories.set(id, directory);
            this.saveDirectories();
            return directory;
        } catch (error) {
            console.error('创建目录失败:', error);
            vscode.window.showErrorMessage('创建目录失败');
            return null;
        }
    }

    public updateDirectory(id: string, name: string): boolean {
        try {
            const directory = this.directories.get(id);
            if (!directory) {
                return false;
            }

            directory.name = name;
            directory.updatedAt = Date.now();
            this.directories.set(id, directory);
            this.saveDirectories();
            return true;
        } catch (error) {
            console.error('更新目录失败:', error);
            vscode.window.showErrorMessage('更新目录失败');
            return false;
        }
    }

    public deleteDirectory(id: string): boolean {
        try {
            // 删除当前目录及其所有子目录
            const deleteRecursively = (dirId: string) => {
                const childDirs = Array.from(this.directories.values())
                    .filter(dir => dir.parentId === dirId)
                    .map(dir => dir.id);

                childDirs.forEach(childId => deleteRecursively(childId));
                this.directories.delete(dirId);
            };

            if (!this.directories.has(id)) {
                return false;
            }

            deleteRecursively(id);
            this.saveDirectories();
            return true;
        } catch (error) {
            console.error('删除目录失败:', error);
            vscode.window.showErrorMessage('删除目录失败');
            return false;
        }
    }

    public getDirectory(id: string): Directory | undefined {
        return this.directories.get(id);
    }

    public getAllDirectories(): Directory[] {
        return Array.from(this.directories.values());
    }

    public getDirectoryTree(): Directory[] {
        const rootDirs = Array.from(this.directories.values())
            .filter(dir => !dir.parentId)
            .sort((a, b) => a.name.localeCompare(b.name));

        const buildTree = (parentId: string | null): Directory[] => {
            return Array.from(this.directories.values())
                .filter(dir => dir.parentId === parentId)
                .sort((a, b) => a.name.localeCompare(b.name));
        };

        return rootDirs;
    }
}