import React from 'react';

export const StatsGrid = ({ stats, season }) => {
  const statCards = [
    { label: 'Points', value: stats.ppg, context: 'Per Game' },
    { label: 'Rebounds', value: stats.rpg, context: 'Per Game' },
    { label: 'Assists', value: stats.apg, context: 'Per Game' },
    { label: 'Steals', value: stats.stl, context: 'Per Game' },
    { label: 'Blocks', value: stats.blk, context: 'Per Game' },
    { label: '3P%', value: stats.threePct, context: '3-Point' },
    { label: 'TS%', value: stats.ts, context: 'True Shooting' },
    { label: 'Usage', value: stats.usg, context: 'Rate' },
    { label: 'AST%', value: stats.ast, context: 'Assist Rate' },
    { label: 'TOV%', value: stats.tov, context: 'Turnover Rate' },
    { label: 'BPM', value: stats.bpm, context: 'Box Plus/Minus' },
    { label: 'OBPM', value: stats.obpm, context: 'Offensive' }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Statistics</h3>
        <span className="text-sm font-semibold text-neutral-500">{season} Season</span>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-neutral-50 rounded-xl p-4 text-center hover:bg-neutral-100 transition-colors">
            <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-neutral-900">{stat.value}</div>
            <div className="text-xs text-neutral-400">{stat.context}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
