# SignalRX

SignalRX is an AI-powered healthcare social listening platform designed to monitor, analyze, and visualize patient safety signals from social media and other public sources. It uses advanced artificial intelligence to extract critical insights, assess risk scores, and present trends in an intuitive, secure dashboard.

## Features

- **AI-Powered Analysis**: Integrates with Groq AI to process and analyze healthcare-related posts for safety signals, adverse events, and trends.
- **Three-Tab Dashboard**:
  - **Configuration**: Set up and manage data ingestion pipelines and AI parameters.
  - **Posts**: View and filter raw social listening data with AI-generated summaries.
  - **Signals**: Monitor dynamic risk scoring, trend visualizations, and high-priority patient safety insights.
- **Secure Authentication**: Robust Firebase OTP-based authentication with a secure admin dashboard.
- **Real-time Data Visualization**: Interactive charts and graphs powered by Recharts.

## Tech Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Styling**: Modern CSS / UI Components
- **Icons**: Lucide React
- **Charts**: Recharts
- **Authentication**: Firebase Auth (OTP)
- **Routing**: React Router DOM

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor / PyMongo for async operations)
- **AI Integration**: Groq API
- **Data Processing**: NumPy, SciPy

## Project Structure

```
SignalRX/
├── backend/            # FastAPI backend, AI pipeline, and database models
│   ├── engines/        # Core processing engines
│   ├── pipeline/       # Data ingestion pipelines
│   ├── main.py         # FastAPI application entry point
│   ├── models.py       # Pydantic data models
│   ├── database.py     # MongoDB connection setup
│   └── requirements.txt# Backend dependencies
└── frontend/           # React frontend application
    ├── src/            # Source components and views
    ├── public/         # Static assets
    ├── package.json    # Frontend dependencies
    └── vite.config.js  # Vite configuration
```

## Instructions to Run

To run the project locally so reviewers can test the platform, follow the steps below.

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB instance (Local or Atlas)
- Firebase Project configured
- Groq API Key

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (create a `.env` file in the `backend/` directory):
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GROQ_API_KEY=your_groq_api_key
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will be available at `http://127.0.0.1:8000`*

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (create a `.env` file in the `frontend/` directory):
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   # ... other Firebase config variables
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`*

### 3. Testing the Application (For Reviewers)
1. Open your browser and navigate to `http://localhost:5173`.
2. Click on **Log In** or **Sign Up**.
3. *Note for Reviewers*: For ease of testing and evaluation, the OTP (One-Time Password) verification step has been **bypassed** in this development build.
4. You will be automatically redirected to the main dashboard where you can interact with the SignalRX platform, view the configured signals, and monitor patient safety trends.

## License

This project is licensed under the MIT License.
