import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let compile_command = vscode.commands.registerCommand(
    "yuerunner.compile",
    () => {
      compileYue();
    }
  );

  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );

  let autoHide = (fileName: string) => {
    if (fileName.endsWith(".yue")) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };

  const onEditorChanged = vscode.window.onDidChangeActiveTextEditor(
    (e: vscode.TextEditor | undefined) => {
      if (e === null) {
        return;
      } else {
        autoHide(e!.document.fileName);
      }
    }
  );

  const onDocSaved = vscode.workspace.onDidSaveTextDocument(
    (e: vscode.TextDocument) => {
      autoHide(e.fileName);
    }
  );

  statusBarItem.command = "yuescriptrunner.compile";
  statusBarItem.text = "$(zap)Compile Yuescript";
  let editor = vscode.window.activeTextEditor;
  if (editor !== null) {
    autoHide(editor!.document.fileName);
  }

  context.subscriptions.push(
    onEditorChanged,
    onDocSaved,
    statusBarItem,
    compile_command
  );
}

function getCurrentFilePath(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found");
    return "";
  }
  const document = editor.document;
  return document.fileName;
}

function compileYue() {
  const file_path = getCurrentFilePath();
  if (!file_path.endsWith(".yue")) {
    vscode.window.showErrorMessage("this file is not a .yue!");
    return;
  }
  const terminal = vscode.window.createTerminal({
    name: "Yue Compiler",
    shellPath: "yue",
    shellArgs: [file_path],
  });
  terminal.show();
  terminal.sendText(`yue ${file_path}`);
}

export function deactivate() {}
