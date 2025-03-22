import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
    <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
      <div className="card">
        <h3 className="card-title">Median Household Income</h3>
        <p className="card-description">Annual household income after taxes and benefits</p>
        
        <div style={{ height: '300px' }}>
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
                stroke="#0070f3" 
                strokeWidth={2} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="changeFromBaseline" 
                name="Change from 2025" 
                stroke="#6b46c1" 
                strokeWidth={2}
                strokeDasharray="5 5" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem', textAlign: 'right' }}>
          Data calculated using PolicyEngine
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Poverty Rate</h3>
        <p className="card-description">Percentage of population below the poverty line</p>
        
        <div style={{ height: '300px' }}>
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
                stroke="#e53e3e" 
                strokeWidth={2} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="changeInPctPoints" 
                name="Change from 2025 (pp)" 
                stroke="#dd6b20" 
                strokeWidth={2}
                strokeDasharray="5 5" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.8rem', textAlign: 'right' }}>
          Data calculated using PolicyEngine
        </div>
      </div>
    </div>
  );
};