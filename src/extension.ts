'use strict'
// Object.defineProperty(exports, "__esModule", { value: true })
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as themeUtils from './getThemesList'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as opn from 'open'
import * as os from 'os'
import slug = require('limax')

const getDirectories = (p: string) => fs.readdirSync(p).filter((f: string) => fs.statSync(p + '/' + f).isDirectory())

let startCmd: any = false

const getVersion = () => {
    const version = spawn('hugo', ['version'], { shell: true })
    version.stdout.on('data', (data: any) => {
        vscode.window.showInformationMessage(data.toString())
    })
    version.stderr.on('data', (data: any) => {
        vscode.window.showErrorMessage(data.toString())
    })
    version.on('close', (code: number) => {
        if (code !== 0) {
            vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.')
        }
    })
}
const newSite = () => {
    if (vscode.workspace.rootPath) {
        const newSiteCmd = spawn('hugo', ['new', 'site', `"${vscode.workspace.rootPath}"`], { shell: true })
        newSiteCmd.stdout.on('data', (data: any) => {
            console.log(`stdout: ${data}`)
        })
        newSiteCmd.stderr.on('data', (data: any) => {
            console.log(`stderr: ${data}`)
        })
        newSiteCmd.on('close', (code: number) => {
            if (code !== 0) {
                vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.')
            }
            else {
                vscode.window.showInformationMessage(`Congratulations! Your new Hugo site is created in ${vscode.workspace.rootPath} test`)
            }
        })
    }
}
const build = () => {
    const buildCmd = spawn('hugo', ['--buildDrafts', `-s="${vscode.workspace.rootPath}"`], { shell: true })
    buildCmd.stdout.on('data', (data: any) => {
        console.log(`std ${data}`)
        vscode.window.showInformationMessage(data.toString())
    })
    buildCmd.stderr.on('data', (data: any) => {
        console.log(`stderr ${data}`)
        vscode.window.showErrorMessage(data.toString())
    })
    buildCmd.on('close', (code: number) => {
        console.log(`code ${code}`)
        if (code !== 0) {
            vscode.window.showErrorMessage('Error getting hugo version, Make sure hugo is available in path.')
        }
    })
}
const downloadTheme = () => {
    themeUtils.getThemesList().then((themeList: any) => {
        const themeNames = themeList.map((themeItem: any) => themeItem.name)
        vscode.window.showQuickPick(themeNames).then((selection: any) => {
            const themeData = themeList.find((themeItem: any) => themeItem.name === selection)
            themeUtils.getThemeGitURL(themeData).then((gitURL: string) => {
                const themePath = path.join(vscode.workspace.rootPath, 'themes', themeData.name)
                const downloadThemeCmd = spawn('git', ['clone', gitURL, `"${themePath}"`], { shell: true })
                downloadThemeCmd.stdout.on('data', (data: any) => {
                    console.log(`stdout: ${data}`)
                })
                downloadThemeCmd.stderr.on('data', (data: any) => {
                    console.log(`stderr ${data}`)
                    //vscode.window.showInformationMessage(`Error downloading theme. Make sure git is installed.`)
                })
                downloadThemeCmd.on('close', (code: number) => {
                    if (code === 0) {
                        vscode.window.showInformationMessage(`successfully downloaded theme ${themeData.name}`)
                    }
                    else {
                        vscode.window.showErrorMessage(`Error downloading theme. Exit code ${code}`)
                    }
                })
            })
        })
    })
}

const createHugoPost = function (postPath: string, newPostFilePath: string) {
    if (fs.existsSync(newPostFilePath)) {
        vscode.window.showErrorMessage(`Error: post already exists!`, newPostFilePath)
        return
    }
    if (fs.existsSync(path.join(path.dirname(path.dirname(newPostFilePath)), 'index.md'))) {
        vscode.window.showErrorMessage('Leaf bundle does NOT allow nesting of more bundles under it!')
        return
    }
    // console.info('hugoContentPath: %s, newPostFilePath: %s, postPath: %s', hugoContentPath, newPostFilePath, postPath)
    const newPostCmd = spawn('hugo', ['new', postPath, `-s="${vscode.workspace.rootPath}"`], { shell: true })
    newPostCmd.stdout.on('data', (data: any) => {
        vscode.window.showInformationMessage(data)
    })
    newPostCmd.stderr.on('data', (data: any) => {
        console.log(`stderr: ${data}`)
        vscode.window.showInformationMessage(`Error creating new post.`)
    })
    newPostCmd.on('close', (code: number) => {
        if (code === 0) {
            let uripath = vscode.Uri.file(newPostFilePath)
            vscode.workspace.openTextDocument(uripath).then((document: any) => {
                vscode.window.showTextDocument(document)
            }, (err: any) => {
                console.log(err)
            })
        }
        else {
            vscode.window.showErrorMessage(`Error creating new post.`)
        }
    })
}

