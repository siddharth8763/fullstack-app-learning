# Git Workflows and CI/CD Interview Notes

## Advanced Git Concepts

### Merge vs Rebase
When pulling changes from `main` into your feature branch:

- **Merge (`git merge`)**:
  - Adds a new "Merge commit" to the branch history tying the two branches together.
  - **Pros**: Non-destructive, preserves exact history.
  - **Cons**: History can become cluttered with merge commits ("spaghetti history").
  
- **Rebase (`git rebase`)**:
  - Rewrites history by moving the base of your feature branch to the tip of `main`, replaying your commits on top.
  - **Pros**: Creates a beautifully clean, linear hit history.
  - **Cons**: Dangerous if used on shared public branches because rewriting history enforces force-pushing. "Never rebase a public branch."

### Cherry-Pick
- Commits a specific commit from another branch to your current location.
- **Use Case**: A critical hotfix was made in a random branch and you need to apply that single commit to the release branch without bringing the rest of the branch.

### Git Branching Strategies
1. **GitFlow**: Very rigid. `master` (production), `develop` (pre-prod), `feature/`, `release/`, and `hotfix/` branches. Good for desktop apps or scheduled releases.
2. **Trunk-based Development**: Everyone merges into `main` frequently (multiple times a day). Branches are extremely short-lived. Heavily relies on feature flags to hide unfinished features in production.

## Continuous Integration / Continuous Deployment (CI/CD)

### Continuous Integration (CI)
The practice of developers merging their code changes into a central repository frequently. Each merge triggers an automated build and testing process.
- **Goals**: Find and address bugs quickly, improve software quality.
- **Stages**: Linting -> Type Checking -> Unit Tests -> Build.

### Continuous Delivery (CD)
Automates the release of validated code to a repository or staging environment. The code is *ready* to be deployed to production at any given moment, but requires a manual click/approval to push to prod.

### Continuous Deployment (CD)
Goes one step further than delivery. Every change that passes automated tests is automatically deployed to production automatically without human intervention.

### GitHub Actions Workflow Example
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run Unit Tests
        run: npm test
        
      - name: Build
        run: npm run build
        
  deploy_prod:
    needs: build_and_test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS (Script)
        run: ./deploy.sh
```

## Common Interview Questions

### Q: What is an artifact in CI/CD?
A: An artifact is the deployable byproduct of the CI build process. For a React app, it is the `build/` folder (the transpiled and minified static files). Using artifacts saves having to re-build the app repeatedly for different deployment stages.

### Q: How do you resolve a Git conflict?
A: 
1. Use `git fetch` and then `git merge` or `git pull` from the target branch. 
2. Git will mark conflict zones in the files with `<<<<<< HEAD`, `======`, and `>>>>>>`.
3. Open the files, manually edit to preserve the lines of code desired, remove the git markers.
4. Run `git add` to stage the resolved files, and run `git commit`.

### Q: What's the difference between `git pull` and `git fetch`?
A: `git fetch` contacts the remote repository to see if there is any new data, but does NOT integrate it into your working files. `git pull` does a `git fetch` followed immediately by a `git merge`. `git pull` actively changes your files.

### Q: How would you safely handle secrets/API keys in a CI/CD pipeline?
A: 
- Never check `.env` files or hardcoded credentials into Git.
- Use CI/CD secret managers (like GitHub Secrets, AWS Secrets Manager, or HashiCorp Vault). 
- Inject them into the build environment seamlessly as runtime environment variables.

## Additional Git Commands

### git stash
- Temporarily shelves changes (both staged and unstaged) so you can work on something else.

```bash
git stash              # Save current changes
git stash list         # View all stashes
git stash pop          # Apply most recent stash and remove it
git stash apply        # Apply stash but keep it in the stash list
git stash drop         # Delete a specific stash
```

### git reset vs git revert
- **`git reset`**: Moves the branch pointer backward, effectively removing commits from history. **Dangerous on shared branches** because it rewrites history.
  - `--soft`: Uncommit changes but keep them staged.
  - `--mixed` (default): Uncommit and unstage, but keep changes in the working directory.
  - `--hard`: Discard all changes completely.
- **`git revert`**: Creates a **new commit** that undoes the changes of a previous commit. Safe for shared branches because it doesn't rewrite history.

### git bisect
- Binary search through commit history to find the specific commit that introduced a bug.

```bash
git bisect start
git bisect bad           # Current commit has the bug
git bisect good abc123   # This older commit was working fine
# Git checks out the middle commit. You test it, then mark:
git bisect good   # or `git bisect bad`
# Repeat until Git identifies the exact problematic commit.
git bisect reset         # Exit bisect mode
```

## Semantic Versioning (SemVer)
- Format: **MAJOR.MINOR.PATCH** (e.g., `2.4.1`)
  - **MAJOR**: Breaking changes (incompatible API changes).
  - **MINOR**: New features (backwards-compatible additions).
  - **PATCH**: Bug fixes (backwards-compatible fixes).
- **Pre-release**: `1.0.0-beta.1`
- Used in `package.json` ranges: `^1.2.3` (compatible with 1.x.x), `~1.2.3` (compatible with 1.2.x).

## Monorepo Management
- **Monorepo**: Single repository containing multiple projects/packages.
- **Tools**: Nx, Turborepo, Lerna.
- **Benefits**: Shared code, unified CI/CD, atomic cross-project changes.
- **Challenges**: Slower CI, complex permissions, large repo size.

## Deployment Strategies

### Blue-Green Deployment
- Two identical production environments (Blue = current, Green = new version).
- Traffic is switched from Blue to Green instantly via load balancer.
- **Rollback**: Switch traffic back to Blue.
- **Pro**: Zero downtime. **Con**: Requires double infrastructure.

### Canary Deployment
- Roll out the new version to a small subset of users (e.g., 5%) first.
- Monitor metrics (error rates, latency). If healthy, gradually increase to 100%.
- **Rollback**: Route all traffic back to the old version.
- **Pro**: Lower risk than big-bang deployments.

### Rolling Deployment
- Replace instances of the old version with the new version one at a time.
- At any point, both old and new versions are running simultaneously.
- Used by Kubernetes `RollingUpdate` strategy by default.

## Additional Interview Questions

### Q: What are Git hooks?
A: Scripts that Git executes automatically before or after events (commit, push, merge). Common hooks: `pre-commit` (run linter/tests before allowing commit), `pre-push` (run tests before pushing). Tools like Husky make managing Git hooks easy in JS projects.

### Q: How do feature flags work?
A: Feature flags (toggles) let you deploy code to production with new features hidden behind conditional checks. This decouples deployment from release. You can enable features per user, per region, or gradually via percentage rollout. Tools: LaunchDarkly, Unleash, or simple environment variables.
