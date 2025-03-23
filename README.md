# OBR Forecast Impact Estimator

A web application that uses PolicyEngine to estimate the impact of different Office for Budget Responsibility (OBR) forecasts, including the upcoming Spring 2025 forecast (March 27, 2025).

## Technology Stack

- **Backend**: FastAPI (Python 3.10)
- **Frontend**: Next.js with TypeScript
- **Dependency Management**: pip (Python), npm (JavaScript)
- **Visualization**: Recharts
- **UI Framework**: Radix UI
- **Deployment**: Docker, Google Cloud Platform
- **Simulation**: PolicyEngine UK

## Prerequisites

- Python 3.10+
- Node.js and npm
- Docker (for containerized deployment)

## Development Setup

For development, you can run the frontend and API separately:

### API (Backend)

```bash
# Install dependencies
pip install -r requirements.txt -r api/requirements.txt

# Start the API server
uvicorn api.main:app --reload --port 8000
```

The API will be available at http://localhost:8000/api

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3000

## Docker Deployment

The simplest way to run the complete application is with Docker:

```bash
# Build the Docker image
docker build -t obr-forecast .

# Run the container
docker run -p 8000:8000 obr-forecast
```

The application will be available at http://localhost:8000

## Project Structure

```
.
├── api/                      # FastAPI backend
│   ├── endpoints/            # API route handlers
│   │   └── forecasts.py      # Forecast-related endpoints
│   ├── utils/                # Utility functions
│   │   └── forecast.py       # OBR forecast simulation logic
│   └── main.py               # API entry point
├── frontend/                 # Next.js frontend
│   ├── components/           # React components
│   │   ├── ForecastSelector.tsx    # Forecast selection component
│   │   ├── GrowthRatesInput.tsx    # Growth factor input component 
│   │   └── ForecastResults.tsx     # Results visualization component
│   ├── pages/                # Next.js pages
│   ├── public/               # Static assets
│   └── styles/               # CSS styles
├── Dockerfile                # Docker configuration
├── .dockerignore             # Docker build exclusions
├── pyproject.toml            # Python project configuration
├── setup.py                  # Python package configuration
└── README.md                 # Project documentation
```

## Features

### OBR Forecast Simulation

The application uses PolicyEngine to simulate the impact of economic forecasts on UK households:

1. **Growth Factors**: Users can adjust several economic parameters:
   - Earned Income Growth: Wage and salary growth rate
   - Mixed Income Growth: Self-employment and business income growth
   - Capital Income Growth: Investment, dividend and interest income growth
   - Inflation Rate: General price level changes

2. **Impact Metrics**:
   - Median Household Income: Shows how income changes over the forecast period
   - Poverty Rate: Tracks changes in the poverty headcount ratio

3. **Analysis Period**:
   - Baseline year: 2025
   - Forecast period: 2026-2030

### Technical Implementation

- The frontend allows users to configure growth assumptions for each year and economic factor
- The API applies these growth factors to a representative sample of UK households using PolicyEngine
- Results are calculated by comparing household outcomes across the forecast period

## GCP Deployment

The application is containerized for easy deployment to Google Cloud Platform using Cloud Run or Google Kubernetes Engine.

## License

[Add your license here]