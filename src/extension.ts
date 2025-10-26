import * as vscode from "vscode";
import * as path from "path";
/**
 *
 */
const terminalName = "YueRunner";
/**
 *
 */
const defaultLuaVersion = "5.4";
/**
 *
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  /**
   * Status Bar Item for ease of compilation
   */
  const sbi = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    32
  );
  sbi.tooltip = "Compile";
  sbi.command = "yuescriptrunner.compile";
  /**
   * Programmatically shows, or hides the Status Bar Item,
   * based upon the provided file extension.
   * @param fileName
   */
  const autoHideStatusButton = (fileName: string): void => {
    if (fileName.endsWith(".yue")) {
      sbi.show();
    } else {
      sbi.hide();
      return;
    }
  };
  /**
   * Updates the Status Bar Item based on configuration settings.
   */
  const updateStatusBarItem = (): void => {
    const config = vscode.workspace.getConfiguration();
    const operation: string =
      config.get("yuescriptrunner.defaultAction") ?? "Compile";
    const icon_only: boolean = config.get("yuescriptrunner.iconOnly") ?? false;
    const e_zap = "$(zap)";
    const e_run = "$(run)";
    const e_all = "$(run-all)";
    switch (operation) {
      case "Run":
        sbi.text = icon_only ? e_run : e_run + "Run Yuescript";
        sbi.command = "yuescriptrunner.run";
        break;
      case "Compile":
        sbi.text = icon_only ? e_zap : e_zap + "Compile Yuescript";
        sbi.command = "yuescriptrunner.compile";
        break;
      case "Compile all":
        sbi.text = icon_only ? e_zap : e_zap + "Compile all Yuescripts";
        sbi.command = "yuescriptrunner.compile_all";
        break;
      case "Compile all and Run LÖVE":
        sbi.text = icon_only ? e_all : e_all + "Compile all & Run LÖVE";
        sbi.command = "yuescriptrunner.compile_all_and_run_love";
        break;
      default:
        break;
    }
    sbi.tooltip = operation;
    
    // Ensure the button is visible if a yuescript file is active
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName.endsWith(".yue")) {
      sbi.show();
    }
  };

  /**
   * Changes Status Bar Item properties based upon the currently
   * selected extension settings.
   */
  const onConfigChanged = vscode.workspace.onDidChangeConfiguration(() => {
    updateStatusBarItem();
  });
  /**
   * Shows or hides the Status Bar Item, based upon the currently active
   * Text Editor.
   */
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
  // Initialize the status bar item
  updateStatusBarItem();
  const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  if (editor !== undefined) {
    autoHideStatusButton(editor!.document.fileName);
  }
  // Close old terminals
  vscode.window.terminals.forEach((term) => {
    if (term.name === terminalName) {
      term.hide();
      term.sendText("exit");
      term.dispose();
    }
  });
  context.subscriptions.push(
    onConfigChanged,
    onEditorChanged,
    sbi,
    vscode.commands.registerCommand(
      "yuescriptrunner.compile_all_and_run_love",
      compileYueDirAndLove
    ),
    vscode.commands.registerCommand(
      "yuescriptrunner.compile_all",
      compileYueDir
    ),
    vscode.commands.registerCommand("yuescriptrunner.compile", compileYue),
    vscode.commands.registerCommand("yuescriptrunner.run", executeYue)
  );
}
/**
 * Saves the active document if auto-save is enabled.
 */
async function autoSaveDocument(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const autoSave: boolean = config.get("yuescriptrunner.autoSaveBeforeRun") ?? true;
  
  if (autoSave && vscode.window.activeTextEditor?.document.isDirty) {
    await vscode.window.activeTextEditor.document.save();
  }
}
/**
 * Clears the terminal if the option is enabled.
 * @param term Terminal to clear
 */
function clearTerminalIfEnabled(term: vscode.Terminal): void {
  const config = vscode.workspace.getConfiguration();
  const shouldClear: boolean = config.get("yuescriptrunner.clearTerminalBeforeRun") ?? false;
  
  if (shouldClear) {
    term.sendText("clear", true);
  }
}
/**
 * Returns the current YuescriptRunner Terminal.
 * If ones does not exist, then one is immidiately instantiated.
 * @param available array of currently available terminals
 * @returns
 */
