import { useState, useEffect } from 'react';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { ForecastSelector } from '../components/ForecastSelector';
import { ForecastResults } from '../components/ForecastResults';
import { GrowthRatesInput } from '../components/GrowthRatesInput';
import { DecileYearlyChangeChart } from '../components/DecileYearlyChangeChart';
import { buildApiUrl } from '../lib/api';

// Types
type GrowthRateType = 'earned_income' | 'mixed_income' | 'capital_income' | 'inflation';
type GrowthRatesByYear = Record<number, number>;
type GrowthRates = Record<GrowthRateType, GrowthRatesByYear>;
type ForecastType = 'actual' | 'custom';

interface YearlyMetric {
  year: number;
  value: number;
}

interface DecileYearlyChange {
  decile: number;
  year: number;
  change: number;
}

interface ForecastResponse {
  median_income_by_year: YearlyMetric[];
  poverty_rate_by_year: YearlyMetric[];
  decile_yearly_changes: DecileYearlyChange[];
  metadata: {
    forecast_id: string;
    growth_rates: GrowthRates;
  };
}

const Home: NextPage = () => {
  const [selectedForecast, setSelectedForecast] = useState<string>('');
  const [forecastType, setForecastType] = useState<ForecastType>('actual');
  const [forecastYears, setForecastYears] = useState<number[]>([]);
  const [defaultGrowthRates, setDefaultGrowthRates] = useState<GrowthRates>({
    earned_income: {},
    mixed_income: {},
    capital_income: {},
    inflation: {},
  });
  const [customGrowthRates, setCustomGrowthRates] = useState<GrowthRates | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forecastResults, setForecastResults] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available forecasts and default growth rates
  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        // Reset any previous errors
        setError(null);
        
        // Use environment-aware API URL
        const response = await axios.get(buildApiUrl('/forecasts'));
        if (response.data.forecasts.length > 0) {
          setSelectedForecast(response.data.forecasts[0].id);
        }
        if (response.data.forecast_years) {
          setForecastYears(response.data.forecast_years);
        }
        if (response.data.default_growth_rates) {
          setDefaultGrowthRates(response.data.default_growth_rates);
          setCustomGrowthRates(response.data.default_growth_rates);
        }
      } catch (error) {
        console.error('Error fetching forecasts:', error);
        setError('Failed to load forecasts. Please try again later.');
      }
    };

    fetchForecasts();
  }, []);

  const handleGrowthRatesChange = (growthRates: GrowthRates) => {
    setCustomGrowthRates(growthRates);
  };

  const handleAnalyze = async () => {
    // Don't proceed if no forecast is selected
    if (forecastType === 'actual' && !selectedForecast) return;

    setIsLoading(true);
    // Reset previous errors and results
    setError(null);
    
    try {
      // Use environment-aware API URL
      const response = await axios.post<ForecastResponse>(buildApiUrl('/forecasts/impact'), {
        forecast_id: forecastType === 'actual' ? selectedForecast : 'custom',
        growth_rates: forecastType === 'custom' ? customGrowthRates : undefined,
      }, {
        timeout: 300000, // 5 minutes timeout
      });

      setForecastResults(response.data);
    } catch (error) {
      console.error('Error analyzing forecast:', error);
      setError('Failed to analyze forecast. The server may be experiencing high load or maintenance.');
      setForecastResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>OBR Forecast Impact Estimator</title>
        <meta name="description" content="Estimate the impact of OBR forecasts using PolicyEngine" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2C6496" />
      </Head>

      <header className="site-header">
        <div className="container">
          <h1 className="header-title slide-in">OBR Forecast Impact Estimator</h1>
          <p className="header-description slide-in" style={{ animationDelay: '100ms' }}>
            Analyze the impact of Office for Budget Responsibility forecasts using PolicyEngine
          </p>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Fixed sidebar */}
          <div className="fixed-sidebar" style={{ 
            width: '300px', 
            flexShrink: 0,
            position: 'sticky', 
            top: '2rem', 
            height: 'fit-content', 
            maxHeight: 'calc(100vh - 4rem)', 
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            padding: '1rem',
            background: 'var(--blue-98)'
          }}>
            <div className="space-y-6">
              <ForecastSelector 
                onSelectForecast={setSelectedForecast}
                selectedForecast={selectedForecast}
                onForecastTypeChange={setForecastType}
                forecastType={forecastType}
              />
              
              <div className="card slide-in" style={{ animationDelay: '200ms' }}>
                <button 
                  className="btn btn-lg btn-block"
                  onClick={handleAnalyze}
                  disabled={isLoading || (forecastType === 'actual' && !selectedForecast)}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Forecast Impact'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {forecastType === 'custom' && forecastYears.length > 0 && defaultGrowthRates && (
              <GrowthRatesInput
                years={forecastYears}
                defaultGrowthRates={defaultGrowthRates}
                onChange={handleGrowthRatesChange}
              />
            )}
            
            {isLoading && (
              <div className="card flex items-center justify-center slide-in" style={{ minHeight: '300px' }}>
                <div className="text-center">
                  <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '3rem', height: '3rem' }}></div>
                  <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '0.5rem' }}>Running simulation with PolicyEngine...</p>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    This may take a minute or two to complete
                  </p>
                </div>
              </div>
            )}
            
            {!isLoading && error && (
              <div className="card slide-in" style={{ borderLeft: '4px solid var(--dark-red)' }}>
                <div className="flex items-center" style={{ gap: '1rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" fill="var(--dark-red)"/>
                  </svg>
                  <div>
                    <h3 style={{ color: 'var(--dark-red)', marginBottom: '0.5rem' }}>Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {!isLoading && !error && forecastResults && (
              <div className="space-y-6 fade-in" style={{ animationDelay: '300ms' }}>
                {/* Show the ForecastResults first with summary */}
                <ForecastResults
                  medianIncomeByYear={forecastResults.median_income_by_year}
                  povertyRateByYear={forecastResults.poverty_rate_by_year}
                  isLoading={isLoading}
                />
                
                {/* Then show the decile yearly change chart */}
                <DecileYearlyChangeChart
                  decileYearlyChanges={forecastResults.decile_yearly_changes}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="site-footer">
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Built with <a href="https://policyengine.org">PolicyEngine</a> | 
            Economic forecasts from the <a href="https://obr.uk">Office for Budget Responsibility</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;