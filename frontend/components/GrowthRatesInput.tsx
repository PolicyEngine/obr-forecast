import {
  Box,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type GrowthRateType = 'earned_income' | 'mixed_income' | 'capital_income' | 'inflation';

type GrowthRatesByYear = Record<number, number>;
type GrowthRates = Record<GrowthRateType, GrowthRatesByYear>;

interface GrowthRatesInputProps {
  years: number[];
  defaultGrowthRates: GrowthRates;
  onChange: (growthRates: GrowthRates) => void;
}

const GROWTH_RATE_LABELS: Record<GrowthRateType, string> = {
  earned_income: 'Earned Income Growth',
  mixed_income: 'Mixed Income Growth',
  capital_income: 'Capital Income Growth',
  inflation: 'Inflation Rate',
};

export const GrowthRatesInput = ({
  years,
  defaultGrowthRates,
  onChange,
}: GrowthRatesInputProps) => {
  const [growthRates, setGrowthRates] = useState<GrowthRates>(defaultGrowthRates);

  // Update parent component when growth rates change
  useEffect(() => {
    onChange(growthRates);
  }, [growthRates, onChange]);

  const handleGrowthRateChange = (
    type: GrowthRateType,
    year: number,
    value: number
  ) => {
    setGrowthRates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [year]: value,
      },
    }));
  };

  // Format values for display (convert from decimal to percentage)
  const formatValue = (value: number) => `${(value * 100).toFixed(1)}%`;
  const parseValue = (value: string) => parseFloat(value.replace('%', '')) / 100;

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Heading size="md">Economic Growth Assumptions</Heading>
        <Text>
          Adjust the growth factors for each year of the forecast to simulate different economic
          scenarios.
        </Text>

        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Growth Factor</Th>
                {years.map((year) => (
                  <Th key={year} isNumeric>
                    {year}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {Object.entries(GROWTH_RATE_LABELS).map(([type, label]) => (
                <Tr key={type}>
                  <Td fontWeight="medium">{label}</Td>
                  {years.map((year) => (
                    <Td key={year} isNumeric>
                      <NumberInput
                        size="sm"
                        value={formatValue(
                          growthRates[type as GrowthRateType][year] || 0
                        )}
                        onChange={(valueString) => {
                          handleGrowthRateChange(
                            type as GrowthRateType,
                            year,
                            parseValue(valueString)
                          );
                        }}
                        min={-0.1}
                        max={0.2}
                        step={0.005}
                        precision={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
};