## AI Career & Internship Agent

Northstar helps students compare a resume with an internship or job description, understand skill alignment, plan targeted learning, choose portfolio projects, and practice for interviews.

Live Demo: https://ai-career-project-xi.vercel.app/

## Features
- Email/password registration and sign-in with Auth.js Credentials and JWT sessions.
- PDF resume upload with size and signature checks, chunked transfer, MongoDB GridFS storage, and server-side text extraction.
- Resume and job description analysis, evidence-based matched/partial/missing skills, and an alignment estimate.
- Personalized learning roadmaps, project ideas, and technical, behavioral, and resume-specific interview practice.
- Private analysis history and owner-scoped API access.
- Responsive Next.js App Router UI with accessible loading, error, and empty states.

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS, MongoDB Atlas with Mongoose, Auth.js, Zod, `pdf-parse`, and Recharts. AI calls use a server-only OpenAI-compatible chat completions endpoint.

## Local Setup
1. Use Node.js 20.19 or newer and install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`, `NEXTAUTH_SECRET`, and `GROQ_API_KEY`. The example uses Groq's OpenAI-compatible endpoint and `openai/gpt-oss-120b`; override `GROQ_MODEL` if you choose another Groq model.
3. Start MongoDB locally or create an Atlas database and allow the development machine's IP in Atlas Network Access.
4. Start the app with `npm run dev`, then open [http://localhost:3000](http://localhost:3000).

Generate a strong Auth.js secret locally with `openssl rand -base64 32`. Do not commit `.env.local` or place secrets in `NEXT_PUBLIC_*` variables. Registration requires a password of at least 12 characters.

## Environment Variables
| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for Compass or local MongoDB. |
| `NEXTAUTH_URL` | Production | Public deployment URL used by Auth.js. |
| `NEXTAUTH_SECRET` | Production | Secret used to sign/encrypt Auth.js session tokens. |
| `GROQ_API_KEY` | For analysis | Server-only API key from your Groq account. |
| `GROQ_MODEL` | No | Groq model name; defaults to `openai/gpt-oss-120b`. |
| `GROQ_API_BASE_URL` | No | Groq-compatible endpoint; defaults to `https://console.groq.com/home`. |

Analysis is unavailable until the LLM key and model are configured. No AI credentials are needed to build the application.

## Resume and Data Handling
PDF uploads are limited to 15 MiB and transferred in 1 MiB chunks so individual requests remain below common serverless body limits. Chunks are staged in MongoDB with a one-hour TTL, assembled into the `resumes` GridFS bucket, then removed after successful processing. Text extraction runs locally on the server; image-only PDFs fall back to English OCR for the first four pages. OCR does not send the PDF to Groq or another external service and requires outbound access to download Tesseract's English language data on a cold start. Extracted text is stored on the owner's Resume record; structured career results are stored in CareerAnalysis. All resume, analysis, and download queries are scoped to the signed-in user.

The alignment percentage is an estimate from extracted resume evidence and job requirements. It is not a hiring prediction. AI-generated guidance should be reviewed for accuracy and adapted to the student's real experience.

## Commands
```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

## Vercel Deployment
1. Push the repository to GitHub and import it into Vercel as a Next.js project.
2. Configure the environment variables above for the Production environment. Set `NEXTAUTH_URL` to the deployment's canonical HTTPS URL and create a unique `NEXTAUTH_SECRET` for each environment.
3. Configure MongoDB Atlas Network Access for the Vercel deployment and use a least-privilege database user.
4. Confirm the deployed function duration limit supports the `maxDuration` configured for analysis routes. AI response latency varies by provider and model.
5. Deploy and test registration, resume upload, analysis, history, and cross-account access using separate test accounts.

## Architecture
- `lib/ai/` contains the OpenAI-compatible adapter and the six focused analysis/generation services. Every structured response is validated with Zod before it can be persisted or displayed.
- `lib/db/` contains the serverless-safe Mongoose connection, User/Resume/CareerAnalysis models, GridFS operations, and temporary upload staging models.
- `app/api/` contains Auth.js, registration, resume upload/download, and career analysis Route Handlers. Private endpoints authorize on the server and scope access by session user ID.
- `app/(workspace)/` contains authenticated dashboard, history, and analysis detail pages.
