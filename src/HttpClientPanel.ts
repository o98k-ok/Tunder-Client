import * as vscode from 'vscode';
import axios, { CancelTokenSource } from 'axios';
import { Request } from './models/request';

export class HttpClientPanel {
  private static readonly viewType = 'httpClient';
  public static currentPanel: HttpClientPanel | undefined;
  public readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _currentRequestItem: Request | null = null;
  private _currentRequest: CancelTokenSource | null = null;
  public folderId: string | undefined = undefined;

  public static createOrShow(extensionUri: vscode.Uri, request?: Request) {
    const column = vscode.ViewColumn.Active;

    if (HttpClientPanel.currentPanel) {
      HttpClientPanel.currentPanel._panel.reveal(column);
      if (request) {
        HttpClientPanel.currentPanel.loadRequest(request);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'httpClient',
      'Tunder Client',
      column,
      {
        enableScripts: true,
        localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'node_modules', 'monaco-editor')
        ],
        retainContextWhenHidden: true
      }
    );

    HttpClientPanel.currentPanel = new HttpClientPanel(panel, extensionUri);
    
    if (request) {
      HttpClientPanel.currentPanel.loadRequest(request);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._currentRequest = null;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'sendRequest':
            try {
              if (this._currentRequest) {
                this._currentRequest.cancel('用户取消了请求');
                this._currentRequest = null;
              }

              const { method, url, headers, body } = message.data;
              
              const headersObj: Record<string, string> = {};
              if (Array.isArray(headers)) {
                headers.forEach(header => {
                  if (header.key && header.key.trim()) {
                    headersObj[header.key.trim()] = header.value || '';
                  }
                });
              }
              
              this._currentRequest = axios.CancelToken.source();
              
              const response = await axios({
                method,
                url,
                headers: headersObj,
                data: body ? JSON.parse(body) : undefined,
                validateStatus: () => true,
                cancelToken: this._currentRequest.token
              });
              
              this._currentRequest = null;
              
              this._panel.webview.postMessage({
                command: 'responseReceived',
                data: {
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                  data: response.data
                }
              });
            } catch (error) {
              console.error('请求出错:', error);
              
              let errorMessage = '请求失败';
              if (axios.isCancel(error)) {
                errorMessage = '请求已取消';
              } else if (error instanceof Error) {
                errorMessage = error.message;
              }
              
              this._panel.webview.postMessage({
                command: 'requestError',
                error: errorMessage
              });
            } finally {
              this._currentRequest = null;
            }
            return;

          case 'cancelRequest':
            if (this._currentRequest) {
              this._currentRequest.cancel('用户取消了请求');
              this._currentRequest = null;
            }
            return;

          case 'loadRequest':
            try {
              const { id, name, url, method, headers, body, folder_id } = message.data;
              this._panel.webview.postMessage({
                command: 'updateRequestData',
                data: {
                  id,
                  name,
                  url,
                  method,
                  headers,
                  body
                }
              });
            } catch (error) {
              console.error('加载请求数据时出错:', error);
              vscode.window.showErrorMessage('加载请求数据失败');
            }
            return;

          case 'getRequestData':
            try {
              this._panel.webview.postMessage({
                command: 'requestDataRequested'
              });
            } catch (error) {
              console.error('获取请求数据时出错:', error);
              vscode.window.showErrorMessage('获取请求数据失败');
            }
            return;

          case 'saveRequest':
            try {
              const { name, method, url, headers, body } = message.data;
              vscode.commands.executeCommand('httpClient.saveRequest', {
                name,
                method,
                url,
                headers,
                body
              });
            } catch (error) {
              console.error('保存请求数据时出错:', error);
              vscode.window.showErrorMessage('保存请求数据失败');
            }
            return;

                    case 'autoSaveRequest':
                        try {
                            // 调用自动保存命令
                            vscode.commands.executeCommand('httpClient.autoSaveRequest', message.data);
                        } catch (error) {
                            console.error('自动保存请求时出错:', error);
            }
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "Tunder Client";
    this._panel.webview.html = this._getHtmlForWebview(webview, this._extensionUri);
  }

