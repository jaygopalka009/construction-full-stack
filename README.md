# Full Stack Construction ERP Project

An end-to-end Construction Management & ERP platform for tracking sites, labor (Site Labor), construction materials, tasks across project types (Building, Bridge, Bungalows, Row House, Road Work), invoices, change orders, and reports.

---

## 📁 Project Structure

```
full stack web/
├── backend/                # Node.js + Express REST API
│   ├── database/           # MongoDB Connection & Models
│   ├── routes/             # API Endpoints (Auth, Projects, Workers, Materials, etc.)
│   ├── server.js           # Server Entry Point
│   ├── package.json        # Backend Dependencies
│   └── .env.example        # Environment Variable Blueprint
│
├── frontend/               # React + Vite Frontend UI
│   ├── src/                # Components, Pages & Logic
│   ├── index.html          # App HTML Entry
│   ├── vite.config.js      # Vite Configuration
│   └── package.json        # Frontend Dependencies
│
└── .gitignore              # Git Ignore Rules
```

---

## 🚀 Setup & Installation

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📅 Commit Roadmap (Daily Incremental Pushes)

- **Phase 1 (10% - Completed)**: Initial Repository Foundation (Config, Base Files, `.gitignore`, Dependencies structure, Documentation).
- **Phase 2 (30%)**: Backend Database Setup & Authentication APIs.
- **Phase 3 (50%)**: Core Backend Services (Projects, Workers, Materials, Invoices API).
- **Phase 4 (75%)**: Frontend Core Architecture & UI Components.
- **Phase 5 (100%)**: Full Integration, Reports Module & Production Release.
