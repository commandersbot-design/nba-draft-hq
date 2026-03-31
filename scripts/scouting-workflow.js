// Scouting Report Workflow
// Add written evaluations and video links

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'draft_hq.db');

function addScoutingReport(playerId, report, scoutId = 'system') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.run(`
            INSERT INTO scouting_reports (player_id, scout_id, summary, strengths, weaknesses, bottom_line, games_scouted, report_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))
        `, [
            playerId, scoutId, report.summary, report.strengths, 
            report.weaknesses, report.bottom_line, report.games_scouted || 0
        ], function(err) {
            db.close();
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function addVideo(playerId, video, scoutId = 'system') {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.run(`
            INSERT INTO player_videos (player_id, video_url, video_type, title, source, scout_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            playerId, video.url, video.type, video.title, 
            video.source, scoutId, video.notes
        ], function(err) {
            db.close();
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function getPlayerReports(playerId) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        db.all(`
            SELECT * FROM scouting_reports WHERE player_id = ? ORDER BY report_date DESC
        `, [playerId], (err, reports) => {
            if (err) {
                db.close();
                return reject(err);
            }
            db.all(`
                SELECT * FROM player_videos WHERE player_id = ? ORDER BY created_at DESC
            `, [playerId], (err, videos) => {
                db.close();
                if (err) return reject(err);
                resolve({ reports, videos });
            });
        });
    });
}

// CLI
const command = process.argv[2];

if (command === 'add-report') {
    const playerId = parseInt(process.argv[3]);
    if (!playerId) {
        console.error('Usage: node scouting-workflow.js add-report <player-id>');
        process.exit(1);
    }
    // Interactive or JSON file input would go here
    console.log('Would add report for player', playerId);
} else if (command === 'add-video') {
    const playerId = parseInt(process.argv[3]);
    const url = process.argv[4];
    if (!playerId || !url) {
        console.error('Usage: node scouting-workflow.js add-video <player-id> <url> [type]');
        process.exit(1);
    }
    addVideo(playerId, {
        url: url,
        type: process.argv[5] || 'highlights',
        title: process.argv[6] || 'Untitled',
        source: 'manual'
    }).then(id => {
        console.log(`✓ Added video ${id}`);
        process.exit(0);
    });
} else if (command === 'view') {
    const playerId = parseInt(process.argv[3]);
    getPlayerReports(playerId).then(data => {
        console.log('\nReports:', data.reports.length);
        console.log('Videos:', data.videos.length);
        data.reports.forEach(r => console.log(`- ${r.report_date}: ${r.summary?.substring(0, 50)}...`));
        data.videos.forEach(v => console.log(`- [${v.video_type}] ${v.title}`));
    });
} else {
    console.log('Scouting Workflow Commands:');
    console.log('  add-report <player-id>    - Add written evaluation');
    console.log('  add-video <id> <url>      - Add video link');
    console.log('  view <player-id>          - View all reports/videos');
}

module.exports = { addScoutingReport, addVideo, getPlayerReports };
