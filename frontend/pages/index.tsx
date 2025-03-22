import { useState, useEffect } from 'react';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { ForecastSelector } from '../components/ForecastSelector';
import { ForecastResults } from '../components/ForecastResults';
import { GrowthRatesInput } from '../components/GrowthRatesInput';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

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
    <div className="min-h-screen bg-background">
      <Head>
        <title>OBR Forecast Impact Estimator</title>
        <meta name="description" content="Estimate the impact of OBR forecasts using PolicyEngine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container py-10 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">OBR Forecast Impact Estimator</h1>
          <p className="text-xl text-muted-foreground">
            Analyze the impact of Office for Budget Responsibility forecasts using PolicyEngine
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ForecastSelector 
              onSelectForecast={setSelectedForecast}
              selectedForecast={selectedForecast}
              onForecastTypeChange={setForecastType}
              forecastType={forecastType}
            />
            
            <Card>
              <CardContent className="pt-6">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={isLoading || (forecastType === 'actual' && !selectedForecast)}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Forecast Impact'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            {forecastType === 'custom' && forecastYears.length > 0 && defaultGrowthRates && (
              <GrowthRatesInput
                years={forecastYears}
                defaultGrowthRates={defaultGrowthRates}
                onChange={handleGrowthRatesChange}
              />
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <div className="text-muted-foreground">
                    <p>Running simulation with PolicyEngine...</p>
                    <p className="text-sm">This may take a minute or two to complete</p>
                  </div>
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
      </main>
      
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Built with <a href="https://policyengine.org" className="font-medium underline underline-offset-4">PolicyEngine</a>. 
            Economic forecasts from the <a href="https://obr.uk" className="font-medium underline underline-offset-4">Office for Budget Responsibility</a>.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;