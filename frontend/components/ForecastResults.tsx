import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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

  // Custom Tooltip component for charts
  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'var(--white)', 
          padding: '10px', 
          border: '1px solid var(--medium-dark-gray)',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontFamily: 'Roboto, sans-serif',
        }}>
          <p style={{ 
            margin: '0 0 5px',
            fontWeight: 'bold',
            fontFamily: 'Roboto Mono, monospace',
          }}>{`Year: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ 
              margin: '2px 0',
              color: entry.color,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 'bold' }}>{
                formatter ? formatter(entry.value, entry.name) : entry.value
              }</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-2 fade-in" style={{ gap: '1.5rem', animationDelay: '300ms' }}>
      <div className="card">
        <h3 className="card-title">Median Household Income</h3>
        <p className="card-description">Annual household income after taxes and benefits</p>
        
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={medianIncomeWithChange} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tickFormatter={formatCurrency} 
                stroke="var(--blue)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={(value) => `${value.toFixed(1)}%`} 
                stroke="var(--teal-accent)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
              />
              <Tooltip 
                content={<CustomTooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Median Income') return formatCurrency(value);
                    if (name === 'Change from 2025') return `${value.toFixed(1)}%`;
                    return value;
                  }}
                />} 
              />
              <Legend wrapperStyle={{ fontFamily: 'Roboto, sans-serif' }} />
              <ReferenceLine
                y={baselineMedianIncome}
                yAxisId="left"
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                isFront={false}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                name="Median Income" 
                stroke="var(--blue)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--blue)', strokeWidth: 2, fill: 'white', r: 4 }}
                activeDot={{ stroke: 'var(--blue)', strokeWidth: 2, fill: 'var(--blue)', r: 6 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="changeFromBaseline" 
                name="Change from 2025" 
                stroke="var(--teal-accent)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ stroke: 'var(--teal-accent)', strokeWidth: 2, fill: 'white', r: 3 }}
                activeDot={{ stroke: 'var(--teal-accent)', strokeWidth: 2, fill: 'var(--teal-accent)', r: 5 }}
                animationDuration={1800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-muted" style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.8rem', 
          textAlign: 'right',
          fontFamily: 'Roboto Serif, serif'
        }}>
          Data calculated using PolicyEngine
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Poverty Rate</h3>
        <p className="card-description">Percentage of population below the poverty line</p>
        
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={povertyRateWithChange} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tickFormatter={formatPercentage} 
                stroke="var(--dark-red)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tickFormatter={(value) => `${value.toFixed(1)}pp`}
                stroke="var(--blue)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
              />
              <Tooltip 
                content={<CustomTooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Poverty Rate') return formatPercentage(value);
                    if (name === 'Change from 2025 (pp)') return `${value.toFixed(1)}pp`;
                    return value;
                  }}
                />} 
              />
              <Legend wrapperStyle={{ fontFamily: 'Roboto, sans-serif' }} />
              <ReferenceLine
                y={baselinePovertyRate}
                yAxisId="left"
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                isFront={false}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                name="Poverty Rate" 
                stroke="var(--dark-red)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--dark-red)', strokeWidth: 2, fill: 'white', r: 4 }}
                activeDot={{ stroke: 'var(--dark-red)', strokeWidth: 2, fill: 'var(--dark-red)', r: 6 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="changeInPctPoints" 
                name="Change from 2025 (pp)" 
                stroke="var(--blue)" 
                strokeWidth={2}
                strokeDasharray="5 5" 
                dot={{ stroke: 'var(--blue)', strokeWidth: 2, fill: 'white', r: 3 }}
                activeDot={{ stroke: 'var(--blue)', strokeWidth: 2, fill: 'var(--blue)', r: 5 }}
                animationDuration={1800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-muted" style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.8rem', 
          textAlign: 'right',
          fontFamily: 'Roboto Serif, serif'
        }}>
          Data calculated using PolicyEngine
        </div>
      </div>
    </div>
  );
};