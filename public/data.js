// NBA Draft HQ - Mock Draft Data Module

// Admin key for updates
const ADMIN_KEY = 'draft-hq-admin-2026';

// 2026 Draft Order with Team Needs (based on 2024-25 season projections)
const teams = [
  { id: 1, name: 'Washington Wizards', abbreviation: 'WAS', record: '18-64', needs: ['PG', 'C', 'Wing'], colors: { primary: '#002B5C', secondary: '#E31837' } },
  { id: 2, name: 'Utah Jazz', abbreviation: 'UTA', record: '21-61', needs: ['PG', 'Wing', 'Big'], colors: { primary: '#002B5C', secondary: '#F9A01B' } },
  { id: 3, name: 'Charlotte Hornets', abbreviation: 'CHA', record: '24-58', needs: ['C', 'Wing', 'PG'], colors: { primary: '#1D1160', secondary: '#00788C' } },
  { id: 4, name: 'Toronto Raptors', abbreviation: 'TOR', record: '26-56', needs: ['C', 'Wing', 'SG'], colors: { primary: '#CE1141', secondary: '#000000' } },
  { id: 5, name: 'Detroit Pistons', abbreviation: 'DET', record: '28-54', needs: ['Wing', 'C', 'SG'], colors: { primary: '#C8102E', secondary: '#1D42BA' } },
  { id: 6, name: 'San Antonio Spurs', abbreviation: 'SAS', record: '30-52', needs: ['PG', 'Wing', 'C'], colors: { primary: '#C4CED4', secondary: '#000000' } },
  { id: 7, name: 'Portland Trail Blazers', abbreviation: 'POR', record: '31-51', needs: ['C', 'Wing', 'SG'], colors: { primary: '#E03A3E', secondary: '#000000' } },
  { id: 8, name: 'Brooklyn Nets', abbreviation: 'BKN', record: '32-50', needs: ['PG', 'C', 'Wing'], colors: { primary: '#000000', secondary: '#FFFFFF' } },
  { id: 9, name: 'New Orleans Pelicans', abbreviation: 'NOP', record: '33-49', needs: ['C', 'Wing', 'PG'], colors: { primary: '#0C2340', secondary: '#85714D' } },
  { id: 10, name: 'Philadelphia 76ers', abbreviation: 'PHI', record: '35-47', needs: ['Wing', 'SG', 'C'], colors: { primary: '#006BB6', secondary: '#ED174C' } },
  { id: 11, name: 'Chicago Bulls', abbreviation: 'CHI', record: '36-46', needs: ['PG', 'C', 'Wing'], colors: { primary: '#CE1141', secondary: '#000000' } },
  { id: 12, name: 'Houston Rockets', abbreviation: 'HOU', record: '37-45', needs: ['C', 'Wing', 'SG'], colors: { primary: '#CE1141', secondary: '#FDB927' } },
  { id: 13, name: 'Oklahoma City Thunder', abbreviation: 'OKC', record: '40-42', needs: ['C', 'Wing'], colors: { primary: '#007AC1', secondary: '#EF3B24' } },
  { id: 14, name: 'Indiana Pacers', abbreviation: 'IND', record: '41-41', needs: ['Wing', 'C', 'SG'], colors: { primary: '#002D62', secondary: '#FDBB30' } },
  { id: 15, name: 'Golden State Warriors', abbreviation: 'GSW', record: '42-40', needs: ['C', 'Wing', 'PG'], colors: { primary: '#1D428A', secondary: '#FFC72C' } },
  { id: 16, name: 'Phoenix Suns', abbreviation: 'PHX', record: '43-39', needs: ['PG', 'C', 'Wing'], colors: { primary: '#1D1160', secondary: '#E56020' } },
  { id: 17, name: 'Atlanta Hawks', abbreviation: 'ATL', record: '44-38', needs: ['C', 'Wing', 'SG'], colors: { primary: '#E03A3E', secondary: '#C1D32F' } },
  { id: 18, name: 'Sacramento Kings', abbreviation: 'SAC', record: '45-37', needs: ['Wing', 'C', 'SG'], colors: { primary: '#5A2D81', secondary: '#63727A' } },
  { id: 19, name: 'Miami Heat', abbreviation: 'MIA', record: '46-36', needs: ['C', 'Wing', 'PG'], colors: { primary: '#98002E', secondary: '#F9A01B' } },
  { id: 20, name: 'Los Angeles Lakers', abbreviation: 'LAL', record: '47-35', needs: ['C', 'Wing', 'SG'], colors: { primary: '#552583', secondary: '#FDB927' } },
  { id: 21, name: 'Orlando Magic', abbreviation: 'ORL', record: '48-34', needs: ['SG', 'C', 'Wing'], colors: { primary: '#0077C0', secondary: '#C4CED4' } },
  { id: 22, name: 'Milwaukee Bucks', abbreviation: 'MIL', record: '49-33', needs: ['Wing', 'C', 'SG'], colors: { primary: '#00471B', secondary: '#EEE1C6' } },
  { id: 23, name: 'Memphis Grizzlies', abbreviation: 'MEM', record: '50-32', needs: ['Wing', 'C', 'SG'], colors: { primary: '#5D76A9', secondary: '#12173F' } },
  { id: 24, name: 'Denver Nuggets', abbreviation: 'DEN', record: '51-31', needs: ['Wing', 'SG', 'C'], colors: { primary: '#0E2240', secondary: '#FEC524' } },
  { id: 25, name: 'New York Knicks', abbreviation: 'NYK', record: '52-30', needs: ['C', 'Wing', 'SG'], colors: { primary: '#006BB6', secondary: '#F58426' } },
  { id: 26, name: 'LA Clippers', abbreviation: 'LAC', record: '53-29', needs: ['C', 'PG', 'Wing'], colors: { primary: '#C8102E', secondary: '#1D428A' } },
  { id: 27, name: 'Cleveland Cavaliers', abbreviation: 'CLE', record: '54-28', needs: ['Wing', 'SG', 'C'], colors: { primary: '#860038', secondary: '#041E42' } },
  { id: 28, name: 'Boston Celtics', abbreviation: 'BOS', record: '55-27', needs: ['C', 'Wing'], colors: { primary: '#007A33', secondary: '#BA9653' } },
  { id: 29, name: 'Dallas Mavericks', abbreviation: 'DAL', record: '56-26', needs: ['C', 'Wing', 'SG'], colors: { primary: '#00538C', secondary: '#B8C4CA' } },
  { id: 30, name: 'Minnesota Timberwolves', abbreviation: 'MIN', record: '57-25', needs: ['Wing', 'SG', 'C'], colors: { primary: '#0C2340', secondary: '#236192' } }
];

