// Object.defineProperty(exports, "__esModule", { value: true })
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { Uri, QuickPickItem } from 'vscode'
import * as themeUtils from './getThemesList'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as open from 'open'
import * as os from 'os'
const vscache = require('vscode-cache')

import { slugify } from 'transliteration'
import { URL } from 'url'
const slugifyConf = { ignore: [path.sep], trim: true, lowercase: true }
const themelistCacheKey = 'ttys3.hugoy.themeList'
const curThemeCacheKey = 'ttys3.hugoy.themeCurrent'

const getDirectories = (p: string) => fs.readdirSync(p).filter((f: string) => fs.statSync(p + path.sep + f).isDirectory())

let extCache: any
let startCmd: any = false

class themeItem implements QuickPickItem {
    label: string;
    description: string;

    constructor(public name: string, public gitURL: Uri, public apiURL: Uri) {
        this.label = name
        this.description = gitURL.toString()
    }
}

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
    if (getRootPath()) {
        const newSiteCmd = spawn('hugo', ['new', 'site', `"${getRootPath()}"`], { shell: true })
        newSiteCmd.stdout.on('data', (data: any) => {
            console.info(`hugo new site stdout: ${data}`)
        })
        newSiteCmd.stderr.on('data', (data: any) => {
            console.error(`hugo new site stderr: ${data}`)
            vscode.window.showErrorMessage(`New hugo site err: ${data}`)
        })
        newSiteCmd.on('close', (code: number) => {
            if (code !== 0) {
                console.error(`hugo new site err code: ${code}`)
            }
            else {
                vscode.window.showInformationMessage(`Congratulations! Your new Hugo site is created in ${getRootPath()} test`)
            }
        })
    }
}

const build = () => {
    const buildCmd = spawn('hugo', ['--buildDrafts', `-s="${getRootPath()}"`, `--theme="${getDefaultTheme()}"`], { shell: true })
    buildCmd.stdout.on('data', (data: any) => {
        const out = data.toString()
        if (/error/i.test(out)) {
            console.info(`hugo build out: ${out}`)
            vscode.window.showErrorMessage(out)
        }
    })
    buildCmd.stderr.on('data', (data: any) => {
        console.error(`hugo build stderr ${data}`)
        vscode.window.showErrorMessage(data.toString())
    })
    buildCmd.on('close', (code: number) => {
        if (code !== 0) {
            console.error(`hugo build err code: ${code}`)
            vscode.window.showErrorMessage('hugofy: hugo build failed')
        }
    })
}

const getRootPath = (): string => {
    // `workspaceFolders` List of workspace folders or undefined when no folder is open.
    // Note that the first entry corresponds to the value of rootPath.
    if (vscode.workspace.workspaceFolders == undefined) {
        vscode.window.showErrorMessage('Error: you need open a folder')
        return ''
    }
    // console.log('vscode.workspace.workspaceFolders: %o', vscode.workspace.workspaceFolders)
    return vscode.workspace.workspaceFolders[0].uri.fsPath
}

const gitCloneTheme = (themeData: themeItem) => {
    const themePath = path.join(getRootPath(), 'themes', themeData.name)
    const downloadThemeCmd = spawn('git', ['clone', themeData.gitURL.toString(), `"${themePath}"`], { shell: true })
    downloadThemeCmd.stdout.on('data', (data: any) => {
        console.info(`hugofy git clone ${themeData.gitURL.toString()} stdout: ${data.toString()}`)
    })
    downloadThemeCmd.stderr.on('data', (data: any) => {
        console.log(`hugofy git clone ${themeData.gitURL.toString()} stderr ${data.toString()}`)
        //vscode.window.showInformationMessage(`Error downloading theme. Make sure git is installed.`)
    })
    downloadThemeCmd.on('close', (code: number) => {
        if (code === 0) {
            vscode.window.showInformationMessage(`successfully downloaded theme ${themeData.name}`,
                ...[`use ${themeData.name}`, 'start server']).then((action: string | undefined) => {
                    if (action === undefined) {
                        return
                    }
                    // console.log('action: %s', action)
                    if (action === `use ${themeData.name}`) {
                        doSetTheme(themeData.name)
                    } else {
                        startServer()
                    }
                })
        } else {
            vscode.window.showErrorMessage(`Error downloading theme ${themeData.name} from ${themeData.gitURL.toString()}, Exit code ${code}`,
                'try again').then((action: string | undefined) => {
                    if (action === undefined) {
                        return
                    }
                    gitCloneTheme(themeData)
                })
        }
    })
}

