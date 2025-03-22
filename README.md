# OBR Forecast Impact Estimator

A web application that uses PolicyEngine to estimate the impact of different Office for Budget Responsibility (OBR) forecasts, including the upcoming Spring 2025 forecast (March 27, 2025).

## Technology Stack

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Next.js with TypeScript
- **Dependency Management**: uv (Python), npm (JavaScript)
- **Visualization**: Recharts
- **UI Framework**: Chakra UI
- **Deployment**: Vercel (frontend)
- **Simulation**: PolicyEngine UK

## Prerequisites

- Python 3.11 (required)
- Node.js and npm
- uv

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/obr-forecast.git
   cd obr-forecast
   ```

2. Set up the environment:
   ```
   make setup
   ```

3. Install dependencies:
   ```
   make install
   ```

## Development

Run the development server:

```
make dev
```

This will start:
- Backend API server at http://localhost:8000
- Frontend development server at http://localhost:3000

## Project Structure

```
obr-forecast/
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
├── Makefile                  # Development commands
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

## Deployment

### Frontend Deployment

Before deploying the frontend to Vercel, make sure to set the API URL environment variable:

1. Update the `NEXT_PUBLIC_API_URL` in the `frontend/vercel.json` file with your deployed backend URL.

2. To deploy the frontend to Vercel:

```
make deploy-frontend
```

3. For production deployment:

```
make deploy-frontend-prod
```

### Backend Deployment

The backend API can be deployed to any platform that supports Python applications. Some options include:

- Heroku
- AWS Lambda with API Gateway
- Google Cloud Run
- Digital Ocean App Platform

When deploying the backend, make sure to:

1. Set the appropriate CORS settings in `api/main.py` to allow requests from your frontend domain
2. Configure the environment to use Python 3.11
3. Install dependencies using `uv pip install -e .`

## License

[Add your license here]