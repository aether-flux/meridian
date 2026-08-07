# 🚀 Meridian — Developer & Contribution Guide

Welcome to the **Meridian** monorepo! This guide details our workflow, commands, and development standards. **Please read this thoroughly before creating your first branch.**

---

## 📌 Non-Negotiable Rules

1. **Never push directly to `main` or `staging`.** All code must enter the repository via a Pull Request (PR).
2. **Always target `staging` for PRs.** `staging` is our integration branch; `main` is reserved for releases.
3. **Keep branches short-lived.** One branch = one specific feature or fix. Do not mix unrelated tasks.
4. **Format & Lint before committing.** Unformatted code or ESLint errors will cause CI checks to fail and block your PR from merging.

---

## 🛠️ First-Time Repository Setup

When setting up your local environment for the first time:

```bash
# 1. Clone the repository
git clone git@github.com:aether-flux/meridian.git
cd meridian

# 2. Make sure you are on staging
git checkout staging
git pull origin staging

# 3. Install dependencies from the ROOT directory
npm install

# 4. Set up Environment Variables
# Copy .env.example inside apps/api to .env
cp apps/api/.env.example apps/api/.env

```

---

## 🔄 Daily Development Flow (Step-by-Step)

Follow these exact steps every time you start working on a new task:

### Step 1: Update `staging` & Create a Feature Branch

Always branch off the latest version of `staging`.

```bash
git checkout staging
git pull origin staging
git checkout -b feat/your-feature-name

```

> **Branch Naming Conventions:**
>
> - `feat/` for new features (e.g., `feat/jwt-auth`, `feat/cli-login`)
> - `fix/` for bug fixes (e.g., `fix/prisma-adapter`, `fix/navbar-mobile`)
> - `chore/` for dependencies/configs (e.g., `chore/eslint-update`)

---

### Step 2: Develop & Validate Code Locally

Work on your feature across the monorepo (`apps/web`, `apps/api`, `apps/cli`).

**Before committing, run formatting and linting from the project root:**

```bash
# 1. Format all files automatically
npm run format

# 2. Run ESLint checks across all apps
npm run lint

```

> ⚠️ If `npm run lint` flags unused variables in Express error handlers, prefix them with an underscore (e.g., `_next`).

---

### Step 3: Database Changes (If modifying `apps/api/prisma/schema.prisma`)

If you touch the database schema, generate the client and push changes locally:

```bash
# Run inside apps/api/
npx prisma db push

```

---

### Step 4: Commit & Push Your Branch

```bash
# 1. Stage your changes
git add .

# 2. Commit with a descriptive message
git commit -m "feat(api): add user authentication routes"

# 3. Push your feature branch upstream
git push -u origin feat/your-feature-name

```

---

### Step 5: Open a Pull Request (PR)

1. Go to the repository on GitHub.
2. Click **New Pull Request**.
3. Set the base branch to **`staging`**:

- **`base: staging`** $\leftarrow$ **`compare: feat/your-feature-name`**

4. Add a short title and description of your changes.
5. Wait for the automated **GitHub Actions CI Quality Checks** to pass.
6. Merge using **Create a merge commit** (or ask a teammate to review).
7. Delete the branch on GitHub after merging.

---

### Step 6: Clean Up Local Workspace

Once your PR is merged, switch back to `staging` and clean up your local machine:

```bash
# 1. Return to staging and pull the merged changes
git checkout staging
git pull origin staging

# 2. Delete your local feature branch
git branch -d feat/your-feature-name

# 3. Prune deleted remote branches from local cache
git fetch --prune

```

---

## ⚡ Quick Command Reference

| Command               | Location   | Purpose                                           |
| --------------------- | ---------- | ------------------------------------------------- |
| `npm run dev`         | Root       | Starts `web` and `api` concurrently via Turborepo |
| `npm run format`      | Root       | Formats code with Prettier across the monorepo    |
| `npm run lint`        | Root       | Runs ESLint across all apps and packages          |
| `npx prisma generate` | `apps/api` | Regenerates Prisma Client                         |
| `npx prisma db push`  | `apps/api` | Syncs schema changes with Neon DB                 |

---

## ❓ FAQ & Troubleshooting

- **CI check failed on PR:** Run `npm run format` and `npm run lint` locally, fix any errors, commit the changes, and push again to the same branch. The PR will update automatically.
- **Database initialization error:** Ensure you pass the `@prisma/adapter-neon` adapter into `new PrismaClient({ adapter })`. Prisma 7 strictly requires a driver adapter.
- **Never commit `.env`:** Keep secrets local. Do not push API keys or database URLs to GitHub.
