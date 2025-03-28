import { useState, useEffect, useRef } from 'react';
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



interface ForecastData {
  median_income_by_year: YearlyMetric[];
  absolute_poverty_ahc_by_year: YearlyMetric[];
  absolute_poverty_bhc_by_year: YearlyMetric[];
  relative_poverty_ahc_by_year: YearlyMetric[];
  relative_poverty_bhc_by_year: YearlyMetric[];
  decile_yearly_changes: DecileYearlyChange[];
  metadata: {
    forecast_id: string;
    growth_rates: GrowthRates;
  };
}

interface ComputationResponse {
  computation_id: string;
  status: 'computing' | 'completed' | 'failed';
  result?: ForecastData;
  error?: string;
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
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [computationId, setComputationId] = useState<string | null>(null);
  const [forecastResults, setForecastResults] = useState<ForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // For polling
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch available forecasts and default growth rates
  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        // Reset any previous errors
        setError(null);
        
        // Use environment-aware API URL
        const response = await axios.get("/api/forecasts");
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

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Set up polling when computationId changes
  useEffect(() => {
    // Only set up polling if we have a computation ID and are in computing state
    if (computationId && isComputing) {
      // Do an immediate check
      pollComputationStatus();
      
      // Set up the polling interval - check every 10 seconds
      pollingInterval.current = setInterval(pollComputationStatus, 10000);
      
      // Clean up function to clear interval if component unmounts or dependencies change
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      };
    }
  }, [computationId, isComputing]); // Re-run when computationId or isComputing changes
  
  // Polling function to check computation status
  const pollComputationStatus = async () => {
    if (!computationId) return;
    
    try {
      const response = await axios.post<ComputationResponse>(
        '/api/forecasts/impact', {
        forecast_id: `computation_id:${computationId}`,
        growth_rates: forecastType === 'custom' ? customGrowthRates : undefined,
      });
      
      const { status, result, error: computationError } = response.data;
      
      if (status === 'completed' && result) {
        // Computation is complete, set the results
        setForecastResults(result);
        setIsComputing(false);
        setIsLoading(false);
        
        // Clear the polling interval
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      } else if (status === 'failed') {
        // Computation failed
        setError(computationError || 'Computation failed unexpectedly');
        setIsComputing(false);
        setIsLoading(false);
        
        // Clear the polling interval
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
      }
      // If status is still 'computing', continue polling
    } catch (error) {
      console.error('Error polling computation status:', error);
      setError('Failed to check computation status. Please try again.');
      setIsComputing(false);
      setIsLoading(false);
      
      // Clear the polling interval
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    }
  };
  
  const handleAnalyze = async () => {
    // Don't proceed if no forecast is selected
    if (forecastType === 'actual' && !selectedForecast) return;

    setIsLoading(true);
    // Reset previous errors and results
    setError(null);
    setForecastResults(null);
    setIsComputing(false);
    setComputationId(null);
    
    // Clean up any existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    
    try {
      // Start a new computation
      const response = await axios.post<ComputationResponse>(
        '/api/forecasts/impact', {
        forecast_id: forecastType === 'actual' ? selectedForecast : 'custom',
        growth_rates: forecastType === 'custom' ? customGrowthRates : undefined,
      });

      const { status, computation_id, result, error: computationError } = response.data;
      
      if (status === 'computing') {
        // Long-running computation started
        setComputationId(computation_id);
        setIsComputing(true);
        // The useEffect will set up polling
      } else if (status === 'completed' && result) {
        // Computation completed immediately (possibly from cache)
        setForecastResults(result);
        setIsLoading(false);
      } else if (status === 'failed') {
        // Computation failed
        setError(computationError || 'Computation failed unexpectedly');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error analyzing forecast:', error);
      setError('Failed to analyze forecast. The server may be experiencing high load or maintenance.');
      setForecastResults(null);
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
            
            {(isLoading || isComputing) && (
              <div className="card flex items-center justify-center slide-in" style={{ minHeight: '300px' }}>
                <div className="text-center">
                  <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '3rem', height: '3rem' }}></div>
                  <p style={{ fontFamily: 'Roboto, sans-serif', marginBottom: '0.5rem' }}>
                    {isComputing ? 'Computation in progress...' : 'Starting simulation with PolicyEngine...'}
                  </p>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {isComputing ? 'Checking status every 10 seconds' : 'This may take a minute or two to complete'}
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
            
            {!isLoading && !isComputing && !error && forecastResults && (
              <div className="space-y-6 fade-in" style={{ animationDelay: '300ms' }}>
                {/* Show the ForecastResults first with summary */}
                <ForecastResults
                  medianIncomeByYear={forecastResults.median_income_by_year}
                  absolutePovertyAhcByYear={forecastResults.absolute_poverty_ahc_by_year}
                  absolutePovertyBhcByYear={forecastResults.absolute_poverty_bhc_by_year}
                  relativePovertyAhcByYear={forecastResults.relative_poverty_ahc_by_year}
                  relativePovertyBhcByYear={forecastResults.relative_poverty_bhc_by_year}
                  isLoading={isLoading || isComputing}
                />
                
                {/* Then show the decile yearly change chart */}
                <DecileYearlyChangeChart
                  decileYearlyChanges={forecastResults.decile_yearly_changes}
                  isLoading={isLoading || isComputing}
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