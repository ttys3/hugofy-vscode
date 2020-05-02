# hugofy README

This is a modified Hugofy extension with extra support for hugo [Page Bundles](https://gohugo.io/content-management/page-bundles/)

Hugofy is a plugin for Visual Studio Code to make life easier to use [Hugo static site generator](http://gohugo.io)

## Features

1. Create new hugo site
2. Create posts (support right click on folder)
3. Build site
4. Run and stop server
5. Download available hugo themes.
6. `New Post` action on current folder right click event
7. Auto normalize path name to **slug** friendly path

    Currently supports, but not limited to, the following scripts:

    - **Latin**: e.g. English, français, Deutsch, español, português

    - **Cyrillic**: e.g. Русский язык, български език, українська мова

    - **Chinese**: e.g. 中文 (converts to Latin script using Pinyin with optional tone number)

    - **Japanese**: e.g. ひらがな, カタカナ (converts to Romaji using Hepburn)

    For example:

    Cyrillic: `Я люблю русский/index.md`  => `ya-lyublyu-russkij/index.md`

    Chinese: `你好/index.md` => `ni-hao/index.md`

    Japanese Romaji: `私は ひらがな が大好き/index.md` => `ha-hiragana-gaki/index.md`


## Usage

Use command pallete ```Ctrl+Shift+P``` and type Hugofy
Once the server has been started you can view the output by directing your browser to: http://localhost:9081

## Extension Settings

## How to contribute

`eamodio.tsl-problem-matcher` extension provides `$ts-webpack`, you need install it:

```bash
: `ext install eamodio.tsl-problem-matcher`
```

```bash
git clone https://github.com/ttys3/hugofy-vscode.git
cd ./hugofy-vscode
code .
# press F5 start
```

## Known Issues

for some themes which need specific config,

you'll need copy config to your `config.toml` from `themes/[Hugo theme name]/exampleSite/config.toml` after new theme installed,

otherwise the theme will not work

## Release Notes

## 0.1.0

[Fix] Fixed start server error

## 0.0.2

[Fix] Server Stop works on windows

### 0.0.1

Initial Release
