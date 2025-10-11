import * as vscode from 'vscode';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { HttpClientPanel } from './HttpClientPanel';
import { DirectoryService } from './services/directoryService';
import { DirectoryTreeProvider } from './views/DirectoryTreeProvider';
import { RequestService } from './services/requestService';
import { CurlParserService } from './services/curlParserService';
import { Request } from './models/request';

export function activate(context: vscode.ExtensionContext) {
  // 创建directoryService实例
  const directoryService = new DirectoryService(context);

  // 创建requestService实例
  const requestService = new RequestService(context);

  // 创建curlParserService实例
  const curlParser = new CurlParserService();

  // 打印存储路径和数据
  console.log('存储路径:', context.globalStoragePath);
  console.log('所有文件夹:', directoryService.getAllDirectories());
  console.log('所有请求:', requestService.getAllRequests());

  // 创建目录树视图提供者
  const directoryTreeProvider = new DirectoryTreeProvider(directoryService, requestService, context.extensionUri);

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

  // 注册自动保存请求命令（用于实时自动保存）
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.autoSaveRequest', async (requestData: any) => {
      // 安全检查：自动保存只用于已保存的请求
      if (!requestData || !requestData.id) {
        console.error('[AutoSave] 缺少请求 ID，跳过自动保存');
        return;
      }

      console.log('[AutoSave] 开始自动保存:', requestData.id);

      try {
        // 调用 RequestService 更新请求
        const updated = requestService.updateRequest(requestData.id, {
          name: requestData.name,
          url: requestData.url,
          method: requestData.method,
          headers: requestData.headers || [],
          body: requestData.body || '',
          updated_at: Date.now()
        });

        if (updated) {
          console.log('[AutoSave] 保存成功');

          // 静默刷新目录树（不展开/折叠）
          directoryTreeProvider.refresh();

          // 通知 Webview 保存成功
          if (HttpClientPanel.currentPanel) {
            HttpClientPanel.currentPanel['_panel'].webview.postMessage({
              command: 'updateSaveStatus',
              status: 'saved'
            });
          }
        } else {
          console.error('[AutoSave] 保存失败：请求不存在');

          // 通知 Webview 保存失败
          if (HttpClientPanel.currentPanel) {
            HttpClientPanel.currentPanel['_panel'].webview.postMessage({
              command: 'updateSaveStatus',
              status: 'error',
              message: '请求不存在或已被删除'
            });
          }
        }
      } catch (error) {
        console.error('[AutoSave] 保存异常:', error);

        // 通知 Webview 保存失败
        if (HttpClientPanel.currentPanel) {
          HttpClientPanel.currentPanel['_panel'].webview.postMessage({
            command: 'updateSaveStatus',
            status: 'error',
            message: error instanceof Error ? error.message : '保存失败'
          });
        }
      }
    })
  );

  // 注册导入cURL命令（从目录右键菜单）
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.importCurl', async (directory) => {
      const folderId = directory?.id;
      if (!folderId) {
        vscode.window.showErrorMessage('请选择一个目录');
        return;
      }

      await importCurlCommand(folderId, curlParser, requestService, directoryTreeProvider, context.extensionUri);
    })
  );

  // 注册导入cURL命令（从工具栏）
  context.subscriptions.push(
    vscode.commands.registerCommand('httpClient.importCurlFromToolbar', async () => {
      // 提示用户选择目录
      const directories = Array.from(directoryService.getAllDirectories());
      const selected = await vscode.window.showQuickPick(
        directories.map(d => ({ label: d.name, id: d.id })),
        { placeHolder: '选择保存导入请求的目录' }
      );

      if (!selected) {
        return; // 用户取消
      }

      await importCurlCommand(selected.id, curlParser, requestService, directoryTreeProvider, context.extensionUri);
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

/**
 * 导入cURL命令的辅助函数
 */
async function importCurlCommand(
  folderId: string,
  curlParser: CurlParserService,
  requestService: RequestService,
  directoryTreeProvider: DirectoryTreeProvider,
  extensionUri: vscode.Uri
): Promise<void> {
  // 显示输入对话框
  const curlInput = await vscode.window.showInputBox({
    prompt: '粘贴您的 cURL 命令',
    placeHolder: 'curl -X POST https://api.example.com -H "Content-Type: application/json" -d \'{"key":"value"}\'',
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return '请输入 cURL 命令';
      }
      return null;
    }
  });

  if (!curlInput) {
    return; // 用户取消
  }

  try {
    // 解析cURL命令
    const parsed = curlParser.parse(curlInput);

    // 生成请求名称
    const name = generateRequestName(parsed.method, parsed.url);

    // 将headers数组转换为字典
    const headersDict: { [key: string]: string } = {};
    parsed.headers.forEach(h => {
      headersDict[h.key] = h.value;
    });

    // 创建请求对象
    const request: Request = {
      id: crypto.randomUUID(),
      name,
      method: parsed.method,
      url: parsed.url,
      headers: headersDict,
      body: parsed.body || '',
      folder_id: folderId,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    // 保存请求
    requestService.createRequest(request);

    // 刷新目录树
    directoryTreeProvider.refresh();

    // 打开请求
    HttpClientPanel.createOrShow(extensionUri, request);

    // 显示成功消息
    vscode.window.showInformationMessage('请求导入成功');

  } catch (error: any) {
    vscode.window.showErrorMessage(
      `无法解析 cURL 命令: ${error.message}`
    );
  }
}

/**
 * 从HTTP方法和URL生成请求名称
 */
function generateRequestName(method: string, url: string): string {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;

    // 处理根路径
    if (!path || path === '/') {
      return `${method.toUpperCase()} /`;
    }

    // 移除尾部斜杠（除非是根路径）
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return `${method.toUpperCase()} ${path}`;
  } catch (error) {
    // URL解析失败时的回退
    return `${method.toUpperCase()} Request`;
  }
}

export function deactivate() {
  console.log('Tunder Client 插件已停用');
}