// Trait Management - View and customize all possible traits

const ALL_TRAITS = {
    // CURRENT ACTIVE (8)
    active: [
        { key: 'advantage_creation', name: 'Advantage Creation', desc: 'Create offensive advantages via dribble, pass, movement', category: 'Offensive' },
        { key: 'decision_making', name: 'Decision Making', desc: 'Quality choices under pressure, shot selection', category: 'Mental' },
        { key: 'passing_creation', name: 'Passing Creation', desc: 'Playmaking vision, generating open looks', category: 'Offensive' },
        { key: 'shooting_gravity', name: 'Shooting Gravity', desc: 'Three-level scoring threat, spacing impact', category: 'Offensive' },
        { key: 'off_ball_value', name: 'Off-Ball Value', desc: 'Cutting, relocation, screening', category: 'Offensive' },
        { key: 'processing_speed', name: 'Processing Speed', desc: 'Speed of reads, reaction time', category: 'Mental' },
        { key: 'scalability', name: 'Scalability', desc: 'Maintain effectiveness in increased role', category: 'Mental' },
        { key: 'defensive_versatility', name: 'Defensive Versatility', desc: 'Defensive assignments, switchability', category: 'Defensive' }
    ],
    
    // OFFENSIVE TRAITS (Potential Additions)
    offensive: [
        { key: 'rim_finishing', name: 'Rim Finishing', desc: 'Converting at the basket, touch, body control' },
        { key: 'mid_range_game', name: 'Mid-Range Game', desc: 'Pull-up jumper, floater, elbow game' },
        { key: 'three_point_shooting', name: 'Three-Point Shooting', desc: 'Catch & shoot, off-dribble, movement shooting' },
        { key: 'free_throw_shooting', name: 'Free Throw Shooting', desc: 'Consistency, mechanics at the line' },
        { key: 'post_game', name: 'Post Game', desc: 'Back-to-basket scoring, footwork' },
        { key: 'isolation_scoring', name: 'Isolation Scoring', desc: 'One-on-one creation, shot-making' },
        { key: 'pick_roll_handling', name: 'Pick & Roll Handling', desc: 'Ball screen mastery, reads, pocket passes' },
        { key: 'transition_offense', name: 'Transition Offense', desc: 'Open court speed, decision making, finishing' },
        { key: 'offensive_rebounding', name: 'Offensive Rebounding', desc: 'Crash boards, putbacks, tip-ins' }
    ],
    
    // DEFENSIVE TRAITS (Potential Additions)
    defensive: [
        { key: 'on_ball_defense', name: 'On-Ball Defense', desc: 'Lateral quickness, staying in front, contests' },
        { key: 'help_defense', name: 'Help Defense', desc: 'Rotations, weak side positioning, rim protection' },
        { key: 'defensive_rebounding', name: 'Defensive Rebounding', desc: 'Box out, securing possession' },
        { key: 'steals_deflections', name: 'Steals/Deflections', desc: 'Anticipation, hands, passing lane jumps' },
        { key: 'rim_protection', name: 'Rim Protection', desc: 'Shot blocking, verticality, timing' },
        { key: 'pick_roll_defense', name: 'Pick & Roll Defense', desc: 'Coverage versatility, ICE, switch, drop' }
    ],
    
    // PHYSICAL TRAITS (Potential Additions)
    physical: [
        { key: 'first_step', name: 'First Step', desc: 'Initial burst, blow-by ability' },
        { key: 'vertical_explosion', name: 'Vertical Explosion', desc: 'Dunking, rebounding, shot blocking' },
        { key: 'strength', name: 'Strength', desc: 'Physicality, finishing through contact' },
        { key: 'speed', name: 'Speed', desc: 'Open court, transition, end-to-end' },
        { key: 'agility', name: 'Agility', desc: 'Change of direction, lateral movement' },
        { key: 'balance_body_control', name: 'Balance/Body Control', desc: 'Contorted finishes, absorbing contact' },
        { key: 'durability', name: 'Durability', desc: 'Injury history, availability' }
    ],
    
    // INTANGIBLE TRAITS (Potential Additions)
    intangible: [
        { key: 'competitive_toughness', name: 'Competitive Toughness', desc: 'Clutch performance, will to win' },
        { key: 'work_ethic', name: 'Work Ethic', desc: 'Improvement trajectory, practice habits' },
        { key: 'leadership', name: 'Leadership', desc: 'Vocal, leads by example, locker room presence' },
        { key: 'basketball_iq', name: 'Basketball IQ', desc: 'Understanding of game, situational awareness' },
        { key: 'coachability', name: 'Coachability', desc: 'Takes instruction, applies feedback' }
    ]
};

