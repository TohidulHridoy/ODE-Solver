import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SolutionChartProps {
  solutions: Array<{
    method: string;
    x_values: number[];
    y_values: number[] | number[][];
    steps_taken: number;
  }>;
  exactSolution?: {
    x_values: number[];
    y_values: number[];
  };
  title?: string;
}

const methodColors: Record<string, string> = {
  Euler: '#ef4444',
  Heun: '#f59e0b',
  RK4: '#3b82f6',
  RK45: '#8b5cf6',
  Taylor: '#10b981',
};

const SolutionChart: React.FC<SolutionChartProps> = ({
  solutions,
  exactSolution,
  title = 'ODE Solution Comparison',
}) => {
  if (solutions.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-lg">
        <p className="text-gray-500">No solutions to display</p>
      </div>
    );
  }

  const baseSolution = solutions.reduce((a, b) =>
    a.x_values.length > b.x_values.length ? a : b
  );
  const xValues = baseSolution.x_values;
  const step = Math.max(1, Math.floor(xValues.length / 500));
  const data: any[] = [];

  for (let i = 0; i < xValues.length; i += step) {
    const point: any = { x: parseFloat(xValues[i].toFixed(4)) };
    solutions.forEach((sol) => {
      const ratio = i / xValues.length;
      const idx = Math.min(Math.floor(ratio * sol.x_values.length), sol.x_values.length - 1);
      const yVal = Array.isArray(sol.y_values[0])
        ? (sol.y_values[idx] as number[])[0]
        : sol.y_values[idx] as number;
      point[sol.method] = typeof yVal === 'number' ? parseFloat(yVal.toFixed(6)) : null;
    });
    if (exactSolution && exactSolution.x_values.length > 0) {
      const ratio = i / xValues.length;
      const exactIdx = Math.min(Math.floor(ratio * exactSolution.x_values.length), exactSolution.x_values.length - 1);
      point['Exact'] = parseFloat(exactSolution.y_values[exactIdx].toFixed(6));
    }
    data.push(point);
  }

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-600 mt-1">
          {solutions.map((s) => `${s.method} (${s.steps_taken} steps)`).join(' · ')}
          {exactSolution ? ' · Exact Solution' : ''}
        </p>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="x" type="number" domain={['auto', 'auto']}
              tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : v}
              label={{ value: 'x', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
                tickFormatter={(v) => typeof v === 'number' ? v.toFixed(3) : v}
                label={{
                    value: 'y(x)',
                    angle: -90,
                    position: 'left',
                    offset: 5,
                }}
                />
            <Tooltip
              formatter={(value: any, name: string) => [
                typeof value === 'number' ? value.toFixed(6) : value, name,
              ]}
              labelFormatter={(label) => `x = ${typeof label === 'number' ? label.toFixed(4) : label}`}
            />
            <Legend />
            {solutions.map((sol) => (
              <Line key={sol.method} type="monotone" dataKey={sol.method}
                stroke={methodColors[sol.method] || '#6b7280'}
                dot={false} isAnimationActive={false} strokeWidth={2} connectNulls
              />
            ))}
            {exactSolution && (
              <Line type="monotone" dataKey="Exact" stroke="#10b981"
                strokeDasharray="6 3" dot={false} isAnimationActive={false}
                strokeWidth={2} connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Better Accuracy Comparison Table */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Method Accuracy Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Steps</th>
                <th className="px-3 py-2 text-left">Final y</th>
                <th className="px-3 py-2 text-left">Error vs Exact</th>
                <th className="px-3 py-2 text-left">Accuracy</th>
                <th className="px-3 py-2 text-left">Color</th>
              </tr>
            </thead>
            <tbody>
              {solutions.map((sol, idx) => {
                const lastY = Array.isArray(sol.y_values[0])
                  ? (sol.y_values[sol.y_values.length - 1] as number[])[0]
                  : sol.y_values[sol.y_values.length - 1] as number;

                const exactLastY = exactSolution
                  ? exactSolution.y_values[exactSolution.y_values.length - 1]
                  : null;

                const absError = exactLastY !== null && typeof lastY === 'number'
                  ? Math.abs(lastY - exactLastY) : null;

                const accuracy = absError !== null
                  ? absError < 1e-8 ? 'Excellent'
                    : absError < 1e-5 ? 'Good'
                    : absError < 1e-3 ? 'Fair'
                    : 'Poor'
                  : 'N/A';

                const accuracyStyle = accuracy === 'Excellent' ? 'text-green-600 bg-green-50'
                  : accuracy === 'Good' ? 'text-blue-600 bg-blue-50'
                  : accuracy === 'Fair' ? 'text-yellow-600 bg-yellow-50'
                  : accuracy === 'Poor' ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 bg-gray-50';

                return (
                  <tr key={sol.method} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-semibold"
                      style={{ color: methodColors[sol.method] || '#6b7280' }}>
                      {sol.method}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">{sol.steps_taken}</td>
                    <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                      {typeof lastY === 'number' ? lastY.toFixed(6) : 'N/A'}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                      {absError !== null ? absError.toExponential(3) : '—'}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${accuracyStyle}`}>
                        {accuracy}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                      <div className="w-6 h-4 rounded"
                        style={{ backgroundColor: methodColors[sol.method] || '#6b7280' }} />
                    </td>
                  </tr>
                );
              })}
              {exactSolution && (
                <tr className="bg-green-50">
                  <td className="border border-gray-200 px-3 py-2 font-semibold text-green-700">Exact</td>
                  <td className="border border-gray-200 px-3 py-2 text-green-700">—</td>
                  <td className="border border-gray-200 px-3 py-2 font-mono text-xs text-green-700">
                    {exactSolution.y_values[exactSolution.y_values.length - 1].toFixed(6)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-green-700 text-xs">0.000e+0</td>
                  <td className="border border-gray-200 px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium text-green-600 bg-green-100">
                      Reference
                    </span>
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    <div className="w-6 h-1 border-t-2 border-dashed border-green-500 mt-1" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SolutionChart;