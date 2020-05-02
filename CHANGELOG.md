# Change Log

All notable changes to the "hugofy" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.1.2

- chore: updated CHANGELOG.md and README.md

## 0.1.1

- refactor: lint the code, more friendly error message
- fix: do not start the server again if already started
- feat: add `New Post` action on current folder right click event
- feat: support normalize path name to slug friendly path

    > Currently supports, but not limited to, the following scripts:
    Latin: e.g. English, français, Deutsch, español, português
    Cyrillic: e.g. Русский язык, български език, українська мова
    Chinese: e.g. 官话, 吴语 (converts to Latin script using Pinyin with optional tone number)
    Japanese: e.g. ひらがな, カタカナ (converts to Romaji using Hepburn)
    > for example:
    Cyrillic: `Я люблю русский/index.md`  => `ya-lyublyu-russkij/index.md`
    Chinese: `你好/index.md` => `ni-hao/index.md`
    Japanese Romaji: `私は ひらがな が大好き/index.md` => `ha-hiragana-gaki/index.md`

## 0.1.0

[Fix] Fixed start server error

## 0.0.2

- [Fix] Server Stop workd on windows

## 0.0.1

- Initial release