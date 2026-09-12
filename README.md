# Full Stack Construction ERP Project

![NodeJS](https://img.shields.io/badge/Node.js-v18%2B-green?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-v4.18-blue?style=flat-square&logo=express)
![React](https://img.shields.io/badge/React-v18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-v5-646CFF?style=flat-square&logo=vite)
![MongoDB](https://img.shields.io/badge/MongoDB-v6-47A248?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)

An end-to-end Construction Management & ERP platform for tracking sites, labor (Site Labor), construction materials, tasks across project types (Building, Bridge, Bungalows, Row House, Road Work), invoices, change orders, and analytics reports.

---

## 📁 Project Architecture

```
full stack web/
├── backend/                # Node.js + Express REST API
│   ├── database/           # MongoDB Connection & Schemas
│   ├── routes/             # API Endpoints (Auth, Projects, Workers, Materials, etc.)
│   ├── server.js           # Server Entry Point
│   ├── package.json        # Backend Dependencies
│   └── .env.example        # Environment Blueprint
│
├── frontend/               # React + Vite Frontend UI
│   ├── src/                # Components, Pages & Utility Modules
│   ├── index.html          # App HTML Entry
│   ├── vite.config.js      # Vite Configuration
│   └── package.json        # Frontend Dependencies
│
└── .gitignore              # Git Ignore Rules
```

---

## 🏗️ Supported Construction Types & Categories

- **Building**: Multi-Storey Column Casting, Basement Excavation, AAC Masonry, Lift & Fire Safety.
- **Bridge**: Hydrological Survey, Pier Caps, Pre-Stressed Concrete Girders, Deck Slab Casting.
- **Bungalows**: Land Layout, Footing Plinth Beams, Interior Joinery & Painting.
- **Row House**: Demarcation, Combined Footing, Partition Masonry.
- **Road Work**: Subgrade Excavation, GSB Base, WMM Layer, Asphalt Bituminous Surface.

---

## 🚀 Setup & Quickstart

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

- **Phase 1 (10% - Completed)**: Initial Repository Foundation (Config, Base Files, `.gitignore`, Dependencies structure, Enhanced Documentation).
- **Phase 2 (30%)**: Backend Database Setup & Authentication APIs.
- **Phase 3 (50%)**: Core Backend Services (Projects, Workers, Materials, Invoices API).
- **Phase 4 (75%)**: Frontend Core Architecture & UI Components.
- **Phase 5 (100%)**: Full Integration, Reports Module & Production Release.
