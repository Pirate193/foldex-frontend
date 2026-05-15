# PSLMP — Frontend

> Personalized Self-Learning Management Platform — web and desktop client.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tauri](https://img.shields.io/badge/Tauri-2-blue?logo=tauri)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)
![CI](https://github.com/YOUR_USERNAME/pslmp-frontend/actions/workflows/ci.yml/badge.svg)

PSLMP is an open-source, offline-first note-taking platform for students. Write notes with a rich block editor, embed flashcards and quizzes directly inside your notes, chat with AI using your own API key, work offline on the desktop app with automatic sync when you reconnect and manim video generation.

**Live app → [pslmp.foldex.space](https://pslmp.foldex.space)**  
**Backend repo → [pslmp-backend](https://github.com/Pirate193/pslmp-backend)**
**ManimRenderer repo ->[pslmp-manim-renderer](https://github.com/Pirate193/pslmp-manim-renderer.git)**

---

## Screenshots


| Home | Editor | AI Chat |
|---|---|---|
| ![home](docs/home.png) | ![editor](docs/editor.png) | ![ai](docs/ai.png) |

---

## Features

- **Block editor** — Notion-style editor with slash commands, built on BlockNote
- **Custom blocks** — Flashcard, Quiz, YouTube embed, Mermaid diagram, Whiteboard — all live inside notes
- **Multi-tab** — Open multiple notes simultaneously, VS Code style
- **AI assistant** — Chat panel that can create and update notes via tool calls. Bring your own API key (OpenAI, Anthropic, Google, DeepSeek, xAI, Moonshot)
- **File attachments** — Attach PDFs, DOCX, PPTX, and images. Text is extracted client-side so every AI model can read them regardless of vision support
- **Offline-first desktop** — Full read/write when disconnected. Changes sync automatically on reconnect via a local SQLite write queue
- **Video generation**- generate manim explanatory video with prompt to break down any concept
- **Folders** — Nested folder tree with drag-and-drop, colour coding, and pinning
- **OTP auth** — Passwordless sign-in via email one-time code. No passwords stored

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Editor | BlockNote |
| Desktop shell | Tauri 2 |
| Server state | TanStack Query |
| Client state | Zustand |
| Auth client | Better Auth |
| AI streaming | Vercel AI SDK |
| Local DB (desktop) | SQLite via tauri-plugin-sql |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Node.js](https://nodejs.org) >= 20
- [Rust](https://rustup.rs) — only required if building the desktop app
- A running instance of [pslmp-backend](https://github.com/Pirate193/pslmp-backend)
- **Optional:** A running instance of the Manim Flask Renderer (required for AI video generation)[]()

### 1. Clone and install

```bash
git clone https://github.com/Pirate193/pslmp-frontend.git
cd pslmp-frontend
bun install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run

```bash
# Web (http://localhost:3001)
bun dev

# Desktop (requires Rust)
bunx tauri dev
```

### Building for production

```bash
# Web
bun run build

# Desktop installer (.exe on Windows, .dmg on macOS) make sure to uncomment the output export and image unoptimized  in next config when building 
bunx tauri build
```

---

## Project Structure

```
src/
  app/                  # Next.js App Router pages and layouts
  components/
    ai-elements/        # Chat UI primitives (message, conversation, reasoning)
    homecomponents/     # all components shown in Home foldercard,videocard,notecard
    notescomponent/     # BlockNote editor custom blocks ,Note header , note item, rename/move  dialogs
    tabs/               # Multi-tab system
    tabs/content        # rendered tab UI for notes,video
    landingpage/        # Marketing site components
    sidebarcomponents/  # all the side bar components 
    videos/             # video components ,player,card ,item ,generationmodal,watchlist,watchpage
    views/              # all the view components rendered in app (note-view,video-view,...)
  hooks/                # TanStack Query hooks (use-notes, use-folders, ...)
  lib/
    ai/                 # All of the ai files to make the ai work client side only for desktop
    services/           # All the local sqllite configuration (localfolders.ts,sync.ts,...)
    api.ts              # Axios API client with typed request functions
    api-types.ts        # Shared TypeScript types matching backend responses
    auth-client.ts      # better auth configurations
    providers.ts        # AI provider + model registry (IDs, prefixes, models)
    localdb.ts          #local sqllite db configuration
    schema.local.ts     # sqlite schema definition
  stores/               # Zustand stores (tabs, AI modal, settings)
src-tauri/              # Tauri Rust shell, config, and icons
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the setup guide, branch workflow, and PR checklist.

---

## License

[MIT](./LICENSE)