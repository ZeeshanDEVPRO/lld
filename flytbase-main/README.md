# FlytBase Mission Orchestration Platform

A distributed mission-orchestration platform for autonomous drones, built with Next.js, Node.js, MongoDB, and Socket.io.

LIVE LINK : https://flytbase-nu.vercel.app/dashboard


## Architecture

- **Frontend (Next.js)**: Mission Planner, Live Mission Monitor, Fleet Dashboard, Analytics Portal (Deployed on **Vercel**)
- **Backend (Node.js)**: Auth & RBAC Service, Mission Service, Fleet Service, Simulation Engine, Reporting Service (Deployed on **Render**)
- **Database (MongoDB)**: User, Drone, Mission, Waypoint, MissionLog collections
- **Realtime Layer**: Socket.io for mission updates

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)

### Setup Steps

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Configure environment variables:**
```bash
# Backend - MongoDB URI is already configured in .env
# The MongoDB connection string is set to your Atlas cluster
# If you need to change it, edit backend/.env

# Frontend
cd frontend
cp .env.local.example .env.local
# Edit .env.local if needed (defaults should work)
```

3. **Seed the database:**
```bash
cd backend
node scripts/seed-db.js
```
This will create the admin user and sample drones.

4. **Run development servers:**
```bash
# Terminal 1: Backend (from project root)
npm run dev:backend

# Terminal 2: Frontend (from project root)
npm run dev:frontend
```

