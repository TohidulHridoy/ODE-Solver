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

const methods = [
  {
    key: 'euler',
    label: 'Euler',
    order: 1,
    color: '#ef4444',
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-700',
    activeBg: 'bg-red-500',
    description: 'First-order',
  },
  {
    key: 'heun',
    label: 'Heun',
    order: 2,
    color: '#f59e0b',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    activeBg: 'bg-yellow-500',
    description: 'Second-order',
  },
  {
    key: 'rk4',
    label: 'RK4',
    order: 4,
    color: '#3b82f6',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    activeBg: 'bg-blue-500',
    description: 'Fourth-order',
  },
  {
    key: 'rk45',
    label: 'RK45',
    order: 4,
    color: '#8b5cf6',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    activeBg: 'bg-purple-500',
    description: 'Adaptive',
  },
];

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

  const selectedMethodInfo = methods.find(m => m.key === selectedMethod);

  return (
    <div className="w-full space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Convergence Analysis</h3>
        <p className="text-xs text-gray-500 mt-1">
          Analyze how numerical error decreases as step size h is reduced.
        </p>
      </div>

      {/* Method Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Select Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {methods.map(m => (
            <button
              key={m.key}
              onClick={() => setSelectedMethod(m.key)}
              className={`relative flex flex-col items-start px-4 py-3 rounded-xl border-2 transition-all ${
                selectedMethod === m.key
                  ? `${m.bg} ${m.border} shadow-md scale-[1.02]`
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Active indicator */}
              {selectedMethod === m.key && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: m.color }}/>
              )}

              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: m.color, opacity: selectedMethod === m.key ? 1 : 0.4 }}/>
                <span className={`font-bold text-sm ${
                  selectedMethod === m.key ? m.text : 'text-gray-600'
                }`}>
                  {m.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  selectedMethod === m.key
                    ? `${m.bg} ${m.text} border ${m.border}`
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  Order {m.order}
                </span>
                <span className="text-xs text-gray-400">{m.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyzeConvergence}
        disabled={loading || !odeExpression.trim()}
        className="w-full py-3 rounded-xl font-bold text-white transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: loading || !odeExpression.trim()
            ? '#9ca3af'
            : `linear-gradient(135deg, ${selectedMethodInfo?.color}, ${selectedMethodInfo?.color}cc)`,
        }}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            Analyzing...
          </>
        ) : (
          <>📊 Analyze Convergence</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">⚠ {error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Result header */}
          <div className="flex items-center gap-3 p-3 rounded-xl border-2"
            style={{ borderColor: selectedMethodInfo?.color, backgroundColor: selectedMethodInfo?.color + '10' }}>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedMethodInfo?.color }}/>
            <div>
              <p className="font-bold text-sm text-gray-800">
                {data.method.toUpperCase()} Convergence Result
              </p>
              {data.convergence_order && (
                <p className="text-xs text-gray-600">
                  Estimated Order: <span className="font-bold" style={{ color: selectedMethodInfo?.color }}>
                    {data.convergence_order.toFixed(2)}
                  </span>
                  <span className="text-gray-400 ml-1">
                    (Theoretical: {selectedMethodInfo?.order}.00)
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Global Error vs Step Size (Log-Log)
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis
                  dataKey="log_h"
                  label={{ value: 'log₁₀(h)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
                  tick={{ fontSize: 9 }}
                />
                <YAxis
                  label={{ value: 'log₁₀(Error)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    typeof value === 'string' ? parseFloat(value).toFixed(4) : value,
                    'log₁₀(Error)'
                  ]}
                  labelFormatter={(label) => `log₁₀(h) = ${label}`}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="log_error"
                  stroke={selectedMethodInfo?.color}
                  dot={{ r: 5, fill: selectedMethodInfo?.color }}
                  name="Global Error"
                  strokeWidth={2.5}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: selectedMethodInfo?.color }}>
                  {['Step Size (h)', 'Steps', 'Global Error', 'Scientific'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-white text-xs font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-mono text-xs">{row.h.toFixed(5)}</td>
                    <td className="px-3 py-2 text-xs">{row.steps}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.error.toFixed(8)}</td>
                    <td className="px-3 py-2 font-mono text-xs font-bold"
                      style={{ color: selectedMethodInfo?.color }}>
                      {row.error > 0 ? row.error.toExponential(3) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Exact solution badge */}
          {data.has_exact_solution ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-green-500">✓</span>
              <p className="text-xs text-green-700 font-medium">
                Exact solution available — errors computed vs analytical solution
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-amber-500">ℹ</span>
              <p className="text-xs text-amber-700 font-medium">
                No exact solution — errors estimated from Richardson extrapolation
              </p>
            </div>
          )}

          {/* Re-analyze button */}
          <button
            onClick={analyzeConvergence}
            disabled={loading}
            className="w-full py-2 rounded-xl border-2 font-semibold text-sm transition hover:bg-gray-50"
            style={{ borderColor: selectedMethodInfo?.color, color: selectedMethodInfo?.color }}
          >
            🔄 Re-analyze
          </button>
        </div>
      )}
    </div>
  );
};

export default ConvergencePanel;