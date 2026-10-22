# Marketing Madness

A browser remake of the FileMaker Jeopardy-style DECA and marketing review games. One screen is shared by the room: a module picker, a 5×10 board, the question, the answer, and a scoreboard for up to 20 players. It is a static app. Edits, imported modules, and game progress stay in the browser.

Product Phenomenon ships with all 50 clues. Its accent is the original green (`#007300`) with a mint question screen (`#CCFFCC`).

## Run it locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:4317.

```bash
npm test          # importer, theme, print seeds, saved games
npm run build     # typecheck and static build in dist/
npm run preview   # serve the production build
```

## Install and play offline

The production build includes a web app manifest and a service worker. In Chrome on a Chromebook, open the deployed site, use the install icon in the address bar (or the Install app button when Chrome offers it), and the game keeps working without a network. The first visit has to be online so the app can be saved. After that, questions, edits, and scores are on the device. There are no passwords.

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` tests, builds, and deploys on every push to `main`. In the repository settings, set Pages → Source to **GitHub Actions** once.

The build sets `GITHUB_PAGES=true`, and the asset path follows the repository name (`https://<user>.github.io/<repo>/`). A user site (`<user>.github.io`) is served from `/`.

## Add a module

You do not change the code.

1. Export the FileMaker data as a `.tab` file. Each row is answer, board order (1–50), question, record number, and the old random key. Board order 1–10 is category 1 from 10 to 100 points, 11–20 is category 2, and so on.
2. In the app, choose **New module → Import a .tab or JSON file**.
3. Enter the title, the five category names, and a color.
4. Check the alternate answers. The importer splits on `or` and `also known as` (the old line breaks were lost, so `Generic Brandsor Generic` comes back as two answers). `or` inside parentheses stays in one answer, as in `Charge Account (Regular or Thirty-Day)`.
5. Save. It is playable immediately. **Export** downloads JSON. Commit that file to `modules/` if it should ship with the app. Every `modules/*.json` file is bundled automatically.

The same import is available as a script:

```bash
npm run import-tab -- data/your-module.tab \
  --title "Pricing Party" \
  --id pricing-party \
  --color "#7A1FA2" \
  --category "Prices" \
  --category "Places" \
  --category "Promos" \
  --category "People" \
  --category "Potluck" \
  --out modules/pricing-party.json
```

**Export all** downloads every module currently in the browser. Importing that JSON on another device restores them. **Reset to original** throws away edits and restores the copy from when the module was bundled or imported.

Category names, questions, and answers can be edited on the board and the clue screens. A short Undo appears after each edit.

## Print

**Print / Study** makes five handouts: the emcee answer key, a study guide sorted alphabetically by answer, a 10-question category quiz, a mixed test of 1–50 questions, and a student answer-choice sheet. Quizzes and tests show a seed on the question page and the same seed on the answer key, so a reprint matches.

## Keyboard

- Arrow keys move around the board. Enter opens a tile.
- Space reveals the answer, then opens the points screen.
- Escape goes back one screen.
