# Instructions for AI agents

## Read first

**Read `INFO.md` in full before doing anything in this repo.** It is the
project's map, written for AI agents (`README.md` is the human-facing
overview): how this repo connects to its sibling
repos, the feature list, the project structure, setup steps, conventions and
the latest work. Don't guess at structure or conventions it already
documents.

Sibling repos (often changed together - check their INFO.md too when a task
crosses repos):

- [cbh-youth-online-api](https://github.com/tunnaduong/cbh-youth-online-api) - Laravel API (api.chuyenbienhoa.com)
- [cbh-youth-online-next-js](https://github.com/tunnaduong/cbh-youth-online-next-js) - main web site (chuyenbienhoa.com)
- [cbh-youth-online-mobile](https://github.com/tunnaduong/cbh-youth-online-mobile) - Expo / React Native app
- [cbh-youth-online-gift-shop](https://github.com/tunnaduong/cbh-youth-online-gift-shop) - gift shop (giftshop.chuyenbienhoa.com)

## Find code via INFO.md first

Before searching the codebase by hand (grep, find, opening files one by
one), look up INFO.md's **Project structure** and **Features** sections: they
say which folder/file owns each feature, screen, route or endpoint. Go
straight to those files and only fall back to a manual search for what
INFO.md doesn't cover - it's much faster. If you had to search for something
INFO.md should have told you, add it there.

## Default branch

Work against **`main`** unless the user names another branch. `main` is
protected, so start a feature branch from an up-to-date `main`, push it and
open a PR into `main` (or add to the open PR the user points you to).

## Keep INFO.md (and README.md) current

These files only stay useful if every change lands in them. When you finish a
task here:

- Add a line to INFO.md's **Recent work** section (newest first).
- Update **Features**, **Project structure**, **Setup** or **Conventions**
  if your change touched them (new screen/route/endpoint, new folder, new env
  var, new rule).
- If the change is user-visible or alters setup, update `README.md` too,
  keeping its existing style and language.
- Commit these doc updates together with the change they describe.

## Repo rules (details in INFO.md)

- `main` is protected: changes go through a PR and need Playwright E2E and
  deploy checks plus a review. Vietnamese commit messages.
- `?app=true` / `src/utils/appMode.js` mark pages running inside the mobile
  app's WebView - respect it when adding sign-out, splash or "get the app" UI.
- **UI work must follow INFO.md's "Design system" section** (colour pairs,
  cards, buttons, antd usage, loading states, dark mode). A large redesign
  updates that section in the same commit.
