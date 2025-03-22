import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts';

interface DecileYearlyChange {
  decile: number;
  year: number;
  change: number;
}

interface DecileYearlyChangeChartProps {
  decileYearlyChanges: DecileYearlyChange[];
  isLoading: boolean;
}

// Function to format percentage values
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Generate colors for deciles (1 = blue, 10 = red, gradient in between)
const getDecileColor = (decile: number) => {
  // Blue (decile 1) to Red (decile 10)
  const blueComponent = Math.max(0, Math.round((11 - decile) / 10 * 255));
  const redComponent = Math.max(0, Math.round(decile / 10 * 255));
  
  return `rgb(${redComponent}, 50, ${blueComponent})`;
};

export const DecileYearlyChangeChart = ({
  decileYearlyChanges,
  isLoading,
}: DecileYearlyChangeChartProps) => {
  // Get unique years
  const years = [...new Set(decileYearlyChanges.map(item => item.year))].sort();
  
  // Transform data to group by year
  const yearData = years.map(year => {
    // Create an object with year and decile properties
    const yearObj: any = { year };
    
    // Add properties for each decile
    for (let decile = 1; decile <= 10; decile++) {
      const item = decileYearlyChanges.find(d => d.year === year && d.decile === decile);
      yearObj[`decile${decile}`] = item ? item.change : 0;
    }
    
    return yearObj;
  });

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Extract decile from the dataKey (e.g., "decile1" -> 1)
      const decileStr = payload[0].dataKey;
      const decile = parseInt(decileStr.replace('decile', ''));
      const year = label;
      const value = payload[0].value;
      
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
          }}>{`Year: ${year}, Decile: ${decile}`}</p>
          
          <p style={{ 
            margin: '3px 0',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            color: getDecileColor(decile),
          }}>
            <span>Year-over-Year Change:</span>
            <span style={{ fontWeight: 'bold' }}>{formatPercentage(value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card w-full">
      <h3 className="card-title">Income Growth by Decile</h3>
      <p className="card-description">Year-over-year change in aggregate household income by income decile</p>
      
      <div style={{ height: '450px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={yearData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--light-gray)" />
            <XAxis 
              dataKey="year" 
              stroke="var(--dark-gray)" 
              tickLine={false}
              tick={{ fontFamily: 'Roboto Mono, monospace' }}
              interval={0}
              axisLine={{ stroke: 'var(--dark-gray)' }}
              label={{
                value: 'Year',
                position: 'insideBottom',
                offset: -5,
                fontFamily: 'Roboto, sans-serif'
              }}
            />
            <YAxis 
              tickFormatter={formatPercentage} 
              stroke="var(--dark-gray)"
              tick={{ fontFamily: 'Roboto Mono, monospace' }}
              label={{
                value: 'Year-over-Year Change',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fontFamily: 'Roboto, sans-serif'
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              payload={
                Array.from({ length: 10 }, (_, i) => i + 1).map(decile => ({
                  value: `Decile ${decile}`,
                  type: 'square',
                  color: getDecileColor(decile)
                }))
              }
            />
            <ReferenceLine y={0} stroke="var(--dark-gray)" />
            
            {/* Create a bar for each decile */}
            {Array.from({ length: 10 }, (_, i) => i + 1).map(decile => (
              <Bar 
                key={`decile-${decile}`}
                dataKey={`decile${decile}`}
                name={`Decile ${decile}`}
                fill={getDecileColor(decile)}
                stroke="none"
                radius={[2, 2, 0, 0]}
                barSize={12}
              />
            ))}
          </BarChart>
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
  );
};