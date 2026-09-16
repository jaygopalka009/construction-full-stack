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
│   ├── routes/             # API Endpoints (Auth, Projects, Workers, Materials, Equipment, Reports)
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

## ✨ Key Features & Capabilities

- **Role-Based Portals**: Tailored dashboards for Administrators and Site Engineers.
- **Project Lifecycle Tracking**: Track milestones, categories, and progress from excavation to handover.
- **Heavy Machinery & Fleet Management**: Real-time tracking of excavators, cranes, transit mixers, rollers, running meter hours, maintenance service intervals, and site dispatch allocation.
- **Resource Management**: Real-time monitoring of site labor, attendance, and material catalogs.
- **Cost & Expense Auditing**: Live expense analysis, budget allocation, and financial tracking.
- **Site Activity Logging**: Daily site reports with status badges, weather conditions, and engineering notes.

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

## 📅 Project Roadmap & Implementation Modules

- **Phase 1**: Initial Repository Foundation & Configuration Setup.
- **Phase 2**: Backend Server Setup, Database Connection & Authentication APIs.
- **Phase 3**: Core Backend Services (Projects, Workers, Materials, Reports API).
- **Phase 4**: Frontend Core Architecture & Dual Dashboards (Admin & Site Engineer).
- **Phase 5**: Full Integration, Site Reports & Production Release.

---

## 🚜 Equipment & Machinery REST API
- `GET /api/equipment`: Retrieve list of all heavy construction machinery assets.
- `POST /api/equipment`: Register new machinery into site inventory.
- `PUT /api/equipment/:id`: Update machinery operational status (Operating, Idle, Maintenance).
- `POST /api/equipment/:id/log-shift`: Log daily shift running hours and fuel reading.
- `POST /api/equipment/:id/service`: Record maintenance overhaul event and advance next service interval.
- `DELETE /api/equipment/:id`: Remove machinery from fleet database.

