import React from 'react';

export const ProspectHero = ({ prospect }) => {
  return (
    <div className="mb-8">
      {/* Oversized Name */}
      <h1 className="text-7xl md:text-8xl font-black text-neutral-900 uppercase tracking-tight leading-[0.9] mb-6">
        {prospect.firstName}<br />
        <span className="text-red-600">{prospect.lastName}</span>
      </h1>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-4 text-lg font-semibold text-neutral-600 mb-4">
        <span className="bg-neutral-900 text-white px-3 py-1 rounded-lg">{prospect.position}</span>
        <span className="text-neutral-400">•</span>
        <span>{prospect.school}</span>
        <span className="text-neutral-400">•</span>
        <span>Class of {prospect.classYear}</span>
      </div>

      {/* Physical Row */}
      <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-neutral-500 mb-6">
        <div>
          <span className="text-neutral-400 uppercase text-xs">Height</span>
          <span className="ml-2 text-neutral-900 font-bold">{prospect.height}</span>
        </div>
        <div>
          <span className="text-neutral-400 uppercase text-xs">Weight</span>
          <span className="ml-2 text-neutral-900 font-bold">{prospect.weight}</span>
        </div>
        <div>
          <span className="text-neutral-400 uppercase text-xs">Age</span>
          <span className="ml-2 text-neutral-900 font-bold">{prospect.age}</span>
        </div>
        {prospect.wingspan && (
          <div>
            <span className="text-neutral-400 uppercase text-xs">Wingspan</span>
            <span className="ml-2 text-neutral-900 font-bold">{prospect.wingspan}</span>
          </div>
        )}
      </div>

      {/* Scouting Summary */}
      <p className="text-xl text-neutral-700 leading-relaxed max-w-3xl font-medium italic border-l-4 border-red-600 pl-6">
        "{prospect.summary}"
      </p>
    </div>
  );
};
