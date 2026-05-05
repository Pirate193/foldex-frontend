```markdown
# Contributing to Foldex

First off, thank you for considering contributing to Foldex! It's people like you that make Foldex such a great tool for students.

## 🧠 Before You Begin

* **Check existing issues:** Before writing any code, please check the [Issues](https://github.com/Pirate193/pslmp-frontend/issues) tab to see if someone is already working on the same bug or feature.
* **Open a discussion:** If you want to build a major new feature, please open an issue first to discuss it with the maintainers so we don't waste your time if it doesn't fit the roadmap.

## 💻 Local Development Setup

We use Bun for package management and Tauri for the desktop app. 

1. **Fork the repository** to your own GitHub account.
2. **Clone your fork** to your local machine:
   ```bash
   git clone [https://github.com/Pirate193/pslmp-frontend.git](https://github.com/Pirate193/pslmp-frontend.git)
   
```
3. **Install dependencies:**
   ```bash
   bun install
   ```
4. **Start the development servers:**
   * For Web: `bun run dev`
   * For Desktop (Tauri): `bunx tauri dev`

## 🌿 Branching Strategy

Please do not push directly to the `main` branch of your fork. Create a new branch for every feature or bug fix:

* For features: `feature/your-feature-name` (e.g., `feature/ai-flashcards`)
* For bugs: `bugfix/issue-description` (e.g., `bugfix/sync-toast-ui`)

## 📝 Commit Messages

We follow conventional commits to keep our history clean. Please format your commit messages like this:

* `feat: added a new dark mode toggle` (New features)
* `fix: resolved overlapping tooltips in the sidebar` (Bug fixes)
* `docs: updated the README` (Documentation changes)
* `chore: updated dependencies` (Maintenance tasks)

## 🚀 Submitting a Pull Request

1. Ensure your code works locally on both Web and Desktop (`tauri dev`).
2. Push your branch to your fork.
3. Open a Pull Request against our `main` branch.
4. Fill out the Pull Request template completely, including screenshots if you changed the UI.

We will review your PR as soon as possible!
```