function getTerminal(available: readonly vscode.Terminal[]): vscode.Terminal {
  for (let i = 0; i < available.length; i++) {
    const term = available[i];
    if (term.name === terminalName) {
      term.show(true);
      return term;
    }
  }
  const term = vscode.window.createTerminal({
    name: terminalName,
  });
  term.show(true);
  return term;
}
/**
 * Returns the optionally-chosen arguments, each incrementally appended.
 * @returns arguments
 */
function getAddedArgs(): string {
  var args: string = "";
  const config = vscode.workspace.getConfiguration();
  if (config.get("yuescriptrunner.useMinification") ?? false) {
    args += "-m ";
  }
  if (config.get("yuescriptrunner.dumpGlobals") ?? false) {
    args += "-g ";
  }
  if (config.get("yuescriptrunner.dumpToStdout")) {
    args += "-p ";
  }
  const useTargetLuaVersion: string =
    config.get("yuescriptrunner.targetLuaVersion") ?? "";
  if (useTargetLuaVersion !== defaultLuaVersion) {
    args += "--target-version=" + useTargetLuaVersion + " ";
  }
  // append the options, incrementally.
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
/**
 * Returns a file path's parent directory, as a string.
 * @param file_path path to a file within a folder
 * @returns the parent directory of the file
 */
function getFileRootPath(file_path: string): string {
  return path.dirname(file_path.replaceAll("\\", "/"));
}
function focusActiveDocument(config: vscode.WorkspaceConfiguration): void {
  if ((config.get("yuescriptrunner.reFocusDocument") ?? false) === false) {
    return;
  }
  // Re-focus the current text doc.
  const doc: vscode.TextDocument | undefined =
    vscode.window.activeTextEditor?.document;
  if (doc !== undefined) {
    vscode.window.showTextDocument(doc, undefined, false);
  }
}
/**
 * Asserts that the user has an active Text Editor, and
 * throws a visual warning when one cannot be obtained.
 */
function assertTextEditor(): void {
  const err_message: string = terminalName + " is unable to compile this";
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
/**
 * Compiles the currently open Yuescript, and then executes the
 * LOVE executable.
 */
async function compileYueDirAndLove(): Promise<void> {
  assertTextEditor();
  await autoSaveDocument();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  const config = vscode.workspace.getConfiguration();
  term.sendText(
    "\byue " + getFileRootPath(editor.document.fileName) + " " + getAddedArgs(),
    true
  );
  term.sendText(
    "\b" +
      ((config.get("yuescriptrunner.loveExecutable") as string) ?? "lovec") +
      " " +
      getFileRootPath(editor.document.fileName) +
      " " +
      getAddedArgs(),
    true
  );
  // Check for errors? TODO.
  focusActiveDocument(config);
}
/**
 * Compiles all scripts in the currently open Yuescript's root
 * directory, if any.
 */
async function compileYueDir(): Promise<void> {
  assertTextEditor();
  await autoSaveDocument();
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  term.sendText(
    "\byue " +
      getFileRootPath(vscode.window.activeTextEditor!.document.fileName) +
      " " +
      getAddedArgs()
  );
  focusActiveDocument(vscode.workspace.getConfiguration());
}
/**
 * Compiles the currently open Yuescript, if any.
 */
async function compileYue(): Promise<void> {
  assertTextEditor();
  await autoSaveDocument();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  term.sendText(
    "\byue " +
      editor.document.fileName.replaceAll("\\", "/") +
      " " +
      getAddedArgs()
  );
  focusActiveDocument(vscode.workspace.getConfiguration());
  
  // Show notification if enabled
  const config = vscode.workspace.getConfiguration();
  if (config.get("yuescriptrunner.showNotifications") ?? false) {
    vscode.window.showInformationMessage("Yuescript compiled successfully");
  }
}
/**
 * Executes the currently open Yuescript, if any.
 */
async function executeYue(): Promise<void> {
  assertTextEditor();
  await autoSaveDocument();
  const editor = vscode.window.activeTextEditor!;
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  term.sendText(
    "\byue -e " + editor.document.fileName.replaceAll("\\", "/")
  );
  focusActiveDocument(vscode.workspace.getConfiguration());
}
/**
 * ??
 */
export function deactivate() {}
