import * as https from 'https'

export const getThemesList = (): Promise<Array<any>> => {
    const options = {
        hostname: 'api.github.com',
        port: 443,
        path: '/repos/spf13/hugoThemes/contents',
        method: 'GET',
        headers: {
            'User-Agent': 'akmittal',
        }
    }
    return new Promise((resolve, reject) => {
        https.get(options, (res: any) => {
            let data = ''
            res.on('data', (chunk: any) => data += chunk)
            res.on('end', () => {
                try {
                    let parsedData = JSON.parse(data)
                    let items = parsedData
                        .filter(((item: any) =>
                            (item.name !== '.gitmodules' &&
                                item.name !== 'LICENSE' &&
                                item.name !== 'README.md')
                        )).map((item: any) =>
                            ({
                                name: item.name,
                                url: item.url
                            })
                        )
                    resolve(items)

                } catch (e) {
                    reject(e)
                }
            })

        })
    })
}

export const getThemeGitURL = (themedata: any) => {
    console.log(themedata)
    const options = {
        hostname: 'api.github.com',
        port: 443,
        method: 'GET',
        path: themedata.url.slice(22),
        headers: {
            'User-Agent': 'akmittal',
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
                    reject(e)
                }
            })

        })
    })
}
