---
name: merge-pr
description: >-
  Merge the single open GitHub pull request after reading its comments and
  applying any required fixes. Use only when the user runs /merge-pr. If more
  than one pull request is open, report that and stop.
disable-model-invocation: true
---

# Merge pull request

Read the only open pull request, apply comment fixes when they are required, and merge it into `main`. Use `gh` for every GitHub operation. Report the result in Persian.

## Gate

Do this before checkout, reading comments, editing, pushing, or merging.

```bash
gh pr list --state open --json number,title,url,headRefName,baseRefName
```

- **Not exactly one open pull request:** stop.
  - None: say there is no open pull request.
  - More than one: list each number, title, and URL, then stop. Do nothing else.
- **Exactly one:** continue with that pull request only.

## Rules

- Never change git config, skip hooks, force-push, or rewrite pushed history.
- Never push directly to `main` or `master`. Merge only through `gh pr merge`.
- Never stage secrets (`.env`, credentials, and similar).
- Change only what a comment requires. Do not refactor nearby code.
- Follow `.cursor/rules/frontend-guidelines.mdc`. A component change includes its colocated Storybook story.
- If a comment is ambiguous or conflicts with another comment, stop and ask.
- If local uncommitted work would block a checkout, stop and report it. Do not discard it.
- If a step fails, stop and report the blocker. Do not claim the pull request was merged.

## Read

1. Check out the pull request head branch.
2. Read the diff, the conversation, and every inline review comment. Note the file and line for each unresolved comment.
3. Before editing, list each comment and the change it requires. A comment that asks for no code change stays a note, not an edit.

## Fix

1. Apply each required change on the pull request branch. Keep the existing architecture and make the smallest change that answers the comment.
2. When a fix changes UI, layout, routing, client state, or rendered data, verify that flow in the browser before committing. When a fix changes a component, update its colocated Storybook story.
3. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint` for the code you touched. If a failure comes from the fix, correct the fix.
4. If there is nothing to change, skip the commit.

## Publish the fixes

When there are fixes:

1. In parallel, inspect `git status`, `git diff`, and recent `git log`.
2. Stage only the files that belong to the review fixes.
3. Commit with a 1–2 sentence message that states why the comments required the change. If a hook modifies files or rejects the commit, fix the problem and create a new commit. Do not amend.
4. Push with `git push`.

## Merge

1. Confirm the pull request is open and mergeable, and that every comment that required a change is addressed.
2. If required checks are failing, do not merge. Report the failing checks.
3. Merge into the base branch:

```bash
gh pr merge NUMBER --merge
```

4. Update local `main`:

```bash
git checkout main
git pull origin main
```

5. Report the pull request URL, whether it merged, the fixes made, and the `main` commit SHA.
