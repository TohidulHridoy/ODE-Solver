import React, { useState } from 'react';

interface StabilityDiagramProps {
  odeExpression?: string;
  stepSize?: number;
}

const stabilityData = [
  {
    method: 'Euler', order: 1, color: '#ef4444',
    interval: '[-2, 0]', evals: 1, best: 'Simple problems',
    description: 'Requires h < 2/|λ| for stability.',
    maxStable: 2.0,
    region: [[-2,0],[-1,1],[0,0],[-1,-1],[-2,0]],
  },
  {
    method: 'Heun', order: 2, color: '#f59e0b',
    interval: '[-2, 0]', evals: 2, best: 'Moderate accuracy',
    description: 'Predictor-corrector. Better than Euler.',
    maxStable: 2.0,
    region: [[-2,0],[-1,1.5],[0,0],[-1,-1.5],[-2,0]],
  },
  {
    method: 'RK4', order: 4, color: '#3b82f6',
    interval: '[-2.79, 0]', evals: 4, best: 'Most problems',
    description: 'Industry standard. Large stability region.',
    maxStable: 2.79,
    region: [[-2.79,0],[-2,2],[0,2.83],[0,-2.83],[-2,-2],[-2.79,0]],
  },
  {
    method: 'RK45', order: 4, color: '#8b5cf6',
    interval: 'Adaptive', evals: 6, best: 'Stiff problems',
    description: 'Adaptive step control. Error-controlled.',
    maxStable: 3.5,
    region: [[-3.5,0],[-2.5,2.5],[0,3.5],[0,-3.5],[-2.5,-2.5],[-3.5,0]],
  },
  {
  method: 'Taylor',
  order: 4,
  color: '#10b981',
  interval: '[-2.79, 0]',
  evals: 0,
  best: 'Educational comparison with RK4',
  description: 'Has an identical stability region to RK4 because both methods match the same O(h⁴) Taylor expansion. The difference is that Taylor uses symbolic derivatives instead of additional function evaluations.',
  maxStable: 2.79,
  region: [[-2.79,0],[-2,2],[0,2.83],[0,-2.83],[-2,-2],[-2.79,0]],
},
];

