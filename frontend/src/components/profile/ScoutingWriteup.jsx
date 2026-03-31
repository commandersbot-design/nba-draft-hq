import React from 'react';

export const ScoutingWriteup = ({ writeup }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-6">Scouting Report</h3>
      
      {/* Summary */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-neutral-900 uppercase mb-3">Summary</h4>
        <p className="text-neutral-700 leading-relaxed">{writeup.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div>
          <h4 className="text-sm font-bold text-green-700 uppercase mb-3">Strengths</h4>
          <ul className="space-y-2">
            {writeup.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-neutral-700">
                <span className="text-green-500 font-bold mt-1">+</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div>
          <h4 className="text-sm font-bold text-red-700 uppercase mb-3">Areas for Improvement</h4>
          <ul className="space-y-2">
            {writeup.weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start gap-2 text-neutral-700">
                <span className="text-red-500 font-bold mt-1">−</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Development Plan */}
      {writeup.developmentPlan && (
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <h4 className="text-sm font-bold text-neutral-900 uppercase mb-3">Development Plan</h4>
          <p className="text-neutral-700 leading-relaxed">{writeup.developmentPlan}</p>
        </div>
      )}

      {/* NBA Role Outlook */}
      {writeup.roleOutlook && (
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <h4 className="text-sm font-bold text-neutral-900 uppercase mb-3">NBA Role Outlook</h4>
          <p className="text-neutral-700 leading-relaxed">{writeup.roleOutlook}</p>
        </div>
      )}
    </div>
  );
};
