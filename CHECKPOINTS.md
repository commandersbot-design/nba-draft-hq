# Checkpoints

## 2026-04-02

### `checkpoint-20260402-082535-prospera-board`
- Commit: `7261944`
- Scope: Prospera board UI live in the Netlify repo, using the real prospect list supplied for the 2026 board.
- Includes:
  - React app replaced with the Prospera board workflow
  - Real board data in `src/data/prospects.js`
  - Watchlist, compare queue, compare matrix, and local notes
  - Updated styling in `src/index.css`
- Backup:
  - Local zip: `C:\Users\danud\Desktop\prospera-checkpoint-20260402-082535.zip`

## How To Create The Next Checkpoint

1. Commit and push the current work.
2. Create a git tag with a timestamped name.
3. Push the tag to GitHub.
4. Export a zip snapshot locally if you want a file backup too.
5. Add a new section to this file with:
   - date
   - tag
   - commit
   - what changed
   - backup zip path if one exists
