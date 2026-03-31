// Features & Ideas Browser
// Track feature requests and ideas

const FEATURES = {
    'Data & Stats': [
        { name: 'Real-time BartTorvik sync', status: 'planned', priority: 'high', desc: 'Auto-import stats nightly' },
        { name: 'Synergy Sports integration', status: 'planned', priority: 'high', desc: 'Play-type breakdowns' },
        { name: 'NBA Combine data import', status: 'planned', priority: 'medium', desc: 'Measurements and athletic testing' },
        { name: 'International stats (Euroleague)', status: 'planned', priority: 'medium', desc: 'Non-NCAA prospects' },
        { name: 'Injury history tracking', status: 'idea', priority: 'medium', desc: 'Medical red flags database' },
        { name: 'Social media sentiment', status: 'idea', priority: 'low', desc: 'Twitter/Reddit scouting buzz' }
    ],
    'Scouting Tools': [
        { name: 'Video annotation', status: 'in-progress', priority: 'high', desc: 'Timestamp notes on film' },
        { name: 'Side-by-side film player', status: 'planned', priority: 'high', desc: 'Watch two prospects simultaneously' },
        { name: 'Mobile scouting app', status: 'planned', priority: 'high', desc: 'Grade players at games' },
        { name: 'Voice-to-text notes', status: 'idea', priority: 'medium', desc: 'Dictate scouting reports' },
        { name: 'AI-generated summaries', status: 'idea', priority: 'low', desc: 'Auto-write reports from grades' }
    ],
    'Analysis & Models': [
        { name: 'Team-specific models', status: 'complete', priority: 'high', desc: 'Lakers, Warriors, etc.' },
        { name: 'Historical comps finder', status: 'planned', priority: 'high', desc: 'Find similar NBA players' },
        { name: 'Age curve projections', status: 'planned', priority: 'medium', desc: 'Predict future development' },
        { name: 'Trade value calculator', status: 'planned', priority: 'medium', desc: 'Pick swap valuations' },
        { name: 'Monte Carlo draft sim', status: 'idea', priority: 'medium', desc: 'Run 10,000 draft scenarios' },
        { name: 'Consensus big board', status: 'idea', priority: 'low', desc: 'Aggregate multiple scouts' }
    ],
    'UI/UX': [
        { name: 'Dark/light mode', status: 'complete', priority: 'high', desc: 'Theme toggle' },
        { name: 'Mobile responsive', status: 'in-progress', priority: 'high', desc: 'Phone/tablet friendly' },
        { name: 'Export to PDF', status: 'planned', priority: 'medium', desc: 'Printable reports' },
        { name: 'Custom dashboards', status: 'planned', priority: 'medium', desc: 'User-defined layouts' },
        { name: 'Keyboard shortcuts', status: 'idea', priority: 'low', desc: 'Power user navigation' }
    ],
    'Collaboration': [
        { name: 'Multi-user support', status: 'planned', priority: 'high', desc: 'Scout accounts' },
        { name: 'Comment threads', status: 'planned', priority: 'medium', desc: 'Discuss prospects' },
        { name: 'Shareable boards', status: 'planned', priority: 'medium', desc: 'Public links' },
        { name: 'Slack/Discord bot', status: 'idea', priority: 'low', desc: 'Chat integration' }
    ]
};

function renderFeaturesPage() {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Features & Ideas - NBA Draft HQ</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
        h1 { font-size: 28px; color: #ff6b35; }
        .category { margin: 30px 0; }
        h2 { color: #ff6b35; margin-bottom: 15px; font-size: 20px; }
        .feature { background: #111; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #444; }
        .feature.complete { border-left-color: #4ade80; }
        .feature.in-progress { border-left-color: #fbbf24; }
        .feature.planned { border-left-color: #60a5fa; }
        .feature.idea { border-left-color: #888; }
        .feature-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .feature-name { font-weight: 600; }
        .badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; }
        .badge.complete { background: #4ade80; color: #000; }
        .badge.in-progress { background: #fbbf24; color: #000; }
        .badge.planned { background: #60a5fa; color: #000; }
        .badge.idea { background: #444; color: #fff; }
        .badge.high { background: #ef4444; color: #fff; }
        .badge.medium { background: #f97316; color: #fff; }
        .badge.low { background: #666; color: #fff; }
        .feature-desc { color: #888; font-size: 14px; }
        .nav { margin-bottom: 20px; }
        .nav a { color: #ff6b35; text-decoration: none; }
        .legend { display: flex; gap: 20px; margin: 20px 0; font-size: 12px; }
        .legend-item { display: flex; align-items: center; gap: 5px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Features & Ideas Roadmap</h1>
        </header>
        <div class="nav"><a href="/">← Back to Big Board</a></div>
        
        <div class="legend">
            <div class="legend-item"><div class="dot" style="background:#4ade80"></div> Complete</div>
            <div class="legend-item"><div class="dot" style="background:#fbbf24"></div> In Progress</div>
            <div class="legend-item"><div class="dot" style="background:#60a5fa"></div> Planned</div>
            <div class="legend-item"><div class="dot" style="background:#888"></div> Idea</div>
        </div>
`;

    for (const [category, features] of Object.entries(FEATURES)) {
        html += `<div class="category"><h2>${category}</h2>`;
        for (const f of features) {
            html += `
                <div class="feature ${f.status}">
                    <div class="feature-header">
                        <span class="feature-name">${f.name}</span>
                        <div>
                            <span class="badge ${f.status}">${f.status}</span>
                            <span class="badge ${f.priority}">${f.priority}</span>
                        </div>
                    </div>
                    <div class="feature-desc">${f.desc}</div>
                </div>
            `;
        }
        html += '</div>';
    }

    html += '</div></body></html>';
    return html;
}

module.exports = { FEATURES, renderFeaturesPage };

// CLI
if (require.main === module) {
    console.log('\nNBA Draft HQ - Features & Ideas');
    console.log('=' .repeat(50));
    for (const [category, features] of Object.entries(FEATURES)) {
        console.log(`\n${category}:`);
        features.forEach(f => {
            const status = f.status === 'complete' ? '✓' : f.status === 'in-progress' ? '⋯' : '○';
            console.log(`  ${status} ${f.name}`);
        });
    }
}
