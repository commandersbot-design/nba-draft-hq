import React from 'react';

export const SupportingTraitsSection = ({ traits }) => {
  const categories = {
    offensive: traits.filter(t => t.category === 'offensive'),
    defensive: traits.filter(t => t.category === 'defensive'),
    physical: traits.filter(t => t.category === 'physical'),
    intangible: traits.filter(t => t.category === 'intangible')
  };

  const getGradeColor = (grade) => {
    if (grade >= 8) return 'bg-green-100 text-green-800 border-green-300';
    if (grade >= 6) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (grade >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-neutral-100 text-neutral-600 border-neutral-300';
  };

  const renderCategory = (title, traits) => {
    if (!traits.length) return null;
    
    return (
      <div className="mb-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {traits.map((trait, index) => (
            <span
              key={index}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getGradeColor(trait.grade)}`}
            >
              {trait.name} {trait.grade}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-6">Supporting Traits</h3>
      
      {renderCategory('Offensive', categories.offensive)}
      {renderCategory('Defensive', categories.defensive)}
      {renderCategory('Physical / Athletic', categories.physical)}
      {renderCategory('Intangibles / Feel', categories.intangible)}
    </div>
  );
};
