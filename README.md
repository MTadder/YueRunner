<center>

# 月 Runner

###### (yuescriptrunner)

<img src="logo.ico" width=128 height=128>

![GitHub last commit](https://img.shields.io/github/last-commit/MTadder/YueRunner?style=flat-square)
![GitHub Tag](https://img.shields.io/github/v/tag/MTadder/YueRunner?style=flat-square)
![GitHub Repo code size in bytes](https://img.shields.io/github/languages/code-size/MTadder/YueRunner?style=flat-square)
![GitHub Repo size](https://img.shields.io/github/repo-size/MTadder/YueRunner?style=flat-square)
![GitHub Repo stars](https://img.shields.io/github/stars/MTadder/YueRunner?style=flat-square)

</center>

## Features

provides palette commands, and a status bar button
for compiling any currently open `yue` script.

### Commands:

> Open your command palette with `CTRL` + `SHIFT` + `P`

- `Compile this Yuescript`
- `Compile all Yuescripts (in this directory)`
- `Compile all Yuescripts & run LÖVE2D (in this directory)`

## Requirements

- Install [`月 yuescript`](https://yuescript.org)

- Ensure that `yue` is visible within your `PATH`.

- If you want [`LÖVE2D`](https://love2d.org) support, [install it](https://github.com/love2d/love/releases/latest), and add it to your `PATH`.

## Extension Settings

- `yuescriptrunner.dumpGlobals` 
- `yuescriptrunner.stdout` 
- `yuescriptrunner.targetLuaVersion`
- `yuescriptrunner.useMinification`
- `yuescriptrunner.useSpacesInstead`
- `yuescriptrunner.reserveComments`
- `yuescriptrunner.writeLineNumbers`
- `yuescriptrunner.dumpCompileTime`
- `yuescriptrunner.useImplicitReturn`
- `yuescriptrunner.matchLineNumbers`
- `yuescriptrunner.loveExecutable`

## Known Issues

> Help out by reporting any issues to the [Github](https://github.com/MTadder/YueRunner)

- If _you try to use `LÖVE2D` without it being installed_, an error will occur.
- If _you change your default shell profile_ while a `yue` script is open, the status bar button will disappear, **until you reopen the tab**.

---

**Enjoy!**
