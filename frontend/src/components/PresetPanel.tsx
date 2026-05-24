import React, { useEffect, useState } from 'react';
import ODESolverAPI, { CaseStudy } from '../api/client';

interface PresetPanelProps {
  onLoadPreset: (caseStudyId: string, methods: string[]) => void;
  loading?: boolean;
}

const categoryIcons: Record<string, string> = {
  'Electrical Engineering': '⚡',
  'Biology/Ecology': '🌿',
  'Thermal Engineering': '🌡️',
  'Chemical Engineering': '⚗️',
  'Mechanical Engineering': '⚙️',
  'Biomedical Engineering': '🧬',
  'Aerospace Engineering': '🛸',
  'Civil Engineering': '🏗️',
  'Environmental Engineering': '🌍',
};

const categoryColors: Record<string, string> = {
  'Electrical Engineering': 'bg-yellow-50 border-yellow-300 text-yellow-800',
  'Biology/Ecology': 'bg-green-50 border-green-300 text-green-800',
  'Thermal Engineering': 'bg-orange-50 border-orange-300 text-orange-800',
  'Chemical Engineering': 'bg-purple-50 border-purple-300 text-purple-800',
  'Mechanical Engineering': 'bg-blue-50 border-blue-300 text-blue-800',
  'Biomedical Engineering': 'bg-pink-50 border-pink-300 text-pink-800',
  'Aerospace Engineering': 'bg-indigo-50 border-indigo-300 text-indigo-800',
  'Civil Engineering': 'bg-stone-50 border-stone-300 text-stone-800',
  'Environmental Engineering': 'bg-teal-50 border-teal-300 text-teal-800',
};

const methodColors: Record<string, string> = {
  euler: 'bg-red-50 border-red-300 text-red-700',
  heun: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  rk4: 'bg-blue-50 border-blue-300 text-blue-700',
  rk45: 'bg-purple-50 border-purple-300 text-purple-700',
};

const methodLabels: Record<string, string> = {
  euler: 'Euler',
  heun: 'Heun',
  rk4: 'RK4',
  rk45: 'RK45',
};

const PresetPanel: React.FC<PresetPanelProps> = ({ onLoadPreset, loading = false }) => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['rk4']);
  const [error, setError] = useState<string | null>(null);
  const [fetchingCases, setFetchingCases] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCaseStudies = async () => {
      try {
        const api = new ODESolverAPI();
        const result = await api.listCaseStudies();
        setCaseStudies(result.case_studies);
        if (result.case_studies.length > 0) {
          setSelectedStudy(result.case_studies[0].id);
        }
      } catch {
        setError('Failed to load case studies');
      } finally {
        setFetchingCases(false);
      }
    };
    fetchCaseStudies();
  }, []);

  const toggleMethod = (method: string) => {
    setSelectedMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const currentStudy = caseStudies.find(s => s.id === selectedStudy);
  const categoryColor = currentStudy
    ? categoryColors[currentStudy.category] || 'bg-gray-50 border-gray-300 text-gray-800'
    : '';
  const categoryIcon = currentStudy
    ? categoryIcons[currentStudy.category] || '📋'
    : '📋';

  // Group by category
  const grouped = caseStudies.reduce((acc, study) => {
    if (!acc[study.category]) acc[study.category] = [];
    acc[study.category].push(study);
    return acc;
  }, {} as Record<string, CaseStudy[]>);

  return (
    <div className="w-full bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <div>
            <h3 className="text-base font-bold text-gray-800">Engineering Presets</h3>
            <p className="text-xs text-gray-500">
              {caseStudies.length} classic engineering problems ready to solve
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {fetchingCases ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/>
            Loading case studies...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">⚠ {error}</p>
          </div>
        ) : (
          <>
            {/* Custom dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Select Case Study
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border-2 border-purple-300 rounded-lg hover:border-purple-400 transition text-left shadow-sm"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 truncate">
                    <span>{categoryIcon}</span>
                    <span className="truncate">{currentStudy?.name || 'Select...'}</span>
                  </span>
                  <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {isOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {Object.entries(grouped).map(([category, studies]) => (
                      <div key={category}>
                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            {categoryIcons[category] || '📋'} {category}
                          </p>
                        </div>
                        {studies.map(study => (
                          <button
                            key={study.id}
                            onClick={() => { setSelectedStudy(study.id); setIsOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition text-sm ${
                              selectedStudy === study.id ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {study.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Case info card */}
            {currentStudy && (
              <div className={`rounded-lg border p-3 space-y-1 ${categoryColor}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcon}</span>
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {currentStudy.category}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{currentStudy.description}</p>
              </div>
            )}

            {/* Method Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Comparison Methods
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['euler', 'heun', 'rk4', 'rk45'].map(method => (
                  <button
                    key={method}
                    onClick={() => toggleMethod(method)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-bold transition ${
                      selectedMethods.includes(method)
                        ? methodColors[method]
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                      selectedMethods.includes(method) ? 'border-current bg-current' : 'border-gray-300'
                    }`}>
                      {selectedMethods.includes(method) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white"/>
                      )}
                    </div>
                    {methodLabels[method]}
                  </button>
                ))}
              </div>
            </div>

            {/* Load Button */}
            <button
              onClick={() => {
                if (selectedStudy && selectedMethods.length > 0) {
                  onLoadPreset(selectedStudy, selectedMethods);
                }
              }}
              disabled={loading || !selectedStudy || selectedMethods.length === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Solving...
                </>
              ) : (
                <>🚀 Load & Solve Case Study</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PresetPanel;