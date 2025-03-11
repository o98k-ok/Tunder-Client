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
    const column = vscode.ViewColumn.Two;

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
          vscode.Uri.joinPath(extensionUri, 'media')
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
        console.log('收到来自WebView的消息:', message);
        
        switch (message.command) {
          case 'sendRequest':
            try {
              if (this._currentRequest) {
                this._currentRequest.cancel('用户取消了请求');
                this._currentRequest = null;
              }

              const { method, url, headers, body } = message.data;
              console.log('发送请求:', { method, url, headers });
              
              const headersObj: Record<string, string> = {};
              if (Array.isArray(headers)) {
                headers.forEach(header => {
                  if (header.key && header.key.trim()) {
                    headersObj[header.key.trim()] = header.value || '';
                  }
                });
              }
              
              console.log('处理后的headers:', headersObj);
              
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
              
              console.log('收到响应:', {
                status: response.status,
                statusText: response.statusText
              });
              
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
    return `<!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
        <title>Tunder Client</title>
        <style>
            :root {
                --border-radius: 6px;
                --primary-color: var(--vscode-button-background);
                --hover-color: var(--vscode-button-hoverBackground);
                --spacing: 16px;
                --section-gap: 24px;
                
                /* JSON 语法高亮颜色 */
                --json-key-color: #9cdcfe;
                --json-string-color: #ce9178;
                --json-number-color: #b5cea8;
                --json-boolean-color: #569cd6;
                --json-null-color: #569cd6;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                padding: var(--spacing);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                line-height: 1.5;
                margin: 0;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: 1fr 1fr; /* 左右布局 */
                gap: var(--section-gap);
                height: 100vh;
            }
            
            .request-section, .response-section {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
                padding: calc(var(--spacing) * 1.25);
                overflow: auto;
            }
            
            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--spacing);
                padding-bottom: var(--spacing);
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .section-header h2 {
                margin: 0;
                font-size: 1.2em;
                color: var(--vscode-editor-foreground);
            }
            
            .section-title {
                font-size: 1em;
                font-weight: 500;
                color: var(--vscode-foreground);
                margin: var(--spacing) 0 calc(var(--spacing) * 0.5);
                padding-bottom: calc(var(--spacing) * 0.5);
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .url-bar {
                display: grid;
                grid-template-columns: 120px minmax(300px, 1fr) auto;
                gap: var(--spacing);
                margin-bottom: var(--spacing);
                align-items: end;
            }
            
            .form-group {
                margin-bottom: var(--spacing);
            }
            
            label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: var(--vscode-input-foreground);
                font-size: 0.9em;
            }
            
            input, select, textarea {
                width: 100%;
                padding: 6px 10px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: var(--border-radius);
                font-size: 13px;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            
            input:focus, select:focus, textarea:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
            }
            
            select {
                appearance: none;
                padding-right: 24px;
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right 8px center;
                background-size: 12px;
            }
            
            textarea {
                min-height: 120px;
                font-family: 'Fira Code', 'Consolas', monospace;
                resize: vertical;
                tab-size: 2;
                line-height: 1.4;
            }
            
            button {
                background-color: var(--primary-color);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                height: 28px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            button:hover {
                background-color: var(--hover-color);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            button:active {
                transform: translateY(0);
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }
            
            .send-btn {
                min-width: 60px;
                justify-content: center;
                padding: 6px 8px;
                font-size: 12px;
            }
            
            .save-btn {
                min-width: 100px;
                justify-content: center;
            }
            
            .send-btn.loading {
                position: relative;
                color: transparent;
            }
            
            .send-btn.loading::after {
                content: "";
                position: absolute;
                left: 50%;
                top: 50%;
                width: 14px;
                height: 14px;
                margin: -7px 0 0 -7px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .headers-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin-bottom: var(--spacing);
                table-layout: fixed;
            }
            
            .headers-table th {
                text-align: left;
                padding: 8px;
                font-weight: 500;
                color: var(--vscode-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
                font-size: 0.9em;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .headers-table td {
                padding: 4px;
                vertical-align: middle;
            }
            
            .headers-table tr:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            
            .headers-table input {
                margin: 0;
                border-radius: var(--border-radius);
                width: 100%;
                box-sizing: border-box;
            }
            
            .key-cell {
                width: 40%;
            }
            
            .value-cell {
                width: auto;
            }
            
            .remove-header-btn {
                background: none;
                border: none;
                color: var(--vscode-errorForeground);
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 50%;
                font-size: 16px;
                line-height: 1;
                transition: background-color 0.2s;
                height: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                box-shadow: none;
            }
            
            .remove-header-btn:hover {
                background-color: var(--vscode-list-hoverBackground);
                transform: none;
                box-shadow: none;
            }
            
            .add-header-btn {
                background: none;
                border: 1px solid var(--vscode-button-background);
                color: var(--vscode-button-background);
                padding: 4px 10px;
                font-size: 12px;
                height: 24px;
                box-shadow: none;
            }
            
            .add-header-btn:hover {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                transform: none;
                box-shadow: none;
            }
            
            .response-container {
                margin-top: var(--spacing);
            }
            
            .status {
                display: inline-block;
                padding: 4px 8px;
                border-radius: var(--border-radius);
                font-weight: 500;
                margin-bottom: var(--spacing);
                font-size: 0.9em;
            }
            
            .status.success {
                background-color: rgba(35, 134, 54, 0.2);
                color: #2ea043;
            }
            
            .status.error {
                background-color: rgba(248, 81, 73, 0.2);
                color: #f85149;
            }
            
            .status.info {
                background-color: rgba(56, 139, 253, 0.2);
                color: #388bfd;
            }
            
            pre.json {
                margin: 0;
                padding: var(--spacing);
                background: var(--vscode-textBlockQuote-background);
                border-radius: var(--border-radius);
                overflow: auto;
                white-space: pre-wrap;
                font-family: 'Fira Code', 'Consolas', monospace;
            }
            
            .json-key {
                color: var(--json-key-color);
            }
            
            .json-string {
                color: var(--json-string-color);
            }
            
            .json-number {
                color: var(--json-number-color);
            }
            
            .json-boolean {
                color: var(--json-boolean-color);
            }
            
            .json-null {
                color: var(--json-null-color);
            }
            
            .clear-response-btn {
                background: none;
                border: none;
                color: var(--vscode-descriptionForeground);
                font-size: 12px;
                padding: 4px 8px;
                cursor: pointer;
                box-shadow: none;
            }
            
            .clear-response-btn:hover {
                color: var(--vscode-foreground);
                background-color: var(--vscode-list-hoverBackground);
                transform: none;
                box-shadow: none;
            }
            
            /* 添加URL高亮样式 */
            .url-highlight {
                color: var(--json-string-color);
            }
            
            .url-protocol {
                color: var(--json-key-color);
            }
            
            .url-path {
                color: var(--json-string-color);
            }
            
            .url-query {
                color: var(--json-number-color);
            }
            
            #url {
                font-family: 'Fira Code', 'Consolas', monospace;
                min-width: 300px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="request-section">
                <div class="section-header">
                    <h2>请求</h2>
                </div>
                
                <div class="url-bar">
                    <select id="method">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                        <option value="HEAD">HEAD</option>
                        <option value="OPTIONS">OPTIONS</option>
                    </select>
                    <input type="text" id="url" placeholder="https://" value="https://">
                    <button class="send-btn" id="sendRequest">发送</button>
                </div>

                <div class="section-title">请求头</div>
                <table class="headers-table">
                    <thead>
                        <tr>
                            <th class="key-cell">Key</th>
                            <th class="value-cell">Value</th>
                            <th style="width: 40px;"></th>
                        </tr>
                    </thead>
                    <tbody id="headersContainer"></tbody>
                </table>
                <button class="add-header-btn" id="addHeader">添加请求头</button>

                <div class="section-title">请求体</div>
                <div style="position: relative;">
                    <textarea id="requestBody" placeholder="请输入请求体"></textarea>
                    <button id="formatBody" style="position: absolute; right: 8px; top: 8px; padding: 4px 8px; font-size: 12px; height: 24px; background: none; border: 1px solid var(--vscode-button-background); color: var(--vscode-button-background);">格式化</button>
                </div>
            </div>

            <div class="response-section" id="responseContainer" style="display: none;">
                <div class="section-header">
                    <h2>响应</h2>
                    <button class="clear-response-btn" id="clearResponse">清除</button>
                </div>
                <div id="responseContent"></div>
            </div>
        </div>

        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                let headers = [];

                function addHeader() {
                    const headersContainer = document.getElementById('headersContainer');
                    const row = document.createElement('tr');
                    row.innerHTML = 
                        '<td class="key-cell"><input type="text" class="header-key" placeholder="Key"></td>' +
                        '<td class="value-cell"><input type="text" class="header-value" placeholder="Value"></td>' +
                        '<td><button class="remove-header-btn" onclick="window.removeHeader(this)">×</button></td>';
                    headersContainer.appendChild(row);
                }

                // 修改为window对象的方法，使其在全局可访问
                window.removeHeader = function(button) {
                    button.closest('tr').remove();
                };

                // URL高亮函数
                function highlightUrl(url) {
                    try {
                        const urlObj = new URL(url);
                        return '<span class="url-protocol">' + urlObj.protocol + '//' + '</span>' +
                               '<span class="url-path">' + urlObj.host + urlObj.pathname + '</span>' +
                               (urlObj.search ? '<span class="url-query">' + urlObj.search + '</span>' : '');
                    } catch (e) {
                        return url;
                    }
                }

                // 监听URL输入框变化
                const urlInput = document.getElementById('url');
                urlInput.addEventListener('input', function() {
                    const url = this.value;
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        try {
                            new URL(url); // 验证URL是否有效
                            this.classList.add('url-highlight');
                        } catch (e) {
                            this.classList.remove('url-highlight');
                        }
                    } else {
                        this.classList.remove('url-highlight');
                    }
                });

                function getRequestData() {
                    const method = document.getElementById('method').value;
                    const url = document.getElementById('url').value;
                    const body = document.getElementById('requestBody').value;
                    
                    const headers = [];
                    document.querySelectorAll('#headersContainer tr').forEach(row => {
                        const key = row.querySelector('.header-key').value.trim();
                        const value = row.querySelector('.header-value').value.trim();
                        if (key) {
                            headers.push({ key, value });
                        }
                    });

                    return { method, url, headers, body };
                }

                function updateRequestData(data) {
                    const { method, url, headers, body } = data;
                    document.getElementById('method').value = method;
                    document.getElementById('url').value = url;
                    document.getElementById('requestBody').value = body || '';
                    
                    const headersContainer = document.getElementById('headersContainer');
                    headersContainer.innerHTML = '';
                    
                    if (Array.isArray(headers)) {
                        headers.forEach(header => {
                            const row = document.createElement('tr');
                            const keyValue = header.key || '';
                            const valueValue = header.value || '';
                            row.innerHTML = 
                                '<td class="key-cell"><input type="text" class="header-key" value="' + keyValue + '" placeholder="Key"></td>' + 
                                '<td class="value-cell"><input type="text" class="header-value" value="' + valueValue + '" placeholder="Value"></td>' + 
                                '<td><button class="remove-header-btn" onclick="removeHeader(this)">×</button></td>';
                            headersContainer.appendChild(row);
                        });
                    }
                }
                
                // 格式化JSON并添加语法高亮
                function formatJSON(json) {
                    if (typeof json !== 'string') {
                        json = JSON.stringify(json, null, 2);
                    }
                    
                    // 转义HTML特殊字符
                    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    
                    // 添加语法高亮
                    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                        let cls = 'json-number';
                        if (/^"/.test(match)) {
                            if (/:$/.test(match)) {
                                cls = 'json-key';
                                // 移除末尾的冒号
                                match = match.replace(/:$/, '') + ':';
                            } else {
                                cls = 'json-string';
                            }
                        } else if (/true|false/.test(match)) {
                            cls = 'json-boolean';
                        } else if (/null/.test(match)) {
                            cls = 'json-null';
                        }
                        
                        // 对于键，添加特殊格式
                        if (cls === 'json-key') {
                            return '<span class="' + cls + '">' + match.substring(0, match.length - 1) + '</span>:';
                        }
                        
                        return '<span class="' + cls + '">' + match + '</span>';
                    });
                }

                // 重置响应区域
                function resetResponse() {
                    const responseContainer = document.getElementById('responseContainer');
                    const responseContent = document.getElementById('responseContent');
                    responseContainer.style.display = 'none';
                    responseContent.innerHTML = '';
                }

                document.getElementById('addHeader').addEventListener('click', addHeader);
                
                document.getElementById('clearResponse').addEventListener('click', resetResponse);

                document.getElementById('sendRequest').addEventListener('click', () => {
                    const sendButton = document.getElementById('sendRequest');
                    sendButton.classList.add('loading');
                    sendButton.disabled = true;

                    const requestData = getRequestData();
                    vscode.postMessage({
                        command: 'sendRequest',
                        data: requestData
                    });
                });

                // 监听来自扩展的消息
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateRequestData':
                            updateRequestData(message.data);
                            break;

                        case 'resetResponse':
                            resetResponse();
                            break;

                        case 'requestDataRequested':
                            const requestData = getRequestData();
                            vscode.postMessage({
                                command: 'saveRequest',
                                data: requestData
                            });
                            break;

                        case 'responseReceived':
                            const responseContainer = document.getElementById('responseContainer');
                            const responseContent = document.getElementById('responseContent');
                            responseContainer.style.display = 'block';

                            const { status, statusText, headers, data } = message.data;
                            let statusClass = 'info';
                            if (status >= 200 && status < 300) {
                                statusClass = 'success';
                            } else if (status >= 400) {
                                statusClass = 'error';
                            }

                            const statusStr = status + ' ' + statusText;
                            const headersStr = formatJSON(headers);
                            const dataStr = typeof data === 'object' ? formatJSON(data) : data;
                            
                            // 重置按钮状态
                            const sendButton = document.getElementById('sendRequest');
                            if (sendButton) {
                                sendButton.classList.remove('loading');
                                sendButton.disabled = false;
                                sendButton.style.display = 'inline-block';
                            }
                            
                            responseContent.innerHTML = 
                                '<div class="status ' + statusClass + '">' + statusStr + '</div>' +
                                '<div class="section-title">响应头</div>' +
                                '<pre class="json">' + headersStr + '</pre>' +
                                '<div class="section-title">响应体</div>' +
                                '<pre class="json">' + dataStr + '</pre>';
                            break;

                        case 'requestError':
                            const errorContainer = document.getElementById('responseContainer');
                            const errorContent = document.getElementById('responseContent');
                            errorContainer.style.display = 'block';
                            const errorMessage = message.error || 'Unknown error';
                            errorContent.innerHTML = 
                                '<div class="status error">' + errorMessage + '</div>';
                            
                            // 重置按钮状态
                            const errorSendButton = document.getElementById('sendRequest');
                            if (errorSendButton) {
                                errorSendButton.classList.remove('loading');
                                errorSendButton.disabled = false;
                            }
                            break;
                    }
                });

                // 添加键盘快捷键
                document.addEventListener('keydown', event => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                        event.preventDefault();
                        saveCurrentRequest();
                    }
                });

                // 保存当前请求的函数
                function saveCurrentRequest() {
                    const requestData = getRequestData();
                    
                    if (!requestData.url) {
                        alert('请输入URL');
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'saveRequest',
                        data: requestData
                    });
                }

                // 格式化请求体
                document.getElementById('formatBody').addEventListener('click', () => {
                    const textarea = document.getElementById('requestBody');
                    try {
                        const json = JSON.parse(textarea.value);
                        textarea.value = JSON.stringify(json, null, 2);
                    } catch (e) {
                        // 如果不是有效的 JSON，保持原样
                        console.error('Invalid JSON:', e);
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
    
    // 存储当前请求对象的引用
    this._currentRequestItem = request;
    
    // 如果请求有文件夹ID，保存它
    if (request.folder_id) {
      this.folderId = request.folder_id;
    }
    
    // 转换headers格式
    let formattedHeaders: Array<{key: string, value: string}> = [];
    if (request.headers) {
      if (Array.isArray(request.headers)) {
        formattedHeaders = request.headers as Array<{key: string, value: string}>;
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