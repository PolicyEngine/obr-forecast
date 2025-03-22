import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface YearlyMetric {
  year: number;
  value: number;
}

interface ForecastResultsProps {
  medianIncomeByYear: YearlyMetric[];
  povertyRateByYear: YearlyMetric[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

export const ForecastResults = ({
  medianIncomeByYear,
  povertyRateByYear,
  isLoading,
}: ForecastResultsProps) => {
  // Calculate change from baseline (2025)
  const baselineYear = medianIncomeByYear.length > 0 ? medianIncomeByYear[0].year : 0;
  const baselineMedianIncome = medianIncomeByYear.length > 0 ? medianIncomeByYear[0].value : 0;
  const baselinePovertyRate = povertyRateByYear.length > 0 ? povertyRateByYear[0].value : 0;

  const medianIncomeWithChange = medianIncomeByYear.map(data => ({
    ...data,
    changeFromBaseline: ((data.value - baselineMedianIncome) / baselineMedianIncome) * 100,
  }));

  const povertyRateWithChange = povertyRateByYear.map(data => ({
    ...data,
    changeInPctPoints: (data.value - baselinePovertyRate) * 100,
  }));

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Forecast Results</Heading>

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
        <Card variant="outline">
          <CardHeader>
            <Heading size="sm">Median Household Income</Heading>
            <Text fontSize="sm" color="gray.500">
              Annual household income after taxes and benefits
            </Text>
          </CardHeader>
          <CardBody>
            <Box height="250px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={medianIncomeWithChange}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tickFormatter={formatCurrency} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tickFormatter={(value) => `${value.toFixed(1)}%`} 
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'value') return [formatCurrency(value as number), 'Median Income'];
                      if (name === 'changeFromBaseline') return [`${value.toFixed(1)}%`, 'Change from 2025'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="value" 
                    name="Median Income" 
                    stroke="#3182CE" 
                    strokeWidth={2} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="changeFromBaseline" 
                    name="Change from 2025" 
                    stroke="#805AD5" 
                    strokeWidth={2}
                    strokeDasharray="5 5" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>

        <Card variant="outline">
          <CardHeader>
            <Heading size="sm">Poverty Rate</Heading>
            <Text fontSize="sm" color="gray.500">
              Percentage of population below the poverty line
            </Text>
          </CardHeader>
          <CardBody>
            <Box height="250px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={povertyRateWithChange}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tickFormatter={formatPercentage} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tickFormatter={(value) => `${value.toFixed(1)}pp`}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'value') return [formatPercentage(value as number), 'Poverty Rate'];
                      if (name === 'changeInPctPoints') return [`${value.toFixed(1)}pp`, 'Change from 2025'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="value" 
                    name="Poverty Rate" 
                    stroke="#E53E3E" 
                    strokeWidth={2} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="changeInPctPoints" 
                    name="Change from 2025 (pp)" 
                    stroke="#DD6B20" 
                    strokeWidth={2}
                    strokeDasharray="5 5" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
      </Grid>

      <Flex justifyContent="flex-end">
        <Text fontSize="sm" color="gray.500">
          Data calculated using PolicyEngine
        </Text>
      </Flex>
    </VStack>
  );
};