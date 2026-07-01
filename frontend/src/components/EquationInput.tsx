import React, { useState, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface EquationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

const EquationInput: React.FC<EquationInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter ODE: e.g., -2*y + x',
}) => {
  const [latex, setLatex] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      let latexStr = value
      .replace(/exp\(([^)]+)\)/g, 'e^{$1}')
      .replace(/\*\*(\d+)/g, '^{$1}')
      .replace(/\*\*\(([^)]+)\)/g, '^{($1)}')
      .replace(/\*/g, ' \\cdot ')
      .replace(/sin\(/g, '\\sin(')
      .replace(/cos\(/g, '\\cos(')
      .replace(/tan\(/g, '\\tan(')
      .replace(/log\(/g, '\\ln(')
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
      .replace(/abs\(([^)]+)\)/g, '|$1|');

      if (latexStr) {
        const rendered = katex.renderToString(`\\frac{dy}{dx} = ${latexStr}`, {
          throwOnError: false,
        });
        setLatex(rendered);
        setError('');
      }
    } catch (err) {
      setError('LaTeX rendering error');
    }
  }, [value]);

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          ODE Expression
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
        <p className="text-xs text-gray-500">
          Examples: -2*y, y**2 - y, sin(x)*y, exp(-t)
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
        {latex ? (
          <div className="text-lg" dangerouslySetInnerHTML={{ __html: latex }} />
        ) : (
          <p className="text-gray-400 italic">Enter an expression to see LaTeX preview</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition shadow-md hover:shadow-lg"
      >
        Solve ODE
      </button>
    </div>
  );
};

export default EquationInput;