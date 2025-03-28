// Using native elements instead of Chakra UI
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// This is sample data - in a real application, you would get this from your API
const sampleData = [
  { decile: 1, value: 0.2 },
  { decile: 2, value: 0.3 },
  { decile: 3, value: 0.4 },
  { decile: 4, value: 0.5 },
  { decile: 5, value: 0.6 },
  { decile: 6, value: 0.7 },
  { decile: 7, value: 0.8 },
  { decile: 8, value: 0.9 },
  { decile: 9, value: 1.0 },
  { decile: 10, value: 1.1 },
];

export const ImpactChart = () => {
  // In a real app, this would use data from a state management system like Redux or React Context
  // that would be updated when a forecast is analyzed

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Forecast Impact by Income Decile</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          <p>Impact of forecast on household income by decile</p>
          
          <div style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="decile"
                  label={{ value: 'Income Decile', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{
                    value: 'Impact (£ per year)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip formatter={(value) => [`£${value}`, 'Impact']} />
                <Legend />
                <Bar dataKey="value" name="Impact" fill="#3182CE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-end">
            <p className="text-sm text-gray-500">
              Data calculated using PolicyEngine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
