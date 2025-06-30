# 🎫 Ticket Management System – Frontend

A modern, scalable ticket management frontend built with **React** and **TypeScript**, designed to support internal workflows such as issue tracking, task assignment, file attachments, comments, and more.

---

## ✨ Features

- 🎯 **Role-Based Access Control** (Admin, Staff, Client)
- 🧾 **Ticket Management**: Create, update, assign, and change ticket status
- 🗃️ **Kanban Board** with drag-and-drop (using `@hello-pangea/dnd`)
- 💬 **Rich Text Editor** (Lexical) for comments and discussions
- 📁 **Attachments Panel** with file preview & download
- 🔍 **Advanced Filtering & Search** using URL query params
- 🔄 **Real-Time Updates** via Pusher (e.g., chat or ticket changes)
- 📡 **Slack OAuth Integration**
- 📜 **Audit Log Table** with inline edit and status tracking
- 🧠 Optimistic UI updates with React Query
- 📱 Fully responsive UI

---

## 🧱 Tech Stack

### 🖥️ Frontend Technologies

| Technology             | Description                                      |
|------------------------|--------------------------------------------------|
| **React**              | UI library                                       |
| **TypeScript**         | Static typing for maintainability                |
| **Tailwind CSS**       | Utility-first CSS framework                      |
| **ShadCN UI**          | Accessible, reusable UI components (Radix-based) |
| **React Router**       | Declarative routing                              |
| **TanStack Query**     | Powerful async state & caching                   |
| **Zustand**            | Lightweight state management                     |
| **Lexical**            | Modular rich text editor                         |
| **@hello-pangea/dnd**  | Drag-and-drop Kanban support                     |
| **Pusher**             | Real-time updates and communication              |
| **Slack OAuth**        | Sign in with Slack accounts                      |
| **Date-fns**           | Date formatting and utilities                    |

---

## 🗂 Project Structure

src/
├── components/ # Shared UI components (modals, buttons, etc.)
├── features/ # Feature-based folders (tickets, users, clients...)
├── hooks/ # Custom React hooks
├── lib/ # Utility helpers (formatters, constants)
├── pages/ # Page routes (TicketsPage, ClientsPage, etc.)
├── services/ # API integrations using fetch or axios
├── stores/ # Zustand stores (tabs, auth, etc.)
├── types/ # TypeScript types and enums
├── editor/ # Lexical editor config and plugins
└── App.tsx # Root component

---

## 🧪 Getting Started

1. Clone & Install

git clone https://github.com/your-username/ticket-system.git
cd ticket-system
npm install


2. Configure Environment
Create a .env file and set required variables:
VITE_API_URL=http://localhost:3000
VITE_PUSHER_KEY=your-pusher-key
VITE_PUSHER_CLUSTER=ap1
VITE_SLACK_CLIENT_ID=your-client-id

3. Run Development Server
npm run dev


--------
📸 UI Highlights
Screenshot	Description
🎛️ Dashboard	Analytics, ticket summary
🧾 Ticket Detail	Inline edit, assignment, logs
💬 Conversations	Real-time chat with clients
🗂️ Tab Management	Persistent, closeable tabs
📁 File Preview	Image and PDF preview, download


--------

🧑‍💻 Developer Notes
✅ Uses optimistic UI for fast updates on status/assignment

✅ Infinite scroll for chat & comment history

✅ Reusable modular component architecture

✅ Built-in accessibility, responsive layout

✅ Detailed loading/error/success state handling


