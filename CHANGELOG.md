# Change Log

All notable changes to the "hugofy" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.1.5

- use [transliteration](https://www.npmjs.com/package/transliteration) instead of limax
  which cause problem under webpack and has too many dependencies

- use webpack to [bundle the extension](https://code.visualstudio.com/api/working-with-extensions/bundling-extension),
  thanks [this PR](https://github.com/Microsoft/vscode-references-view/pull/50)

## 0.1.4

- chore: fixup getThemesList.ts line ending (CRLF to LF)
- chore: updated CHANGELOG.md and README.md

## 0.1.3

- chore: extension logo added

## 0.1.2

- chore: updated CHANGELOG.md and README.md

## 0.1.1

- refactor: lint the code, more friendly error message
- fix: do not start the server again if already started
- feat: add `New Post` action on current folder right click event
- feat: support normalize path name to **slug** friendly path

  Currently supports, but not limited to, the following scripts:

  - **Latin**: e.g. English, français, Deutsch, español, português

  - **Cyrillic**: e.g. Русский язык, български език, українська мова

  - **Chinese**: e.g. 中文 (converts to Latin script using Pinyin with optional tone number)

  - **Japanese**: e.g. ひらがな, カタカナ (converts to Romaji using Hepburn)

  For example:

  Cyrillic: `Я люблю русский/index.md`  => `ya-lyublyu-russkij/index.md`

    Chinese: `你好/index.md` => `ni-hao/index.md`

    Japanese Romaji: `私は ひらがな が大好き/index.md` => `ha-hiragana-gaki/index.md`

## 0.1.0

[Fix] Fixed start server error

## 0.0.2

- [Fix] Server Stop workd on windows

## 0.0.1

- Initial release