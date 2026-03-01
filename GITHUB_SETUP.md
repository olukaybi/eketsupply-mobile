# GitHub Repository Setup Guide

This guide walks through pushing EketSupply to GitHub and activating the full CI pipeline.

---

## 1. Create the GitHub Repository

1. Go to [github.com/new](https://github.com/new).
2. Set **Repository name** to `eketsupply-mobile`.
3. Set visibility to **Private** (recommended before public launch).
4. Leave "Initialize this repository" **unchecked** — the project already has a local history.
5. Click **Create repository**.

---

## 2. Push the Project

Open a terminal in the project directory and run:

```bash
git remote add origin https://github.com/<your-org>/eketsupply-mobile.git
git branch -M main
git push -u origin main
```

Replace `<your-org>` with your GitHub username or organisation name.

---

## 3. Add Repository Secrets for CI

The CI workflow (`ci.yml`) requires two secrets to run the Supabase connection tests.

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add each of the following:

| Secret Name | Value |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://rwskbbtkidpqvgsaeccm.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key (from Supabase Dashboard → Project Settings → API) |

> **Security note:** Never commit these values directly to the repository. Always use GitHub Secrets.

---

## 4. Verify CI Runs Successfully

After pushing, go to your repository → **Actions** tab. You should see a workflow run triggered automatically. It runs four parallel jobs:

| Job | What it checks |
|---|---|
| **TypeScript** | `pnpm check` — zero type errors |
| **Tests** | `pnpm test` — all 197 tests pass |
| **Lint** | `pnpm lint` — zero errors and warnings |
| **Build (Web)** | `npx expo export --platform web` — Metro bundler succeeds |

All four jobs must show a green checkmark before proceeding to branch protection.

---

## 5. Enable Branch Protection on `main`

This prevents any code from being merged unless all CI checks pass.

1. Go to **Settings** → **Branches** → **Add branch protection rule**.
2. Set **Branch name pattern** to `main`.
3. Enable the following options:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging**
     - Search for and add: `TypeScript`, `Tests`, `Lint`, `Build (Web)`
   - **Require branches to be up to date before merging**
   - **Do not allow bypassing the above settings**
4. Click **Save changes**.

---

## 6. Enable Dependabot Version Updates

1. Go to **Settings** → **Security** → **Code security and analysis**.
2. Under **Dependabot**, enable:
   - **Dependabot alerts**
   - **Dependabot security updates**
   - **Dependabot version updates**

Dependabot will read `.github/dependabot.yml` and open weekly PRs every Monday at 09:00 WAT for npm and GitHub Actions updates.

---

## 7. Enable Auto-Merge for Dependabot Patch PRs

1. Go to **Settings** → **General** → scroll to **Pull Requests**.
2. Tick **Allow auto-merge**.
3. Tick **Automatically delete head branches** (keeps the repo tidy).

Once enabled, the `auto-merge.yml` workflow will automatically approve and squash-merge Dependabot PRs for patch-level updates after all CI checks pass. Minor and major updates will receive a review comment instead.

---

## 8. Update CODEOWNERS (Optional)

Replace the placeholder team names in `.github/CODEOWNERS` with real GitHub usernames or team slugs:

```
# Example
*                          @your-github-username
/server/                   @your-backend-team
/app/                      @your-mobile-team
/.github/                  @your-devops-team
```

Teams must be created under your GitHub organisation before they can be used in CODEOWNERS.

---

## Summary Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to `main`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` secret added
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` secret added
- [ ] CI workflow runs and all 4 jobs pass
- [ ] Branch protection enabled on `main` with all 4 status checks required
- [ ] Dependabot version updates enabled
- [ ] Auto-merge enabled in repository settings
- [ ] CODEOWNERS updated with real team names
