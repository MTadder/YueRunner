import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let compile_command = vscode.commands.registerCommand(
    "yuescriptrunner.compile", compileYue
  );
  let compile_dir_command = vscode.commands.registerCommand(
    "yuescriptrunner.compile_directory", compileYueDir // do yue .
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
    compile_command,
    compile_dir_command
  );
}

function compileYueDir() {
  vscode.window.showErrorMessage("Not supported yet. Check back tomorrow.");
  return;
  const editor = vscode.window.activeTextEditor;
  if (!editor === null) {
    vscode.window.showErrorMessage("No active editor found");
    return;
  }
  //vscode.workspace.getWorkspaceFolder()?.uri
}

function compileYue() {
  const editor = vscode.window.activeTextEditor;
  if (editor === null) {
    vscode.window.showErrorMessage("No active editor found");
    return;
  }
  if (!editor!.document.fileName.endsWith(".yue")) {
    vscode.window.showErrorMessage("this file is not a .yue!");
    return;
  }
  const terminal = vscode.window.createTerminal({
    name: "Yue Compiler",
    shellPath: "yue",
    shellArgs: [editor!.document.fileName],
  });
  terminal.show();
  terminal.sendText(`yue ${editor!.document.fileName}`);
}

export function deactivate() {}
