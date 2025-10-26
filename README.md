# YueRunner

<center>
<img src="logo.png" width=64 height=64>

![GitHub last commit](https://img.shields.io/github/last-commit/MTadder/YueRunner?style=flat-square)
![GitHub Tag](https://img.shields.io/github/v/tag/MTadder/YueRunner?style=flat-square)
![GitHub Repo code size in bytes](https://img.shields.io/github/languages/code-size/MTadder/YueRunner?style=flat-square)
![GitHub Repo size](https://img.shields.io/github/repo-size/MTadder/YueRunner?style=flat-square)
![GitHub Repo stars](https://img.shields.io/github/stars/MTadder/YueRunner?style=flat-square)

</center>

## Features

Provides palette commands and a convenient status bar button for compiling and running Yuescript files.

**New in v0.4.0:**
- Fixed status bar button visibility issue - button now appears immediately when opening Yuescript files
- Auto-save before compile/run (configurable)
- Success notifications on compilation (optional)
- Clear terminal before running commands (optional)
- Improved configuration descriptions with helpful context

### Commands

> Open your command palette with `CTRL` + `SHIFT` + `P`

- `Run this Yuescript`
- `Compile this Yuescript`
- `Compile all Yuescripts (in this directory)`
- `Compile all Yuescripts & Run LOVE2D (in this directory)`

## Requirements

- Install [`yuescript`](https://yuescript.org)

- Ensure that `yue` is visible within your `PATH`.

- If you want [`LÖVE2D`](https://love2d.org) support, [install it](https://github.com/love2d/love/releases/latest), and add it to your `PATH`.

## Extension Settings

This extension contributes the following settings:

### Compilation Options

- `yuescriptrunner.targetLuaVersion` - Select the Lua version to target for compilation (5.1, 5.2, 5.3, or 5.4)
- `yuescriptrunner.useMinification` - Enable code minification to reduce output size
- `yuescriptrunner.useSpacesInstead` - Use spaces instead of tabs for indentation
- `yuescriptrunner.reserveComments` - Preserve comments from source in compiled output
- `yuescriptrunner.writeLineNumbers` - Include line number information for debugging
- `yuescriptrunner.useImplicitReturn` - Automatically add return statement for last expression
- `yuescriptrunner.matchLineNumbers` - Maintain same line numbers as source file

### Debug and Output Options

- `yuescriptrunner.dumpGlobals` - Output list of global variables with their locations
- `yuescriptrunner.dumpToStdout` - Print compiled code to terminal instead of file
- `yuescriptrunner.dumpCompileTime` - Display compilation time in terminal

### UI and Behavior Options

- `yuescriptrunner.defaultAction` - Choose the default action for the status bar button
- `yuescriptrunner.iconOnly` - Show only icon on status bar button (saves space)
- `yuescriptrunner.reFocusDocument` - Return focus to editor after running commands
- `yuescriptrunner.autoSaveBeforeRun` - Automatically save file before compiling/running
- `yuescriptrunner.showNotifications` - Show success notifications on compilation
- `yuescriptrunner.clearTerminalBeforeRun` - Clear terminal before running commands

### LÖVE2D Options

- `yuescriptrunner.loveExecutable` - Choose LÖVE executable (love or lovec)

## Known Issues

> Help out by reporting any issues to the [Github](https://github.com/MTadder/YueRunner)

- If _you try to use `LÖVE2D` without it being installed_, an error will occur.

---

**Enjoy!**
