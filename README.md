# OBR Forecast Impact Estimator

A web application that uses PolicyEngine to estimate the impact of different Office for Budget Responsibility (OBR) forecasts, including the upcoming Spring 2025 forecast (March 27, 2025).

## Technology Stack

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Next.js with TypeScript
- **Dependency Management**: uv (Python), npm (JavaScript)
- **Visualization**: Recharts
- **UI Framework**: Radix UI
- **Deployment**: Vercel (both frontend and backend)
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

This application is configured to be fully deployable to Vercel for both frontend and backend.

### Frontend Deployment

The frontend is configured to be deployed to Vercel with the following steps:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Create a new project and select the `frontend` directory as your root directory
4. Vercel will automatically detect the Next.js project and deploy it
5. Environment variables are configured in `frontend/vercel.json`

Or, deploy directly from the command line:

```bash
make deploy-frontend
```

For production deployment:

```bash
make deploy-frontend-prod
```

### Backend Deployment

The FastAPI backend is also configured for Vercel deployment using Vercel's Python runtime:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Create a new project and select the `api` directory as your root directory
4. Vercel will automatically detect the Python project with vercel.json configuration
5. Set the Python version to 3.11 in the Vercel project settings

Or, deploy directly from the command line:

```bash
make deploy-api
```

For production deployment:

```bash
make deploy-api-prod
```

### Setup in Vercel Dashboard

1. Create two separate projects in Vercel:
   - One for the frontend (pointing to the `frontend` directory)
   - One for the API (pointing to the `api` directory)

2. Set custom domains for both projects if needed (e.g., `app.yourdomain.com` and `api.yourdomain.com`)

3. Make sure the frontend's environment variable `NEXT_PUBLIC_API_URL` points to your API's URL

4. Update the API's `ALLOWED_ORIGINS` environment variable in Vercel to include your frontend domain

### Environment Variables

#### Frontend

The following variables are configured in `frontend/vercel.json`:
- `NEXT_PUBLIC_API_URL`: URL of your deployed API

#### Backend

The following variables are configured in `api/vercel.json`:
- `ALLOWED_ORIGINS`: Comma-separated list of domains allowed to access the API

## License

[Add your license here]