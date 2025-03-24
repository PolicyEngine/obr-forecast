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
  absolutePovertyAhcByYear: YearlyMetric[];
  absolutePovertyBhcByYear: YearlyMetric[];
  relativePovertyAhcByYear: YearlyMetric[];
  relativePovertyBhcByYear: YearlyMetric[];
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
  absolutePovertyAhcByYear,
  absolutePovertyBhcByYear,
  relativePovertyAhcByYear,
  relativePovertyBhcByYear,
  isLoading,
}: ForecastResultsProps) => {
  // Calculate baseline values (2025)
  const baselineYear = medianIncomeByYear.length > 0 ? medianIncomeByYear[0].year : 0;
  const baselineMedianIncome = medianIncomeByYear.length > 0 ? medianIncomeByYear[0].value : 0;
  const baselineAbsolutePovertyAhc = absolutePovertyAhcByYear.length > 0 ? absolutePovertyAhcByYear[0].value : 0;
  const baselineAbsolutePovertyBhc = absolutePovertyBhcByYear.length > 0 ? absolutePovertyBhcByYear[0].value : 0;
  const baselineRelativePovertyAhc = relativePovertyAhcByYear.length > 0 ? relativePovertyAhcByYear[0].value : 0;
  const baselineRelativePovertyBhc = relativePovertyBhcByYear.length > 0 ? relativePovertyBhcByYear[0].value : 0;

  // Custom Tooltip component for charts
  const CustomTooltip = ({ active, payload, label, formatter, baselineValue, baselineYear }: any) => {
    if (active && payload && payload.length) {
      // Calculate change from baseline
      const currentValue = payload[0].value;
      const isBaseline = label === baselineYear;
      
      // Calculate percentage change for income or percentage point change for poverty
      let changeValue, changeLabel;
      if (formatter === formatCurrency) {
        // For income, calculate percentage change
        changeValue = isBaseline ? 0 : ((currentValue - baselineValue) / baselineValue) * 100;
        changeLabel = "Change from baseline";
        changeValue = `${changeValue.toFixed(1)}%`;
      } else {
        // For poverty rate, calculate percentage point change
        changeValue = isBaseline ? 0 : (currentValue - baselineValue) * 100;
        changeLabel = "Change from baseline";
        changeValue = `${changeValue.toFixed(1)} pp`;
      }

      return (
        <div style={{ 
          backgroundColor: 'var(--white)', 
          padding: '10px 16px', 
          border: '1px solid var(--medium-dark-gray)',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontFamily: 'Roboto, sans-serif',
          minWidth: '180px',
        }}>
          <p style={{ 
            margin: '0 0 8px',
            fontWeight: 'bold',
            fontFamily: 'Roboto Mono, monospace',
            borderBottom: '1px solid var(--light-gray)',
            paddingBottom: '4px',
          }}>{`Year: ${label}`}</p>
          
          <p style={{ 
            margin: '3px 0',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            color: payload[0].color,
          }}>
            <span>Value:</span>
            <span style={{ fontWeight: 'bold' }}>{formatter(currentValue)}</span>
          </p>
          
          {!isBaseline && (
            <p style={{ 
              margin: '3px 0',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              color: 'var(--teal-accent)',
            }}>
              <span>{changeLabel}:</span>
              <span style={{ fontWeight: 'bold' }}>{changeValue}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get last year's data for summary block
  const lastYear = medianIncomeByYear.length > 0 ? medianIncomeByYear[medianIncomeByYear.length - 1].year : 0;
  const lastYearMedianIncome = medianIncomeByYear.length > 0 ? medianIncomeByYear[medianIncomeByYear.length - 1].value : 0;
  const lastYearAbsolutePovertyAhc = absolutePovertyAhcByYear.length > 0 ? absolutePovertyAhcByYear[absolutePovertyAhcByYear.length - 1].value : 0;
  
  // Calculate changes from baseline
  const incomeChange = lastYearMedianIncome - baselineMedianIncome;
  const incomeChangePercent = ((incomeChange / baselineMedianIncome) * 100).toFixed(1);
  const absolutePovertyAhcChange = lastYearAbsolutePovertyAhc - baselineAbsolutePovertyAhc;
  const absolutePovertyAhcChangePoints = (absolutePovertyAhcChange * 100).toFixed(1);
  
  // Estimate poverty headcount (assuming UK population of 67 million)
  const ukPopulation = 67000000;
  const baselineAbsolutePovertyAhcHeadcount = Math.round(baselineAbsolutePovertyAhc * ukPopulation);
  const lastYearAbsolutePovertyAhcHeadcount = Math.round(lastYearAbsolutePovertyAhc * ukPopulation);
  const absolutePovertyAhcHeadcountChange = lastYearAbsolutePovertyAhcHeadcount - baselineAbsolutePovertyAhcHeadcount;
  
  return (
    <div className="space-y-6 fade-in" style={{ animationDelay: '300ms' }}>
      {/* Summary block */}
      <div className="card">
        <h3 className="card-title">Forecast Summary</h3>
        <p className="card-description">Key changes from {baselineYear} to {lastYear}</p>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-lg font-medium">Median Household Income</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(lastYearMedianIncome)} 
              <span className={incomeChange >= 0 ? "text-green-600" : "text-red-600"}>
                ({incomeChange >= 0 ? "+" : ""}{formatCurrency(incomeChange)} / {incomeChangePercent}%)
              </span>
            </p>
          </div>
          <div>
            <p className="text-lg font-medium">Absolute Poverty Rate (AHC)</p>
            <p className="text-2xl font-bold text-red-600">
              {formatPercentage(lastYearAbsolutePovertyAhc)} 
              <span className={absolutePovertyAhcChange <= 0 ? "text-green-600" : "text-red-600"}>
                ({absolutePovertyAhcChange <= 0 ? "" : "+"}{absolutePovertyAhcChangePoints}pp / 
                {absolutePovertyAhcHeadcountChange <= 0 ? "" : "+"}{Math.abs(absolutePovertyAhcHeadcountChange).toLocaleString()} people)
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Existing charts - now full width */}
      <div className="card">
        <h3 className="card-title">Median Household Income</h3>
        <p className="card-description">Annual household income after taxes and benefits</p>
        
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={medianIncomeByYear} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                orientation="left" 
                tickFormatter={formatCurrency} 
                stroke="var(--blue)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={formatCurrency}
                    baselineValue={baselineMedianIncome}
                    baselineYear={baselineYear}
                  />
                } 
              />
              <ReferenceLine
                y={baselineMedianIncome}
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                label={{ 
                  value: "Baseline (2025)", 
                  position: "right",
                  fill: "var(--dark-gray)",
                  fontSize: 12,
                  fontFamily: "Roboto, sans-serif"
                }}
              />
              <Line 
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

      {/* Absolute Poverty AHC Chart */}
      <div className="card">
        <h3 className="card-title">Absolute Poverty Rate (After Housing Costs)</h3>
        <p className="card-description">Percentage of population below the absolute poverty line after housing costs</p>
        
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={absolutePovertyAhcByYear} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                orientation="left" 
                tickFormatter={formatPercentage} 
                stroke="var(--dark-red)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={formatPercentage}
                    baselineValue={baselineAbsolutePovertyAhc}
                    baselineYear={baselineYear}
                  />
                } 
              />
              <ReferenceLine
                y={baselineAbsolutePovertyAhc}
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                label={{ 
                  value: "Baseline (2025)", 
                  position: "right",
                  fill: "var(--dark-gray)",
                  fontSize: 12,
                  fontFamily: "Roboto, sans-serif"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Absolute Poverty Rate (AHC)" 
                stroke="var(--dark-red)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--dark-red)', strokeWidth: 2, fill: 'white', r: 4 }}
                activeDot={{ stroke: 'var(--dark-red)', strokeWidth: 2, fill: 'var(--dark-red)', r: 6 }}
                animationDuration={1500}
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

      {/* Absolute Poverty BHC Chart */}
      <div className="card">
        <h3 className="card-title">Absolute Poverty Rate (Before Housing Costs)</h3>
        <p className="card-description">Percentage of population below the absolute poverty line before housing costs</p>
        
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={absolutePovertyBhcByYear} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                orientation="left" 
                tickFormatter={formatPercentage} 
                stroke="var(--dark-red)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={formatPercentage}
                    baselineValue={baselineAbsolutePovertyBhc}
                    baselineYear={baselineYear}
                  />
                } 
              />
              <ReferenceLine
                y={baselineAbsolutePovertyBhc}
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                label={{ 
                  value: "Baseline (2025)", 
                  position: "right",
                  fill: "var(--dark-gray)",
                  fontSize: 12,
                  fontFamily: "Roboto, sans-serif"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Absolute Poverty Rate (BHC)" 
                stroke="var(--orange)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--orange)', strokeWidth: 2, fill: 'white', r: 4 }}
                activeDot={{ stroke: 'var(--orange)', strokeWidth: 2, fill: 'var(--orange)', r: 6 }}
                animationDuration={1500}
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

      {/* Relative Poverty AHC Chart */}
      <div className="card">
        <h3 className="card-title">Relative Poverty Rate (After Housing Costs)</h3>
        <p className="card-description">Percentage of population with income below 60% of median (after housing costs)</p>
        
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={relativePovertyAhcByYear} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                orientation="left" 
                tickFormatter={formatPercentage} 
                stroke="var(--purple)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={formatPercentage}
                    baselineValue={baselineRelativePovertyAhc}
                    baselineYear={baselineYear}
                  />
                } 
              />
              <ReferenceLine
                y={baselineRelativePovertyAhc}
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                label={{ 
                  value: "Baseline (2025)", 
                  position: "right",
                  fill: "var(--dark-gray)",
                  fontSize: 12,
                  fontFamily: "Roboto, sans-serif"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Relative Poverty Rate (AHC)" 
                stroke="var(--purple)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--purple)', strokeWidth: 2, fill: 'white', r: 4 }}
                activeDot={{ stroke: 'var(--purple)', strokeWidth: 2, fill: 'var(--purple)', r: 6 }}
                animationDuration={1500}
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

      {/* Relative Poverty BHC Chart */}
      <div className="card">
        <h3 className="card-title">Relative Poverty Rate (Before Housing Costs)</h3>
        <p className="card-description">Percentage of population with income below 60% of median (before housing costs)</p>
        
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={relativePovertyBhcByYear} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
              <XAxis 
                dataKey="year" 
                stroke="var(--dark-gray)" 
                tick={{ fontFamily: 'Roboto Mono, monospace' }} 
              />
              <YAxis 
                orientation="left" 
                tickFormatter={formatPercentage} 
                stroke="var(--teal-accent)"
                tick={{ fontFamily: 'Roboto Mono, monospace' }}
                tickMargin={5}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={
                  <CustomTooltip 
                    formatter={formatPercentage}
                    baselineValue={baselineRelativePovertyBhc}
                    baselineYear={baselineYear}
                  />
                } 
              />
              <ReferenceLine
                y={baselineRelativePovertyBhc}
                stroke="var(--medium-dark-gray)"
                strokeDasharray="3 3"
                label={{ 
                  value: "Baseline (2025)", 
                  position: "right",
                  fill: "var(--dark-gray)",
                  fontSize: 12,
                  fontFamily: "Roboto, sans-serif"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Relative Poverty Rate (BHC)" 
                stroke="var(--teal-accent)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--teal-accent)', strokeWidth: 2, fill: 'white', r: 4 }}
                activeDot={{ stroke: 'var(--teal-accent)', strokeWidth: 2, fill: 'var(--teal-accent)', r: 6 }}
                animationDuration={1500}
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