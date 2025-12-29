# AASTU Q&A

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**Tech stack**: Vite + React + TypeScript + shadcn-ui + Tailwind (frontend) / Node.js + Express + Prisma + PostgreSQL (backend).

**AASTU Q&A** is a platform designed to foster communication and knowledge sharing within the campus. It enables users to create spaces, post questions, share updates, and engage in discussions anonymously or publicly.

---

## 🚀 Features

- **Anonymous & Verified Posting**: Share thoughts freely or as a verified student/staff.
- **Spaces (Communities)**: Join and create focused groups for topics or departments.
- **Rich Content**: Support for Markdown and image uploads in posts.
- **Interactive**: Upvoting, downvoting, saving posts, and threaded comments.
- **Profiles**: Public user profiles to showcase activity (read-only view).
- **Notifications**: Stay updated with relevant interactions.

## 🛠️ Tech Stack

**Frontend**
- [Vite](https://vitejs.dev/) - Fast build tool
- [React](https://reactjs.org/) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Reusable components

**Backend**
- [Node.js](https://nodejs.org/) - Runtime environment
- [Express](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - ORM
- [PostgreSQL](https://www.postgresql.org/) - Database

## 📂 Repository Structure

This project is organized as a monorepo:

- [`frontend/`](./frontend) - All React client code.
- [`backend/`](./backend) - All Express server code.

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- **Node.js** (v20 or higher)
- **PostgreSQL** (v13 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abemchegen/aastuqanda.git
   cd aastuqanda
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   ```

3. **Frontend Setup**
   Open a new terminal:
   ```bash
   cd frontend
   npm install
   # The default API URL is http://localhost:4000/api
   npm run dev
   ```

The frontend should now be running at default Vite port (usually `http://localhost:5173`).

## ⚙️ Environment Variables

Check `.env.example` in both `backend` and `frontend` directories for the required variables.

**Backend (.env)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET="your-super-secret-key"
# ... other vars
```

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started, our code of conduct, and the PR process.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

---
Built with ❤️ by the AASTU Q&A Team.
