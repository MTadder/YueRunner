import * as vscode from "vscode";
import * as path from "path";

const terminalName = "月Runner";

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

  vscode.window.terminals.forEach((term) => {
    // close any old 月Runner terminals.
    if (term.name === terminalName) {
      term.hide();
      term.sendText("exit");
      term.dispose();
    }
  });

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

function getTerminal(
  availableTerminals: readonly vscode.Terminal[]
): vscode.Terminal {
  for (let i = 0; i < availableTerminals.length; i++) {
    const term = availableTerminals[i];
    if (term.name === terminalName) {
      term.show();
      return term;
    }
  }
  const term = vscode.window.createTerminal({
    name: terminalName,
  });
  term.show();
  return term;
}
function getAddedArgs(): string {
  var args: string = "";
  const config = vscode.workspace.getConfiguration();
  if (config.get("yuescriptrunner.useMinification") ?? false) {
    args += "-m ";
  }
  const useTargetLuaVersion: string =
    config.get("yuescriptrunner.targetLuaVersion") ?? "";
  if (["5.1", "5.2", "5.3", "5.4"].includes(useTargetLuaVersion)) {
    args += "--target-version=" + useTargetLuaVersion + " ";
  } else if (useTargetLuaVersion.length !== 0) {
    vscode.window.showWarningMessage(
      "Unknown Lua version: " + useTargetLuaVersion
    );
  }
  // there is a better way to do this.
  if (config.get("yuescriptrunner.useSpacesInstead") ?? false) {
    args += "-s ";
  }
  if (config.get("yuescriptrunner.reserveComments") ?? false) {
    args += "-c ";
  }
  if (config.get("yuescriptrunner.writeLineNumbers") ?? false) {
    args += "-l ";
  }
  if (config.get("yuescriptrunner.dumpCompileTime") ?? false) {
    args += "-b ";
  }
  if ((config.get("yuescriptrunner.useImplicitReturn") ?? true) === false) {
    args += "-j ";
  }
  if (config.get("yuescriptrunner.matchLineNumbers") ?? false) {
    args += "-r ";
  }
  return args;
}
function getFileRootPath(fromFilePath: string): string {
  return path.dirname(fromFilePath.replaceAll("\\", "/"));
}
function assertTextEditor() {
  const cantCompileMessage: string = "月Runner is unable to compile this";
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
  const term = getTerminal(vscode.window.terminals);

  const config = vscode.workspace.getConfiguration();
  const loveExe = config.get("yuescriptrunner.loveExecutable") ?? "lovec";

  term.sendText(
    "\byue " + getFileRootPath(editor.document.fileName) + " " + getAddedArgs(),
    true
  );
  term.sendText(
    "\b" +
      loveExe +
      " " +
      getFileRootPath(editor.document.fileName) +
      " " +
      getAddedArgs(),
    true
  );
  // Check for errors? TODO.
}

// Also to this.
function compileYueDir(): void {
  assertTextEditor();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal(vscode.window.terminals);
  term.sendText(
    "\byue " + getFileRootPath(editor.document.fileName) + " " + getAddedArgs()
  );
}

function compileYue(): void {
  assertTextEditor();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal(vscode.window.terminals);
  term.sendText(
    "\byue " +
      editor.document.fileName.replaceAll("\\", "/") +
      " " +
      getAddedArgs()
  );
}

export function deactivate() {}
