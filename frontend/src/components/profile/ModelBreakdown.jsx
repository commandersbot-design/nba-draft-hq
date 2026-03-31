import React from 'react';

export const ModelBreakdown = ({ traits, weightedScore, riskPenalty, finalScore, tier }) => {
  const traitLabels = {
    'advantage_creation': 'Advantage Creation',
    'decision_making': 'Decision Making',
    'passing_creation': 'Passing Creation',
    'shooting_gravity': 'Shooting Gravity',
    'off_ball_value': 'Off-Ball Value',
    'processing_speed': 'Processing Speed',
    'scalability': 'Scalability',
    'defensive_versatility': 'Defensive Versatility'
  };

  const getBarColor = (grade) => {
    if (grade >= 8) return 'bg-green-500';
    if (grade >= 6) return 'bg-blue-500';
    if (grade >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Model Breakdown</h3>
        <span className="text-xs text-neutral-400 italic">FinalBoardScore = WeightedTraitScore - RiskPenalty</span>
      </div>

      {/* Trait Bars */}
      <div className="space-y-4 mb-6">
        {traits.map(trait => (
          <div key={trait.key} className="flex items-center gap-4">
            <div className="w-40 text-sm font-semibold text-neutral-700">{traitLabels[trait.key]}</div>
            <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(trait.grade)} transition-all duration-500`}
                style={{ width: `${(trait.grade / 9) * 100}%` }}
              />
            </div>
            <div className="w-8 text-right font-bold text-neutral-900">{trait.grade}</div>
          </div>
        ))}
      </div>

      {/* Score Breakdown */}
      <div className="bg-neutral-50 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Weighted Trait Score</div>
            <div className="text-2xl font-black text-neutral-900">{weightedScore.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Risk Penalty</div>
            <div className="text-2xl font-black text-red-600">-{riskPenalty.toFixed(1)}</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">Final Score</div>
            <div className="text-3xl font-black text-white">{finalScore.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
