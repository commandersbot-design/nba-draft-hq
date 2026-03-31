// NBA DRAFT HQ - FINAL TRAIT LIBRARY V1
// 3-Level System: Core (8) → Supporting → Subtraits

const TRAIT_LIBRARY = {
    // LEVEL 1 — CORE 8 (ACTIVE FOR SCORING)
    core: [
        {
            key: 'advantage_creation',
            backend: 'Advantage Creation',
            frontend: 'Paint Touch Creator',
            desc: 'Ability to bend the defense and force reactions using handle, burst, strength, pace, or movement',
            weight: 20
        },
        {
            key: 'decision_making',
            backend: 'Decision Making',
            frontend: 'Decision Maker',
            desc: 'Consistency and quality of decisions under pressure; shot selection, reads, turnover control',
            weight: 16
        },
        {
            key: 'passing_creation',
            backend: 'Passing Creation',
            frontend: 'Playmaker',
            desc: 'Ability to generate quality shots for teammates through vision, manipulation, and timing',
            weight: 8
        },
        {
            key: 'shooting_gravity',
            backend: 'Shooting Gravity',
            frontend: 'Warps Spacing',
            desc: 'Degree to which a player\'s shooting warps spacing and defensive positioning',
            weight: 14
        },
        {
            key: 'off_ball_value',
            backend: 'Off-Ball Value',
            frontend: 'Off-Ball Threat',
            desc: 'Impact without the ball through cutting, spacing, screening, relocating, and timing',
            weight: 6
        },
        {
            key: 'processing_speed',
            backend: 'Processing Speed',
            frontend: 'Fast Processor',
            desc: 'How quickly a player reads, reacts, and executes decisions',
            weight: 10
        },
        {
            key: 'scalability',
            backend: 'Scalability',
            frontend: 'Plug-and-Play',
            desc: 'Ability to maintain effectiveness in different roles, especially alongside better players',
            weight: 14
        },
        {
            key: 'defensive_versatility',
            backend: 'Defensive Versatility',
            frontend: 'Switchable Coverage',
            desc: 'Ability to guard multiple roles, actions, and schemes effectively',
            weight: 12
        }
    ],

    // LEVEL 2 — SUPPORTING TRAITS (STORED, DISPLAYED, FILTERABLE)
    supporting: {
        offensive: [
            { key: 'rim_finishing', name: 'Rim Finishing', desc: 'Touch, control, and conversion at the rim' },
            { key: 'rim_pressure', name: 'Rim Pressure', desc: 'Ability to collapse defenses by getting downhill' },
            { key: 'self_creation', name: 'Self-Creation', desc: 'Ability to generate offense independently', subtraits: ['isolation_scoring', 'pick_roll_creation'] },
            { key: 'isolation_scoring', name: 'Isolation Scoring', desc: 'One-on-one scoring ability', parent: 'self_creation' },
            { key: 'mid_range_shotmaking', name: 'Mid-Range Shotmaking', desc: 'Pull-ups, floaters, in-between game' },
            { key: 'three_point_shooting', name: 'Three-Point Shooting', desc: 'Overall perimeter shooting ability', subtraits: ['movement_shooting', 'spot_up_shooting', 'pull_up_shooting'] },
            { key: 'movement_shooting', name: 'Movement Shooting', desc: 'Shooting off motion', parent: 'three_point_shooting' },
            { key: 'spot_up_shooting', name: 'Spot-Up Shooting', desc: 'Catch-and-shoot ability', parent: 'three_point_shooting' },
            { key: 'pull_up_shooting', name: 'Pull-Up Shooting', desc: 'Off-dribble shooting', parent: 'three_point_shooting' },
            { key: 'free_throw_touch', name: 'Free Throw Touch', desc: 'Indicator of shooting consistency' },
            { key: 'pick_roll_handling', name: 'Pick-and-Roll Handling', desc: 'Reads, control, and creation in ball screens' },
            { key: 'transition_offense', name: 'Transition Offense', desc: 'Decision making and finishing in open floor' },
            { key: 'closeout_attack', name: 'Closeout Attack', desc: 'Attacking scrambling defenses' },
            { key: 'foul_drawing', name: 'Foul Drawing', desc: 'Ability to generate free throws' },
            { key: 'post_scoring', name: 'Post Scoring', desc: 'Back-to-basket ability' },
            { key: 'short_roll_playmaking', name: 'Short-Roll Playmaking', desc: 'Playmaking out of short roll' },
            { key: 'connective_passing', name: 'Connective Passing', desc: 'Quick decision passing within offense' },
            { key: 'live_dribble_passing', name: 'Live-Dribble Passing', desc: 'Passing while attacking' },
            { key: 'offensive_rebounding', name: 'Offensive Rebounding', desc: 'Second-chance creation' }
        ],
        defensive: [
            { key: 'on_ball_defense', name: 'On-Ball Defense', desc: 'Staying in front, contesting' },
            { key: 'point_of_attack_defense', name: 'Point-of-Attack Defense', desc: 'Guarding primary creators' },
            { key: 'team_defense', name: 'Team Defense', desc: 'Overall defensive awareness', subtraits: ['help_defense', 'rotations', 'positioning'] },
            { key: 'help_defense', name: 'Help Defense', desc: 'Rotations and positioning', parent: 'team_defense' },
            { key: 'screen_navigation', name: 'Screen Navigation', desc: 'Ability to fight through screens' },
            { key: 'pick_roll_defense', name: 'Pick-and-Roll Defense', desc: 'Coverage versatility' },
            { key: 'rim_protection', name: 'Rim Protection', desc: 'Shot blocking + verticality' },
            { key: 'steals_deflections', name: 'Steals / Deflections', desc: 'Disruption and anticipation' },
            { key: 'defensive_playmaking', name: 'Defensive Playmaking', desc: 'Creating turnovers' },
            { key: 'switchability', name: 'Switchability', desc: 'Ability to guard across positions' },
            { key: 'defensive_rebounding', name: 'Defensive Rebounding', desc: 'Securing possessions' }
        ],
        physical: [
            { key: 'first_step', name: 'First Step', desc: 'Initial burst', parent: 'advantage_creation' },
            { key: 'vertical_explosion', name: 'Vertical Explosion', desc: 'Jumping ability' },
            { key: 'strength', name: 'Strength', desc: 'Physicality and contact ability' },
            { key: 'straight_line_speed', name: 'Straight-Line Speed', desc: 'Open floor speed' },
            { key: 'agility', name: 'Agility', desc: 'Change of direction' },
            { key: 'balance_body_control', name: 'Balance / Body Control', desc: 'Stability in motion' },
            { key: 'functional_athleticism', name: 'Functional Athleticism', desc: 'Game-usable athleticism' },
            { key: 'frame', name: 'Frame', desc: 'Physical build' },
            { key: 'length', name: 'Length', desc: 'Wingspan + reach' },
            { key: 'durability', name: 'Durability', desc: 'Availability + injury history' }
        ],
        intangible: [
            { key: 'feel', name: 'Feel', desc: 'Natural instinct for the game', related: ['processing_speed', 'decision_making'] },
            { key: 'basketball_iq', name: 'Basketball IQ', desc: 'Understanding of structure + reads', related: ['processing_speed', 'decision_making'] },
            { key: 'motor', name: 'Motor', desc: 'Consistency of effort' },
            { key: 'competitive_toughness', name: 'Competitive Toughness', desc: 'Will to compete' },
            { key: 'composure', name: 'Composure', desc: 'Control under pressure' },
            { key: 'adaptability', name: 'Adaptability', desc: 'Ability to adjust' },
            { key: 'coachability', name: 'Coachability', desc: 'Ability to apply feedback' },
            { key: 'leadership', name: 'Leadership', desc: 'Influence on team' },
            { key: 'work_ethic', name: 'Work Ethic', desc: 'Development trajectory' }
        ]
    },

    // RISK FLAGS (8)
    riskFlags: [
        { key: 'shooting_risk', name: 'Shooting Risk' },
        { key: 'physical_translation_risk', name: 'Physical Translation Risk' },
        { key: 'creation_translation_risk', name: 'Creation Translation Risk' },
        { key: 'defensive_role_risk', name: 'Defensive Role Risk' },
        { key: 'processing_risk', name: 'Processing Risk' },
        { key: 'age_upside_risk', name: 'Age/Upside Risk' },
        { key: 'motor_consistency_risk', name: 'Motor/Consistency Risk' },
        { key: 'medical_risk', name: 'Medical Risk' }
    ]
};

