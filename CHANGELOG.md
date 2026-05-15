# Changelog

All notable changes to PSLMP are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.0] — 2026-05-14

Initial public release. This is the first version of PSLMP submitted as part of CCS/CSE 2328 Project I at Multimedia University of Kenya.

### ✨ Added — Editor

- Block-based note editor built on BlockNote with slash command menu (`/`)
- Built-in blocks: Paragraph, Heading (H1–H3), Bullet list, Numbered list, Code block, Quote, Divider
- **Custom blocks**: Flashcard (flippable question/answer cards), Quiz (multiple choice self-assessment), YouTube embed, Mermaid diagram renderer, Whiteboard canvas
- Multi-tab note view — open multiple notes simultaneously like VS Code, with per-tab scroll position and unsaved change indicator

### ✨ Added — Organisation

- Nested folder tree with unlimited depth and drag-and-drop
- Folder colour coding and pinning
- Note pinning, recents section, and workspace sort (A–Z, Z–A, Newest, Oldest)
- Sidebar search with live filtering
- Resizable sidebar with persisted width

### ✨ Added — AI Assistant

- Streaming AI chat panel (SSE) with full conversation history
- **Tool calls** — AI can create notes, update notes, create folders, generate code snippets, generate Mermaid diagrams, embed YouTube videos, and search the web
- `@mention` notes and folders in your prompt to give the AI direct context
- `/` prompt shortcuts — pre-written prompts like "Summarise" and "Quiz Me"
- Model selector — switch providers and models mid-conversation
- Retry and copy actions on every AI message

### ✨ Added — Bring Your Own API Key

- Supported providers: OpenAI, Anthropic, Google Gemini, DeepSeek, xAI Grok, Moonshot (Kimi)
- Keys stored locally on your device — never sent to PSLMP servers
- Web search via Tavily (optional — button disabled when key is absent)
- Custom system prompt override in Settings

### ✨ Added — File Attachments

- Attach PDF, DOCX, PPTX, images, and plain text files to any chat message
- Client-side text extraction: pdf.js for PDFs, mammoth for DOCX, Tesseract.js OCR for images without vision support
- Per-attachment parse status shown on the prompt input (parsing → ready → failed)
- Submit is blocked until all attached files have finished parsing
- Works with every AI model — even models without native vision capability

### ✨ Added — Auth

- Passwordless OTP sign-in via email — no passwords ever stored
- 6-digit code expires in 10 minutes
- Session managed by Better Auth with secure HttpOnly cookies

### ✨ Added — Templates

- Save any note as a personal reusable template
- Community template gallery — browse and apply templates shared by other users
- Applying a template creates a new note with all block IDs regenerated

### ✨ Added — Desktop App (Windows)

- Native Windows desktop app built with Tauri 2
- Offline mode — full note read and write with no internet connection
- Local SQLite database stores notes, folders, and chats while offline
- Offline banner with live sync status and pending mutation count
- On reconnect — local changes are automatically pushed to the cloud
- On first sign-in — guest data created before signing in is adopted and synced
- Sync map tracks local ↔ cloud ID mappings so folder references never break during push
- API keys stored in the OS secure keychain on desktop

### ✨ Added — Infrastructure

- Frontend and API deployed on a self-hosted VPS via [Dokploy](https://dokploy.com)
- `pslmp.foldex.space` (web) and `api.pslmp.foldex.space` (API) on Cloudflare DNS
- Transactional OTP email via Resend
- GitHub Actions CI — build check on every push to `main`

---

### ⚠️ Known Limitations in 0.1.0

- PPTX extraction is partial — complex slide layouts may be incomplete
- Offline sync is last-write-wins — simultaneous edits on web and desktop may overwrite each other
- Whiteboard block content is not included in AI context
- Desktop build is **Windows only** — macOS requires an Apple Developer account for notarisation
- Community block plugins (install/publish custom blocks) are planned but not yet built
- Google OAuth is disabled on the desktop app

---

## Upcoming

| Release | Focus |
|---|---|
| `v0.2.0` | macOS desktop build · Note export to PDF and Markdown · Full-text search |
| `v0.3.0` | Community block plugin system — install and publish custom blocks |
| `v0.4.0` | Conflict-aware sync with per-field merge instead of last-write-wins |
| `v0.5.0` | Mobile app |

---

[0.1.0]: https://github.com/Pirate193/pslmp-frontend/releases/tag/v1.0.0