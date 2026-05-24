import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface ErrorChartProps {
  solutions: Array<{
    method: string;
    x_values: number[];
    local_errors?: number[];
    error_estimates?: number[];
  }>;
  title?: string;
  errorType?: 'local' | 'adaptive';
}

const methodColors: Record<string, string> = {
  Euler: '#ef4444',
  Heun: '#f59e0b',
  RK4: '#3b82f6',
  RK45: '#8b5cf6',
};

const ErrorChart: React.FC<ErrorChartProps> = ({
  solutions,
  title = 'Error Analysis',
  errorType = 'local',
}) => {
  const activeSolutions = solutions.filter((s) => {
    const errors = errorType === 'local' ? s.local_errors : s.error_estimates;
    return errors && errors.length > 0;
  });

  if (activeSolutions.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-lg">
        <p className="text-gray-500">No error data available</p>
      </div>
    );
  }

  // সব solution থেকে data একসাথে merge করি
  const maxLen = Math.max(
    ...activeSolutions.map((s) => {
      const e = errorType === 'local' ? s.local_errors : s.error_estimates;
      return e ? e.length : 0;
    })
  );

  const step = Math.max(1, Math.floor(maxLen / 300));
  const chartData: any[] = [];

  for (let i = 0; i < maxLen; i += step) {
    const point: any = { step: i };
    activeSolutions.forEach((sol) => {
      const errors = errorType === 'local' ? sol.local_errors : sol.error_estimates;
      if (errors && i < errors.length) {
        const val = Math.abs(errors[i]);
        point[`${sol.method}_error`] = val > 0 ? val : 1e-20;
      }
    });
    chartData.push(point);
  }

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-600 mt-1">
          {errorType === 'local'
            ? 'Local truncation errors at each step (log scale)'
            : 'Adaptive error estimates (RK45)'}
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="step"
              label={{ value: 'Step Index', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={(v) => v.toExponential(0)}
              label={{ value: 'Error (log)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: any) =>
                typeof value === 'number' ? value.toExponential(3) : value
              }
              labelFormatter={(label) => `Step: ${label}`}
            />
            <Legend />
            {activeSolutions.map((sol) => (
              <Line
                key={`${sol.method}_error`}
                type="monotone"
                dataKey={`${sol.method}_error`}
                stroke={methodColors[sol.method] || '#666'}
                dot={false}
                isAnimationActive={false}
                name={`${sol.method} Local Error`}
                strokeWidth={1.5}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Higher-order methods (RK4, Heun) have smaller
          local errors than Euler for the same step size.
        </p>
      </div>
    </div>
  );
};

export default ErrorChart;