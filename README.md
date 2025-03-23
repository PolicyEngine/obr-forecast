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

This application is configured to be deployed to Vercel as a single integrated service, where FastAPI serves both the API endpoints and the static frontend files.

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Create a new project with the repository root as the project root
4. Vercel will automatically detect the configuration in `vercel.json` and build both frontend and backend
5. The application will be deployed as a single service with FastAPI serving both the API and the static frontend files

Or, deploy directly from the command line:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

### How It Works

The deployment process follows these steps:

1. The `buildCommand` in `vercel.json` builds the frontend Next.js app as static files
   - Runs `npm install` and `npm run build` in the `frontend` directory
   - Creates a `dist` directory in the project root
   - Copies the built static files to the `dist` directory

2. The `installCommand` installs Python dependencies from `requirements.txt`

3. The FastAPI app is deployed using Vercel's Python runtime
   - The FastAPI app is configured to serve API endpoints under the `/api` path
   - The FastAPI app also serves the static frontend files from the `dist` directory

4. Vercel routes are configured to:
   - Send all `/api/*` requests to the FastAPI app
   - Serve static files directly when they exist
   - Send all other requests to the FastAPI app, which serves the SPA index.html

### Local Development

For local development, you can continue to run the frontend and backend separately:

```bash
make dev
```

This will start:
- Backend API server at http://localhost:8000
- Frontend development server at http://localhost:3000

The frontend is configured to proxy API requests to the backend during development.

## License

[Add your license here]