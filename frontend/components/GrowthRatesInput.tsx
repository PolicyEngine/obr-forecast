import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Slider } from './ui/slider';

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

const GROWTH_RATE_DESCRIPTIONS: Record<GrowthRateType, string> = {
  earned_income: 'Growth in wages and employment income',
  mixed_income: 'Growth in self-employment and business income',
  capital_income: 'Growth in dividend, interest, and investment income',
  inflation: 'General price level changes affecting costs and some benefits',
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

  // Format percentage display
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-8">
      {Object.entries(GROWTH_RATE_LABELS).map(([type, label]) => (
        <Card key={type} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>{label}</CardTitle>
            <CardDescription>{GROWTH_RATE_DESCRIPTIONS[type as GrowthRateType]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {years.map((year) => {
                const value = growthRates[type as GrowthRateType][year] || 0;
                
                return (
                  <div key={year} className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-2">
                      <Label className="text-right block">{year}</Label>
                    </div>
                    <div className="col-span-7">
                      <Slider
                        value={[value * 100]}
                        min={-5}
                        max={15}
                        step={0.1}
                        onValueChange={(newValue) => {
                          handleGrowthRateChange(
                            type as GrowthRateType,
                            year,
                            newValue[0] / 100
                          );
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={(value * 100).toFixed(1)}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) / 100;
                            if (!isNaN(newValue)) {
                              handleGrowthRateChange(
                                type as GrowthRateType,
                                year,
                                newValue
                              );
                            }
                          }}
                          min={-5}
                          max={15}
                          step={0.1}
                          className="w-20"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};