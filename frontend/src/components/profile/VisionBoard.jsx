import React, { useState } from 'react';

export const VisionBoard = ({ comps }) => {
  const [selectedComp, setSelectedComp] = useState(null);

  const getCompStyle = (type) => {
    switch(type) {
      case 'high':
        return {
          card: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-200',
          icon: '🚀',
          desc: 'Best-case scenario'
        };
      case 'median':
        return {
          card: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-200',
          icon: '⚖️',
          desc: 'Most likely outcome'
        };
      case 'low':
        return {
          card: 'bg-gradient-to-br from-neutral-500 to-neutral-700 text-white shadow-neutral-200',
          icon: '📉',
          desc: 'Floor outcome'
        };
      case 'style':
        return {
          card: 'bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-violet-200',
          icon: '🎨',
          desc: 'Playing style comp'
        };
      default:
        return {
          card: 'bg-neutral-200 text-neutral-800 shadow-neutral-200',
          icon: '🏀',
          desc: 'Comparison'
        };
    }
  };

  const getCompLabel = (type) => {
    switch(type) {
      case 'high': return 'Ceiling';
      case 'median': return 'Likely';
      case 'low': return 'Floor';
      case 'style': return 'Style';
      default: return type;
    }
  };

  const getCompExplanation = (comp) => {
    const explanations = {
      'high': `${comp.player} represents the ceiling outcome - if everything goes right in development, this prospect could reach a similar level of impact and stardom.`,
      'median': `${comp.player} is the most realistic comparison - this is the type of player this prospect likely becomes with normal development.`,
      'low': `${comp.player} represents the floor - even if things don't go as planned, this prospect should still reach at least this level of production.`,
      'style': `${comp.player} shares a similar playing style - watching this player gives you a sense of how this prospect operates on the court.`
    };
    return explanations[comp.type] || `${comp.player} is a useful comparison for understanding this prospect.`;
  };

  // Ensure comps is an array
  const compList = Array.isArray(comps) ? comps : [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">The Vision Board</h3>
        <span className="text-xs text-neutral-400">Click cards to explore</span>
      </div>

      {/* Visual Comps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {compList.map((comp, index) => {
          const style = getCompStyle(comp.type);
          const isSelected = selectedComp === index;
          return (
            <div
              key={index}
              onClick={() => setSelectedComp(isSelected ? null : index)}
              className={`${style.card} rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer group ${isSelected ? 'ring-4 ring-red-400 ring-offset-2' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{style.icon}</span>
                <span className="text-xs font-bold uppercase opacity-70 bg-white/20 px-2 py-0.5 rounded">
                  {getCompLabel(comp.type)}
                </span>
              </div>
              <div className="text-lg font-black leading-tight mb-1 group-hover:scale-105 transition-transform origin-left">
                {comp.player}
              </div>
              <div className="text-xs opacity-70">{style.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Selected Comp Detail */}
      {selectedComp !== null && compList[selectedComp] && (
        <div className="bg-neutral-900 rounded-xl p-5 text-white animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{getCompStyle(compList[selectedComp].type).icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase bg-white/20 px-2 py-1 rounded">
                  {getCompLabel(compList[selectedComp].type)} Comp
                </span>
                <span className="text-xl font-black">{compList[selectedComp].player}</span>
              </div>
              <p className="text-neutral-300 leading-relaxed">
                {getCompExplanation(compList[selectedComp])}
              </p>
            </div>
            <button 
              onClick={() => setSelectedComp(null)}
              className="text-neutral-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Comp Explanation Notes */}
      {comps.notes && (
        <div className="bg-neutral-50 rounded-xl p-4 border-l-4 border-red-500 mt-4">
          <p className="text-sm text-neutral-600 leading-relaxed">{comps.notes}</p>
        </div>
      )}
    </div>
  );
};
