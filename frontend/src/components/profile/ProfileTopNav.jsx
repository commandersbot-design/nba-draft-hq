import React from 'react';

export const ProfileTopNav = ({ depthMode, onDepthChange, position }) => {
  const tabs = [
    { id: 'skim', label: 'Skim', desc: 'Summary' },
    { id: 'peek', label: 'Peek', desc: 'Quick Look' },
    { id: 'peruse', label: 'Peruse', desc: 'Full Profile' },
    { id: 'deep-dive', label: 'Deep Dive', desc: 'Everything' }
  ];

  const positions = ['All', 'PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'Wing', 'Big'];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight">NBA</span>
            <span className="text-xl font-black tracking-tight text-red-600">DRAFT</span>
            <span className="text-xl font-black tracking-tight">HQ</span>
          </div>

          {/* Depth Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onDepthChange(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  depthMode === tab.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Position Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 font-medium">Position</span>
            <select 
              defaultValue={position || 'All'}
              className="bg-neutral-100 border-none rounded-lg px-4 py-2 text-sm font-semibold text-neutral-700 focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
};
