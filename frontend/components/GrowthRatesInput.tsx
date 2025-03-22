import { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';

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
    <div className="space-y-6">
      {Object.entries(GROWTH_RATE_LABELS).map(([type, label]) => (
        <div key={type} className="card">
          <h3 className="card-title">{label}</h3>
          <p className="card-description">{GROWTH_RATE_DESCRIPTIONS[type as GrowthRateType]}</p>
          
          <div className="space-y-6">
            {years.map((year) => {
              const value = growthRates[type as GrowthRateType][year] || 0;
              
              return (
                <div key={year} className="grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 1fr 100px',
                  gap: '1rem',
                  alignItems: 'center' 
                }}>
                  <div>
                    <label className="form-label text-center">{year}</label>
                  </div>
                  
                  <div style={{ padding: '0 10px' }}>
                    <input
                      type="range"
                      min={-5}
                      max={15}
                      step={0.1}
                      value={value * 100}
                      onChange={(e) => {
                        handleGrowthRateChange(
                          type as GrowthRateType,
                          year,
                          parseFloat(e.target.value) / 100
                        );
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <input
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
                        className="form-control"
                        style={{ width: '70px' }}
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};