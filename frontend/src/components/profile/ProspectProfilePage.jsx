import React, { useState } from 'react';
import { ProspectCard } from './ProspectCard';
import { ProfileTopNav } from './ProfileTopNav';
import { ProspectHero } from './ProspectHero';
import { BadgeRow } from './BadgeRow';
import { RoleProjectionPanel } from './RoleProjectionPanel';
import { ModelBreakdown } from './ModelBreakdown';
import { RiskPanel } from './RiskPanel';
import { ScoutingWriteup } from './ScoutingWriteup';
import { VisionBoard } from './VisionBoard';
import { StatsGrid } from './StatsGrid';
import { SupportingTraitsSection } from './SupportingTraitsSection';
import { RelatedProspectsStrip } from './RelatedProspectsStrip';

export const ProspectProfilePage = ({ prospect, relatedProspects }) => {
  const [depthMode, setDepthMode] = useState('peruse'); // skim, peek, peruse, deep-dive

  const depthConfig = {
    'skim': { showSummary: true, showTraits: false, showStats: false, showComps: false, showWriteup: false },
    'peek': { showSummary: true, showTraits: true, showStats: false, showComps: false, showWriteup: true },
    'peruse': { showSummary: true, showTraits: true, showStats: true, showComps: true, showWriteup: true },
    'deep-dive': { showSummary: true, showTraits: true, showStats: true, showComps: true, showWriteup: true, showSupporting: true }
  };

  const config = depthConfig[depthMode];

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-neutral-900 font-sans">
      {/* Top Navigation */}
      <ProfileTopNav 
        depthMode={depthMode} 
        onDepthChange={setDepthMode}
        position={prospect.position}
      />

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          
          {/* Left Column - Sticky Player Card */}
          <div className="w-[380px] flex-shrink-0">
            <div className="sticky top-24">
              <ProspectCard prospect={prospect} />
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="flex-1 min-w-0">
            
            {/* Hero Header */}
            <ProspectHero prospect={prospect} />

            {/* Badge Row */}
            <BadgeRow badges={prospect.badges} />

            {/* Role Projection */}
            <RoleProjectionPanel projection={prospect.projection} />

            {/* Model Breakdown */}
            {config.showTraits && (
              <ModelBreakdown 
                traits={prospect.coreTraits}
                weightedScore={prospect.weightedTraitScore}
                riskPenalty={prospect.riskPenalty}
                finalScore={prospect.finalBoardScore}
                tier={prospect.tier}
              />
            )}

            {/* Risk Panel */}
            {config.showTraits && (
              <RiskPanel risks={prospect.risks} />
            )}

            {/* Scouting Writeup */}
            {config.showWriteup && (
              <ScoutingWriteup writeup={prospect.writeup} />
            )}

            {/* Vision Board / Comps */}
            {config.showComps && (
              <VisionBoard comps={prospect.comps} />
            )}

            {/* Stats Grid */}
            {config.showStats && (
              <StatsGrid stats={prospect.stats} season="2025-26" />
            )}

            {/* Supporting Traits */}
            {config.showSupporting && (
              <SupportingTraitsSection traits={prospect.supportingTraits} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Player Navigation */}
      <RelatedProspectsStrip prospects={relatedProspects} currentId={prospect.id} />
    </div>
  );
};
