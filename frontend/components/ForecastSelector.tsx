import {
  FormControl,
  FormLabel,
  Select,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type Forecast = {
  id: string;
  name: string;
  date: string;
};

interface ForecastSelectorProps {
  onSelectForecast: (forecastId: string) => void;
  selectedForecast: string;
}

export const ForecastSelector = ({
  onSelectForecast,
  selectedForecast,
}: ForecastSelectorProps) => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const response = await axios.get('/api/forecasts');
        setForecasts(response.data.forecasts);
        if (response.data.forecasts.length > 0 && !selectedForecast) {
          onSelectForecast(response.data.forecasts[0].id);
        }
      } catch (error) {
        console.error('Error fetching forecasts:', error);
        toast({
          title: 'Error fetching forecasts',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchForecasts();
  }, [toast, onSelectForecast, selectedForecast]);

  return (
    <FormControl>
      <Select
        value={selectedForecast}
        onChange={(e) => onSelectForecast(e.target.value)}
        placeholder="Select a forecast"
        disabled={forecasts.length === 0}
      >
        {forecasts.map((forecast) => (
          <option key={forecast.id} value={forecast.id}>
            {forecast.name} ({forecast.date})
          </option>
        ))}
      </Select>
    </FormControl>
  );
};