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
        
        const colorOptions = ['blue', 'green', 'orange', 'red', 'yellow'];
        const colorIndex = parseInt(this.id, 10) % colorOptions.length;
        const selectedColor = `charts.${colorOptions[colorIndex]}`;
        this.iconPath = new vscode.ThemeIcon('folder', new vscode.ThemeColor(selectedColor));
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

        // 根据方法类型设置不同的颜色
        let color: string;
        switch (method.toUpperCase()) {
            case 'GET':
                color = 'charts.blue';
                break;
            case 'POST':
                color = 'charts.green';
                break;
            case 'PUT':
                color = 'charts.orange';
                break;
            case 'DELETE':
                color = 'charts.red';
                break;
            case 'PATCH':
                color = 'charts.yellow';
                break;
            default:
                color = 'foreground';
        }

        // 设置图标和颜色
        this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor(color));
        
        // 设置方法名称作为描述
        this.description = `${method}`;

        // 设置命令
        this.command = {
            command: 'httpClient.loadRequest',
            title: '',
            arguments: [this]
        };
    }
}