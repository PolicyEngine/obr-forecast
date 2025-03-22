import { 
  Box, 
  Button, 
  Card, 
  CardBody, 
  Container, 
  Divider, 
  Heading, 
  Spinner, 
  Stack, 
  Text, 
  VStack, 
  useToast 
} from '@chakra-ui/react';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { ForecastSelector } from '../components/ForecastSelector';
import { ForecastResults } from '../components/ForecastResults';
import { GrowthRatesInput } from '../components/GrowthRatesInput';

// Types
type GrowthRateType = 'earned_income' | 'mixed_income' | 'capital_income' | 'inflation';
type GrowthRatesByYear = Record<number, number>;
type GrowthRates = Record<GrowthRateType, GrowthRatesByYear>;

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
  const toast = useToast();

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

  const handleGrowthRatesChange = (growthRates: GrowthRates) => {
    setCustomGrowthRates(growthRates);
  };

  const handleAnalyze = async () => {
    if (!selectedForecast) return;

    setIsLoading(true);
    try {
      const response = await axios.post<ForecastResponse>('/api/forecasts/impact', {
        forecast_id: selectedForecast,
        growth_rates: customGrowthRates,
      });

      setForecastResults(response.data);

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
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Head>
        <title>OBR Forecast Impact Estimator</title>
        <meta name="description" content="Estimate the impact of OBR forecasts using PolicyEngine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={8}>
            <Heading as="h1" size="2xl" mb={4}>
              OBR Forecast Impact Estimator
            </Heading>
            <Text fontSize="xl">
              Analyze the impact of Office for Budget Responsibility forecasts using PolicyEngine
            </Text>
          </Box>
          
          <Card variant="outline">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Configure Forecast Parameters</Heading>
                
                <Box>
                  <Text mb={2} fontWeight="medium">Select Forecast</Text>
                  <ForecastSelector 
                    onSelectForecast={(forecastId) => setSelectedForecast(forecastId)} 
                    selectedForecast={selectedForecast}
                  />
                </Box>
                
                <Divider />
                
                {forecastYears.length > 0 && defaultGrowthRates && (
                  <GrowthRatesInput
                    years={forecastYears}
                    defaultGrowthRates={defaultGrowthRates}
                    onChange={handleGrowthRatesChange}
                  />
                )}
                
                <Box>
                  <Button
                    colorScheme="blue"
                    onClick={handleAnalyze}
                    isLoading={isLoading}
                    disabled={!selectedForecast}
                    width="full"
                    size="lg"
                  >
                    Analyze Forecast Impact
                  </Button>
                </Box>
              </VStack>
            </CardBody>
          </Card>
          
          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Running simulation with PolicyEngine...</Text>
              <Text fontSize="sm" color="gray.500" mt={2}>
                This may take a minute or two to complete
              </Text>
            </Box>
          ) : forecastResults ? (
            <ForecastResults
              medianIncomeByYear={forecastResults.median_income_by_year}
              povertyRateByYear={forecastResults.poverty_rate_by_year}
              isLoading={isLoading}
            />
          ) : null}
        </VStack>
      </Container>
    </Box>
  );
};

export default Home;