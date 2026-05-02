import * as vscode from "vscode";
import * as path from "path";
/**
 *
 */
const terminalName = "YueRunner";
const yueExtension = ".yue";
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
    if (fileName.endsWith(yueExtension)) {
      sbi.show();
    } else {
      sbi.hide();
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
        sbi.text = icon_only ? e_run : `${e_run} Run Yuescript`;
        sbi.command = "yuescriptrunner.run";
        break;
      case "Compile":
        sbi.text = icon_only ? e_zap : `${e_zap} Compile Yuescript`;
        sbi.command = "yuescriptrunner.compile";
        break;
      case "Compile all":
        sbi.text = icon_only ? e_zap : `${e_zap} Compile all Yuescripts`;
        sbi.command = "yuescriptrunner.compile_all";
        break;
      case "Compile all and Run LÖVE":
        sbi.text = icon_only ? e_all : `${e_all} Compile all & Run LÖVE`;
        sbi.command = "yuescriptrunner.compile_all_and_run_love";
        break;
      default:
        break;
    }
    sbi.tooltip = operation;

    // Ensure the button is visible if a yuescript file is active
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.fileName.endsWith(yueExtension)) {
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
        autoHideStatusButton(e.document.fileName);
      }
    }
  );
  // Initialize the status bar item
  updateStatusBarItem();
  const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  if (editor !== undefined) {
    autoHideStatusButton(editor.document.fileName);
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
 * Shows a success notification if enabled in configuration.
 * @param message The message to show
 */
function showNotificationIfEnabled(message: string): void {
  const config = vscode.workspace.getConfiguration();
  if (config.get("yuescriptrunner.showNotifications") ?? false) {
    vscode.window.showInformationMessage(message);
  }
}
/**
 * Saves the active document if auto-save is enabled.
 */
async function autoSaveDocument(document: vscode.TextDocument): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const autoSave: boolean = config.get("yuescriptrunner.autoSaveBeforeRun") ?? true;

  if (autoSave && document.isDirty) {
    await document.save();
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
    term.sendText(process.platform === "win32" ? "cls" : "clear", true);
  }
}
/**
 * Returns the current YuescriptRunner Terminal.
 * If one does not exist, then one is immediately instantiated.
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
function getAddedArgs(): string[] {
  const args: string[] = [];
  const config = vscode.workspace.getConfiguration();
  if (config.get("yuescriptrunner.useMinification") ?? false) {
    args.push("-m");
  }
  if (config.get("yuescriptrunner.dumpGlobals") ?? false) {
    args.push("-g");
  }
  if (config.get("yuescriptrunner.dumpToStdout")) {
    args.push("-p");
  }
  const useTargetLuaVersion: string =
    config.get("yuescriptrunner.targetLuaVersion") ?? "";
  if (useTargetLuaVersion !== defaultLuaVersion) {
    args.push(`--target-version=${useTargetLuaVersion}`);
  }
  // append the options, incrementally.
  if (config.get("yuescriptrunner.useSpacesInstead") ?? false) {
    args.push("-s");
  }
  if (config.get("yuescriptrunner.reserveComments") ?? false) {
    args.push("-c");
  }
  if (config.get("yuescriptrunner.writeLineNumbers") ?? false) {
    args.push("-l");
  }
  if (config.get("yuescriptrunner.dumpCompileTime") ?? false) {
    args.push("-b");
  }
  if ((config.get("yuescriptrunner.useImplicitReturn") ?? true) === false) {
    args.push("-j");
  }
  if (config.get("yuescriptrunner.matchLineNumbers") ?? false) {
    args.push("-r");
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
function escapeTerminalArg(arg: string): string | undefined {
  if (/[\r\n]/.test(arg)) {
    return undefined;
  }

  if (process.platform === "win32") {
    return `"${arg.replace(/"/g, `""`).replace(/%/g, "%%")}"`;
  }

  return `'${arg.replace(/'/g, `'\\''`)}'`;
}
function buildTerminalCommand(command: string, args: string[]): string | undefined {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(command)) {
    vscode.window.showErrorMessage(`${terminalName} blocked an unsafe terminal command.`);
    return undefined;
  }

  const escapedArgs = args.map(escapeTerminalArg);
  if (escapedArgs.some((arg) => arg === undefined)) {
    vscode.window.showErrorMessage(
      `${terminalName} blocked an unsafe terminal argument.`
    );
    return undefined;
  }

  return [command, ...escapedArgs].join(" ");
}
function runTerminalCommand(
  term: vscode.Terminal,
  command: string,
  args: string[]
): void {
  const terminalCommand = buildTerminalCommand(command, args);
  if (terminalCommand === undefined) {
    return;
  }

  term.sendText(terminalCommand, true);
}
function runTerminalCommandOnSuccess(
  term: vscode.Terminal,
  firstCommand: string,
  firstArgs: string[],
  secondCommand: string,
  secondArgs: string[]
): void {
  const first = buildTerminalCommand(firstCommand, firstArgs);
  const second = buildTerminalCommand(secondCommand, secondArgs);
  if (first === undefined || second === undefined) {
    return;
  }

  term.sendText(`${first} && ${second}`, true);
}
function getActiveYueEditor(): vscode.TextEditor | undefined {
  const editor = vscode.window.activeTextEditor;

  if (editor === undefined) {
    vscode.window.showErrorMessage(`${terminalName} could not find an active editor.`);
    return undefined;
  }

  if (!editor.document.fileName.endsWith(yueExtension)) {
    vscode.window.showErrorMessage(
      `${terminalName} commands only work for ${yueExtension} files.`
    );
    return undefined;
  }

  return editor;
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
  const editor = getActiveYueEditor();
  if (editor === undefined) {
    return;
  }
  await autoSaveDocument(editor.document);
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  const config = vscode.workspace.getConfiguration();
  runTerminalCommandOnSuccess(
    term,
    "yue",
    [getFileRootPath(editor.document.fileName), ...getAddedArgs()],
    config.get("yuescriptrunner.loveExecutable") ?? "lovec",
    [getFileRootPath(editor.document.fileName)]
  );
  focusActiveDocument(config);
  showNotificationIfEnabled("All Yuescripts compiled and LÖVE started");
}
/**
 * Compiles all scripts in the currently open Yuescript's root
 * directory, if any.
 */