// Get all traits flattened for display
function getAllTraits() {
    const all = [];
    
    // Core
    TRAIT_LIBRARY.core.forEach(t => {
        all.push({ ...t, level: 'Core', active: true });
    });
    
    // Supporting
    Object.entries(TRAIT_LIBRARY.supporting).forEach(([category, traits]) => {
        traits.forEach(t => {
            all.push({ ...t, level: 'Supporting', category, active: false });
        });
    });
    
    return all;
}

// Get frontend label for trait
function getFrontendLabel(key) {
    const core = TRAIT_LIBRARY.core.find(t => t.key === key);
    if (core) return core.frontend;
    
    // Check supporting
    for (const category of Object.values(TRAIT_LIBRARY.supporting)) {
        const trait = category.find(t => t.key === key);
        if (trait) return trait.name;
    }
    
    return key.replace(/_/g, ' ');
}

// Get backend name for trait
function getBackendName(key) {
    const core = TRAIT_LIBRARY.core.find(t => t.key === key);
    if (core) return core.backend;
    
    for (const category of Object.values(TRAIT_LIBRARY.supporting)) {
        const trait = category.find(t => t.key === key);
        if (trait) return trait.name;
    }
    
    return key.replace(/_/g, ' ');
}

module.exports = { TRAIT_LIBRARY, getAllTraits, getFrontendLabel, getBackendName };

// CLI display
if (require.main === module) {
    console.log('\n=== NBA DRAFT HQ - FINAL TRAIT LIBRARY V1 ===\n');
    
    console.log('LEVEL 1 — CORE 8 (ACTIVE FOR SCORING):');
    console.log('Backend Name → Frontend Label');
    console.log('-'.repeat(50));
    TRAIT_LIBRARY.core.forEach(t => {
        console.log(`${t.backend} → "${t.frontend}"`);
    });
    
    console.log('\n\nLEVEL 2 — SUPPORTING TRAITS:');
    Object.entries(TRAIT_LIBRARY.supporting).forEach(([category, traits]) => {
        console.log(`\n${category.toUpperCase()} (${traits.length}):`);
        traits.forEach(t => {
            const parent = t.parent ? ` [${t.parent}]` : '';
            const sub = t.subtraits ? ` {${t.subtraits.join(', ')}}` : '';
            console.log(`  • ${t.name}${parent}${sub}`);
        });
    });
    
    console.log('\n\nRISK FLAGS (8):');
    TRAIT_LIBRARY.riskFlags.forEach(r => console.log(`  • ${r.name}`));
    
    const totalSupporting = Object.values(TRAIT_LIBRARY.supporting).flat().length;
    console.log(`\n\nTOTAL: ${TRAIT_LIBRARY.core.length} Core + ${totalSupporting} Supporting + ${TRAIT_LIBRARY.riskFlags.length} Risk Flags`);
}
