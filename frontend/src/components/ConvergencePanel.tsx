import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import ODESolverAPI from '../api/client';

interface ConvergencePanelProps {
  odeExpression: string;
  initialX: number;
  initialY: number;
  xEnd: number;
}

interface ConvergenceData {
  method: string;
  step_sizes: number[];
  steps_taken: number[];
  global_errors: number[];
  convergence_order?: number;
  has_exact_solution: boolean;
}

const ConvergencePanel: React.FC<ConvergencePanelProps> = ({
  odeExpression, initialX, initialY, xEnd,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConvergenceData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('rk4');
  const [error, setError] = useState<string | null>(null);

  const analyzeConvergence = async () => {
    if (!odeExpression.trim()) {
      setError('Please enter an ODE expression first');
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const api = new ODESolverAPI();
      const result = await api.convergenceAnalysis(
        odeExpression, initialX, initialY, xEnd,
        [0.1, 0.05, 0.025, 0.0125, 0.00625],
        selectedMethod
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze convergence.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = data
    ? data.step_sizes.map((h, idx) => ({
        log_h: Math.log10(h).toFixed(3),
        log_error: data.global_errors[idx]
          ? Math.log10(Math.max(1e-15, data.global_errors[idx])).toFixed(4)
          : null,
        error: data.global_errors[idx] ?? 0,
        steps: data.steps_taken[idx],
        h,
      }))
    : [];

  return (
    <div className="w-full space-y-4 bg-gray-50 border border-gray-300 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800">Convergence Analysis</h3>
      <p className="text-sm text-gray-600">
        Analyze how numerical error decreases with step size.
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Method</label>
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="euler">Euler</option>
          <option value="heun">Heun</option>
          <option value="rk4">RK4</option>
          <option value="rk45">RK45</option>
        </select>
      </div>

      <button
        onClick={analyzeConvergence}
        disabled={loading || !odeExpression.trim()}
        className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        {loading ? 'Analyzing...' : data ? 'Re-analyze' : 'Analyze Convergence'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && (
        <>
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Global Error vs Step Size (Log-Log) — Method: {data.method.toUpperCase()}
            </h4>
            {data.convergence_order && (
              <p className="text-sm text-green-700 font-medium mb-2">
                Estimated Order: {data.convergence_order.toFixed(2)}
              </p>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="log_h"
                  label={{ value: 'log₁₀(h)', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'log₁₀(Error)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    typeof value === 'string' ? parseFloat(value).toFixed(4) : value,
                    'log₁₀(Error)'
                  ]}
                  labelFormatter={(label) => `log₁₀(h) = ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="log_error"
                  stroke="#3b82f6"
                  dot={{ r: 5 }}
                  name="Global Error"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">Step Size (h)</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Steps</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Global Error</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Scientific</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-mono">{row.h.toFixed(5)}</td>
                    <td className="border border-gray-300 px-3 py-2">{row.steps}</td>
                    <td className="border border-gray-300 px-3 py-2 font-mono">{row.error.toFixed(8)}</td>
                    <td className="border border-gray-300 px-3 py-2 font-mono text-blue-600">
                      {row.error > 0 ? row.error.toExponential(3) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.has_exact_solution ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-700">
                ✓ Exact solution available — errors computed vs analytical solution
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm text-amber-700">
                ℹ No exact solution — errors estimated from Richardson extrapolation
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConvergencePanel;