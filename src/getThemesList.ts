import { Uri } from 'vscode'
import { https } from 'follow-redirects'
import { URL } from 'url'

export class HugoTheme {
    constructor(
        public name: string,
        public apiURL: string,
        public gitURL: string) { }
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
                        )).map((item: any) => new HugoTheme(normalizeThemeDirName(item.name), item.url, extractGitURL(item.html_url)))
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

// get git URL from html_url like `https://github.com/marketempower/axiom/tree/34156c0530092c3cef71bfeaa133c19673bb58b1"`
const extractGitURL = (html_url: string | null): string => {
    if (html_url === null ) {
        return ''
    }
    
    const u = new URL(html_url)
    const pathArr = u.pathname.split('/')
    if (pathArr.length < 3) {
        return ''
    }
    // console.log('getThemeGitURL: %s, pathArr: %o', html_url, pathArr)
    const repoUser = pathArr[1]
    const repoName = pathArr[2]
    return `${u.origin}/${repoUser}/${repoName}.git`
}

export const getThemeGitURL = (api_url: string): Promise<string> => {
    // for non-github submodule, we can not get it from extractGitURL, because html_url is null
    const u = new URL(api_url)
    const options = {
        hostname: u.hostname,
        port: 443,
        method: 'GET',
        path: u.pathname,
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