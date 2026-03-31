import React from 'react';

export const BadgeRow = ({ badges }) => {
  // Frontend labels for traits
  const badgeLabels = {
    'advantage_creation': 'Paint Touch Creator',
    'decision_making': 'Decision Maker',
    'passing_creation': 'Playmaker',
    'shooting_gravity': 'Warps Spacing',
    'off_ball_value': 'Off-Ball Threat',
    'processing_speed': 'Fast Processor',
    'scalability': 'Plug-and-Play',
    'defensive_versatility': 'Switchable Coverage',
    'rim_pressure': 'Rim Pressure',
    'midrange_mastery': 'Midrange Mastery',
    'connector_value': 'Connector Value',
    'pantheon_potential': 'Pantheon Potential',
    'injury_concerns': 'Injury Concerns'
  };

  const getBadgeStyle = (badge) => {
    if (badge.includes('Concern') || badge.includes('Risk')) {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    if (badge.includes('Pantheon') || badge.includes('Elite')) {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    return 'bg-neutral-100 text-neutral-800 border-neutral-300';
  };

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getBadgeStyle(badgeLabels[badge] || badge)}`}
        >
          {badgeLabels[badge] || badge}
        </span>
      ))}
    </div>
  );
};
