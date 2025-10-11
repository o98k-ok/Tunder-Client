import * as vscode from 'vscode';
import { DirectoryService } from '../services/directoryService';
import { RequestService } from '../services/requestService';

export class DirectoryTreeProvider implements vscode.TreeDataProvider<DirectoryTreeItem | RequestTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DirectoryTreeItem | RequestTreeItem | undefined | null | void> = new vscode.EventEmitter<DirectoryTreeItem | RequestTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DirectoryTreeItem | RequestTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private directoryService: DirectoryService,
        private requestService: RequestService,
        private extensionUri: vscode.Uri
    ) { }

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
                vscode.TreeItemCollapsibleState.Collapsed,
                this.extensionUri
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
                vscode.TreeItemCollapsibleState.Collapsed,
                this.extensionUri
            )));

            // 添加请求
            const requests = this.requestService.getRequestsByFolder(element.id);
            items.push(...requests.map(request => new RequestTreeItem(
                request.name,
                request.id,
                request.method,
                this.extensionUri
            )));

            return items;
        }
    }
}

/**
 * 获取方法标签 SVG 图标路径
 */
function getMethodBadgeIcon(method: string, extensionUri: vscode.Uri): vscode.Uri {
    const methodLower = method.toLowerCase();
    return vscode.Uri.joinPath(extensionUri, 'media', 'method-badges', `${methodLower}.svg`);
}

class DirectoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        extensionUri: vscode.Uri
    ) {
        super(label, collapsibleState);
        this.tooltip = label;
        this.contextValue = 'directory';
        
        // 使用统一的文件夹图标（自适应主题颜色）
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

class RequestTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly method: string,
        extensionUri: vscode.Uri
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${method} ${label}`;
        this.contextValue = 'request';

        // 使用 SVG 方法标签图标
        this.iconPath = getMethodBadgeIcon(method, extensionUri);

        // 设置命令
        this.command = {
            command: 'httpClient.loadRequest',
            title: '',
            arguments: [this]
        };
    }
}