import * as vscode from 'vscode'
import { https } from 'follow-redirects'

export class HugoTheme {
    constructor(
        public name: string,
        public url: string) { }
}

const normalizeThemeDirName = (themeRepoDir: string): string => {
    themeRepoDir = themeRepoDir.toLowerCase()
    if (/^hugo-[\w_-]+-theme$/.test(themeRepoDir)) {
        // hugo-xxx-theme
        return themeRepoDir.replace(/^hugo-/, '').replace(/-theme$/, '')
    } else if (/^hugo-theme-[\w_-]+$/.test(themeRepoDir)) {
        // hugo-theme-xxx
        return themeRepoDir.replace(/^hugo-theme-/, '')
    }  else if (/^[\w_-]+-hugo-theme$/.test(themeRepoDir)) {
        // xxx-hugo-theme
        return themeRepoDir.replace(/-hugo-theme$/, '')
    } else if (/^hugo-[\w_-]+$/.test(themeRepoDir)) {
        // hugo-xxx
        return themeRepoDir.replace(/^hugo-/, '')
    } else if (/^[\w_-]+-hugo$/.test(themeRepoDir)) {
        // xxx-hugo
        return themeRepoDir.replace(/-hugo$/, '')
    } else {
        return themeRepoDir
    }
}

export const getThemesList = (): Promise<Array<HugoTheme>> => {
    const options = {
        hostname: 'api.github.com',
        port: 443,
        path: '/repos/gohugoio/hugoThemes/contents',
        method: 'GET',
        headers: {
            'User-Agent': 'ttys3/hugofy-vscode',
        }
    }
    return new Promise((resolve, reject) => {
        // vscode.window.showInformationMessage('begin fetch theme list ...')
        console.info('hugofy: begin fetch theme list ...')
        https.get(options, (res: any) => {
            let data = ''
            res.on('data', (chunk: any) => data += chunk)
            res.on('end', () => {
                try {
                    let parsedData = JSON.parse(data)
                    // console.log('parsedData: %o', parsedData)
                    let items = parsedData
                        .filter(((item: any) =>
                            (item.name.substring(0, 1) !== '.' &&
                                item.name.substring(0, 1) !== '_' &&
                                item.name !== 'LICENSE' &&
                                item.name !== 'README.md')
                        )).map((item: any) => new HugoTheme(normalizeThemeDirName(item.name), item.url))
                    // vscode.window.showInformationMessage('done fetch theme list.')
                    console.info('hugofy: done fetch theme list.')
                    resolve(items)
                } catch (e) {
                    reject(e)
                }
            })

        })
    })
}

export const getThemeGitURL = (themedata: any): Promise<string> => {
    if (themedata == undefined) {
        console.error("hugofy: getThemeGitURL(): themedata can not be undefined")
        return new Promise((resolve, reject) => {
            reject(new Error("hugofy: getThemeGitURL(): abort due to themedata undefined"))
        })
    }
    const options = {
        hostname: 'api.github.com',
        port: 443,
        method: 'GET',
        path: themedata.url.slice(22),
        headers: {
            'User-Agent': 'ttys3/hugofy-vscode',
        }
    }
    return new Promise<string>((resolve, reject) => {
        https.get(options, (res: any) => {
            let data = ''
            res.on('data', (chunk: any) => data += chunk)
            res.on('end', () => {
                try {
                    let parsedData = JSON.parse(data)
                    let items = parsedData
                    resolve(items.submodule_git_url)
                } catch (e) {
                    console.error(e)
                    reject(e)
                }
            })

        })
    })
}
