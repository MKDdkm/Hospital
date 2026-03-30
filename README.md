# MedCore HMS - AI-Driven Hospital Management System (Phase-1)

Phase-1 web platform for hospital operations management with role-based access for receptionist, doctor, and admin users.

## Overview

MedCore HMS centralizes the core day-to-day workflows needed in a clinic or hospital front office:

- Patient registration and records
- Appointment scheduling and token management
- Prescription entry and review
- Billing and payment tracking
- Role-wise dashboards and summary reports

Current implementation uses mock data for rapid UI and workflow validation.

## Roles and Modules

- Receptionist:
	- Register and manage patients
	- Book appointments
	- View patient list
	- Generate and review bills
- Doctor:
	- Search patients
	- View patient history
	- Create prescriptions
	- View issued prescriptions
- Admin:
	- System summary dashboard
	- User management
	- Reports and analytics

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- Recharts (analytics)
- Vitest + Testing Library
- Playwright (E2E setup)

## Project Structure

Key directories:

- `src/pages/` - Role-wise page screens
- `src/components/` - Shared layout and UI components
- `src/data/mockData.ts` - Mock hospital data used by dashboards and modules
- `src/contexts/AuthContext.tsx` - Role-based session context

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open app in browser:

```text
http://localhost:5173
```

## Build and Quality Checks

Run production build:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

## Deployment Notes

- Framework: Static front-end build output (`dist/`)
- Recommended hosts: Netlify, Vercel, AWS S3 + CloudFront, or any static server
- Environment variables: Not required for current mock-data build

## Current Scope

This repository contains Phase-1 implementation. Production backend APIs, real authentication, and advanced AI workflows are planned for subsequent phases.

## Ownership

Maintained by MedCore HMS engineering team.