const doDownloadTheme = (themeList: any) => {
    const themeItems = themeList.map((theme: any) => new themeItem(theme.name, theme.gitURL, theme.apiURL))
    vscode.window.showQuickPick(themeItems).then((selection: any) => {
        if (selection === undefined) {
            return
        }
        // console.log('doDownloadTheme selection: %o', selection)
        const themeData = themeList.find((theme: any) => theme.apiURL === selection.apiURL)
        if (themeData) {
            vscode.window.showInformationMessage(`begin download theme ${themeData.name}`)
            if (themeData.gitURL.toString() !== '') {
                gitCloneTheme(themeData)
            } else {
                console.log(`hugofy: download theme ${themeData.name}, non-github repo, try fetch git URL via API`)
                themeUtils.getThemeGitURL(themeData.apiURL).then((gitURL: string) => {
                    themeData.gitURL = new URL(gitURL)
                    gitCloneTheme(themeData)
                })
            }
        }
    })
}

const downloadTheme = () => {
    const themelist = extCache.get(themelistCacheKey)
    if (themelist) {
        doDownloadTheme(themelist)
    } else {
        themeUtils.getThemesList().then(doDownloadTheme)
    }
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
    // console.info('hugofy: hugoContentPath: %s, newPostFilePath: %s, postPath: %s', hugoContentPath, newPostFilePath, postPath)
    const newPostCmd = spawn('hugo', ['new', postPath, `-s="${getRootPath()}"`, `--theme="${getDefaultTheme()}"`], { shell: true })
    newPostCmd.stdout.on('data', (data: any) => {
        vscode.window.showInformationMessage(data.toString())
    })
    newPostCmd.stderr.on('data', (data: any) => {
        console.error(`hugofy: new post stderr: ${data.toString()}`)
        vscode.window.showInformationMessage(`${data.toString()}`)
    })
    newPostCmd.on('close', (code: number) => {
        if (code === 0) {
            let uripath = vscode.Uri.file(newPostFilePath)
            vscode.workspace.openTextDocument(uripath).then((document: any) => {
                vscode.window.showTextDocument(document)
            }, (err: any) => {
                console.error(err)
            })
        } else {
            vscode.window.showErrorMessage(`Error creating new post.`)
        }
    })
}

const newPost = (args: any[]) => {
    const defaultTheme = getDefaultTheme()
    if (defaultTheme == undefined) {
        vscode.window.showInformationMessage('Default theme not set. Please set one')
        setTheme()
        return
    }
    vscode.window.showInputBox({ placeHolder: 'Enter filename', value: 'index.md' }).then((filename: string | undefined) => {
        if (filename == undefined) {
            return
        }
        const filePath = path.normalize(path.dirname(filename))
        const fileBasename = slugify(path.basename(filename), slugifyConf)
        const normalizedPath = filePath.split(path.sep).map((dirname: string) => slugify(dirname, slugifyConf))
        // normalize filename
        filename = path.join(...normalizedPath, fileBasename)
        // console.log('hugofy: normalize filename: %s', filename)
        // if calls come from right menu click
        if (args != undefined && 'fsPath' in args) {
            // console.log('newPost() args: %o', args)
            // create index.md fast under current context directory
            const hugoContentPath = path.join(getRootPath(), 'content')
            const newPostPath = path.join(args['fsPath'], filename)
            const postPath = newPostPath.substring(hugoContentPath.length)

            const postDirPath = path.join(getRootPath(), 'content', 'post')
            if (postDirPath == args['fsPath'] && filename === 'index.md') {
                vscode.window.showErrorMessage(`page bundle should has its own sub-directory!`)
                return
            }
            createHugoPost(postPath, newPostPath)
        } else {
            if (filename === 'index.md') {
                vscode.window.showErrorMessage(`page bundle should has its own sub-directory!`)
                return
            }
            const newPostPath = path.join(getRootPath(), 'content', 'post', filename)
            const postPath = 'post' + path.sep + filename
            createHugoPost(postPath, newPostPath)
        }
    })
}

const doSetTheme = (theme: string) => {
    const config = vscode.workspace.getConfiguration('launch')
    config.update('defaultTheme', theme)
    extCache.set(curThemeCacheKey, theme)
    if (startCmd) {
        stopServer()
        startServer()
    }
}

