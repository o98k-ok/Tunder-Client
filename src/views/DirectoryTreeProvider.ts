import * as vscode from 'vscode';
import { DirectoryService } from '../services/directoryService';
import { RequestService } from '../services/requestService';

export class DirectoryTreeProvider implements vscode.TreeDataProvider<DirectoryTreeItem | RequestTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DirectoryTreeItem | RequestTreeItem | undefined | null | void> = new vscode.EventEmitter<DirectoryTreeItem | RequestTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DirectoryTreeItem | RequestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private directoryService: DirectoryService,
        private requestService: RequestService
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DirectoryTreeItem | RequestTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: DirectoryTreeItem): Promise<(DirectoryTreeItem | RequestTreeItem)[]> {
        if (!element) {
            // 根级目录
            const rootDirs = this.directoryService.getDirectoryTree();
            return rootDirs.map(dir => new DirectoryTreeItem(
                dir.name,
                dir.id,
                vscode.TreeItemCollapsibleState.Collapsed
            ));
        } else {
            // 子目录和请求
            const items: (DirectoryTreeItem | RequestTreeItem)[] = [];
            
            // 添加子目录
            const childDirs = Array.from(this.directoryService.getAllDirectories())
                .filter(dir => dir.parentId === element.id)
                .sort((a, b) => a.name.localeCompare(b.name));

            items.push(...childDirs.map(dir => new DirectoryTreeItem(
                dir.name,
                dir.id,
                vscode.TreeItemCollapsibleState.Collapsed
            )));

            // 添加请求
            const requests = this.requestService.getRequestsByFolder(element.id);
            items.push(...requests.map(request => new RequestTreeItem(
                request.name,
                request.id,
                request.method
            )));

            return items;
        }
    }
}

class DirectoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = label;
        this.contextValue = 'directory';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

class RequestTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly method: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${method} ${label}`;
        this.contextValue = 'request';
        this.iconPath = new vscode.ThemeIcon(this.getMethodIcon(method));
        this.command = {
            command: 'httpClient.loadRequest',
            title: '加载请求',
            arguments: [this]
        };
    }

    private getMethodIcon(method: string): string {
        switch (method.toUpperCase()) {
            case 'GET': return 'arrow-down';
            case 'POST': return 'arrow-up';
            case 'PUT': return 'arrow-both';
            case 'DELETE': return 'trash';
            default: return 'circle-outline';
        }
    }
}