5. **Access the application:**
- Frontend: [ https://flytbase-nu.vercel.app/dashboard](https://flytbase-nu.vercel.app/dashboard) (Deployed on **Vercel**)
- Backend API: [https://flytbase-3.onrender.com/api](https://flytbase-3.onrender.com/api) (Hosted on **Render**)
- Default login: `admin@flytbase.com` / `admin123`

**Note:** The application is configured as a distributed system with the backend hosted on Render and the frontend served via Vercel.

## Features

### Mission Planning & Configuration
- Define survey areas using interactive map (geo-polygons)
- Generate waypoints for multiple patterns: Grid, Perimeter, Crosshatch
- Configure flight parameters: altitude, overlap percentage, sensors
- Mission scheduling and assignment to drones
- **Tactical Plan Revisions**: Ability to cancel and re-plot blueprint vertices

### Fleet Visualization & Management
- Drone inventory with real-time status
- Battery level monitoring and health status
- Location tracking and assignment management
- Status filtering (idle, in-mission, offline, maintenance)
- **Advanced Maintenance Hub**: Granular "Recharge" and "Maintenance" protocols for idle units
- **Fleet Seeding (Reinforcements)**: Automated protocol to deploy mock drones for testing

### Real-Time Mission Monitoring
- Live mission tracking with WebSocket updates
- Interactive map showing drone position and waypoints
- Progress tracking (percentage, waypoints, distance, duration)
- Mission controls: Start, Pause, Resume, Abort
- **Tactical HUD Overlays**: Technical telemetry overlays displaying unit-specific logistics on-map

### Survey Reporting & Analytics
- Mission statistics (total, completed, average duration)
- Fleet statistics (battery distribution, health status)
- Mission type breakdown charts
- **Detailed Mission Recaps**: Comprehensive per-mission reports with duration, distance, and 🎯 area coverage
- **Global Operation Analytics**: Strategic KPI grid and high-density operation logs

### 🎭 Tactical UX & Immersion (Bonus)
- **Multi-Spectrum Vision Modes**:
  - `Standard`: Clean tactical vision.
  - `Emerald`: Deep green night-vision mode.
  - `Frost`: Ice-blue arctic visibility mode.
  - `Hazard`: Sepia/Orange high-alert mode.
- **Global Intel Ticker**: Live-feed ticker displaying real-time operational metadata and satellite updates.
- **Micro-Animations**: CSS scanline overlays, pulsing status indicators, and smooth transition physics for mission immersion.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Missions
- `GET /api/missions` - List all missions
- `GET /api/missions/:id` - Get mission details
- `POST /api/missions` - Create new mission
- `PUT /api/missions/:id` - Update mission
- `POST /api/missions/:id/control` - Control mission (start/pause/resume/abort)
- `DELETE /api/missions/:id` - Delete mission

### Fleet
- `GET /api/fleet` - List all drones
- `GET /api/fleet/:id` - Get drone details
- `POST /api/fleet` - Create drone
- `PUT /api/fleet/:id` - Update drone
- `DELETE /api/fleet/:id` - Delete drone

### Reports
- `GET /api/reports/missions/stats` - Mission statistics
- `GET /api/reports/fleet/stats` - Fleet statistics
- `GET /api/reports/missions/:id/performance` - Mission performance report

## Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Leaflet, Chart.js
- **Backend**: Node.js, Express, Mongoose, Socket.io, JWT, bcryptjs
- **Database**: MongoDB Atlas (Cloud)
- **Real-time**: Socket.io (WebSockets)

## Project Structure

```
flytbase/
├── backend/
│   ├── database/
│   │   └── schema.sql          # Database schema
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── missions.js          # Mission routes
│   │   ├── fleet.js             # Fleet routes
│   │   └── reports.js           # Reporting routes
│   ├── services/
│   │   ├── waypointGenerator.js # Waypoint generation algorithms
│   │   └── simulationEngine.js  # Mission simulation engine
│   └── server.js                # Express server setup
├── frontend/
│   ├── app/                     # Next.js app directory
│   │   ├── dashboard/          # Dashboard page
│   │   ├── missions/
│   │   │   ├── planner/         # Mission planner
│   │   │   └── monitor/         # Live monitor
│   │   ├── fleet/               # Fleet dashboard
│   │   └── analytics/           # Analytics portal
│   ├── components/              # React components
│   └── lib/                      # Utilities (API client, Socket)
└── README.md
```

## Notes

- The simulation engine uses a timer-based approach (updates every 2 seconds)
- Mission waypoints are pre-generated based on survey area and mission type
- Real-time updates are broadcast via Socket.io
- Authentication uses JWT tokens stored in localStorage
- Default admin user is created automatically (see schema.sql)



## Project Summary: FlytBase Tactical Command Hub



This document summarizes the development journey, architectural decisions, and safety considerations implemented during the creation of the FlytBase Mission Control system.

1. Approach to the Problem
My primary objective was to transform a standard fleet management dashboard into a "Tactical Mission Control" experience. I approached this through three distinct phases:

Aesthetic-First Architecture: Before building individual features, I established a "Strategic HUD" design system. This used glassmorphism, monospace typography, and a "High-Density" layout to mimic professional aerospace software. This ensured that every new component felt integrated into a cohesive "Tactical Hub."
Real-Time Telemetry Loop: I prioritized the feedback loop between the drone (backend) and the operator (frontend). By integrating Socket.io early, I ensured that "Live Monitoring" wasn't just a static view, but a reactive interface where signal updates feel instantaneous.
Next.js Production Hardening: Recognizing that Leaflet and WebSockets often conflict with Next.js SSR/Static generation, I implemented an "Isomorphic Safety" layer—abstracting browser-only dependencies into dynamic components and hardening the API layer against pre-render crashes.


2. Trade-offs Considered
During development, I made several strategic trade-offs to balance visual excellence with system reliability:

Visual Complexity vs. Performance:
Trade-off: I used heavy CSS filters (Vision Modes) and backdrop-blur effects.
Decision: While these add CPU overhead, they were essential for the "Premium Tactical" feel. I mitigated this by ensuring standard layouts remain lightweight and only active HUDs use advanced filtering.
Custom UI vs. Component Libraries:
Trade-off: I avoided generic libraries (like Material UI) in favor of Tailwind + Custom CSS.
Decision: Generic libraries are faster but result in a "templated" look. Custom styling allowed for the specialized "hazard" and "emerald" vision modes that give the tool Its unique identity.
Global State vs. Component-Specific Stores:
Trade-off: I used a centralized in-memory cache in 
api.js
 rather than a complex state manager like Redux.
Decision: For a mission control system, data freshness is more critical than complex state history. The 5-second TTL cache provided a "snappy" UI experience while ensuring the operator always sees near-real-time data on navigation.


3. Safety and Adaptability Strategies
The system was built to be both safe for operations and adaptable for future expansion:

Operational Safety
Logical Safeguards: I implemented backend logic to prevent "Impossible States"—for example, a drone cannot be recharged or decommissioned while its status is in-progress.
Confirm-Abort Protocol: All destructive actions (Abort Mission, Drop Unit, Delete) require a multi-step confirmation, preventing accidental termination of airborne sorties.
SSR Guards: I implemented typeof window !== 'undefined' checks across all authentication and storage utilities, ensuring the application remains stable during the Next.js build and deployment cycle.
Adaptability & Scaling
Provider Abstraction: Leaflet maps were wrapped in dynamic 
MapWrapper
 components. This makes the system Map-Provider Agnostic; if a client wants to switch to Mapbox or Google Maps, only the internal wrapper needs to change.
Unified API Interceptors: The API layer handles token injection and 401-unauthorized redirects globally. This makes it trivial to swap backend URLs (e.g., from local to Render/Vercel) without touching component logic.
Modular Reporting: The reports/[id] architecture uses dynamic IDs and flexible aggregation, allowing the system to scale from simple mission summaries to high-density sensor analysis with no codebase changes.

