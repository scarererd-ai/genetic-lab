# Genetic Laboratory CRM

A full-stack Next.js application for managing genetic laboratory customers, their contacts, world regions, assigned representatives, relationship status, and active/archive state. It is designed for Vercel deployment with PostgreSQL persistent storage and Excel import/export.

## Features

- Add, edit, delete, activate, and archive laboratory/customer records
  
- Search by name, company, telephone, email, representative, region, notes, and status
- Filter by status, active/archive state, representative, and region
- Import the attached Excel format
- Export the current search/filter results to Excel
- Dashboard metrics for total, active, archived, status counts, region counts, and representative counts
- Light blue professional interface with darker blue accents

## Tech Stack

- Next.js App Router
- React + TypeScript
- PostgreSQL
- Prisma ORM
- xlsx for Excel import/export
- Vercel-ready deployment

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Add your PostgreSQL connection string to `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

4. Create the database tables:

```bash
npx prisma migrate dev --name init
```

5. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

1. Push this folder to a GitHub repository.
2. Create or open your Vercel account.
3. Import the GitHub repository into Vercel.
4. Add a PostgreSQL database from Vercel Marketplace, Neon, Supabase, or another provider.
5. Add `DATABASE_URL` in Vercel Project Settings → Environment Variables.
6. Deploy.
7. After the first deploy, run database migrations from your local machine against the production database:

```bash
npx prisma migrate deploy
```

Alternatively, use Vercel's build command:

```bash
npm run build
```

## Importing Your Spreadsheet

A copy of the provided spreadsheet is included in `/sample/Laboratory Summary.xlsx`.

Use the **Import Excel** button in the app. The importer reads:

- Representatives section: region, representative name, representative email
- Laboratories section: region, company/laboratory, contact person, email, status, details

Telephone numbers were not present in the sample spreadsheet, but the app supports them for new/editable records.

## Excel Export

Use **Export Current Search**. The exported Excel file contains only the records currently matching the filters/search.

## Notes

- Archived records are hidden by default because the default filter is `Active`.
- Choose `Archived` or `All` in the Active/Archived filter to view archived records.
- The app uses PostgreSQL, so records persist after deployment and refreshes.