  private _getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        // Monaco Editor URI
        const monacoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, 'node_modules', 'monaco-editor', 'min')
        );

    return `<!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; worker-src ${webview.cspSource} blob:; child-src ${webview.cspSource} blob:; font-src ${webview.cspSource} data:;">
        <title>Tunder Client</title>
        <style>
            :root {
            /* 基础变量 */
            --border-radius: 4px;
            --spacing: 12px;
            
            /* 颜色变量 - 映射VSCode主题 */
            --bg-primary: var(--vscode-editor-background);
            --bg-secondary: var(--vscode-sideBar-background);
            --bg-hover: var(--vscode-list-hoverBackground);
            --fg-primary: var(--vscode-editor-foreground);
            --fg-secondary: var(--vscode-descriptionForeground);
            --border-color: var(--vscode-panel-border);
            --input-bg: var(--vscode-input-background);
            --input-border: var(--vscode-input-border);
            --input-fg: var(--vscode-input-foreground);
            --button-bg: var(--vscode-button-background);
            --button-hover: var(--vscode-button-hoverBackground);
            --button-fg: var(--vscode-button-foreground);
            
            /* 状态颜色 */
            --status-success: #2ea043;
            --status-success-bg: rgba(35, 134, 54, 0.15);
            --status-error: #f85149;
            --status-error-bg: rgba(248, 81, 73, 0.15);
            --status-warning: #ff8c00;
            --status-info: #388bfd;
            
            /* JSON 语法高亮 */
            --json-key: #9cdcfe;
            --json-string: #ce9178;
            --json-number: #b5cea8;
            --json-boolean: #569cd6;
            --json-null: #569cd6;
        }
        
        * {
            box-sizing: border-box;
            }
            
            body {
                margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 13px;
            color: var(--fg-primary);
            background: var(--bg-primary);
            overflow: hidden;
        }
        
        /* 主容器 - 单栏布局 */
        .main-container {
            display: flex;
            flex-direction: column;
                height: 100vh;
            padding: var(--spacing);
                gap: var(--spacing);
        }
        
        /* URL 输入区 */
        .url-section {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .method-select {
            min-width: 100px;
            padding: 6px 10px;
            border: 1px solid var(--input-border);
            background: var(--input-bg);
            color: var(--input-fg);
                border-radius: var(--border-radius);
            font-size: 13px;
            cursor: pointer;
        }
        
        .url-input {
            flex: 1;
                padding: 6px 10px;
            border: 1px solid var(--input-border);
            background: var(--input-bg);
            color: var(--input-fg);
                border-radius: var(--border-radius);
                font-size: 13px;
            font-family: 'Consolas', 'Monaco', monospace;
            }
            
        .url-input:focus, .method-select:focus {
                outline: none;
            border-color: var(--button-bg);
        }
        
        .send-button {
            padding: 6px 20px;
            background: var(--button-bg);
            color: var(--button-fg);
            border: none;
            border-radius: var(--border-radius);
            font-size: 13px;
                font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .send-button:hover {
            background: var(--button-hover);
        }
        
        .send-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .send-button.loading::after {
            content: "";
            display: inline-block;
            width: 12px;
            height: 12px;
            margin-left: 8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* 保存状态指示器 */
        .save-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            padding: 4px 10px;
                border-radius: var(--border-radius);
            white-space: nowrap;
            margin-left: 12px;
            transition: all 0.2s ease;
        }
        
        .save-indicator.hidden {
            display: none;
        }
        
        .save-indicator.saved {
            color: var(--vscode-testing-iconPassed);
            background: rgba(115, 191, 105, 0.15);
        }
        
        .save-indicator.saved .icon::before {
            content: '✓';
        }
        
        .save-indicator.saving {
            color: var(--vscode-testing-iconQueued);
            background: rgba(232, 164, 52, 0.15);
        }
        
        .save-indicator.saving .icon::before {
            content: '⏳';
        }
        
        .save-indicator.unsaved {
            color: var(--vscode-descriptionForeground);
            background: var(--vscode-editor-background);
            border: 1px solid var(--border-color);
        }
        
        .save-indicator.unsaved .icon::before {
            content: '●';
            font-size: 10px;
        }
        
        .save-indicator.error {
            color: var(--vscode-testing-iconFailed);
            background: rgba(244, 71, 71, 0.15);
        }
        
        .save-indicator.error .icon::before {
            content: '✗';
        }
        
        /* 标签页容器 */
        .tabs-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
            background: var(--bg-primary);
        }
        
        .tabs-header {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            color: var(--fg-secondary);
            font-size: 13px;
            transition: all 0.2s;
        }
        
        .tab:hover {
            background: var(--bg-hover);
            color: var(--fg-primary);
        }
        
        .tab.active {
            color: var(--button-bg);
            border-bottom-color: var(--button-bg);
            background: var(--bg-primary);
        }
        
        .tab-content {
            display: none;
            flex: 1;
            overflow: auto;
            padding: var(--spacing);
        }
        
        .tab-content.active {
            display: flex;
            flex-direction: column;
        }
        
        /* Headers 表格 */
            .headers-table {
                width: 100%;
            border-collapse: collapse;
        }
        
        .headers-table thead {
            position: sticky;
            top: 0;
            background: var(--bg-secondary);
            z-index: 10;
            }
            
            .headers-table th {
                text-align: left;
                padding: 8px;
                font-weight: 500;
            font-size: 12px;
            color: var(--fg-secondary);
            border-bottom: 1px solid var(--border-color);
        }
        
        .headers-table th:first-child {
            width: 30px;
            }
            
            .headers-table td {
                padding: 4px;
            border-bottom: 1px solid var(--border-color);
            }
            
            .headers-table tr:hover {
            background: var(--bg-hover);
        }
        
        .headers-table input[type="checkbox"] {
            cursor: pointer;
            width: 16px;
            height: 16px;
        }
        
        .headers-table input[type="text"] {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid var(--input-border);
            background: var(--input-bg);
            color: var(--input-fg);
            border-radius: 3px;
            font-size: 13px;
        }
        
        .headers-table input[type="text"]:focus {
            outline: none;
            border-color: var(--button-bg);
        }
        
        .delete-btn {
                background: none;
                border: none;
            color: var(--status-error);
                cursor: pointer;
            font-size: 18px;
            padding: 0 8px;
            opacity: 0.6;
            transition: opacity 0.2s;
        }
        
        .delete-btn:hover {
            opacity: 1;
        }
        
        .add-button {
            margin-top: 8px;
            padding: 6px 12px;
                background: none;
            border: 1px solid var(--button-bg);
            color: var(--button-bg);
            border-radius: var(--border-radius);
                font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .add-button:hover {
            background: var(--button-bg);
            color: var(--button-fg);
        }
        
        /* Body 区域 */
        .body-editor {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .monaco-container {
            flex: 1;
            min-height: 300px;
            border: 1px solid var(--input-border);
                border-radius: var(--border-radius);
            overflow: hidden;
        }
        
        .format-button-legacy {
            padding: 4px 12px;
            background: none;
            border: 1px solid var(--button-bg);
            color: var(--button-bg);
                border-radius: var(--border-radius);
            font-size: 12px;
            cursor: pointer;
        }
        
        .format-button:hover {
            background: var(--button-bg);
            color: var(--button-fg);
        }
        
        /* Response 区域 */
        .response-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 12px;
        }
        
        .response-info {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-success {
            background: var(--status-success-bg);
            color: var(--status-success);
        }
        
        .status-error {
            background: var(--status-error-bg);
            color: var(--status-error);
        }
        
        .status-info {
            background: rgba(56, 139, 253, 0.15);
            color: var(--status-info);
        }
        
        .response-meta {
            font-size: 12px;
            color: var(--fg-secondary);
        }
        
        /* Copy Button */
        .copy-button {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 12px;
            background: var(--button-bg);
            color: var(--button-fg);
                border: none;
            border-radius: var(--border-radius);
                font-size: 12px;
            font-weight: 500;
                cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .copy-button:hover {
            background: var(--button-hover);
        }
        
        .copy-button.copied {
            background: var(--status-success);
            color: white;
        }
        
        .copy-button.error {
            background: var(--status-error);
            color: white;
        }
        
        .copy-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .copy-icon {
            font-size: 14px;
            line-height: 1;
        }
        
        .copy-text {
            font-size: 12px;
        }
        
        .response-body {
            flex: 1;
            min-height: 200px;
            max-height: 600px;
            overflow: auto;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: var(--border-radius);
            font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-all;
            color: var(--fg-primary);
        }
        
        /* JSON 语法高亮 */
        .json-key { color: var(--json-key); }
        .json-string { color: var(--json-string); }
        .json-number { color: var(--json-number); }
        .json-boolean { color: var(--json-boolean); }
        .json-null { color: var(--json-null); }
        
        .empty-state {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--fg-secondary);
            font-size: 14px;
            }
        </style>
    </head>
    <body>
    <div class="main-container">
        <!-- URL输入区 -->
        <div class="url-section">
            <select class="method-select" id="method">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                        <option value="HEAD">HEAD</option>
                        <option value="OPTIONS">OPTIONS</option>
                    </select>
            <input type="text" class="url-input" id="url" placeholder="Enter request URL" value="">
            <button class="send-button" id="sendBtn">Send</button>
            <div class="save-indicator hidden" id="save-indicator">
                <span class="icon"></span>
                <span class="text">已保存</span>
            </div>
                </div>

        <!-- 标签页容器 -->
        <div class="tabs-container">
            <!-- 标签页头部 -->
            <div class="tabs-header">
                <div class="tab active" data-tab="headers">Headers</div>
                <div class="tab" data-tab="body">Body</div>
                <div class="tab" data-tab="params">Params</div>
            </div>
            
            <!-- Headers 标签页 -->
            <div class="tab-content active" id="headers-tab">
                <table class="headers-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Key</th>
                            <th>Value</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="headers-body"></tbody>
                </table>
                <button class="add-button" id="add-header">+ Add</button>
            </div>
            
            <!-- Body 标签页 -->
            <div class="tab-content" id="body-tab">
                <div class="body-editor">
                    <div id="body-editor" class="monaco-container"></div>
                </div>
            </div>

            <!-- Params 标签页 -->
            <div class="tab-content" id="params-tab">
                <table class="headers-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Key</th>
                            <th>Value</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="params-body"></tbody>
                </table>
                <button class="add-button" id="add-param">+ Add</button>
                </div>
        </div>

        <!-- Response 区域 -->
        <div class="tabs-container" id="response-container" style="display: none;">
            <div class="tabs-header">
                <div class="tab active">Response</div>
                </div>
            <div class="tab-content active">
                <div class="response-header">
                    <div class="response-info">
                        <div class="status-badge" id="status-badge"></div>
                        <span class="response-meta" id="response-time"></span>
                        <span class="response-meta" id="response-size"></span>
                    </div>
                    <button class="copy-button" id="copy-response-btn" title="Copy response body">
                        <span class="copy-icon">📋</span>
                        <span class="copy-text">Copy</span>
                    </button>
                </div>
                <div class="response-body" id="response-body"></div>
            </div>
        </div>

        <script src="${monacoUri}/vs/loader.js"></script>
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
            let bodyEditor = null; // Monaco Editor 实例
            let currentRequest = null; // 当前请求对象
            let rawResponseData = null; // 原始响应数据
            
            // 防抖函数
            function debounce(func, delay) {
                let timeoutId;
                return function(...args) {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        func.apply(this, args);
                    }, delay);
                };
            }
            
            // 自动保存函数
            function autoSave() {
                // 关键判断：只有已保存的请求才自动保存
                if (!currentRequest || !currentRequest.id) {
                    console.log('[AutoSave] 跳过：新建请求不自动保存');
                    return;
                }
                
                console.log('[AutoSave] 触发自动保存:', currentRequest.id);
                updateSaveIndicator('saving');
                
                // 收集表单数据
                const requestData = {
                    id: currentRequest.id,
                    name: currentRequest.name || '',
                    url: document.getElementById('url')?.value || '',
                    method: document.getElementById('method')?.value || 'GET',
                    headers: getHeadersArray(),
                    body: bodyEditor ? bodyEditor.getValue() : ''
                };
                
                // 发送自动保存消息
                vscode.postMessage({
                    command: 'autoSaveRequest',
                    data: requestData
                });
            }
            
            // 创建防抖保存函数（500ms）
            const debouncedAutoSave = debounce(autoSave, 500);
            
            // 更新保存状态指示器
            function updateSaveIndicator(status, message) {
                const indicator = document.getElementById('save-indicator');
                if (!indicator) return;

                // 只对已保存请求显示指示器
                if (!currentRequest || !currentRequest.id) {
                    indicator.classList.add('hidden');
                    return;
                }
                
                indicator.classList.remove('hidden');
                indicator.classList.remove('saved', 'saving', 'unsaved', 'error');
                indicator.classList.add(status);

                const textEl = indicator.querySelector('.text');
                if (textEl) {
                    const statusText = {
                        saved: '已保存',
                        saving: '保存中...',
                        unsaved: '有未保存更改',
                        error: message || '保存失败'
                    };
                    textEl.textContent = statusText[status];
                }
            }
            
            // 获取 Headers 数组
            function getHeadersArray() {
                const headers = [];
                const rows = document.querySelectorAll('#headers-body tr');
                rows.forEach(row => {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    const keyInput = row.querySelector('input[name="key"]');
                    const valueInput = row.querySelector('input[name="value"]');
                    
                    if (checkbox && checkbox.checked && keyInput && valueInput) {
                        const key = keyInput.value.trim();
                        const value = valueInput.value.trim();
                        if (key || value) {
                            headers.push({ key, value });
                        }
                    }
                });
                return headers;
            }
            
            // 配置 Monaco Loader
            require.config({ 
                paths: { 'vs': '${monacoUri}/vs' },
                onError: function(err) {
                    console.error('[Monaco] Load error:', err);
                    console.error('[Monaco] Error type:', err.errorType);
                    console.error('[Monaco] Module ID:', err.moduleId);
                    alert('Monaco Editor 加载失败！\\n错误: ' + err.errorType + '\\n模块: ' + err.moduleId + '\\n\\n将使用简化编辑器。');
                    initFallbackEditor();
                }
            });
            
            // 初始化 Monaco Editor
            require(['vs/editor/editor.main'], function() {
                bodyEditor = monaco.editor.create(document.getElementById('body-editor'), {
                    value: '',
                    language: 'json',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: 'Consolas, Monaco, Courier New, monospace',
                    wordWrap: 'on',
                    formatOnPaste: true,   // ✅ 启用粘贴格式化
                    formatOnType: true,    // ✅ 启用实时格式化
                    tabSize: 2,
                    insertSpaces: true
                });
                window.bodyEditor = bodyEditor; // 全局引用
                
                // 自动格式化：粘贴时
                bodyEditor.onDidPaste(() => {
                    setTimeout(() => {
                        if (bodyEditor.getModel().getLanguageId() === 'json') {
                            try {
                                const content = bodyEditor.getValue();
                                JSON.parse(content); // 验证是否为有效 JSON
                                bodyEditor.getAction('editor.action.formatDocument').run();
                    } catch (e) {
                                // 非法 JSON，不格式化
                            }
                        }
                    }, 50);
                });
                
                // 自动格式化：失焦时
                let lastContent = '';
                bodyEditor.onDidBlurEditorText(() => {
                    const currentContent = bodyEditor.getValue();
                    if (currentContent !== lastContent && bodyEditor.getModel().getLanguageId() === 'json') {
                        try {
                            JSON.parse(currentContent); // 验证是否为有效 JSON
                            bodyEditor.getAction('editor.action.formatDocument').run();
                            lastContent = currentContent;
                        } catch (e) {
                            // 非法 JSON，不格式化
                        }
                    }
                });
                
                // 监听内容变化以更新语言模式
                bodyEditor.onDidChangeModelContent(() => {
                    updateEditorLanguage();
                });
                
                // 绑定依赖 bodyEditor 的事件（必须在 Monaco 初始化后）
                bindEditorDependentEvents();
            });
            
            // 语言检测函数
            function updateEditorLanguage() {
                if (!bodyEditor) return;
                
                const contentType = getActiveContentType();
                const body = bodyEditor.getValue();
                const lang = detectLanguage(body, contentType);
                
                if (bodyEditor.getModel().getLanguageId() !== lang) {
                    monaco.editor.setModelLanguage(bodyEditor.getModel(), lang);
                }
            }
            
            // 获取当前激活的 Content-Type
            function getActiveContentType() {
                const rows = document.querySelectorAll('#headers-body tr');
                for (const row of rows) {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    const keyInput = row.querySelector('input[name="key"]');
                    const valueInput = row.querySelector('input[name="value"]');
                    
                    if (checkbox && checkbox.checked && 
                        keyInput && keyInput.value.toLowerCase() === 'content-type' &&
                        valueInput) {
                        return valueInput.value;
                    }
                }
                return null;
            }
            
            // 语言检测逻辑
            function detectLanguage(body, contentType) {
                // 1. Content-Type 优先
                if (contentType) {
                    const ct = contentType.toLowerCase();
                    if (ct.includes('json')) return 'json';
                    if (ct.includes('xml')) return 'xml';
                    if (ct.includes('html')) return 'html';
                    if (ct.includes('javascript')) return 'javascript';
                    if (ct.includes('yaml')) return 'yaml';
                    return 'plaintext';
                }
                
                // 2. 智能检测
                if (!body || body.trim() === '') return 'json'; // 默认 JSON
                
                try {
                    JSON.parse(body);
                    return 'json';
                } catch {
                    const trimmed = body.trim();
                    if (trimmed.startsWith('<')) return 'xml';
                    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'; // 可能是未完成的 JSON
                    return 'plaintext';
                }
            }
            
            // 标签页切换
            document.querySelectorAll('.tab[data-tab]').forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    if (!tabName) return;
                    
                    // 只操作 Headers/Body 的标签页容器，不影响 Response 容器
                    const mainContainer = tab.closest('.tabs-container');
                    
                    // 只移除当前容器内的 active 状态
                    mainContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    mainContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // 添加 active 状态
                    tab.classList.add('active');
                    document.getElementById(tabName + '-tab').classList.add('active');
                    
                    // 当切换到 Body 标签页时，触发 Monaco 布局更新
                    if (tabName === 'body' && bodyEditor) {
                        setTimeout(() => bodyEditor.layout(), 100);
                    }
                    
                    // 当切换到 Params 标签页时，刷新参数列表
                    if (tabName === 'params') {
                        refreshParamsFromUrl();
                    }
                });
            });
            
            // ========== URL Params 功能 ==========
            
            // 解析 URL 参数
            function parseUrlParams(url) {
                const params = [];
                try {
                    const urlObj = new URL(url);
                    const searchParams = new URLSearchParams(urlObj.search);
                    
                    // 支持重复键
                    for (const [key, value] of searchParams.entries()) {
                        params.push({ key, value });
                    }
                    } catch (e) {
                    // URL 无效或没有参数
                }
                return params;
            }
            
            // 渲染参数表格
            function renderParams(params) {
                const tbody = document.getElementById('params-body');
                tbody.innerHTML = '';
                
                if (params.length === 0) {
                    // 显示空状态
                    const row = tbody.insertRow();
                    row.innerHTML = '<td colspan="4" style="text-align:center;color:var(--fg-secondary);padding:20px;">No parameters. Add one to get started.</td>';
                } else {
                    params.forEach((param, index) => {
                        addParamRow(param.key, param.value, index);
                    });
                }
            }
            
            // 添加参数行
            function addParamRow(key = '', value = '', index = -1) {
                const tbody = document.getElementById('params-body');
                const row = tbody.insertRow();
                row.dataset.paramIndex = index;
                row.innerHTML = \`
                    <td></td>
                    <td><input type="text" class="param-key" value="\${key}" placeholder="Key" /></td>
                    <td><input type="text" class="param-value" value="\${value}" placeholder="Value" /></td>
                    <td><button class="delete-btn">×</button></td>
                \`;
                
                // 绑定输入事件
                const keyInput = row.querySelector('.param-key');
                const valueInput = row.querySelector('.param-value');
                
                keyInput.addEventListener('input', debounceUrlUpdate);
                valueInput.addEventListener('input', debounceUrlUpdate);
                
                // 绑定删除事件
                row.querySelector('.delete-btn').addEventListener('click', () => {
                    row.remove();
                    updateUrlFromParams();
                });
            }
            
            // 从 Params 表格更新 URL
            function updateUrlFromParams() {
                const urlInput = document.getElementById('url');
                const currentUrl = urlInput.value.trim();
                
                if (!currentUrl) return;
                
                try {
                    // 解析基础 URL（不含参数）
                    const urlObj = new URL(currentUrl);
                    const baseUrl = urlObj.origin + urlObj.pathname;
                    
                    // 收集参数
                    const params = [];
                    const rows = document.querySelectorAll('#params-body tr');
                    rows.forEach(row => {
                        const keyInput = row.querySelector('.param-key');
                        const valueInput = row.querySelector('.param-value');
                        
                        if (keyInput && valueInput) {
                            const key = keyInput.value.trim();
                            const value = valueInput.value.trim();
                            if (key) {
                                params.push({ key, value });
                            }
                        }
                    });
                    
                    // 重建 URL
                    if (params.length > 0) {
                        const searchParams = new URLSearchParams();
                        params.forEach(p => searchParams.append(p.key, p.value));
                        urlInput.value = baseUrl + '?' + searchParams.toString();
                    } else {
                        urlInput.value = baseUrl;
                    }
                    
                    // 触发自动保存
                    if (currentRequest && currentRequest.id) {
                        updateSaveIndicator('unsaved');
                        debouncedAutoSave();
                    }
                } catch (e) {
                    // URL 无效，不更新
                }
            }
            
            // 防抖的 URL 更新
            const debounceUrlUpdate = debounce(updateUrlFromParams, 300);
            
            // 从 URL 刷新参数表格
            function refreshParamsFromUrl() {
                const urlInput = document.getElementById('url');
                const url = urlInput.value.trim();
                const params = parseUrlParams(url);
                renderParams(params);
            }
            
            // 监听 URL 输入变化，更新 Params 标签页
            let lastUrl = '';
            document.getElementById('url').addEventListener('input', debounce(() => {
                const currentUrl = document.getElementById('url').value;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    // 如果当前在 Params 标签页，刷新参数列表
                    const paramsTab = document.querySelector('.tab[data-tab="params"]');
                    if (paramsTab && paramsTab.classList.contains('active')) {
                        refreshParamsFromUrl();
                    }
                }
            }, 300));
            
            // 添加参数按钮
            document.getElementById('add-param').addEventListener('click', () => {
                addParamRow();
                // 聚焦到新行的 key 输入框
                const rows = document.querySelectorAll('#params-body tr');
                const lastRow = rows[rows.length - 1];
                const keyInput = lastRow?.querySelector('.param-key');
                if (keyInput) keyInput.focus();
            });
            
            // ========== End URL Params 功能 ==========
            
            // 添加 Header 行
            function addHeaderRow(key = '', value = '', enabled = true) {
                const tbody = document.getElementById('headers-body');
                const row = tbody.insertRow();
                row.innerHTML = \`
                    <td><input type="checkbox" \${enabled ? 'checked' : ''} /></td>
                    <td><input type="text" name="key" value="\${key}" placeholder="Key" /></td>
                    <td><input type="text" name="value" value="\${value}" placeholder="Value" /></td>
                    <td><button class="delete-btn">×</button></td>
                \`;
                
                row.querySelector('.delete-btn').addEventListener('click', () => row.remove());
            }
            
            document.getElementById('add-header').addEventListener('click', () => addHeaderRow());
            
            // 初始添加一行
            addHeaderRow('Content-Type', 'application/json');
            
            // 降级方案：如果 Monaco 加载失败，使用简单 textarea
            function initFallbackEditor() {
                const container = document.getElementById('body-editor');
                container.innerHTML = '<textarea id="body-fallback" style="width:100%;height:100%;padding:8px;font-family:monospace;font-size:13px;border:none;background:var(--input-bg);color:var(--input-fg);resize:none;"></textarea>';
                
                const textarea = document.getElementById('body-fallback');
                bodyEditor = {
                    getValue: () => textarea.value,
                    setValue: (v) => { textarea.value = v; },
                    getModel: () => ({ getLanguageId: () => 'json' })
                };
                window.bodyEditor = bodyEditor;
                bindEditorDependentEvents();
            }
            
            // Monaco 加载超时检测（5秒）
            setTimeout(() => {
                if (!bodyEditor) {
                    console.error('[Monaco] Load timeout! Falling back to textarea.');
                    alert('Monaco Editor 加载超时，使用简化编辑器。');
                    initFallbackEditor();
                }
            }, 5000);
            
            // 绑定依赖 bodyEditor 的事件（在 Monaco 初始化后调用）
            function bindEditorDependentEvents() {
                // 监听 URL 输入变化
                document.getElementById('url')?.addEventListener('input', () => {
                    if (currentRequest && currentRequest.id) {
                        updateSaveIndicator('unsaved');
                        debouncedAutoSave();
                    }
                });
                
                // 监听 Method 选择变化
                document.getElementById('method')?.addEventListener('change', () => {
                    if (currentRequest && currentRequest.id) {
                        updateSaveIndicator('unsaved');
                        debouncedAutoSave();
                    }
                });
                
                // 监听 Headers 表格变化（事件委托）
                document.getElementById('headers-body')?.addEventListener('input', (e) => {
                    if (e.target && (e.target.name === 'key' || e.target.name === 'value')) {
                        if (currentRequest && currentRequest.id) {
                            updateSaveIndicator('unsaved');
                            debouncedAutoSave();
                        }
                    }
                });
                
                // 监听 Headers checkbox 变化
                document.getElementById('headers-body')?.addEventListener('change', (e) => {
                    if (e.target && e.target.type === 'checkbox') {
                        if (currentRequest && currentRequest.id) {
                            updateSaveIndicator('unsaved');
                            debouncedAutoSave();
                        }
                    }
                });
                
                // 监听 Monaco Editor 内容变化
                if (bodyEditor) {
                    bodyEditor.onDidChangeModelContent(() => {
                        if (currentRequest && currentRequest.id) {
                            updateSaveIndicator('unsaved');
                            debouncedAutoSave();
                        }
                    });
                }
                
                // 发送请求
                document.getElementById('sendBtn').addEventListener('click', () => {
                    if (!bodyEditor) {
                        alert('Editor is still loading, please try again.');
                        return;
                    }
                    
                    const method = document.getElementById('method').value;
                    const url = document.getElementById('url').value;
                    const body = bodyEditor.getValue();
                        
                    const headers = [];
                    document.querySelectorAll('#headers-body tr').forEach(row => {
                        const checkbox = row.querySelector('input[type="checkbox"]');
                        const keyInput = row.querySelectorAll('input[type="text"]')[0];
                        const valueInput = row.querySelectorAll('input[type="text"]')[1];
                        
                        if (checkbox.checked && keyInput.value.trim()) {
                            headers.push({
                                key: keyInput.value.trim(),
                                value: valueInput.value.trim()
                            });
                        }
                    });
                    
                    const btn = document.getElementById('sendBtn');
                    btn.classList.add('loading');
                    btn.disabled = true;
                    
                    vscode.postMessage({
                        command: 'sendRequest',
                        data: { method, url, headers, body }
                    });
                });
                
                // 绑定复制按钮事件
                document.getElementById('copy-response-btn')?.addEventListener('click', copyResponseToClipboard);
            }
            
            // 初始化：隐藏复制按钮
            document.getElementById('copy-response-btn').style.display = 'none';

            // 格式化 JSON
            // Beautify 按钮已移除，Monaco Editor 自动格式化
            
            // 格式化 JSON 带语法高亮
            function formatJSON(obj) {
                let json = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
                    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g, (match) => {
                        let cls = 'json-number';
                        if (/^"/.test(match)) {
                        cls = /:$/.test(match) ? 'json-key' : 'json-string';
                        } else if (/true|false/.test(match)) {
                            cls = 'json-boolean';
                        } else if (/null/.test(match)) {
                            cls = 'json-null';
                        }
                    return \`<span class="\${cls}">\${match}</span>\`;
                });
            }
            
            // 复制响应到剪贴板
            async function copyResponseToClipboard() {
                const button = document.getElementById('copy-response-btn');
                const icon = button.querySelector('.copy-icon');
                const text = button.querySelector('.copy-text');
                
                if (!rawResponseData) {
                    text.textContent = 'No data';
                    setTimeout(() => text.textContent = 'Copy', 2000);
                    return;
                }
                
                // 更新按钮状态: 复制中
                button.disabled = true;
                icon.textContent = '⏳';
                text.textContent = 'Copying...';
                
                try {
                    // 复制到剪贴板
                    await navigator.clipboard.writeText(rawResponseData);
                    
                    // 更新按钮状态: 成功
                    button.classList.add('copied');
                    icon.textContent = '✓';
                    text.textContent = 'Copied!';
                    
                    // 2秒后恢复
                    setTimeout(() => {
                        button.classList.remove('copied');
                        button.disabled = false;
                        icon.textContent = '📋';
                        text.textContent = 'Copy';
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy:', err);
                    
                    // 更新按钮状态: 失败
                    button.classList.add('error');
                    icon.textContent = '✗';
                    text.textContent = 'Failed';
                    
                    // 2秒后恢复
                    setTimeout(() => {
                        button.classList.remove('error');
                        button.disabled = false;
                        icon.textContent = '📋';
                        text.textContent = 'Copy';
                    }, 2000);
                }
            }
            
            // 处理响应
                window.addEventListener('message', event => {
                    const message = event.data;
                
                if (message.command === 'responseReceived') {
                            const { status, statusText, headers, data } = message.data;
                    
                    // 存储原始响应数据
                    rawResponseData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                    
                    const btn = document.getElementById('sendBtn');
                    btn.classList.remove('loading');
                    btn.disabled = false;
                    
                    const container = document.getElementById('response-container');
                    container.style.display = 'flex';
                    
                    const badge = document.getElementById('status-badge');
                    badge.textContent = status + ' ' + statusText;
                    badge.className = 'status-badge ' + (status < 300 ? 'status-success' : status < 400 ? 'status-info' : 'status-error');
                    
                    const responseBody = document.getElementById('response-body');
                    responseBody.innerHTML = formatJSON(data);
                    
                    // 显示复制按钮
                    document.getElementById('copy-response-btn').style.display = 'inline-flex';
                    
                } else if (message.command === 'requestError') {
                    const btn = document.getElementById('sendBtn');
                    btn.classList.remove('loading');
                    btn.disabled = false;
                    
                    const container = document.getElementById('response-container');
                    container.style.display = 'flex';
                    
                    const badge = document.getElementById('status-badge');
                    badge.textContent = 'Error';
                    badge.className = 'status-badge status-error';
                    
                    const body = document.getElementById('response-body');
                    body.textContent = message.error;
                    
                } else if (message.command === 'updateRequestData') {
                    // 设置当前请求对象
                    currentRequest = message.data;
                    
                    const { method, url, headers, body } = message.data;
                    document.getElementById('method').value = method || 'GET';
                    document.getElementById('url').value = url || '';
                    if (bodyEditor) {
                        bodyEditor.setValue(body || '');
                    }
                    
                    // 刷新 Params 标签页
                    refreshParamsFromUrl();
                    
                    // 清空并重新填充 headers
                    const tbody = document.getElementById('headers-body');
                    tbody.innerHTML = '';
                    if (headers && headers.length > 0) {
                        headers.forEach(h => addHeaderRow(h.key, h.value, true));
                    } else {
                        addHeaderRow('Content-Type', 'application/json');
                    }
                    
                    // 如果是已保存请求，显示保存状态
                    if (currentRequest && currentRequest.id) {
                        updateSaveIndicator('saved');
                    } else {
                        updateSaveIndicator('unsaved');
                    }
                } else if (message.command === 'updateSaveStatus') {
                    // 处理自动保存状态更新
                    updateSaveIndicator(message.status, message.message);
                } else if (message.command === 'resetResponse') {
                    // 重置响应区域
                    const container = document.getElementById('response-container');
                    if (container) {
                        container.style.display = 'none';
                    }
                }
            });
            })();
        </script>
    </body>
</html>`;
  }

  public dispose() {
    HttpClientPanel.currentPanel = undefined;
    
    // 取消当前请求（如果有）
    if (this._currentRequest) {
      this._currentRequest.cancel('面板已关闭');
      this._currentRequest = null;
    }

    // 清理所有disposables
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * 获取当前加载的请求项
   */
  public getCurrentRequestItem(): Request | null {
    return this._currentRequestItem;
  }

  /**
   * 加载请求到面板
   */
  public loadRequest(request: Request): void {
    console.log('加载请求到面板:', request);
    
    if (!request || !request.id) {
      console.error('无效的请求对象:', request);
      vscode.window.showErrorMessage('无效的请求');
      return;
    }
    
    // 切换焦点到请求面板
    this._panel.reveal(vscode.ViewColumn.Active);
    
    // 存储当前请求对象的引用
    this._currentRequestItem = request;
    
    // 如果请求有文件夹ID，保存它
    if (request.folder_id) {
      this.folderId = request.folder_id;
    }
    
    // 转换headers格式
        let formattedHeaders: Array<{ key: string, value: string }> = [];
    if (request.headers) {
      if (Array.isArray(request.headers)) {
                formattedHeaders = request.headers as Array<{ key: string, value: string }>;
      } else {
        formattedHeaders = Object.entries(request.headers).map(([key, value]) => ({ key, value }));
      }
    }
    
    console.log('发送到webview的请求数据:', {
      id: request.id,
      name: request.name,
      url: request.url || '',
      method: request.method || 'GET',
      headers: formattedHeaders,
      body: request.body || ''
    });
    
    // 向webview发送加载请求的消息
    this._panel.webview.postMessage({
      command: 'updateRequestData',
      data: {
        id: request.id,
        name: request.name,
        url: request.url || '',
        method: request.method || 'GET',
        headers: formattedHeaders,
        body: request.body || '',
        folder_id: request.folder_id
      }
    });
    
    // 重置响应区域
    this._panel.webview.postMessage({
      command: 'resetResponse'
    });
  }
}