const newPost = (args: any[]) => {
    vscode.window.showInputBox({ placeHolder: 'Enter filename', value: 'index.md' }).then((filename: string | undefined) => {
        if (filename == undefined) {
            return
        }
        const filePath = path.normalize(path.dirname(filename))
        const fileBasename = slug(path.basename(filename), { tone: false, custom: { '.': '.' } })
        const normalizedPath = filePath.split('/').map((dirname: string) => slug(dirname, { tone: false }))
        // normalize filename
        filename = path.join(...normalizedPath, fileBasename)
        console.log('normalize filename: %s', filename)
        // if calls come from right menu click
        if (args != undefined && 'path' in args) {
            // create index.md fast under current context directory
            const hugoContentPath = path.join(vscode.workspace.rootPath, 'content')
            const newPostPath = path.join(args['path'], filename)
            const postPath = newPostPath.substring(hugoContentPath.length)

            const postDirPath = path.join(vscode.workspace.rootPath, 'content', 'post')
            if (postDirPath == args['path'] && filename === 'index.md') {
                vscode.window.showErrorMessage(`page bundle should has its own sub-directory!`)
                return
            }
            createHugoPost(postPath, newPostPath)
        } else {
            const newPostPath = path.join(vscode.workspace.rootPath, 'content', 'post', filename)
            const postPath = 'post' + path.sep + filename
            createHugoPost(postPath, newPostPath)
        }
    })
}

const setTheme = () => {
    const themeFolder = path.join(vscode.workspace.rootPath, 'themes')
    let themeList = getDirectories(themeFolder)
    if (themeList.length === 0) {
        const actions = ['Download Themes']
        vscode.window.showInformationMessage('No themes available in themes folder', ...actions).then((value: string) => {
            if (value === 'Download Themes') {
                downloadTheme()
            }
        })
    }
    else {
        let config = vscode.workspace.getConfiguration('launch')
        vscode.window.showQuickPick(themeList).then((selection: any) => {
            config.update('defaultTheme', selection)
        })
    }
}
const startServer = () => {
    if (startCmd) {
        vscode.window.showInformationMessage('hugo server already started, open URL.')
        opn('http://localhost:9081')
        return
    }
    const defaultTheme = getDefaultTheme()
    if (defaultTheme) {
        startCmd = spawn('hugo', [
            'server',
            '--disableFastRender', `--theme=${defaultTheme}`,
            `-s="${vscode.workspace.rootPath}"`,
            '--buildDrafts',
            '--watch',
            '--port=9081'],
            { shell: true })
    }
    else {
        vscode.window.showInformationMessage('Default theme not set. Please set one')
        setTheme()
        return
    }
    startCmd.stdout.on('data', (data: any) => {
        if (data.indexOf('Press Ctrl+C to stop') > -1) {
            opn('http://localhost:9081')
            vscode.window.showInformationMessage('hugo server started successfully.')
        }
        console.log(`stdout: ${data}`)
    })
    startCmd.stderr.on('data', (data: any) => {
        console.log(data.toString())
        vscode.window.showErrorMessage(`Error running server`)
    })
    startCmd.on('close', (code: number) => {
        console.log('Command close, code = ', code)
    })
}
const stopServer = () => {
    if (startCmd) {
        if (os.platform() == 'win32') {
            spawn("taskkill", ["/pid", startCmd.pid, '/f', '/t'])
        }
        else {
            startCmd.kill('SIGTERM')
        }
        // reset startCmd to false value
        startCmd = false
        vscode.window.showInformationMessage('hugo server stopped successfully.')
    }
    else {
        console.log('No process started')
        vscode.window.showInformationMessage('No hugo server started')
    }
}

function activate(context: any) {
    context.subscriptions.push(
        vscode.commands.registerCommand('hugofy.getVersion', getVersion),
        vscode.commands.registerCommand('hugofy.newSite', newSite),
        vscode.commands.registerCommand('hugofy.newPost', newPost),
        vscode.commands.registerCommand('hugofy.build', build),
        vscode.commands.registerCommand('hugofy.downloadTheme', downloadTheme),
        vscode.commands.registerCommand('hugofy.setTheme', setTheme),
        vscode.commands.registerCommand('hugofy.startServer', startServer),
        vscode.commands.registerCommand('hugofy.stopServer', stopServer)
    )
}

exports.activate = activate
function deactivate() {
    stopServer()
}
exports.deactivate = deactivate
function getDefaultTheme() {
    let config = vscode.workspace.getConfiguration('launch')
    return config.get('defaultTheme')
}
//# sourceMappingURL=extension.js.map