import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    256
  );

  vscode.window.terminals.forEach((term) => {
    // close all old terminals
    if (term.name === "月Runner") {
      term.hide();
      term.dispose();
    }
  });

  const yueTerminal = vscode.window.createTerminal({
    name: "月Runner",
  });

  let autoHideStatusButton = (fileName: string) => {
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
        autoHideStatusButton(e!.document.fileName);
      }
    }
  );

  const onDocSaved = vscode.workspace.onDidSaveTextDocument(
    (e: vscode.TextDocument) => {
      autoHideStatusButton(e.fileName);
    }
  );

  statusBarItem.command = "yuescriptrunner.compile";
  statusBarItem.text = "$(zap)Compile Yuescript";
  let editor = vscode.window.activeTextEditor;
  if (editor !== null) {
    autoHideStatusButton(editor!.document.fileName);
  }

  context.subscriptions.push(
    onEditorChanged,
    onDocSaved,
    statusBarItem,
    vscode.commands.registerCommand(
      "yuescriptrunner.compile_all_and_make_love",
      () => {
        compileYueDirAndLove(yueTerminal);
      }
    ),
    vscode.commands.registerCommand("yuescriptrunner.compile_all", () => {
      compileYueDir(yueTerminal);
    }),
    vscode.commands.registerCommand("yuescriptrunner.compile", () => {
      compileYue(yueTerminal);
    })
  );
}

function compileYueDirAndLove(term: vscode.Terminal): void {
  const editor = vscode.window.activeTextEditor!;
  term.show(true);
  term.sendText(`yue ${path.dirname(editor.document.fileName)}`, true);
  // Check for errors? TODO.
  term.sendText(`lovec ${path.dirname(editor.document.fileName)}`, true);
}

function compileYueDir(term: vscode.Terminal): void {
  const editor = vscode.window.activeTextEditor!;
  term.show(true);
  term.sendText(`yue ${path.dirname(editor.document.fileName)}`);
}

function compileYue(term: vscode.Terminal): void {
  const editor = vscode.window.activeTextEditor!;
  term.show();
  term.sendText(`yue ${editor.document.fileName}`);
}

export function deactivate() {}
