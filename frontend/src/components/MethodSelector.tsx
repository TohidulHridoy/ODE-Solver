import React from 'react';

interface MethodSelectorProps {
  selectedMethods: string[];
  onChange: (methods: string[]) => void;
}

const methodInfo = {
  euler: {
    name: 'Euler',
    description: 'First-order, simple, limited stability',
    order: 1,
  },
  heun: {
    name: 'Heun (Improved Euler)',
    description: 'Second-order, good balance of accuracy and speed',
    order: 2,
  },
  rk4: {
    name: 'RK4 (Classical)',
    description: 'Fourth-order, excellent accuracy, most popular',
    order: 4,
  },
  rk45: {
    name: 'RK45 (Adaptive)',
    description: 'Adaptive step control, best for stiff problems',
    order: 4,
  },
};

const MethodSelector: React.FC<MethodSelectorProps> = ({
  selectedMethods,
  onChange,
}) => {
  const toggleMethod = (method: string) => {
    if (selectedMethods.includes(method)) {
      onChange(selectedMethods.filter((m) => m !== method));
    } else {
      onChange([...selectedMethods, method]);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Solver Methods (Select Multiple)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Compare multiple methods simultaneously. Methods will overlay on chart.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {Object.entries(methodInfo).map(([key, info]) => (
          <label
            key={key}
            className="flex items-start p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition"
          >
            <input
              type="checkbox"
              checked={selectedMethods.includes(key)}
              onChange={() => toggleMethod(key)}
              className="mt-1 mr-3 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800">{info.name}</p>
              <p className="text-xs text-gray-600">{info.description}</p>
              <p className="text-xs text-blue-600 mt-1">Order: {info.order}</p>
            </div>
          </label>
        ))}
      </div>

      {selectedMethods.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2">
          <p className="text-xs text-amber-700">⚠ Select at least one method</p>
        </div>
      )}
    </div>
  );
};

export default MethodSelector;
