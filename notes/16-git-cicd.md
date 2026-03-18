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