const setTheme = () => {
    const themeFolder = path.join(getRootPath(), 'themes')
    let themeList = getDirectories(themeFolder)
    if (themeList.length === 0) {
        const actions = ['Download Themes']
        vscode.window.showInformationMessage('No themes available in themes folder', ...actions).then((value: any) => {
            if (value === 'Download Themes') {
                downloadTheme()
            }
        })
    } else {
        vscode.window.showQuickPick(themeList).then((selection: any) => {
            if (selection === undefined) {
                return
            }
            doSetTheme(selection)
        })
    }
}

const openLocalHugoBlog = () => open(`http://localhost:9081/?_t=${Date.now()}`)

const startServer = () => {
    if (startCmd) {
        vscode.window.showInformationMessage('hugo server already started, open URL.')
        openLocalHugoBlog()
        return
    }
    const defaultTheme = getDefaultTheme()
    // console.log('get current theme: %s', defaultTheme)
    if (defaultTheme) {
        startCmd = spawn('hugo', [
            'server',
            '--disableFastRender', `--theme=${defaultTheme}`,
            `-s="${getRootPath()}"`,
            '--buildDrafts',
            '--watch',
            '--port=9081'],
            { shell: true })
    } else {
        vscode.window.showInformationMessage('Default theme not set. Please set one')
        setTheme()
        return
    }
    startCmd.stdout.on('data', (data: any) => {
        if (data.indexOf('Press Ctrl+C to stop') > -1) {
            openLocalHugoBlog()
            vscode.window.showInformationMessage('hugo server started successfully.')
        } else {
            const out = data.toString()
            if (/error/i.test(out)) {
                console.error(`hugofy: hugo server start stdout: ${out}`)
                vscode.window.showErrorMessage(`${out}`)
            }
        }
    })
    startCmd.stderr.on('data', (data: any) => {
        console.error(`hugofy: start server stderr: ${data.toString()}`)
        vscode.window.showErrorMessage(`hugo server start failed: ${data.toString()}`)
    })
    startCmd.on('close', (code: number) => {
        if (code !== 0) {
            // reset startCmd to false value
            startCmd = false
            console.error('hugofy: hugo server closed unexpectd with err code = ', code)
        }
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
    } else {
        console.error('hugofy: hugo server stop: no process started')
        vscode.window.showErrorMessage('No hugo server started')
    }
}

const getInitTheme = () => {
    const config = vscode.workspace.getConfiguration('launch')
    const theme = config.get('defaultTheme')
    extCache.set(curThemeCacheKey, theme)
    return theme
}

const getDefaultTheme = () => {
    if (extCache.has(curThemeCacheKey)) {
        return extCache.get(curThemeCacheKey)
    }
    return getInitTheme()
}

const checkHugoInstalled = () => {
    const version = spawn('hugo', ['version'], { shell: true })
    version.on('close', (code: number) => {
        if (code !== 0) {
            vscode.window.showErrorMessage('hugo executable not found, please ensure hugo is available in path.',
                'Check the guide on how to install Hugo').then((action: string | undefined) => {
                    if (action === undefined) {
                        return
                    }
                    open('https://gohugo.io/getting-started/installing/')
                })
        }
    })
}

const checkThemeExists = () => {
    const curTheme = getDefaultTheme()
    if (curTheme) {
        const themeFolder = path.join(getRootPath(), 'themes', curTheme)
        console.log('check %s', themeFolder)
        if (!fs.existsSync(themeFolder)) {
            vscode.window.showErrorMessage(`hugo theme "${curTheme}" does not exits, please set new theme`,
            'Set Theme').then((action: string | undefined) => {
                if (action !== undefined) {
                    setTheme()
                }
            })
        }
    }
}

// Extension activation method
const activate = (context: any) => {
    checkHugoInstalled()
    // Instantiate the cache
    extCache = new vscache(context)
    // init commands
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

    themeUtils.getThemesList().then((themeList: any) => {
        // Save an item to the cache by specifying a key and value
        extCache.put(themelistCacheKey, themeList).then(() => {
            // console.log(extCache.has(themelistCacheKey)) // returns true
            // const themelist = extCache.get(themelistCacheKey)
            // console.log(themelist)
        })
    })

    getInitTheme()
    checkThemeExists()
};

exports.activate = activate

const deactivate = () => stopServer()

exports.deactivate = deactivate
//# sourceMappingURL=extension.js.map