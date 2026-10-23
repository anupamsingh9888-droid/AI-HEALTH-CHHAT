# AI Health Copilot - Python FastAPI Backend with Gemini Multimodal Document AI

This directory contains the production-grade Python FastAPI backend for **AI Health Copilot**.

It provides:
- **Multimodal Medical Document AI**: **Google Gemini 2.5 Flash** native document processing, extracting verbatim reading lines, structured key-value pairs (forms), multi-column laboratory tables, and clinical findings from images and PDFs in a single unified step.
- **Clinical Structuring & Chat**: Gemini API (`gemini-2.5-flash`) for plain-English document summarization, important clinical findings, and questions to discuss with a healthcare clinician.
- **Authentication & Persistence**: **Supabase Auth** and **Supabase PostgreSQL** with Row-Level Security (RLS).
- **REST Endpoints**: Validated with Pydantic schemas, comprehensive error handling, and interactive OpenAPI documentation (`/docs`).

---

## Document Processing: Google Gemini Multimodal AI

Google Gemini natively processes document images and multi-page PDFs using unified visual-text understanding, eliminating the need for third-party OCR services like Amazon Textract or Azure Vision.

### Supported Document Formats & Limits
- **File Formats**: `PDF`, `PNG`, `JPEG`, `WebP`, `TIFF` (converted in-memory).
- **Inline Upload Limit**: Up to **15 MB** per document.
- **Features Extracted**:
  - `TABLES`: Multi-column medical laboratory panels, blood counts, and dosage grids.
  - `FORMS`: Key-value form fields (e.g. Patient Name, Date, Prescribing Clinician, Refills).
  - `VERBATIM OCR`: Complete reading-order transcription with confidence indicators.
  - `CLINICAL SAFETY`: Explicitly flags ambiguous or faded text in `uncertain_or_unclear_fields` without guessing medications, dosages, or lab numbers.

---

## Environment Variables
Set these variables in `backend/.env`:
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIzaSy...
```

> **Developer Mode / Offline Testing**: If `GEMINI_API_KEY` is not yet configured, the backend automatically provides a deterministic local fallback parser so that local tests and development work smoothly.

---

## Local Setup for Windows (PowerShell Step-by-Step)

Follow these exact steps in Windows PowerShell to set up and run both the backend and frontend.

### Prerequisites
1. **Python 3.10, 3.11, or 3.12**
   - Check with: `python --version`
2. **Node.js 18+ & npm**
   - Check with: `node --version`

---

### Step 1: Open PowerShell and Navigate to the Backend Directory

```powershell
cd "path\to\ai-health-copilot\backend"
```

---

### Step 2: Set Up Python Virtual Environment

```powershell
# Create a virtual environment
python -m venv venv

# If execution of scripts is restricted in your PowerShell, enable for current process:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
```

---

### Step 3: Install Dependencies

```powershell
# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Install all backend dependencies (fastapi, uvicorn, pydantic, supabase, google-genai, pillow, pypdf)
python -m pip install -r requirements.txt
```

---

### Step 4: Configure `.env` File

Copy `.env.example` to `.env` if you have not already:

```powershell
Copy-Item .env.example .env
```

Open `.env` in your editor and enter your credentials:
- `SUPABASE_URL` & `SUPABASE_ANON_KEY` (from Supabase Dashboard -> Settings -> API)
- `GEMINI_API_KEY` (from Google AI Studio: https://aistudio.google.com/)

---

### Step 5: (Optional) Apply Supabase Schema

If using Supabase for database persistence:
1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** -> **New Query**.
3. Paste the contents of `backend/supabase_schema.sql` and click **Run**.
4. This creates tables for `profiles`, `medical_reports`, `chat_messages`, `health_measurements`, and `health_insights` with Row-Level Security (RLS).

---

### Step 6: Start FastAPI Backend

In your backend PowerShell terminal (with `venv` active):

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify the health check in a browser or terminal:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```
Interactive Swagger documentation is available at: **http://127.0.0.1:8000/docs**

---

### Step 7: Start Vite Frontend

In a **second PowerShell window**:

```powershell
cd "path\to\ai-health-copilot"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view and test the application.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System status, AWS Textract readiness, Supabase & Gemini status |
| `POST` | `/api/auth/signup` | Register user via Supabase Auth |
| `POST` | `/api/auth/login` | Authenticate user session |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/profile` | Retrieve user health profile |
| `PUT` | `/api/profile` | Update user health profile |
| `POST` | `/api/reports/upload` | Upload report (PDF/image) -> Amazon Textract (tables & forms) -> Gemini clinical summary |
| `GET` | `/api/reports` | List processed medical reports |
| `GET` | `/api/reports/{id}` | Retrieve report details, extracted tables, and doctor questions |
| `DELETE`| `/api/reports/{id}` | Delete report |
| `POST` | `/api/chat` | Send health message -> Gemini AI Health Copilot response |
| `GET` | `/api/chat/history` | Conversation history |
| `DELETE`| `/api/chat/history`| Clear conversation history |
| `GET` | `/api/health/summary` | Personalized health summary |
| `GET` | `/api/health/insights`| 7-day comparative health trends |
| `POST` | `/api/health/recommendations` | Evidence-based lifestyle suggestions |

---

## Medical Safety & Compliance

- **No Medical Practice**: AI Health Copilot provides general health information and observational trend tracking. It is never a licensed clinical doctor and does not prescribe or diagnose.
- **Verification Notice**: Extracted medications, lab numbers, and dosages must always be verified by the user against the original physical paper report.
