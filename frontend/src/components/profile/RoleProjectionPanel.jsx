import React from 'react';

export const RoleProjectionPanel = ({ projection }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Role Projection</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Offensive Role</div>
          <div className="text-lg font-bold text-neutral-900">{projection.offensiveRole}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Defensive Role</div>
          <div className="text-lg font-bold text-neutral-900">{projection.defensiveRole}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Archetype</div>
          <div className="text-lg font-bold text-red-600">{projection.archetype}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Draft Range</div>
          <div className="text-lg font-bold text-neutral-900">{projection.draftRange}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase">Model Tier</span>
          <div className={`inline-block ml-3 px-3 py-1 rounded-full text-sm font-bold ${
            projection.tier?.includes('1') ? 'bg-green-100 text-green-800' :
            projection.tier?.includes('2') ? 'bg-yellow-100 text-yellow-800' :
            projection.tier?.includes('3') ? 'bg-blue-100 text-blue-800' :
            'bg-neutral-100 text-neutral-600'
          }`}>
            {projection.tier}
          </div>
        </div>
      </div>
    </div>
  );
};
