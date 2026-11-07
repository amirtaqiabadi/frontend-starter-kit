---
name: create-pr
description: >-
  Commit current changes, push the branch, and open a GitHub pull request.
  Use only when the user runs /create-pr.
disable-model-invocation: true
---

# Create pull request

Commit the current work, push it, and open one GitHub pull request. Use `gh` for every GitHub operation. Report the result in Persian.

## Rules

- Never change git config, skip hooks, force-push, or rewrite pushed history.
- Never push `main` or `master`.
- Never stage or commit secrets (`.env`, credentials, and similar). If those files are part of the change, leave them unstaged and warn.
- Stage only files that belong to this change. Leave unrelated work unstaged.
- Do not create an empty commit. Do not amend. If a hook rejects a commit, fix the problem and create a new commit.
- Follow `.cursor/rules/frontend-guidelines.mdc`. If a component changed and its colocated Storybook story was not updated, stop and ask before opening the pull request.
- Write the pull request title and body in English. The chat report stays in Persian.
- If any step fails, stop and report the blocker. Do not claim success.

## Workflow

1. In parallel, inspect `git status`, staged and unstaged diffs, `git branch -vv`, recent `git log`, and `git diff main...HEAD` (use `master` only when `main` does not exist). Match the commit message to this repository's style.
2. If there is nothing to commit and the branch has no commits ahead of the base, stop and say there is nothing to publish.
3. If the current branch is `main` or `master`, create and switch to a descriptive feature branch before committing or pushing. Leave local `main` untouched.
4. If there are uncommitted changes, stage the relevant files and commit with a 1–2 sentence message that states why the change exists:

```bash
git commit -m "$(cat <<'EOF'
Commit message here.

EOF
)"
```

5. Review the full diff against the base branch. Confirm no secrets are included.
6. Push with `git push -u origin HEAD`.
7. If this branch already has an open pull request, do not open another one. Return that pull request URL.
8. Otherwise create the pull request against `main` with `gh pr create`. Write the title and the entire body in English. Title is a concise summary of the whole branch. Body:

```markdown
## Summary
- <1–3 bullets explaining why the change exists>

## Test plan
- [ ] <how to verify the change>
```

When the diff includes UI, include checks for RTL, mobile layout, and the affected flow. When a component changed, include its Storybook story.

9. Return the pull request URL.
