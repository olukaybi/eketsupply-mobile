# Contributing to EketSupply Mobile

## CI / Quality Gates

Every push and pull request runs four parallel GitHub Actions jobs. All four must pass before a branch can be merged into `main`.

| Job | Command | What it enforces |
|---|---|---|
| **TypeScript** | `pnpm check` | Zero type errors across the entire codebase |
| **Tests** | `pnpm test` | All 174 Vitest tests pass |
| **Lint** | `pnpm lint` | No ESLint violations (Expo config) |
| **Build (Web)** | `expo export --platform web` | Metro bundler produces a clean web bundle |

---

## Setting Up GitHub Repository Secrets

The `test` and `build` jobs require two repository secrets to connect to Supabase. Without them the `supabase-connection` test will fail in CI.

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add each of the following:

| Secret name | Where to find it |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → Project API keys → **anon public** |

---

## Enabling Branch Protection on `main`

Branch protection prevents anyone (including admins) from pushing directly to `main` without passing CI.

1. Go to your GitHub repository → **Settings** → **Branches**.
2. Click **Add branch protection rule**.
3. Set **Branch name pattern** to `main`.
4. Enable the following options:

| Option | Setting |
|---|---|
| **Require a pull request before merging** | ✅ Enabled |
| **Require status checks to pass before merging** | ✅ Enabled |
| **Require branches to be up to date before merging** | ✅ Enabled |
| **Status checks that are required** | `TypeScript`, `Tests`, `Lint`, `Build (Web)` |
| **Do not allow bypassing the above settings** | ✅ Enabled (recommended) |

5. Click **Create** (or **Save changes**).

> **Note:** The four status check names (`TypeScript`, `Tests`, `Lint`, `Build (Web)`) must match the `name:` field of each job in `.github/workflows/ci.yml` exactly. They will only appear in the dropdown after the workflow has run at least once on the repository.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start the dev server (Metro + API server)
pnpm dev

# Run all checks locally before pushing
pnpm check   # TypeScript
pnpm test    # Vitest
pnpm lint    # ESLint
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