const RISK_FLAGS = [
    { key: 'shooting_risk', name: 'Shooting Risk', desc: 'Uncertainty around shooting translation' },
    { key: 'physical_translation_risk', name: 'Physical Translation Risk', desc: 'Body/frame concerns at NBA level' },
    { key: 'creation_translation_risk', name: 'Creation Translation Risk', desc: 'Shot creation vs NBA length/athleticism' },
    { key: 'defensive_role_risk', name: 'Defensive Role Risk', desc: 'Questions about defensive position' },
    { key: 'processing_risk', name: 'Processing Risk', desc: 'Decision-making vs NBA complexity' },
    { key: 'age_upside_risk', name: 'Age/Upside Risk', desc: 'Too old (limited upside) or too young (raw)' },
    { key: 'motor_consistency_risk', name: 'Motor/Consistency Risk', desc: 'Effort, consistency, competitive toughness' },
    { key: 'medical_risk', name: 'Medical Risk', desc: 'Injury history or durability concerns' }
];

function renderTraitManager() {
    const activeTraits = ALL_TRAITS.active.map(t => `
        <div class="trait-card active">
            <div class="trait-name">${t.name}</div>
            <div class="trait-desc">${t.desc}</div>
            <div class="trait-category">${t.category}</div>
            <div class="trait-status">✓ Active (Scored)</div>
        </div>
    `).join('');
    
    const offensiveTraits = ALL_TRAITS.offensive.map(t => `
        <div class="trait-card">
            <div class="trait-name">${t.name}</div>
            <div class="trait-desc">${t.desc}</div>
            <button class="btn-add" onclick="addTrait('${t.key}')">+ Add to Scoring</button>
        </div>
    `).join('');
    
    const defensiveTraits = ALL_TRAITS.defensive.map(t => `
        <div class="trait-card">
            <div class="trait-name">${t.name}</div>
            <div class="trait-desc">${t.desc}</div>
            <button class="btn-add" onclick="addTrait('${t.key}')">+ Add to Scoring</button>
        </div>
    `).join('');
    
    const physicalTraits = ALL_TRAITS.physical.map(t => `
        <div class="trait-card">
            <div class="trait-name">${t.name}</div>
            <div class="trait-desc">${t.desc}</div>
            <button class="btn-add" onclick="addTrait('${t.key}')">+ Add to Scoring</button>
        </div>
    `).join('');
    
    const intangibleTraits = ALL_TRAITS.intangible.map(t => `
        <div class="trait-card">
            <div class="trait-name">${t.name}</div>
            <div class="trait-desc">${t.desc}</div>
            <button class="btn-add" onclick="addTrait('${t.key}')">+ Add to Scoring</button>
        </div>
    `).join('');
    
    const riskFlags = RISK_FLAGS.map(r => `
        <div class="trait-card risk">
            <div class="trait-name">${r.name}</div>
            <div class="trait-desc">${r.desc}</div>
            <div class="trait-status">✓ Active (Risk Model)</div>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Trait Manager - NBA Draft HQ</title>
    <style>
        :root {
            --ringer-red: #e10600;
            --ringer-black: #000;
            --ringer-dark: #121212;
            --ringer-gray: #1a1a1a;
            --ringer-light: #2a2a2a;
            --text-primary: #fff;
            --text-secondary: #a0a0a0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--ringer-black);
            color: var(--text-primary);
            line-height: 1.6;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
        
        h1 { font-size: 42px; font-weight: 800; margin-bottom: 8px; }
        h2 { font-size: 24px; font-weight: 700; margin: 40px 0 20px; color: var(--ringer-red); }
        h3 { font-size: 18px; font-weight: 600; margin: 30px 0 15px; color: var(--text-secondary); }
        
        .subtitle { color: var(--text-secondary); font-size: 18px; margin-bottom: 40px; }
        
        .traits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
        }
        
        .trait-card {
            background: var(--ringer-dark);
            border: 1px solid var(--ringer-light);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s;
        }
        .trait-card:hover {
            border-color: var(--text-secondary);
        }
        .trait-card.active {
            border-color: #00d084;
            background: linear-gradient(135deg, var(--ringer-dark) 0%, #0a2a1a 100%);
        }
        .trait-card.risk {
            border-color: #ffc72c;
            background: linear-gradient(135deg, var(--ringer-dark) 0%, #2a220a 100%);
        }
        
        .trait-name { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .trait-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
        .trait-category {
            display: inline-block;
            background: var(--ringer-light);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
        }
        .trait-status {
            font-size: 13px;
            color: #00d084;
            font-weight: 600;
            margin-top: 12px;
        }
        
        .btn-add {
            background: var(--ringer-red);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 12px;
        }
        .btn-add:hover { background: #c00500; }
        
        .summary {
            background: var(--ringer-dark);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 40px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--ringer-light);
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-label { color: var(--text-secondary); }
        .summary-value { font-weight: 700; }
        
        .nav { margin-bottom: 40px; }
        .nav a {
            color: var(--ringer-red);
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav"><a href="/">← Back to Big Board</a></div>
        
        <h1>Trait Manager</h1>
        <p class="subtitle">Customize which traits are used for scoring prospects. Currently using 8 active traits.</p>
        
        <div class="summary">
            <div class="summary-row">
                <span class="summary-label">Active Scoring Traits</span>
                <span class="summary-value">8</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Available Traits</span>
                <span class="summary-value">${Object.values(ALL_TRAITS).flat().length}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Risk Flags</span>
                <span class="summary-value">8</span>
            </div>
        </div>
        
        <h2>Active Scoring Traits (8)</h2>
        <div class="traits-grid">
            ${activeTraits}
        </div>
        
        <h2>Risk Flags (8)</h2>
        <div class="traits-grid">
            ${riskFlags}
        </div>
        
        <h2>Available Offensive Traits</h2>
        <div class="traits-grid">
            ${offensiveTraits}
        </div>
        
        <h2>Available Defensive Traits</h2>
        <div class="traits-grid">
            ${defensiveTraits}
        </div>
        
        <h2>Available Physical Traits</h2>
        <div class="traits-grid">
            ${physicalTraits}
        </div>
        
        <h2>Available Intangible Traits</h2>
        <div class="traits-grid">
            ${intangibleTraits}
        </div>
    </div>
</body>
</html>`;
}

module.exports = { ALL_TRAITS, RISK_FLAGS, renderTraitManager };

// CLI display
if (require.main === module) {
    console.log('\n=== NBA DRAFT HQ - TRAIT LIBRARY ===\n');
    
    console.log(`ACTIVE SCORING TRAITS (${ALL_TRAITS.active.length}):`);
    ALL_TRAITS.active.forEach(t => console.log(`  ✓ ${t.name} (${t.category})`));
    
    console.log(`\nPOTENTIAL ADDITIONS:`);
    console.log(`  • Offensive: ${ALL_TRAITS.offensive.length} traits`);
    console.log(`  • Defensive: ${ALL_TRAITS.defensive.length} traits`);
    console.log(`  • Physical: ${ALL_TRAITS.physical.length} traits`);
    console.log(`  • Intangible: ${ALL_TRAITS.intangible.length} traits`);
    
    console.log(`\nRISK FLAGS (${RISK_FLAGS.length}):`);
    RISK_FLAGS.forEach(r => console.log(`  ✓ ${r.name}`));
    
    console.log(`\nTOTAL AVAILABLE: ${Object.values(ALL_TRAITS).flat().length + RISK_FLAGS.length} traits/flags`);
}
