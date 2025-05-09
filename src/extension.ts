import * as vscode from 'vscode';
import * as fs from 'fs';
import { HttpClientPanel } from './HttpClientPanel';
import { DirectoryService } from './services/directoryService';
import { DirectoryTreeProvider } from './views/DirectoryTreeProvider';
import { RequestService } from './services/requestService';

export function activate(context: vscode.ExtensionContext) {
  // 创建directoryService实例
  const directoryService = new DirectoryService(context);
  
  // 创建requestService实例
  const requestService = new RequestService(context);
  
  // 打印存储路径和数据
  console.log('存储路径:', context.globalStoragePath);
  console.log('所有文件夹:', directoryService.getAllDirectories());
  console.log('所有请求:', requestService.getAllRequests());
  
  // 创建目录树视图提供者
  const directoryTreeProvider = new DirectoryTreeProvider(directoryService, requestService);
  
  // 注册目录树视图
  vscode.window.registerTreeDataProvider('httpClientDirectories', directoryTreeProvider);

  // 注册打开存储目录命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.openStorageFolder', async () => {
      try {
        // 确保存储目录存在
        if (!fs.existsSync(context.globalStoragePath)) {
          fs.mkdirSync(context.globalStoragePath, { recursive: true });
        }
        // 打开存储目录
        const uri = vscode.Uri.file(context.globalStoragePath);
        // 使用openExternal替代revealFileInOS，确保正确打开目录
        await vscode.env.openExternal(uri);
        vscode.window.showInformationMessage(`已打开存储目录: ${context.globalStoragePath}`);
      } catch (error) {
        console.error('打开存储目录失败:', error);
        vscode.window.showErrorMessage('打开存储目录失败');
      }
    })
  );

  // 注册创建文件夹命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.createFolder', async () => {
      const folderName = await vscode.window.showInputBox({
        prompt: '输入文件夹名称',
        placeHolder: '新文件夹'
      });
      
      if (folderName) {
        const created = directoryService.createDirectory(folderName);
        if (created) {
          directoryTreeProvider.refresh();
          vscode.window.showInformationMessage(`文件夹 "${folderName}" 创建成功`);
        } else {
          vscode.window.showErrorMessage('创建文件夹失败');
        }
      }
    })
  );

  // 注册编辑文件夹命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.editFolder', async (item) => {
      if (!item) return;
      
      const newName = await vscode.window.showInputBox({
        prompt: '输入新的文件夹名称',
        placeHolder: item.label,
        value: item.label
      });
      
      if (newName) {
        const updated = directoryService.updateDirectory(item.id, newName);
        if (updated) {
          directoryTreeProvider.refresh();
          vscode.window.showInformationMessage(`文件夹已重命名为 "${newName}"`);
        } else {
          vscode.window.showErrorMessage('重命名文件夹失败');
        }
      }
    })
  );

  // 注册删除文件夹命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.deleteFolder', async (item) => {
      if (!item) return;
      
      const answer = await vscode.window.showWarningMessage(
        `确定要删除文件夹 "${item.label}" 吗？`,
        { modal: true },
        '确定'
      );
      
      if (answer === '确定') {
        const deleted = directoryService.deleteDirectory(item.id);
        if (deleted) {
          directoryTreeProvider.refresh();
          vscode.window.showInformationMessage(`文件夹 "${item.label}" 已删除`);
        } else {
          vscode.window.showErrorMessage('删除文件夹失败');
        }
      }
    })
  );

  // 注册创建请求命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.createRequest', async (item) => {
      const folderName = item ? item.label : '根目录';
      const folderId = item ? item.id : undefined;
      
      const requestName = await vscode.window.showInputBox({
        prompt: `在 ${folderName} 下创建请求`,
        placeHolder: '新建请求'
      });
      
      if (requestName) {
        const request = requestService.createRequest({
          name: requestName,
          folder_id: folderId
        });
        
        if (request) {
          directoryTreeProvider.refresh();
          vscode.window.showInformationMessage(`请求 "${requestName}" 创建成功`);
        } else {
          vscode.window.showErrorMessage('创建请求失败');
        }
      }
    })
  );

  // 注册编辑请求命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.editRequest', async (item) => {
      if (!item) return;
      
      const newName = await vscode.window.showInputBox({
        prompt: '输入新的请求名称',
        placeHolder: item.label,
        value: item.label
      });
      
      if (newName) {
        const updated = requestService.updateRequest(item.id, { name: newName });
        if (updated) {
          directoryTreeProvider.refresh();
          vscode.window.showInformationMessage(`请求已重命名为 "${newName}"`);
        } else {
          vscode.window.showErrorMessage('重命名请求失败');
        }
      }
    })
  );

  // 注册删除请求命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.deleteRequest', async (item) => {
      if (!item) return;
      
      const answer = await vscode.window.showWarningMessage(
        `确定要删除请求 "${item.label}" 吗？`,
        { modal: true },
        '确定'
      );
      
      if (answer === '确定') {
        const deleted = requestService.deleteRequest(item.id);
        if (deleted) {
          directoryTreeProvider.refresh();
          vscode.window.showInformationMessage(`请求 "${item.label}" 已删除`);
        } else {
          vscode.window.showErrorMessage('删除请求失败');
        }
      }
    })
  );

  // 注册复制请求命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.copyRequest', async (item) => {
      if (!item) return;
      
      const newRequest = requestService.copyRequest(item.id);
      if (newRequest) {
        directoryTreeProvider.refresh();
        vscode.window.showInformationMessage(`请求 "${item.label}" 已复制`);
      } else {
        vscode.window.showErrorMessage('复制请求失败');
      }
    })
  );

  // 注册加载请求命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.loadRequest', async (item) => {
      if (!item) return;
      
      const request = requestService.getRequest(item.id);
      if (!request) {
        vscode.window.showErrorMessage('加载请求失败');
        return;
      }

      console.log('加载请求:', request);

      try {
        if (!HttpClientPanel.currentPanel) {
          HttpClientPanel.createOrShow(context.extensionUri, request);
        } else {
          HttpClientPanel.currentPanel.loadRequest(request);
        }
      } catch (error) {
        console.error('加载请求到面板时出错:', error);
        vscode.window.showErrorMessage('加载请求到面板失败');
      }
    })
  );

  // 注册保存请求命令
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.saveRequest', async (requestData: any) => {
      if (!requestData) {
        vscode.window.showErrorMessage('没有请求数据');
        return;
      }
      
      console.log('保存请求:', {
        requestData,
        currentRequest: HttpClientPanel.currentPanel?.getCurrentRequestItem(),
        folderId: HttpClientPanel.currentPanel?.folderId,
        allFolders: directoryService.getAllDirectories(),
        allRequests: requestService.getAllRequests()
      });
      
      // 获取当前请求对象
      const currentRequest = HttpClientPanel.currentPanel?.getCurrentRequestItem();
      
      if (currentRequest) {
        console.log('更新现有请求:', currentRequest.id);
        
        // 更新现有请求
        const updated = requestService.updateRequest(currentRequest.id, {
          name: currentRequest.name,
          url: requestData.url,
          method: requestData.method,
          headers: requestData.headers || [],
          body: requestData.body || '',
          updated_at: Date.now()
        });

        if (updated) {
          vscode.window.showInformationMessage(`请求 "${currentRequest.name}" 已更新`);
          directoryTreeProvider.refresh();
        } else {
          vscode.window.showErrorMessage('更新请求失败');
        }
        return; // 添加return，防止继续执行创建新请求的逻辑
      }
      
      // 获取当前文件夹
      const folderId = HttpClientPanel.currentPanel?.folderId || '';
      console.log('创建新请求的文件夹信息:', {
        folderId,
        allFolders: directoryService.getAllDirectories(),
        currentFolder: folderId ? directoryService.getDirectory(folderId) : null
      });
      
      let folderToUse = null;
      
      if (folderId) {
        folderToUse = directoryService.getDirectory(folderId);
      }
      
      // 如果没有找到文件夹，使用默认文件夹或创建一个新文件夹
      if (!folderToUse) {
        const directories = directoryService.getAllDirectories();
        if (directories.length > 0) {
          folderToUse = directories[0];
        } else {
          folderToUse = directoryService.createDirectory('默认文件夹');
          if (!folderToUse) {
            vscode.window.showErrorMessage('无法创建或获取文件夹');
            return;
          }
        }
      }
      
      // 创建新请求
      const request = requestService.createRequest({
        name: requestData.name,
        folder_id: folderToUse.id,
        url: requestData.url,
        method: requestData.method,
        headers: requestData.headers || [],
        body: requestData.body || '',
        updated_at: Date.now()
      });
      
      if (request) {
        vscode.window.showInformationMessage(`请求 "${requestData.name}" 已保存`);
        directoryTreeProvider.refresh();
        
        // 更新当前请求引用
        if (HttpClientPanel.currentPanel) {
          HttpClientPanel.currentPanel.loadRequest(request);
        }
      } else {
        vscode.window.showErrorMessage('保存请求失败');
      }
    })
  );

  // 注册命令，用于打开HTTP客户端面板
  let disposable = vscode.commands.registerCommand('vscode-http-client.start', () => {
    try {
      HttpClientPanel.createOrShow(context.extensionUri);
    } catch (error) {
      console.error('打开Tunder Client面板时出错:', error);
      vscode.window.showErrorMessage(`打开Tunder Client失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log('Tunder Client 插件已停用');
}