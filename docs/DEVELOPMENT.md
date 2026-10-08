# TrafficPulse-X Development Guide

This guide outlines setup, execution, testing, and repository development conventions for TrafficPulse-X.

---

## 1. Environment Requirements

- **Python**: Python 3.10+ (Tested on Python 3.14.7)
- **Node.js**: Node.js v18+ / v20+ (Tested with npm & Vite v8.3.3)

---

## 2. Installation & Setup

### Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows (PowerShell)
   .\.venv\Scripts\Activate.ps1
   # Linux/macOS
   source .venv/bin/activate
   ```
2. Install direct Python dependencies:
   ```bash
   python -m pip install -r backend/requirements.txt
   ```

### Frontend Setup
1. Install Node dependencies:
   ```bash
   npm install
   ```

---

## 3. Running TrafficPulse-X

### Starting the Backend API Server
Start the single FastAPI web application instance on port 8000:
```bash
# From workspace root
python -m uvicorn backend.main:app --reload --port 8000
```
API Documentation will be accessible at `http://localhost:8000/docs`.

### Starting the Frontend Development Server
Start the React Vite development server on port 5173:
```bash
npm run dev
```
The React User Interface will be accessible at `http://localhost:5173`.

---

## 4. Testing & Verification

### Running Backend Unit & Regression Tests
Run the full 270-test backend pytest suite:
```bash
# On Windows PowerShell
$env:PYTHONPATH="." ; pytest backend -v

# On Linux/macOS
PYTHONPATH=. pytest backend -v
```
All **270 tests** must pass.

### Building Frontend Production Assets
Verify the Vite production build succeeds:
```bash
npm run build
```

---

## 5. Key Repository Conventions

1. **Single FastAPI Rule**: All API routes are declared in `backend/main.py` under `/api/*`. Do NOT spawn parallel backend servers.
2. **Frontend Gateway Rule**: All UI components fetch data through `src/services/api.js`. Do NOT write component-level `fetch` calls.
3. **No Environment Dumps (`pip freeze`)**: Keep `backend/requirements.txt` restricted to direct project runtime, ML, and test dependencies.
4. **Frozen Scientific Checkpoints**: Model weight files (`graph_lstm_best.pt`, `global_best.pt`) and evaluation summaries are frozen contracts. Do NOT retrain or overwrite them without explicit directives.
5. **Standardized Terminology**: Refer to dataset replay as *Historical Replay*, FL participants as *Regional FL Clients*, and Need Score as a *DERIVED* 9-factor metric.
