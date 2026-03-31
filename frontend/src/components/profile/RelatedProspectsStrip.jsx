import React from 'react';

export const RelatedProspectsStrip = ({ prospects, currentId }) => {
  const handleClick = (id) => {
    window.location.href = `/player/${id}`;
  };

  return (
    <div className="bg-white border-t border-neutral-200 mt-8">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">More Prospects</h3>
        
        <div className="flex gap-4 overflow-x-auto pb-2">
          {prospects.map(prospect => (
            <button
              key={prospect.id}
              onClick={() => handleClick(prospect.id)}
              className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                prospect.id === currentId
                  ? 'border-red-600 bg-red-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
            >
              {/* Rank */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${
                prospect.id === currentId ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-700'
              }`}>
                {prospect.rank}
              </div>
              
              {/* School Logo Placeholder */}
              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-bold text-neutral-400">
                {prospect.school?.charAt(0) || 'D'}
              </div>
              
              {/* Name */}
              <div className="text-left">
                <div className={`font-bold text-sm ${prospect.id === currentId ? 'text-red-900' : 'text-neutral-900'}`}>
                  {prospect.firstName} {prospect.lastName}
                </div>
                <div className="text-xs text-neutral-500">{prospect.position} • {prospect.school}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
