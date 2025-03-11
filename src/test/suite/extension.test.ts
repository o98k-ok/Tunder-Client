import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('开始运行测试。');

  test('插件应该已注册命令', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('vscode-http-client.start'));
  });
}); 