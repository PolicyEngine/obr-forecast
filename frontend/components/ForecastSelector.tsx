import { useEffect, useState } from 'react';
import axios from 'axios';
import * as Tabs from '@radix-ui/react-tabs';

type Forecast = {
  id: string;
  name: string;
  date: string;
};

type ForecastType = 'actual' | 'custom';

interface ForecastSelectorProps {
  onSelectForecast: (forecastId: string) => void;
  selectedForecast: string;
  onForecastTypeChange: (type: ForecastType) => void;
  forecastType: ForecastType;
}

export const ForecastSelector = ({
  onSelectForecast,
  selectedForecast,
  onForecastTypeChange,
  forecastType,
}: ForecastSelectorProps) => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchForecasts = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/forecasts');
        setForecasts(response.data.forecasts);
        if (response.data.forecasts.length > 0 && !selectedForecast) {
          onSelectForecast(response.data.forecasts[0].id);
        }
      } catch (error) {
        console.error('Error fetching forecasts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecasts();
  }, [onSelectForecast, selectedForecast]);

  return (
    <div className="card">
      <h3 className="card-title">Forecast Scenarios</h3>
      <p className="card-description">
        Select an official OBR forecast or create your own custom scenario
      </p>
      
      <Tabs.Root 
        defaultValue="actual" 
        value={forecastType}
        onValueChange={(value) => onForecastTypeChange(value as ForecastType)}
      >
        <Tabs.List className="flex border-b mb-4" style={{ marginBottom: '1rem' }}>
          <Tabs.Trigger 
            value="actual"
            className="flex-1 py-2 px-4 border-b-2 text-center"
            style={{ 
              borderBottomColor: forecastType === 'actual' ? '#0070f3' : 'transparent',
              fontWeight: forecastType === 'actual' ? 'bold' : 'normal',
            }}
          >
            Official Forecasts
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="custom"
            className="flex-1 py-2 px-4 border-b-2 text-center"
            style={{ 
              borderBottomColor: forecastType === 'custom' ? '#0070f3' : 'transparent',
              fontWeight: forecastType === 'custom' ? 'bold' : 'normal',
            }}
          >
            Custom Scenario
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="actual" className="space-y-6">
          <div className="form-group">
            <label htmlFor="forecast-select" className="form-label">Select OBR Forecast</label>
            <select
              id="forecast-select"
              className="form-control"
              value={selectedForecast}
              onChange={(e) => onSelectForecast(e.target.value)}
              disabled={loading || forecasts.length === 0}
            >
              <option value="" disabled>Select a forecast</option>
              {forecasts.map((forecast) => (
                <option key={forecast.id} value={forecast.id}>
                  {forecast.name} ({forecast.date})
                </option>
              ))}
            </select>
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="custom" className="space-y-6">
          <div className="form-group">
            <label className="form-label">Custom Forecast Scenario</label>
            <p className="text-muted">
              Use the growth parameters below to define your own forecast scenario.
            </p>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};