const StabilityDiagram: React.FC<StabilityDiagramProps> = ({
  odeExpression = '',
  stepSize = 0.1,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const width = 420;
  const height = 380;
  const cx = width / 2 + 40;
  const cy = height / 2;
  const scale = 52;

  const toSVG = (re: number, im: number) => ({
    x: cx + re * scale,
    y: cy - im * scale,
  });

  const toPath = (region: number[][]) =>
    region.map((p, i) => {
      const { x, y } = toSVG(p[0], p[1]);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ') + ' Z';

  // ODE eigenvalue estimation — coefficient of y
  const estimateLambda = (expr: string): number => {
    try {
      const match = expr.match(/([+-]?\s*\d*\.?\d*)\s*\*?\s*y\b/);
      if (match) {
        const coeff = match[1].replace(/\s/g, '');
        if (coeff === '' || coeff === '+') return 1;
        if (coeff === '-') return -1;
        return parseFloat(coeff);
      }
      return -1;
    } catch { return -1; }
  };

  const lambda = estimateLambda(odeExpression);
  const hLambda = stepSize * lambda;
  const operatingPoint = toSVG(hLambda, 0);

  // Check stability for each method
  const isStable = (method: typeof stabilityData[0]) => {
    if (method.method === 'RK45') return true;
    return Math.abs(hLambda) <= method.maxStable && hLambda <= 0;
  };

  const selectedData = stabilityData.find(d => d.method === selected);

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Stability Region Diagrams</h3>
        <p className="text-xs text-gray-600 mt-1">
          Stability regions in the complex hλ-plane. Methods stable inside shaded regions.
          {odeExpression && ` Current ODE: hλ = ${hLambda.toFixed(3)}`}
        </p>
      </div>

      {/* ODE Stability Status */}
      {odeExpression && (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {stabilityData.map(d => {
            const stable = isStable(d);
            return (
              <div key={d.method}
                className={`rounded-lg p-2 border text-center text-xs font-medium ${
                  stable
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}
              >
                <div className="font-bold">{d.method}</div>
                <div>{stable ? '✅ Stable' : '❌ Unstable'}</div>
                <div className="text-gray-500 mt-0.5">hλ={hLambda.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* SVG Diagram */}
        <div className="bg-white border border-gray-300 rounded-lg p-3 flex justify-center">
          <svg width={width} height={height}>
            {/* Grid */}
            {[-4,-3,-2,-1,0].map(i => (
              <line key={`v${i}`}
                x1={toSVG(i,0).x} y1={30}
                x2={toSVG(i,0).x} y2={height-20}
                stroke="#f3f4f6" strokeWidth="1"/>
            ))}
            {[-3,-2,-1,0,1,2,3].map(i => (
              <line key={`h${i}`}
                x1={40} y1={toSVG(0,i).y}
                x2={width-10} y2={toSVG(0,i).y}
                stroke="#f3f4f6" strokeWidth="1"/>
            ))}

            {/* Axes */}
            <line x1={40} y1={cy} x2={width-10} y2={cy} stroke="#374151" strokeWidth="1.5"/>
            <line x1={cx} y1={30} x2={cx} y2={height-20} stroke="#374151" strokeWidth="1.5"/>

            {/* Labels */}
            <text x={width-15} y={cy+15} fontSize="11" fill="#374151">Re</text>
            <text x={cx+5} y={28} fontSize="11" fill="#374151">Im</text>

            {/* Tick labels */}
            {[-4,-3,-2,-1].map(i => (
              <text key={i} x={toSVG(i,0).x} y={cy+16} fontSize="9" fill="#6b7280" textAnchor="middle">{i}</text>
            ))}
            {[-2,-1,1,2].map(i => (
              <text key={i} x={cx-14} y={toSVG(0,i).y+4} fontSize="9" fill="#6b7280" textAnchor="middle">{i}</text>
            ))}

            {/* Stability regions */}
            {stabilityData.map((d) => (
              <path
                key={d.method}
                d={toPath(d.region)}
                fill={d.color}
                fillOpacity={selected === d.method ? 0.35 : 0.15}
                stroke={d.color}
                strokeWidth={selected === d.method ? 2.5 : 1.5}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(selected === d.method ? null : d.method)}
              />
            ))}

            {/* Origin */}
            <circle cx={cx} cy={cy} r="3" fill="#374151"/>
            <text x={cx+4} y={cy-4} fontSize="9" fill="#374151">0</text>

            {/* Operating point hλ */}
            {odeExpression && (
              <>
                <line
                  x1={operatingPoint.x} y1={30}
                  x2={operatingPoint.x} y2={height-20}
                  stroke="#dc2626" strokeWidth="1"
                  strokeDasharray="4 2" strokeOpacity="0.6"
                />
                <circle
                  cx={operatingPoint.x} cy={operatingPoint.y}
                  r="6" fill="#dc2626" stroke="white" strokeWidth="2"
                />
                <text
                  x={operatingPoint.x + 8} y={operatingPoint.y - 8}
                  fontSize="9" fill="#dc2626" fontWeight="bold"
                >
                  hλ={hLambda.toFixed(2)}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="flex-1 space-y-3">
          {selectedData ? (
            <div className="bg-white border rounded-lg p-4 space-y-2"
              style={{ borderColor: selectedData.color }}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedData.color }}/>
                <h4 className="font-bold text-gray-800">{selectedData.method}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Order {selectedData.order}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="font-semibold">Stability interval:</span> {selectedData.interval}</p>
                <p><span className="font-semibold">Evals/step:</span> {selectedData.evals}</p>
                <p><span className="font-semibold">Best for:</span> {selectedData.best}</p>
                <p>{selectedData.description}</p>
                {odeExpression && (
                  <p className={`font-semibold mt-1 ${isStable(selectedData) ? 'text-green-600' : 'text-red-600'}`}>
                    For your ODE: {isStable(selectedData) ? '✅ Stable' : '❌ Unstable'} (hλ={hLambda.toFixed(3)})
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Click a region to see method details</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {stabilityData.map(d => (
              <button key={d.method}
                onClick={() => setSelected(selected === d.method ? null : d.method)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                  selected === d.method ? 'shadow-md' : 'hover:bg-gray-50'
                }`}
                style={{
                  borderColor: d.color,
                  backgroundColor: selected === d.method ? d.color + '20' : undefined,
                  color: selected === d.method ? d.color : '#374151',
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}/>
                {d.method}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <th className="px-3 py-2 text-left">Method</th>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Stability Interval</th>
              <th className="px-3 py-2 text-left">Evals/Step</th>
              <th className="px-3 py-2 text-left">Best For</th>
              {odeExpression && <th className="px-3 py-2 text-left">Your ODE</th>}
            </tr>
          </thead>
          <tbody>
            {stabilityData.map((d, i) => (
              <tr key={d.method}
                className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-blue-50`}
                onClick={() => setSelected(selected === d.method ? null : d.method)}
              >
                <td className="border border-gray-200 px-3 py-2 font-semibold" style={{ color: d.color }}>{d.method}</td>
                <td className="border border-gray-200 px-3 py-2">{d.order}</td>
                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">{d.interval}</td>
                <td className="border border-gray-200 px-3 py-2">{d.evals}</td>
                <td className="border border-gray-200 px-3 py-2 text-xs">{d.best}</td>
                {odeExpression && (
                  <td className="border border-gray-200 px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isStable(d)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isStable(d) ? '✅ Stable' : '❌ Unstable'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StabilityDiagram;