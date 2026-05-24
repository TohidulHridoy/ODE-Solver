interface MethodInfo {
  name: string;
  formula: string;
  order: number;
  stability: string;
  pros: string[];
  cons: string[];
  useCase: string;
}

const methodData: Record<string, MethodInfo> = {
  euler: {
    name: "Euler's Method",
    formula: "y_{n+1} = y_n + h·f(x_n, y_n)",
    order: 1,
    stability: "Conditionally stable. Stable when |1 + hλ| ≤ 1",
    pros: ["Simple to implement", "Fast computation", "Good for quick estimates"],
    cons: ["Low accuracy (Order 1)", "Requires very small h", "Unstable for stiff ODEs"],
    useCase: "Quick approximations, educational purposes",
  },
  heun: {
    name: "Heun's Method (Improved Euler)",
    formula: "k₁ = f(xₙ, yₙ)\nk₂ = f(xₙ+h, yₙ+h·k₁)\ny_{n+1} = yₙ + h/2·(k₁+k₂)",
    order: 2,
    stability: "Better than Euler. Stable region larger in complex plane",
    pros: ["Order 2 accuracy", "Better stability than Euler", "Predictor-corrector approach"],
    cons: ["2 function evaluations per step", "Still limited for stiff problems"],
    useCase: "Moderate accuracy needs, smooth ODEs",
  },
  rk4: {
    name: "Classical RK4",
    formula: "k₁=f(xₙ,yₙ)\nk₂=f(xₙ+h/2, yₙ+h·k₁/2)\nk₃=f(xₙ+h/2, yₙ+h·k₂/2)\nk₄=f(xₙ+h, yₙ+h·k₃)\ny_{n+1}=yₙ+h/6·(k₁+2k₂+2k₃+k₄)",
    order: 4,
    stability: "Large stability region. Works well for most engineering problems",
    pros: ["High accuracy (Order 4)", "Good stability", "Industry standard", "Excellent error control"],
    cons: ["4 function evaluations per step", "Fixed step size", "Not ideal for stiff ODEs"],
    useCase: "Most engineering problems, high accuracy requirements",
  },
  rk45: {
    name: "RK45 (Adaptive)",
    formula: "Uses RK4 and RK5 estimates\nError = |y_RK5 - y_RK4|\nAdapts h based on error tolerance",
    order: 4,
    stability: "Adaptive step control provides excellent stability",
    pros: ["Adaptive step size", "Error controlled", "Efficient for smooth problems", "Best for stiff problems"],
    cons: ["Complex implementation", "Variable step count", "Higher overhead per step"],
    useCase: "Stiff ODEs, when accuracy and efficiency both matter",
  },
};

interface Props {
  method: string;
  onClose: () => void;
}

const MethodTheoryModal: React.FC<Props> = ({ method, onClose }) => {
  const info = methodData[method.toLowerCase()];
  if (!info) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{info.name}</h2>
              <span className="text-blue-200 text-sm">Order of Accuracy: {info.order}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold leading-none"
            >×</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Formula</h3>
            <pre className="text-sm font-mono text-blue-700 whitespace-pre-wrap">{info.formula}</pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Stability</h3>
            <p className="text-sm text-gray-600">{info.stability}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-green-700 mb-2">✓ Pros</h3>
              <ul className="space-y-1">
                {info.pros.map((p, i) => (
                  <li key={i} className="text-xs text-green-800">• {p}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-red-700 mb-2">✗ Cons</h3>
              <ul className="space-y-1">
                {info.cons.map((c, i) => (
                  <li key={i} className="text-xs text-red-800">• {c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Best Use Case</h3>
            <p className="text-sm text-blue-800">{info.useCase}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MethodTheoryModal;