import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  const sbi = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    32
  );
  sbi.command = "yuescriptrunner.compile";
  sbi.text = "$(zap)Compile Yuescript";

  let autoHideStatusButton = (fileName: string) => {
    if (fileName.endsWith(".yue")) {
      sbi.show();
    } else {
      sbi.hide();
    }
  };

  const onEditorChanged = vscode.window.onDidChangeActiveTextEditor(
    (e: vscode.TextEditor | undefined) => {
      if (e === undefined) {
        sbi.hide();
        return;
      } else {
        autoHideStatusButton(e!.document.fileName);
      }
    }
  );

  let editor = vscode.window.activeTextEditor;
  if (editor !== undefined) {
    autoHideStatusButton(editor!.document.fileName);
  }

  context.subscriptions.push(
    onEditorChanged,
    sbi,
    vscode.commands.registerCommand(
      "yuescriptrunner.compile_all_and_make_love",
      compileYueDirAndLove
    ),
    vscode.commands.registerCommand(
      "yuescriptrunner.compile_all",
      compileYueDir
    ),
    vscode.commands.registerCommand("yuescriptrunner.compile", compileYue)
  );
}

function getTerminal(): vscode.Terminal {
  vscode.window.terminals.forEach((term) => {
    // close all inactive 月Runner terminals
    if (term.name === "YueRunner") {
      // if (term.exitCode === undefined) {
      //   term.show();
      //   return term;
      // }
      term.hide();
      term.sendText("exit");
      term.dispose();
    }
  });
  const term = vscode.window.createTerminal({
    name: "YueRunner",
  });
  term.show();
  return term;
}

function getFileRootPath(fromFilePath: string): string {
  return path.dirname(fromFilePath.replaceAll("\\", "/"));
}
function assertTextEditor() {
  const cantCompileMessage: string =
    "$(warning)YueRunner is unable to compile this";
  if (vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage(cantCompileMessage);
    return;
  }
}

// TODO: Allow support for having a non-yue file open,
// and still be able to use this command, only if there exists
// more than 0 yuescripts in the parent directory.
function compileYueDirAndLove(): void {
  assertTextEditor();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal();
  term.sendText("\byue " + getFileRootPath(editor.document.fileName), true);
  term.sendText("\blovec " + getFileRootPath(editor.document.fileName), true);
  // Check for errors? TODO.
}

// Also to this.
function compileYueDir(): void {
  assertTextEditor();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal();
  term.sendText("\byue " + getFileRootPath(editor.document.fileName));
}

function compileYue(): void {
  assertTextEditor();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal();
  term.sendText("\byue " + editor.document.fileName.replaceAll("\\", "/"));
}

export function deactivate() {}