// Top 25 Prospects
const topProspects = [
  { id: 1, rank: 1, name: 'Darryn Peterson', firstName: 'Darryn', lastName: 'Peterson', school: 'Kansas', position: 'SG', tier: 1, height: "6'5", weight: '195 lbs', age: 19, wingspan: "6'10", classYear: 2026 },
  { id: 2, rank: 2, name: 'Cam Boozer', firstName: 'Cam', lastName: 'Boozer', school: 'Duke', position: 'PF', tier: 1, height: "6'9", weight: '240 lbs', age: 19, wingspan: "7'2", classYear: 2026 },
  { id: 3, rank: 3, name: 'AJ Dybantsa', firstName: 'AJ', lastName: 'Dybantsa', school: 'BYU', position: 'SF/PF', tier: 1, height: "6'9", weight: '210 lbs', age: 19, wingspan: "7'0", classYear: 2026 },
  { id: 4, rank: 4, name: 'Caleb Wilson', firstName: 'Caleb', lastName: 'Wilson', school: 'North Carolina', position: 'SF', tier: 1, height: "6'8", weight: '205 lbs', age: 19, wingspan: "6'11", classYear: 2026 },
  { id: 5, rank: 5, name: 'Keaton Wagler', firstName: 'Keaton', lastName: 'Wagler', school: 'Illinois', position: 'PG', tier: 2, height: "6'3", weight: '180 lbs', age: 20, wingspan: "6'6", classYear: 2026 },
  { id: 6, rank: 6, name: 'Darius Acuff Jr.', firstName: 'Darius', lastName: 'Acuff Jr.', school: 'Arkansas', position: 'PG', tier: 2, height: "6'2", weight: '175 lbs', age: 19, wingspan: "6'5", classYear: 2026 },
  { id: 7, rank: 7, name: 'Brayden Burries', firstName: 'Brayden', lastName: 'Burries', school: 'Arizona', position: 'SG', tier: 2, height: "6'6", weight: '190 lbs', age: 20, wingspan: "6'9", classYear: 2026 },
  { id: 8, rank: 8, name: 'Kingston Flemings', firstName: 'Kingston', lastName: 'Flemings', school: 'Houston', position: 'PG', tier: 2, height: "6'4", weight: '185 lbs', age: 19, wingspan: "6'7", classYear: 2026 },
  { id: 9, rank: 9, name: 'Mikel Brown Jr.', firstName: 'Mikel', lastName: 'Brown Jr.', school: 'Louisville', position: 'PG', tier: 2, height: "6'3", weight: '180 lbs', age: 19, wingspan: "6'6", classYear: 2026 },
  { id: 10, rank: 10, name: 'Jayden Quaintance', firstName: 'Jayden', lastName: 'Quaintance', school: 'Kentucky', position: 'C', tier: 2, height: "6'11", weight: '250 lbs', age: 19, wingspan: "7'4", classYear: 2026 },
  { id: 11, rank: 11, name: 'Koa Peat', firstName: 'Koa', lastName: 'Peat', school: 'Arizona', position: 'SF/PF', tier: 2, height: "6'8", weight: '215 lbs', age: 19, wingspan: "7'1", classYear: 2026 },
  { id: 12, rank: 12, name: 'Tyran Stokes', firstName: 'Tyran', lastName: 'Stokes', school: 'LSU', position: 'PF/C', tier: 2, height: "6'10", weight: '245 lbs', age: 19, wingspan: "7'3", classYear: 2026 },
  { id: 13, rank: 13, name: 'Nate Ament', firstName: 'Nate', lastName: 'Ament', school: 'Texas', position: 'SF', tier: 2, height: "6'7", weight: '200 lbs', age: 20, wingspan: "6'10", classYear: 2026 },
  { id: 14, rank: 14, name: 'Chris Cenac', firstName: 'Chris', lastName: 'Cenac', school: 'Houston', position: 'C', tier: 3, height: "6'11", weight: '255 lbs', age: 20, wingspan: "7'4", classYear: 2026 },
  { id: 15, rank: 15, name: 'VJ Edgecombe', firstName: 'VJ', lastName: 'Edgecombe', school: 'Baylor', position: 'SG', tier: 3, height: "6'5", weight: '195 lbs', age: 20, wingspan: "6'9", classYear: 2026 },
  { id: 16, rank: 16, name: 'Liam McNeeley', firstName: 'Liam', lastName: 'McNeeley', school: 'UConn', position: 'SF', tier: 3, height: "6'7", weight: '205 lbs', age: 20, wingspan: "6'10", classYear: 2026 },
  { id: 17, rank: 17, name: 'Asa Newell', firstName: 'Asa', lastName: 'Newell', school: 'Florida', position: 'PF', tier: 3, height: "6'9", weight: '220 lbs', age: 19, wingspan: "7'0", classYear: 2026 },
  { id: 18, rank: 18, name: 'Drake Powell', firstName: 'Drake', lastName: 'Powell', school: 'North Carolina', position: 'SG/SF', tier: 3, height: "6'6", weight: '195 lbs', age: 20, wingspan: "6'10", classYear: 2026 },
  { id: 19, rank: 19, name: 'John Tonje', firstName: 'John', lastName: 'Tonje', school: 'Wisconsin', position: 'SG', tier: 3, height: "6'5", weight: '190 lbs', age: 21, wingspan: "6'8", classYear: 2026 },
  { id: 20, rank: 20, name: 'Egor Demin', firstName: 'Egor', lastName: 'Demin', school: 'BYU', position: 'PG', tier: 3, height: "6'8", weight: '195 lbs', age: 20, wingspan: "6'11", classYear: 2026 },
  { id: 21, rank: 21, name: 'Rasheer Fleming', firstName: 'Rasheer', lastName: 'Fleming', school: 'Saint Joseph\'s', position: 'PF', tier: 3, height: "6'9", weight: '225 lbs', age: 21, wingspan: "7'2", classYear: 2026 },
  { id: 22, rank: 22, name: 'Oumar Ballo', firstName: 'Oumar', lastName: 'Ballo', school: 'Indiana', position: 'C', tier: 3, height: "6'11", weight: '260 lbs', age: 22, wingspan: "7'5", classYear: 2026 },
  { id: 23, rank: 23, name: 'Ja\'Kobi Gillespie', firstName: 'Ja\'Kobi', lastName: 'Gillespie', school: 'Maryland', position: 'SG', tier: 4, height: "6'3", weight: '185 lbs', age: 21, wingspan: "6'6", classYear: 2026 },
  { id: 24, rank: 24, name: 'Desmond Claude', firstName: 'Desmond', lastName: 'Claude', school: 'USC', position: 'SF', tier: 4, height: "6'7", weight: '210 lbs', age: 20, wingspan: "7'0", classYear: 2026 },
  { id: 25, rank: 25, name: 'Great Osobor', firstName: 'Great', lastName: 'Osobor', school: 'Washington', position: 'C', tier: 4, height: "6'11", weight: '245 lbs', age: 21, wingspan: "7'3", classYear: 2026 }
];

// Storage keys
const MOCK_DRAFT_KEY = 'nba-draft-hq-mock-2026';
const LAST_UPDATED_KEY = 'nba-draft-hq-mock-updated';

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { teams, topProspects, ADMIN_KEY, MOCK_DRAFT_KEY, LAST_UPDATED_KEY };
}
