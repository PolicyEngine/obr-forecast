import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Median Household Income</CardTitle>
          <CardDescription>Annual household income after taxes and benefits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={medianIncomeWithChange} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="value" 
                  name="Median Income" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="changeFromBaseline" 
                  name="Change from 2025" 
                  stroke="hsl(var(--accent-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted-foreground text-right mt-2">
            Data calculated using PolicyEngine
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Poverty Rate</CardTitle>
          <CardDescription>Percentage of population below the poverty line</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={povertyRateWithChange} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="value" 
                  name="Poverty Rate" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="changeInPctPoints" 
                  name="Change from 2025 (pp)" 
                  stroke="hsl(var(--accent-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted-foreground text-right mt-2">
            Data calculated using PolicyEngine
          </div>
        </CardContent>
      </Card>
    </div>
  );
};