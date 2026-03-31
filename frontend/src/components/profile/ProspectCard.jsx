import React from 'react';

export const ProspectCard = ({ prospect }) => {
  return (
    <div className="relative">
      {/* Card Container with slight rotation */}
      <div 
        className="bg-[#faf8f3] rounded-2xl shadow-xl p-6 transform -rotate-1 hover:rotate-0 transition-transform duration-300"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Rank Badge */}
        <div className="absolute -top-3 -left-3 bg-red-600 text-white rounded-xl px-4 py-2 shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider">Rank</span>
          <div className="text-3xl font-black leading-none">{prospect.rank}</div>
        </div>

        {/* School Logo Placeholder */}
        <div className="absolute -top-2 right-4 w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center">
          <span className="text-2xl font-black text-neutral-400">{prospect.school?.charAt(0) || 'D'}</span>
        </div>

        {/* Player Image Area */}
        <div className="mt-8 mb-4 aspect-[3/4] bg-gradient-to-b from-neutral-200 to-neutral-300 rounded-xl flex items-end justify-center overflow-hidden relative">
          {prospect.image ? (
            <img 
              src={prospect.image} 
              alt={prospect.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="text-neutral-400 text-center pb-8">
              <div className="text-6xl mb-2">🏀</div>
              <div className="text-sm font-medium">Player Image</div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Player Info */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-neutral-900 leading-tight mb-1">
            {prospect.firstName}<br />{prospect.lastName}
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-600">
            <span className="bg-neutral-200 px-2 py-1 rounded">{prospect.position}</span>
            <span>•</span>
            <span>{prospect.school}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-xs text-neutral-500 uppercase font-bold">Height</div>
              <div className="text-lg font-bold">{prospect.height}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 uppercase font-bold">Weight</div>
              <div className="text-lg font-bold">{prospect.weight}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 uppercase font-bold">Age</div>
              <div className="text-lg font-bold">{prospect.age}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 uppercase font-bold">Wingspan</div>
              <div className="text-lg font-bold">{prospect.wingspan || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
