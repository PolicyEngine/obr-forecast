import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  Select,
  VStack,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type Forecast = {
  id: string;
  name: string;
  date: string;
};

export const ForecastSelector = () => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const response = await axios.get('/api/forecasts');
        setForecasts(response.data.forecasts);
        if (response.data.forecasts.length > 0) {
          setSelectedForecast(response.data.forecasts[0].id);
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
  }, [toast]);

  const handleAnalyze = async () => {
    if (!selectedForecast) return;

    setLoading(true);
    try {
      // In a real application, you would analyze the forecast here
      // and update a global state or pass the results to a parent component
      await axios.post('/api/forecasts/impact', {
        forecast_id: selectedForecast,
        parameters: {},
      });

      toast({
        title: 'Analysis complete',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error analyzing forecast:', error);
      toast({
        title: 'Error analyzing forecast',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outline">
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Heading size="md">Select Forecast</Heading>

          <FormControl>
            <FormLabel>OBR Forecast</FormLabel>
            <Select
              value={selectedForecast}
              onChange={(e) => setSelectedForecast(e.target.value)}
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

          <Box>
            <Button
              colorScheme="blue"
              onClick={handleAnalyze}
              isLoading={loading}
              disabled={!selectedForecast}
              width="full"
            >
              Analyze Impact
            </Button>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};
