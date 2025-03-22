# OBR Forecast Impact Estimator

A web application that uses PolicyEngine to estimate the impact of different Office for Budget Responsibility (OBR) forecasts, including the upcoming Spring 2025 forecast (March 27, 2025).

## Technology Stack

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Next.js with TypeScript
- **Dependency Management**: uv (Python), npm (JavaScript)
- **Visualization**: Recharts
- **UI Framework**: Chakra UI
- **Deployment**: Vercel (frontend)

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
├── api/                 # FastAPI backend
│   ├── endpoints/       # API route handlers
│   │   └── forecasts.py # Forecast-related endpoints
│   └── main.py          # API entry point
├── frontend/            # Next.js frontend
│   ├── components/      # React components
│   ├── pages/           # Next.js pages
│   ├── public/          # Static assets
│   └── styles/          # CSS styles
├── Makefile             # Development commands
├── pyproject.toml       # Python project configuration
├── setup.py             # Python package configuration
└── README.md            # Project documentation
```

## Deployment

To deploy the frontend to Vercel:

```
make deploy-frontend
```

For production deployment:

```
make deploy-frontend-prod
```

## License

[Add your license here]