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

  function getTerm(): vscode.Terminal {
    if (yueTerminal === undefined) {
      return vscode.window.createTerminal({
        name: "月Runner",
      });
    }
    return yueTerminal;
  }

  let autoHideStatusButton = (fileName: string) => {
    if (fileName.endsWith(".yue")) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };

  const onEditorChanged = vscode.window.onDidChangeActiveTextEditor(
    (e: vscode.TextEditor | undefined) => {
      if (e === undefined) {
        statusBarItem.hide();
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
  if (editor !== undefined) {
    autoHideStatusButton(editor!.document.fileName);
  }

  context.subscriptions.push(
    onEditorChanged,
    onDocSaved,
    statusBarItem,
    vscode.commands.registerCommand(
      "yuescriptrunner.compile_all_and_make_love",
      () => {
        compileYueDirAndLove(getTerm());
      }
    ),
    vscode.commands.registerCommand("yuescriptrunner.compile_all", () => {
      compileYueDir(getTerm());
    }),
    vscode.commands.registerCommand("yuescriptrunner.compile", () => {
      compileYue(getTerm());
    })
  );
}

function compileYueDirAndLove(term: vscode.Terminal): void {
  if (vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage("YueRunner is unable to compile this!");
    return;
  }
  const editor = vscode.window.activeTextEditor!;
  term.show(true);
  term.sendText(`yue ${path.dirname(editor.document.fileName).replaceAll("/", "\\")}`, true);
  // Check for errors? TODO.
  term.sendText(`lovec ${path.dirname(editor.document.fileName).replaceAll("/", "\\")}`, true);
}

function compileYueDir(term: vscode.Terminal): void {
  if (vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage("YueRunner is unable to compile this!");
    return;
  }
  const editor = vscode.window.activeTextEditor!;
  term.show(true);
  term.sendText(`yue ${path.dirname(editor.document.fileName.replaceAll("/", "\\"))}`);
}

function compileYue(term: vscode.Terminal): void {
  if (vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage("YueRunner is unable to compile this!");
    return;
  }
  const editor = vscode.window.activeTextEditor!;
  term.show();
  term.sendText(`\byue ${editor.document.fileName.replaceAll("\\", "/")}`);
}

export function deactivate() {}