async function compileYueDir(): Promise<void> {
  const editor = getActiveYueEditor();
  if (editor === undefined) {
    return;
  }
  await autoSaveDocument(editor.document);
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  runTerminalCommand(term, "yue", [
    getFileRootPath(editor.document.fileName),
    ...getAddedArgs(),
  ]);
  focusActiveDocument(vscode.workspace.getConfiguration());
  showNotificationIfEnabled("All Yuescripts compiled successfully");
}
/**
 * Compiles the currently open Yuescript, if any.
 */
async function compileYue(): Promise<void> {
  const editor = getActiveYueEditor();
  if (editor === undefined) {
    return;
  }
  await autoSaveDocument(editor.document);
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  runTerminalCommand(term, "yue", [
    editor.document.fileName.replaceAll("\\", "/"),
    ...getAddedArgs(),
  ]);
  focusActiveDocument(vscode.workspace.getConfiguration());
  showNotificationIfEnabled("Yuescript compiled successfully");
}
/**
 * Executes the currently open Yuescript, if any.
 */
async function executeYue(): Promise<void> {
  const editor = getActiveYueEditor();
  if (editor === undefined) {
    return;
  }
  await autoSaveDocument(editor.document);
  const term = getTerminal(vscode.window.terminals);
  clearTerminalIfEnabled(term);
  runTerminalCommand(term, "yue", [
    "-e",
    editor.document.fileName.replaceAll("\\", "/"),
  ]);
  focusActiveDocument(vscode.workspace.getConfiguration());
}
/**
 * ??
 */
export function deactivate() {}
