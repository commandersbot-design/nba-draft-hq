import React from 'react';

export const RiskPanel = ({ risks }) => {
  const riskLabels = {
    'shooting_risk': 'Shooting Translation',
    'physical_translation_risk': 'Physical Translation',
    'creation_translation_risk': 'Creation Translation',
    'defensive_role_risk': 'Defensive Role',
    'processing_risk': 'Processing',
    'age_upside_risk': 'Age/Upside',
    'motor_consistency_risk': 'Motor/Consistency',
    'medical_risk': 'Medical'
  };

  const getRiskLevel = (level) => {
    if (level === 0) return { label: 'None', color: 'bg-green-100 text-green-800' };
    if (level === 1) return { label: 'Low', color: 'bg-blue-100 text-blue-800' };
    if (level === 2) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'High', color: 'bg-red-100 text-red-800' };
  };

  const getDots = (level) => {
    return (
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < level ? 'bg-red-500' : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Risk Assessment</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {risks.map(risk => {
          const level = getRiskLevel(risk.level);
          return (
            <div key={risk.key} className="bg-neutral-50 rounded-lg p-3">
              <div className="text-xs font-medium text-neutral-500 mb-2">{riskLabels[risk.key]}</div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-1 rounded ${level.color}`}>
                  {level.label}
                </span>
                {getDots(risk.level)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
