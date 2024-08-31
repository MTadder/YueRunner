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
    // close old terminals.
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
  available: readonly vscode.Terminal[]
): vscode.Terminal {
  for (let i = 0; i < available.length; i++) {
    const term = available[i];
    if (term.name === terminalName) {
      term.show();
      return term;
    }
  }
  const term = vscode.window.createTerminal({ name: terminalName });
  term.show();
  return term;
}
function getAddedArgs(): string {
  var args: string = "";
  const config = vscode.workspace.getConfiguration();
  if (config.get("yuescriptrunner.useMinification") ?? false) {
    args += "-m ";
  }
  if (config.get("yuescriptrunner.dumpGlobals") ?? false) {
    args += "-g ";
  }
  if (config.get("yuescriptrunner.stdout")) {
    args += "-p ";
  }
  const useTargetLuaVersion: string =
    config.get("yuescriptrunner.targetLuaVersion") ?? "";
  if (useTargetLuaVersion !== "") {
    args += "--target-version=" + useTargetLuaVersion + " ";
  }
  // there is a better way to do this. hmmm...
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
function getFileRootPath(file_path: string): string {
  return path.dirname(file_path.replaceAll("\\", "/"));
}
function assertTextEditor() {
  const err_message: string = terminalName+" is unable to compile this";
  if (vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage(err_message);
    return;
  }
}
// TODO: Allow support for having a non-yue file open,
// and still be able to use this command, only if there exists
// more than 0 yuescripts in the parent directory.
// TODO: Also, there should be an option for only running LOVE,
// optionally skipping the compilation step.
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
