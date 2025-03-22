import { useEffect, useState } from 'react';
import axios from 'axios';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle>Forecast Scenarios</CardTitle>
        <CardDescription>
          Select an official OBR forecast or create your own custom scenario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="actual"
          value={forecastType}
          onValueChange={(value) => onForecastTypeChange(value as ForecastType)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="actual">Official Forecasts</TabsTrigger>
            <TabsTrigger value="custom">Custom Scenario</TabsTrigger>
          </TabsList>
          <TabsContent value="actual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forecast-select">Select OBR Forecast</Label>
              <Select
                disabled={loading || forecasts.length === 0}
                value={selectedForecast}
                onValueChange={onSelectForecast}
              >
                <SelectTrigger id="forecast-select">
                  <SelectValue placeholder="Select a forecast" />
                </SelectTrigger>
                <SelectContent>
                  {forecasts.map((forecast) => (
                    <SelectItem key={forecast.id} value={forecast.id}>
                      {forecast.name} ({forecast.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label>Custom Forecast Scenario</Label>
              <p className="text-sm text-muted-foreground">
                Use the growth parameters below to define your own forecast scenario.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};