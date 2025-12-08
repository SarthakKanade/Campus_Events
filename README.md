# Campus Events Management System (MERN Stack)

## Project Overview
This project is a comprehensive event management system designed for college campuses. It covers the full lifecycle of an event:
1.  **Planning**: Governance, approval, and conflicts.
2.  **Student Experience**: Discovery, RSVP, and Digital Tickets.
3.  **Execution**: QR Code Check-in and hardware integration.
4.  **Legacy**: Post-event analytics, photo galleries, and feedback loops.

## Tech Stack
*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts, QR Code React.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose) with complex schema relationships.
*   **Auth**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

## Features
*   **Role-Based Dashboards**: Distinct views for Students, Organizers, and Admins.
*   **Digital RSVP**: Generates unique QR codes for attendees.
*   **Hardware Integration**: Webcam-based QR Scanner for attendance tracking.
*   **Post-Event Analytics**: Bar charts comparing RSVPs vs. Real-time Check-ins.
*   **Gallery & Feedback**: 5-star rating system and image galleries for completed events.

## Setup Instructions

### 1. Prerequisites
*   Node.js (v14 or higher)
*   MongoDB (Local or Atlas URI)

### 2. Installation
```bash
# Install all dependencies (Root, Server, Client)
npm run install-all
```

### 3. Environment Variables
Create a `.env` file in `server/`:
```env
MONGO_URI=mongodb://localhost:27017/campusevents
JWT_SECRET=your_jwt_secret_key
PORT=5001
```

### 4. Database Seeding
Populate the database with sample users (Admin, Organizers, Students) and events:
```bash
# Run from root directory
node server/seed.js
node server/seed-extra.js
```

### 5. Running the App
```bash
# Runs both Server and Client concurrently
npm start
```
*   **Frontend**: `http://localhost:5173`
*   **Backend**: `http://localhost:5001`

## Credentials (Seed Data)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `admin123` |
| **Organizer** | `coding@college.edu` | `password123` |
| **Student** | `student1@college.edu` | `password123` |

## API Documentation
See `API_DOCS.md` for full endpoint details.
