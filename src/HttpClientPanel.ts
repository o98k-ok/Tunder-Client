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
        // Monaco Editor URI
        const monacoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, 'node_modules', 'monaco-editor', 'min')
        );

        return `<!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; worker-src ${webview.cspSource} blob:; child-src ${webview.cspSource} blob:;">
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
        
        .response-body {
            flex: 1;
            overflow: auto;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: var(--border-radius);
            font-family: 'Consolas', 'Monaco', monospace;
                font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-all;
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
                </div>

        <!-- 标签页容器 -->
        <div class="tabs-container">
            <!-- 标签页头部 -->
            <div class="tabs-header">
                <div class="tab active" data-tab="headers">Headers</div>
                <div class="tab" data-tab="body">Body</div>
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
                </div>
                <div class="response-body" id="response-body"></div>
            </div>
            </div>
        </div>

        <script src="${monacoUri}/vs/loader.js"></script>
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
            let bodyEditor = null; // Monaco Editor 实例
            window.bodyEditor = null; // 全局引用供调试使用
            
            console.log('[Init] Script loaded');
            console.log('[Init] Monaco URI: ${monacoUri}');
            console.log('[Init] require available:', typeof require !== 'undefined');
            
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
            console.log('[Monaco] Starting require...');
            require(['vs/editor/editor.main'], function() {
                console.log('[Monaco] Require callback invoked');
                console.log('[Monaco] monaco object:', typeof monaco);
                console.log('[Monaco] Initializing editor...');
                
                const container = document.getElementById('body-editor');
                console.log('[Monaco] Container:', container);
                
                bodyEditor = monaco.editor.create(container, {
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
                console.log('[Monaco] Editor created successfully:', bodyEditor);
                
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
                
                // ✅ 绑定依赖 bodyEditor 的事件（必须在 Monaco 初始化后）
                bindEditorDependentEvents();
                console.log('[Monaco] All events bound');
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
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    if (!tabName) return;
                    
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    tab.classList.add('active');
                    document.getElementById(tabName + '-tab').classList.add('active');
                });
            });
            
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
                console.log('[Fallback] Initializing textarea fallback...');
                const container = document.getElementById('body-editor');
                container.innerHTML = '<textarea id="body-fallback" style="width:100%;height:100%;padding:8px;font-family:monospace;font-size:13px;border:none;background:var(--input-bg);color:var(--input-fg);resize:none;"></textarea>';
                
                const textarea = document.getElementById('body-fallback');
                bodyEditor = {
                    getValue: () => textarea.value,
                    setValue: (v) => { textarea.value = v; },
                    getModel: () => ({ getLanguageId: () => 'json' })
                };
                window.bodyEditor = bodyEditor;
                
                console.log('[Fallback] Textarea editor ready');
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
            
            // ✅ 绑定依赖 bodyEditor 的事件（在 Monaco 初始化后调用）
            function bindEditorDependentEvents() {
                console.log('[Events] Binding editor-dependent events...');
                
                // 发送请求
                document.getElementById('sendBtn').addEventListener('click', () => {
                    console.log('[Send] Button clicked');
                    
                    if (!bodyEditor) {
                        console.error('[Send] Editor not initialized!');
                        alert('Editor is still loading, please try again.');
                        return;
                    }
                    
                    const method = document.getElementById('method').value;
                    const url = document.getElementById('url').value;
                    const body = bodyEditor.getValue();
                    
                    console.log('[Send] Method:', method);
                    console.log('[Send] URL:', url);
                    console.log('[Send] Body:', body);
                        
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
                    
                    console.log('[Send] Headers:', headers);
                    
                    const btn = document.getElementById('sendBtn');
                    btn.classList.add('loading');
                    btn.disabled = true;
                    
                    vscode.postMessage({
                        command: 'sendRequest',
                        data: { method, url, headers, body }
                    });
                });
                
                console.log('[Events] Send button bound');
            }

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
            
            // 处理响应
                window.addEventListener('message', event => {
                    const message = event.data;
                console.log('Received message:', message);
                
                if (message.command === 'responseReceived') {
                    const { status, statusText, headers, data } = message.data;
                    
                    console.log('Response received:', status, statusText);
                    
                    const btn = document.getElementById('sendBtn');
                    btn.classList.remove('loading');
                    btn.disabled = false;
                    
                    const container = document.getElementById('response-container');
                    container.style.display = 'flex';
                    
                    const badge = document.getElementById('status-badge');
                    badge.textContent = status + ' ' + statusText;
                    badge.className = 'status-badge ' + (status < 300 ? 'status-success' : status < 400 ? 'status-info' : 'status-error');
                    
                    const body = document.getElementById('response-body');
                    body.innerHTML = formatJSON(data);
                    
                    console.log('UI updated');
                    
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
                    const { method, url, headers, body } = message.data;
                    document.getElementById('method').value = method || 'GET';
                    document.getElementById('url').value = url || '';
                    if (bodyEditor) {
                        bodyEditor.setValue(body || '');
                    }
                    
                    // 清空并重新填充 headers
                    const tbody = document.getElementById('headers-body');
                    tbody.innerHTML = '';
                    if (headers && headers.length > 0) {
                        headers.forEach(h => addHeaderRow(h.key, h.value, true));
                    } else {
                        addHeaderRow('Content-Type', 'application/json');
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