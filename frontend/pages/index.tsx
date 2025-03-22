import { useState, useEffect } from 'react';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { ForecastSelector } from '../components/ForecastSelector';
import { ForecastResults } from '../components/ForecastResults';
import { GrowthRatesInput } from '../components/GrowthRatesInput';

// Types
type GrowthRateType = 'earned_income' | 'mixed_income' | 'capital_income' | 'inflation';
type GrowthRatesByYear = Record<number, number>;
type GrowthRates = Record<GrowthRateType, GrowthRatesByYear>;
type ForecastType = 'actual' | 'custom';

interface YearlyMetric {
  year: number;
  value: number;
}

interface ForecastResponse {
  median_income_by_year: YearlyMetric[];
  poverty_rate_by_year: YearlyMetric[];
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

  // Fetch available forecasts and default growth rates
  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const response = await axios.get('/api/forecasts');
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
    try {
      const response = await axios.post<ForecastResponse>('/api/forecasts/impact', {
        forecast_id: forecastType === 'actual' ? selectedForecast : 'custom',
        growth_rates: forecastType === 'custom' ? customGrowthRates : undefined,
      });

      setForecastResults(response.data);
    } catch (error) {
      console.error('Error analyzing forecast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>OBR Forecast Impact Estimator</title>
        <meta name="description" content="Estimate the impact of OBR forecasts using PolicyEngine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <header className="text-center mb-4" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            OBR Forecast Impact Estimator
          </h1>
          <p className="text-muted" style={{ fontSize: '1.25rem' }}>
            Analyze the impact of Office for Budget Responsibility forecasts using PolicyEngine
          </p>
        </header>
        
        <div className="grid grid-cols-4" style={{ gap: '1.5rem' }}>
          <div className="space-y-6">
            <ForecastSelector 
              onSelectForecast={setSelectedForecast}
              selectedForecast={selectedForecast}
              onForecastTypeChange={setForecastType}
              forecastType={forecastType}
            />
            
            <div className="card">
              <button 
                className="btn btn-lg btn-block"
                onClick={handleAnalyze}
                disabled={isLoading || (forecastType === 'actual' && !selectedForecast)}
              >
                {isLoading ? 'Analyzing...' : 'Analyze Forecast Impact'}
              </button>
            </div>
          </div>
          
          <div style={{ gridColumn: 'span 3' }}>
            {forecastType === 'custom' && forecastYears.length > 0 && defaultGrowthRates && (
              <GrowthRatesInput
                years={forecastYears}
                defaultGrowthRates={defaultGrowthRates}
                onChange={handleGrowthRatesChange}
              />
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center" style={{ height: '300px' }}>
                <div className="text-center">
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p>Running simulation with PolicyEngine...</p>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    This may take a minute or two to complete
                  </p>
                </div>
              </div>
            )}
            
            {!isLoading && forecastResults && (
              <ForecastResults
                medianIncomeByYear={forecastResults.median_income_by_year}
                povertyRateByYear={forecastResults.poverty_rate_by_year}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
      
      <footer style={{ borderTop: '1px solid #eaeaea', padding: '1rem 0' }}>
        <div className="container">
          <p className="text-muted text-center" style={{ fontSize: '0.875rem' }}>
            Built with <a href="https://policyengine.org" style={{ textDecoration: 'underline' }}>PolicyEngine</a>. 
            Economic forecasts from the <a href="https://obr.uk" style={{ textDecoration: 'underline' }}>Office for Budget Responsibility</a>.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;