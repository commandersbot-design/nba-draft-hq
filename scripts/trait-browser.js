// Trait Browser - 3-Level System Display

const { TRAIT_LIBRARY } = require('./trait-library-v1');

function renderTraitBrowser() {
    // Core traits with frontend labels
    const coreTraits = TRAIT_LIBRARY.core.map(t => `
        <div class="core-trait">
            <div class="trait-main">
                <span class="trait-frontend">"${t.frontend}"</span>
                <span class="trait-arrow">→</span>
                <span class="trait-backend">${t.backend}</span>
                <span class="trait-weight">${t.weight}%</span>
            </div>
            <div class="trait-desc">${t.desc}</div>
        </div>
    `).join('');
    
    // Supporting traits by category
    const renderSupporting = (traits, category) => {
        return traits.map(t => {
            const parent = t.parent ? `<span class="trait-parent">← ${t.parent.replace(/_/g, ' ')}</span>` : '';
            const sub = t.subtraits ? `<div class="trait-sub">→ ${t.subtraits.map(s => s.replace(/_/g, ' ')).join(', ')}</div>` : '';
            return `
                <div class="supporting-trait">
                    <div class="trait-name">${t.name} ${parent}</div>
                    <div class="trait-desc">${t.desc}</div>
                    ${sub}
                </div>
            `;
        }).join('');
    };
    
    const offensive = renderSupporting(TRAIT_LIBRARY.supporting.offensive, 'offensive');
    const defensive = renderSupporting(TRAIT_LIBRARY.supporting.defensive, 'defensive');
    const physical = renderSupporting(TRAIT_LIBRARY.supporting.physical, 'physical');
    const intangible = renderSupporting(TRAIT_LIBRARY.supporting.intangible, 'intangible');
    
    const riskFlags = TRAIT_LIBRARY.riskFlags.map(r => `
        <div class="risk-flag">${r.name}</div>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Trait Library - NBA Draft HQ</title>
    <style>
        :root {
            --ringer-red: #e10600;
            --ringer-black: #000;
            --ringer-dark: #121212;
            --ringer-gray: #1a1a1a;
            --ringer-light: #2a2a2a;
            --text-primary: #fff;
            --text-secondary: #a0a0a0;
            --text-muted: #666;
            --accent-green: #00d084;
            --accent-yellow: #ffc72c;
            --accent-blue: #1d75de;
            --accent-purple: #a855f7;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--ringer-black);
            color: var(--text-primary);
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
        
        h1 { font-size: 48px; font-weight: 800; margin-bottom: 8px; }
        .subtitle { color: var(--text-secondary); font-size: 18px; margin-bottom: 40px; }
        
        .level-section { margin-bottom: 60px; }
        .level-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--ringer-light);
        }
        .level-badge {
            background: var(--ringer-red);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .level-badge.supporting { background: var(--accent-blue); }
        .level-badge.risk { background: var(--accent-yellow); color: black; }
        h2 { font-size: 28px; font-weight: 700; }
        .level-desc { color: var(--text-secondary); margin-top: 4px; }
        
        /* Core Traits */
        .core-trait {
            background: linear-gradient(135deg, var(--ringer-dark) 0%, #1a0a0a 100%);
            border: 1px solid var(--ringer-red);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 16px;
        }
        .trait-main {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            flex-wrap: wrap;
        }
        .trait-frontend {
            font-size: 24px;
            font-weight: 800;
            color: var(--ringer-red);
        }
        .trait-arrow { color: var(--text-muted); }
        .trait-backend {
            font-size: 18px;
            color: var(--text-secondary);
        }
        .trait-weight {
            margin-left: auto;
            background: var(--ringer-red);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
        }
        .trait-desc { color: var(--text-secondary); font-size: 15px; }
        
        /* Supporting Traits */
        .category-section { margin-bottom: 40px; }
        .category-header {
            font-size: 20px;
            font-weight: 700;
            color: var(--accent-blue);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--ringer-light);
        }
        .supporting-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
        }
        .supporting-trait {
            background: var(--ringer-dark);
            border: 1px solid var(--ringer-light);
            border-radius: 8px;
            padding: 16px;
        }
        .supporting-trait:hover {
            border-color: var(--accent-blue);
        }
        .trait-name {
            font-weight: 600;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .trait-parent {
            font-size: 12px;
            color: var(--accent-purple);
            font-weight: 500;
        }
        .trait-sub {
            font-size: 12px;
            color: var(--accent-green);
            margin-top: 4px;
            padding-left: 12px;
            border-left: 2px solid var(--accent-green);
        }
        
        /* Risk Flags */
        .risk-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        .risk-flag {
            background: var(--ringer-dark);
            border: 1px solid var(--accent-yellow);
            color: var(--accent-yellow);
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
        }
        
        .summary {
            background: var(--ringer-dark);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 24px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-number {
            font-size: 48px;
            font-weight: 800;
            color: var(--ringer-red);
        }
        .summary-label {
            color: var(--text-secondary);
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .legend {
            background: var(--ringer-dark);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 40px;
        }
        .legend h3 {
            font-size: 16px;
            margin-bottom: 16px;
            color: var(--text-secondary);
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 14px;
        }
        .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .dot-core { background: var(--ringer-red); }
        .dot-supporting { background: var(--accent-blue); }
        .dot-sub { background: var(--accent-green); }
        .dot-parent { background: var(--accent-purple); }
        
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
        
        <h1>Trait Library</h1>
        <p class="subtitle">3-Level System: Core → Supporting → Subtraits</p>
        
        <div class="summary">
            <div class="summary-item">
                <div class="summary-number">8</div>
                <div class="summary-label">Core Traits</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">${Object.values(TRAIT_LIBRARY.supporting).flat().length}</div>
                <div class="summary-label">Supporting</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">8</div>
                <div class="summary-label">Risk Flags</div>
            </div>
        </div>
        
        <div class="legend">
            <h3>Legend</h3>
            <div class="legend-item"><div class="legend-dot dot-core"></div> Core Trait (Active for Scoring)</div>
            <div class="legend-item"><div class="legend-dot dot-supporting"></div> Supporting Trait (Stored/Displayed)</div>
            <div class="legend-item"><div class="legend-dot dot-parent"></div> Parent Trait (Has Subtraits)</div>
            <div class="legend-item"><div class="legend-dot dot-sub"></div> Subtrait (Nested under Parent)</div>
        </div>
        
        <!-- LEVEL 1: CORE -->
        <div class="level-section">
            <div class="level-header">
                <span class="level-badge">Level 1</span>
                <div>
                    <h2>Core 8 — Active Scoring Traits</h2>
                    <p class="level-desc">These 8 traits are used to calculate the final draft score. Frontend labels shown in quotes.</p>
                </div>
            </div>
            ${coreTraits}
        </div>
        
        <!-- LEVEL 2: SUPPORTING -->
        <div class="level-section">
            <div class="level-header">
                <span class="level-badge supporting">Level 2</span>
                <div>
                    <h2>Supporting Traits</h2>
                    <p class="level-desc">Stored, displayed, and filterable. Used for reports and future models.</p>
                </div>
            </div>
            
            <div class="category-section">
                <div class="category-header">Offensive</div>
                <div class="supporting-grid">${offensive}</div>
            </div>
            
            <div class="category-section">
                <div class="category-header">Defensive</div>
                <div class="supporting-grid">${defensive}</div>
            </div>
            
            <div class="category-section">
                <div class="category-header">Physical / Athletic</div>
                <div class="supporting-grid">${physical}</div>
            </div>
            
            <div class="category-section">
                <div class="category-header">Intangibles / Feel</div>
                <div class="supporting-grid">${intangible}</div>
            </div>
        </div>
        
        <!-- RISK FLAGS -->
        <div class="level-section">
            <div class="level-header">
                <span class="level-badge risk">Risk</span>
                <div>
                    <h2>Risk Flags</h2>
                    <p class="level-desc">Applied as penalty to final score.</p>
                </div>
            </div>
            <div class="risk-grid">${riskFlags}</div>
        </div>
    </div>
</body>
</html>`;
}

module.exports = { renderTraitBrowser };
