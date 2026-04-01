import { useState, useEffect } from 'react'

// Admin configuration
const ADMIN_KEY = 'draft-hq-admin-2026';
const MOCK_DRAFT_KEY = 'nba-draft-hq-mock-2026';
const LAST_UPDATED_KEY = 'nba-draft-hq-mock-updated';
const FAVORITES_KEY = 'nba-draft-hq-favorites';
const SCORING_PROFILES_KEY = 'nba-draft-hq-scoring-profiles';

// Team data with 2026 draft order and needs
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

// Top 25 Prospects (2026 Draft Class)
const topProspects = [
  { id: 1, rank: 1, name: 'AJ Dybantsa', firstName: 'AJ', lastName: 'Dybantsa', school: 'BYU', position: 'Wing', tier: 1, height: "6'9", age: 19, classYear: 2026 },
  { id: 2, rank: 2, name: 'Darryn Peterson', firstName: 'Darryn', lastName: 'Peterson', school: 'Kansas', position: 'Guard', tier: 1, height: "6'5", age: 19, classYear: 2026 },
  { id: 3, rank: 3, name: 'Cameron Boozer', firstName: 'Cameron', lastName: 'Boozer', school: 'Duke', position: 'Forward', tier: 1, height: "6'9", age: 18, classYear: 2026 },
  { id: 4, rank: 4, name: 'Caleb Wilson', firstName: 'Caleb', lastName: 'Wilson', school: 'North Carolina', position: 'Wing', tier: 1, height: "6'8", age: 19, classYear: 2026 },
  { id: 5, rank: 5, name: 'Kingston Flemings', firstName: 'Kingston', lastName: 'Flemings', school: 'Houston', position: 'Guard', tier: 2, height: "6'4", age: 19, classYear: 2026 },
  { id: 6, rank: 6, name: 'Jayden Quaintance', firstName: 'Jayden', lastName: 'Quaintance', school: 'Kentucky', position: 'Big', tier: 2, height: "6'10", age: 19, classYear: 2026 },
  { id: 7, rank: 7, name: 'Koa Peat', firstName: 'Koa', lastName: 'Peat', school: 'Arizona', position: 'Forward', tier: 2, height: "6'8", age: 19, classYear: 2026 },
  { id: 8, rank: 8, name: 'Yaxel Lendeborg', firstName: 'Yaxel', lastName: 'Lendeborg', school: 'Michigan', position: 'Forward', tier: 2, height: "6'8.5", age: 23, classYear: 2026 },
  { id: 9, rank: 9, name: 'Hannes Steinbach', firstName: 'Hannes', lastName: 'Steinbach', school: 'Washington', position: 'Big', tier: 2, height: "6'9.5", age: 20, classYear: 2026 },
  { id: 10, rank: 10, name: 'Mikel Brown Jr.', firstName: 'Mikel', lastName: 'Brown Jr.', school: 'Louisville', position: 'Guard', tier: 2, height: "6'4", age: 20, classYear: 2026 },
  { id: 11, rank: 11, name: 'Keaton Wagler', firstName: 'Keaton', lastName: 'Wagler', school: 'Illinois', position: 'Wing', tier: 2, height: "6'6", age: 19, classYear: 2026 },
  { id: 12, rank: 12, name: 'Thomas Haugh', firstName: 'Thomas', lastName: 'Haugh', school: 'Florida', position: 'Forward', tier: 2, height: "6'9", age: 23, classYear: 2026 },
  { id: 13, rank: 13, name: 'Labaron Philon', firstName: 'Labaron', lastName: 'Philon', school: 'Alabama', position: 'Guard', tier: 2, height: "6'2.75", age: 20, classYear: 2026 },
  { id: 14, rank: 14, name: 'Patrick Ngongba II', firstName: 'Patrick', lastName: 'Ngongba II', school: 'Duke', position: 'Big', tier: 2, height: "6'11", age: 20, classYear: 2026 },
  { id: 15, rank: 15, name: 'Cameron Carr', firstName: 'Cameron', lastName: 'Carr', school: 'Baylor', position: 'Wing', tier: 3, height: "6'6", age: 21, classYear: 2026 },
  { id: 16, rank: 16, name: 'Darius Acuff Jr.', firstName: 'Darius', lastName: 'Acuff Jr.', school: 'Arkansas', position: 'Guard', tier: 3, height: "6'1", age: 19, classYear: 2026 },
  { id: 17, rank: 17, name: 'Braylon Mullins', firstName: 'Braylon', lastName: 'Mullins', school: 'Connecticut', position: 'Wing', tier: 3, height: "6'5", age: 20, classYear: 2026 },
  { id: 18, rank: 18, name: 'Nate Ament', firstName: 'Nate', lastName: 'Ament', school: 'Tennessee', position: 'Wing/Forward', tier: 3, height: "6'9", age: 19, classYear: 2026 },
  { id: 19, rank: 19, name: 'Joshua Jefferson', firstName: 'Joshua', lastName: 'Jefferson', school: 'Iowa State', position: 'Wing', tier: 3, height: "6'9", age: 22, classYear: 2026 },
  { id: 20, rank: 20, name: 'Christian Anderson', firstName: 'Christian', lastName: 'Anderson', school: 'Texas Tech', position: 'Guard', tier: 3, height: "6'2", age: 20, classYear: 2026 },
  { id: 21, rank: 21, name: 'Benett Stirtz', firstName: 'Benett', lastName: 'Stirtz', school: 'Iowa', position: 'Guard', tier: 3, height: "6'4", age: 22, classYear: 2026 },
  { id: 22, rank: 22, name: 'Amari Allen', firstName: 'Amari', lastName: 'Allen', school: 'Alabama', position: 'Wing', tier: 3, height: "6'8", age: 20, classYear: 2026 },
  { id: 23, rank: 23, name: 'Chris Cenac Jr.', firstName: 'Chris', lastName: 'Cenac Jr.', school: 'Houston', position: 'Big', tier: 3, height: "6'9.5", age: 19, classYear: 2026 },
  { id: 24, rank: 24, name: 'Neoklis Avdalas', firstName: 'Neoklis', lastName: 'Avdalas', school: 'Virginia Tech', position: 'Wing', tier: 3, height: "6'7.5", age: 20, classYear: 2026 },
  { id: 25, rank: 25, name: 'Tounde Yessoufou', firstName: 'Tounde', lastName: 'Yessoufou', school: 'Baylor', position: 'Wing', tier: 3, height: "6'4", age: 20, classYear: 2026 }
];

const schoolColors = {
  'Kansas': '#0051ba', 'Duke': '#003087', 'BYU': '#002f5f', 'North Carolina': '#7bafd4',
  'Illinois': '#13294b', 'Arkansas': '#9d2235', 'Arizona': '#cc0033', 'Houston': '#c8102e',
  'Louisville': '#ad0000', 'Kentucky': '#0033a0', 'Michigan': '#00274C', 'Alabama': '#9E1B32',
  'Baylor': '#154734', 'Connecticut': '#003366', 'Florida': '#0021A5', 'Wisconsin': '#C5050C',
  'Tennessee': '#FF8200', 'Iowa State': '#C8102E', 'Texas Tech': '#CC0000', 'Iowa': '#FFCD00',
  'Virginia Tech': '#630031', 'Michigan State': '#18453B', 'Purdue': '#CEB888', 'Minnesota': '#7A0019',
  'UCLA': '#2774AE', 'Syracuse': '#F76900', 'Northwestern': '#4E2A84', 'Creighton': '#005CA9',
  'Oregon': '#154733', 'NC State': '#CC0000', 'Nebraska': '#E41C38', 'Texas': '#BF5700',
  'Georgia': '#BA0C2F', 'Georgetown': '#041E42', 'Cincinnati': '#E00122', 'Auburn': '#0C2340',
  'Valencia': '#FF6600', 'NZ Breakers': '#000000', 'Vanderbilt': '#866D4B', 'Melbourne United': '#000000',
  'Paris Basketball': '#1D4289', 'ASVEL': '#CC0000', 'Perth Wildcats': '#FF0000', 'Joventut': '#000000',
  'Butler': '#13294B', 'UCF': '#BA9B37', 'St. John\'s': '#CF102D', 'Dayton': '#004B8D',
  'Santa Clara': '#B30738', 'Indiana': '#990000', 'Maryland': '#E03A3E', 'USC': '#990000',
  'Washington': '#4B2E83', 'Ohio State': '#BB0000', 'Wake Forest': '#9E7E38', 'Virginia': '#232D4B',
  'Kansas State': '#512888', 'Gonzaga': '#C8102E', 'Oklahoma': '#841617', 'Notre Dame': '#0C2340',
  'Stanford': '#8C1515', 'Utah': '#BE0000', 'Colorado': '#CFB87C', 'Arizona State': '#8C1D40',
  'Oregon State': '#DC4405', 'Washington State': '#981E32', 'California': '#003262', 'Utah State': '#00263A',
  'San Diego State': '#C41230', 'Nevada': '#003366', 'New Mexico': '#BA0C2F', 'Boise State': '#0033A0',
  'Fresno State': '#DB0032', 'San Jose State': '#0055A2', 'Colorado State': '#1E4D2B', 'Wyoming': '#492F24',
  'Air Force': '#003087', 'UNLV': '#CF0A2C', 'New Mexico State': '#882345', 'Grand Canyon': '#522398',
  'Seattle': '#AA0000', 'Tarleton': '#4A2C6A', 'Utah Valley': '#275D38', 'California Baptist': '#A6192E'
};

const getTierColor = (tier) => {
  if (tier === 1) return 'bg-amber-100 border-amber-300';
  if (tier === 2) return 'bg-blue-50 border-blue-200';
  if (tier === 3) return 'bg-green-50 border-green-200';
  return 'bg-white border-neutral-200';
};

// Mock Draft Component
const MockDraft = ({ onBack }) => {
  const [picks, setPicks] = useState(() => {
    const saved = localStorage.getItem(MOCK_DRAFT_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [lastUpdated, setLastUpdated] = useState(() => localStorage.getItem(LAST_UPDATED_KEY) || null);
  const [selectedPick, setSelectedPick] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const savePick = (pickNumber, prospectId) => {
    const newPicks = { ...picks, [pickNumber]: prospectId };
    setPicks(newPicks);
    localStorage.setItem(MOCK_DRAFT_KEY, JSON.stringify(newPicks));
    const now = new Date().toISOString();
    setLastUpdated(now);
    localStorage.setItem(LAST_UPDATED_KEY, now);
    setSelectedPick(null);
  };

  const clearPick = (pickNumber) => {
    const newPicks = { ...picks };
    delete newPicks[pickNumber];
    setPicks(newPicks);
    localStorage.setItem(MOCK_DRAFT_KEY, JSON.stringify(newPicks));
    const now = new Date().toISOString();
    setLastUpdated(now);
    localStorage.setItem(LAST_UPDATED_KEY, now);
  };

  const handleAdminLogin = () => {
    if (adminKeyInput === ADMIN_KEY) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminKeyInput('');
    } else {
      alert('Invalid admin key');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold">
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black">NBA</span>
              <span className="text-xl font-black text-red-600">DRAFT</span>
              <span className="text-xl font-black">HQ</span>
            </div>
            <div>
              {isAdmin ? (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">ADMIN MODE</span>
              ) : (
                <button onClick={() => setShowAdminLogin(true)} className="text-xs text-neutral-400 hover:text-neutral-600">Admin</button>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Admin Login</h3>
            <input type="password" value={adminKeyInput} onChange={(e) => setAdminKeyInput(e.target.value)} placeholder="Enter admin key" className="w-full border border-neutral-300 rounded-lg px-4 py-2 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleAdminLogin} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700">Login</button>
              <button onClick={() => setShowAdminLogin(false)} className="flex-1 bg-neutral-200 text-neutral-700 py-2 rounded-lg font-semibold hover:bg-neutral-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-neutral-900 mb-2">2026 NBA Mock Draft</h1>
          <p className="text-neutral-600">First Round Projections • Last Updated: {formatDate(lastUpdated)}</p>
        </div>

        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800"><span className="font-bold">Admin Mode Active:</span> Click on any pick to assign or change a prospect. Click the X to clear a pick.</p>
          </div>
        )}

        <div className="grid gap-3">
          {teams.map((team, index) => {
            const pickNumber = index + 1;
            const selectedProspectId = picks[pickNumber];
            const selectedProspect = selectedProspectId ? topProspects.find(p => p.id === selectedProspectId) : null;
            const isSelecting = selectedPick === pickNumber;

            return (
              <div key={team.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="flex items-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-neutral-100 border-r border-neutral-200">
                    <span className="text-2xl font-black text-neutral-400">{pickNumber}</span>
                  </div>
                  <div className="w-64 px-4 py-3 border-r border-neutral-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: team.colors.primary }}>{team.abbreviation}</div>
                      <div>
                        <div className="font-bold text-neutral-900">{team.name}</div>
                        <div className="text-xs text-neutral-500">{team.record}</div>
                      </div>
                    </div>
                  </div>
                  <div className="w-40 px-4 py-3 border-r border-neutral-200">
                    <div className="text-xs text-neutral-400 uppercase font-bold mb-1">Needs</div>
                    <div className="flex flex-wrap gap-1">
                      {team.needs.map((need, i) => <span key={i} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">{need}</span>)}
                    </div>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    {isAdmin && isSelecting ? (
                      <div className="flex items-center gap-2">
                        <select onChange={(e) => e.target.value && savePick(pickNumber, parseInt(e.target.value))} className="flex-1 border border-neutral-300 rounded-lg px-3 py-2" defaultValue="">
                          <option value="">Select prospect...</option>
                          {topProspects.map(p => <option key={p.id} value={p.id}>#{p.rank} {p.name} ({p.position}) - {p.school}</option>)}
                        </select>
                        <button onClick={() => setSelectedPick(null)} className="text-neutral-400 hover:text-neutral-600 px-2">×</button>
                      </div>
                    ) : selectedProspect ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-red-600">#{selectedProspect.rank}</span>
                          <div>
                            <div className="font-bold text-neutral-900">{selectedProspect.name}</div>
                            <div className="text-sm text-neutral-500">{selectedProspect.position} • {selectedProspect.school}</div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedPick(pickNumber)} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">Change</button>
                            <button onClick={() => clearPick(pickNumber)} className="text-sm text-red-600 hover:text-red-800 font-semibold">×</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 italic">No pick selected</span>
                        {isAdmin && <button onClick={() => setSelectedPick(pickNumber)} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">+ Add Pick</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Team Needs Component
const TeamNeeds = ({ onBack }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  const getSuggestedTargets = (team) => {
    return topProspects.filter(p => {
      return team.needs.some(need => {
        if (need === 'Wing') return p.position.includes('SF') || p.position.includes('SG');
        if (need === 'Big') return p.position.includes('PF') || p.position.includes('C');
        return p.position.includes(need);
      });
    }).slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black">NBA</span>
              <span className="text-xl font-black text-red-600">DRAFT</span>
              <span className="text-xl font-black">HQ</span>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-neutral-900 mb-2">Team Needs</h1>
          <p className="text-neutral-600">2026 Draft Order & Position Needs (Based on 2024-25 Standings)</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team, index) => {
            const isSelected = selectedTeam === team.id;
            const suggestedTargets = getSuggestedTargets(team);
            
            return (
              <div key={team.id} onClick={() => setSelectedTeam(isSelected ? null : team.id)} className={`bg-white rounded-xl p-5 border-2 cursor-pointer transition-all ${isSelected ? 'border-red-500 shadow-lg' : 'border-neutral-200 hover:border-neutral-300'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: team.colors.primary }}>{team.abbreviation}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-400">#{index + 1}</span>
                      <span className="font-bold text-neutral-900">{team.name}</span>
                    </div>
                    <div className="text-sm text-neutral-500">{team.record}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-neutral-400 uppercase font-bold mb-2">Draft Needs</div>
                  <div className="flex flex-wrap gap-2">
                    {team.needs.map((need, i) => <span key={i} className="text-sm bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full font-semibold">{need}</span>)}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 animate-fade-in">
                    <div className="text-xs text-neutral-400 uppercase font-bold mb-2">Suggested Targets</div>
                    <div className="space-y-2">
                      {suggestedTargets.map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-red-600">#{p.rank}</span>
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-neutral-500">({p.position})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Big Board Component
const BigBoard = ({ onBack, onSelectProspect, favorites, toggleFavorite, isFavorite }) => {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black">NBA</span>
              <span className="text-xl font-black text-red-600">DRAFT</span>
              <span className="text-xl font-black">HQ</span>
            </div>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-neutral-900 mb-2">Top 25 Big Board</h1>
          <p className="text-neutral-600">2026 NBA Draft Rankings</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topProspects.map(prospect => {
            const tierColor = getTierColor(prospect.tier);
            const schoolColor = schoolColors[prospect.school] || '#666';
            return (
              <div key={prospect.id} className={`${tierColor} border rounded-xl p-4 hover:shadow-lg transition-all hover:scale-[1.02] relative group`}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(prospect.id); }}
                  className="absolute top-2 right-2 text-xl hover:scale-110 transition-transform z-10"
                >
                  {isFavorite(prospect.id) ? '⭐' : '☆'}
                </button>
                <div onClick={() => onSelectProspect(prospect.id)} className="cursor-pointer">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-4xl font-black text-neutral-900">{prospect.rank}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: schoolColor }}>{prospect.school.charAt(0)}</div>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">{prospect.name}</h3>
                  <p className="text-sm text-neutral-600">{prospect.position}, {prospect.school}</p>
                  <div className="mt-2 text-xs text-neutral-500">{prospect.height} • {prospect.weight}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Home Component
const Home = ({ onNavigate, onSelectProspect, darkMode, toggleDarkMode, favorites, toggleFavorite, isFavorite }) => {
  const latestUpdates = [
    { date: 'Mar 30', title: 'Updated Big Board after March Madness', type: 'Analysis' },
    { date: 'Mar 28', title: 'Darryn Peterson declares for draft', type: 'News' },
    { date: 'Mar 25', title: 'New measurements: AJ Dybantsa 6\'9" with 7\'0" wingspan', type: 'Update' },
    { date: 'Mar 22', title: 'Cam Boozer dominates in Sweet 16', type: 'Performance' },
  ];

  return (
    <div className="min-h-screen bg-prospera-bg">
      <header className="bg-prospera-surface border-b border-prospera-border sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-prospera-text-primary">NBA</span>
              <span className="text-2xl font-black tracking-tight text-prospera-gold">DRAFT</span>
              <span className="text-2xl font-black tracking-tight text-prospera-text-primary">HQ</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => onNavigate('big-board')} className="text-sm font-semibold text-prospera-text-secondary hover:text-prospera-text-primary transition-colors">Big Board</button>
              <button onClick={() => onNavigate('mock-draft')} className="text-sm font-semibold text-prospera-text-secondary hover:text-prospera-text-primary transition-colors">Mock Draft</button>
              <button onClick={() => onNavigate('team-needs')} className="text-sm font-semibold text-prospera-text-secondary hover:text-prospera-text-primary transition-colors">Team Needs</button>
              <button onClick={() => onNavigate('custom-scoring')} className="text-sm font-semibold text-prospera-text-secondary hover:text-prospera-text-primary transition-colors">Custom Scoring</button>
            </nav>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-xl hover:bg-prospera-surface-alt transition-colors text-prospera-text-primary"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button className="bg-prospera-text-primary text-prospera-surface px-4 py-2 rounded-lg text-sm font-semibold hover:bg-prospera-navy transition-colors">Sign In</button>
              <button className="bg-prospera-gold text-prospera-text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-prospera-gold-hover transition-colors">Get Started</button>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-prospera-navy text-prospera-surface py-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-prospera-gold text-prospera-text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">2026 NBA Draft</div>
              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 text-prospera-surface">The Most<br /><span className="text-prospera-gold">Complete</span><br />Draft Resource</h1>
              <p className="text-xl text-prospera-text-secondary mb-8 max-w-lg">Advanced analytics, custom rankings, and in-depth scouting reports for the 2026 NBA Draft class.</p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => onNavigate('big-board')} className="bg-prospera-gold text-prospera-text-primary px-8 py-4 rounded-xl text-lg font-bold hover:bg-prospera-gold-hover transition-colors">View Big Board</button>
                <button onClick={() => onNavigate('mock-draft')} className="bg-prospera-surface/10 backdrop-blur text-prospera-surface px-8 py-4 rounded-xl text-lg font-bold hover:bg-prospera-surface/20 transition-colors border border-prospera-border">Mock Draft</button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-prospera-gold rounded-3xl transform rotate-3 opacity-20"></div>
                <div className="relative bg-prospera-surface-alt rounded-3xl p-8 border border-prospera-border">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-prospera-gold rounded-2xl flex items-center justify-center text-3xl font-black text-prospera-text-primary">1</div>
                    <div>
                      <div className="text-2xl font-bold text-prospera-text-primary">AJ Dybantsa</div>
                      <div className="text-prospera-text-secondary">Wing, BYU</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-prospera-text-secondary">Draft Score</span><span className="font-bold text-prospera-text-primary">84.5</span></div>
                    <div className="flex justify-between text-sm"><span className="text-prospera-text-secondary">Tier</span><span className="font-bold text-prospera-gold">Franchise</span></div>
                    <div className="flex justify-between text-sm"><span className="text-prospera-text-secondary">Projection</span><span className="font-bold text-prospera-text-primary">All-Star</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-prospera-surface-alt">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => onNavigate('big-board')} className="bg-prospera-surface rounded-xl p-6 border border-prospera-border hover:border-prospera-gold hover:shadow-prospera-lg transition-all group text-left">
              <div className="text-3xl mb-3">📋</div>
              <div className="font-bold text-prospera-text-primary group-hover:text-prospera-gold transition-colors">Full Big Board</div>
            </button>
            <button onClick={() => onNavigate('mock-draft')} className="bg-prospera-surface rounded-xl p-6 border border-prospera-border hover:border-prospera-gold hover:shadow-prospera-lg transition-all group text-left">
              <div className="text-3xl mb-3">🎲</div>
              <div className="font-bold text-prospera-text-primary group-hover:text-prospera-gold transition-colors">Mock Draft</div>
            </button>
            <button onClick={() => onNavigate('team-needs')} className="bg-prospera-surface rounded-xl p-6 border border-prospera-border hover:border-prospera-gold hover:shadow-prospera-lg transition-all group text-left">
              <div className="text-3xl mb-3">🏀</div>
              <div className="font-bold text-prospera-text-primary group-hover:text-prospera-gold transition-colors">Team Needs</div>
            </button>
            <button onClick={() => onNavigate('custom-scoring')} className="bg-prospera-surface rounded-xl p-6 border border-prospera-border hover:border-prospera-gold hover:shadow-prospera-lg transition-all group text-left">
              <div className="text-3xl mb-3">⚖️</div>
              <div className="font-bold text-prospera-text-primary group-hover:text-prospera-gold transition-colors">Custom Scoring</div>
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-prospera-bg">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-prospera-text-primary mb-2">Top 10 Prospects</h2>
              <p className="text-prospera-text-secondary">The best of the 2026 NBA Draft class</p>
            </div>
            <button onClick={() => onNavigate('big-board')} className="text-prospera-gold font-semibold hover:text-prospera-gold-hover transition-colors">View Full Board →</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topProspects.slice(0, 10).map(prospect => {
              const schoolColor = schoolColors[prospect.school] || '#666';
              const isTier1 = prospect.tier === 1;
              return (
                <div key={prospect.id} className={`bg-prospera-surface border rounded-xl p-4 hover:shadow-prospera-lg transition-all hover:scale-[1.02] relative group ${isTier1 ? 'border-prospera-gold' : 'border-prospera-border'}`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(prospect.id); }}
                    className="absolute top-2 right-2 text-xl hover:scale-110 transition-transform z-10"
                  >
                    {isFavorite(prospect.id) ? '⭐' : '☆'}
                  </button>
                  <div onClick={() => onSelectProspect(prospect.id)} className="cursor-pointer">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`text-4xl font-black ${isTier1 ? 'text-prospera-gold' : 'text-prospera-text-primary'}`}>{prospect.rank}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: schoolColor }}>{prospect.school.charAt(0)}</div>
                    </div>
                    <h3 className="text-lg font-bold text-prospera-text-primary mb-1">{prospect.name}</h3>
                    <p className="text-sm text-prospera-text-secondary">{prospect.position}, {prospect.school}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-prospera-surface-alt">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-prospera-text-primary">Latest Updates</h2>
            <button className="text-prospera-gold font-semibold hover:text-prospera-gold-hover transition-colors">View All →</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {latestUpdates.map((update, i) => (
              <div key={i} className="bg-prospera-surface rounded-xl p-6 border border-prospera-border hover:shadow-prospera transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-prospera-gold uppercase">{update.type}</span>
                  <span className="text-xs text-prospera-text-secondary">{update.date}</span>
                </div>
                <h3 className="font-bold text-prospera-text-primary">{update.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-prospera-navy text-prospera-text-secondary py-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-black text-prospera-surface">NBA</span>
                <span className="text-xl font-black text-prospera-gold">DRAFT</span>
                <span className="text-xl font-black text-prospera-surface">HQ</span>
              </div>
              <p className="text-sm">The most complete NBA Draft resource with advanced analytics and in-depth scouting.</p>
            </div>
            <div>
              <h4 className="text-prospera-surface font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onNavigate('big-board')} className="hover:text-prospera-surface transition-colors">Big Board</button></li>
                <li><button onClick={() => onNavigate('mock-draft')} className="hover:text-prospera-surface transition-colors">Mock Draft</button></li>
                <li><button onClick={() => onNavigate('team-needs')} className="hover:text-prospera-surface transition-colors">Team Needs</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-prospera-surface font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-prospera-surface transition-colors">Trait Library</a></li>
                <li><a href="#" className="hover:text-prospera-surface transition-colors">Scouting Guide</a></li>
                <li><a href="#" className="hover:text-prospera-surface transition-colors">Methodology</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-prospera-surface font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-prospera-surface transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-prospera-surface transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-prospera-surface transition-colors">Newsletter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-prospera-border pt-8 text-sm text-center">© 2026 NBA Draft HQ. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

// Prospect Details Data
const prospectDetails = {
  1: {
    summary: "A dynamic downhill creator with real star-pathway upside, but with shooting and role-translation questions still shaping the final outcome.",
    archetype: 'Versatile Wing Creator',
    draftRange: 'Top 3',
    tier: 'Tier 1 — Franchise Player',
    badges: ['advantage_creation', 'shooting_gravity', 'processing_speed', 'scalability'],
    projection: { offensiveRole: 'Primary scorer / facilitator', defensiveRole: 'Helper / chaser' },
    strengths: ['Elite two-way potential with NBA-ready frame', 'Versatile scoring ability at all three levels', 'High motor and competitive toughness', 'Strong finisher in transition'],
    weaknesses: ['Shot selection can improve', 'Three-point consistency needs development', 'Playmaking reads still developing', 'Turnover prone when pressured'],
    coreTraits: [
      { key: 'advantage_creation', grade: 9 }, { key: 'decision_making', grade: 7 }, { key: 'passing_creation', grade: 6 },
      { key: 'shooting_gravity', grade: 8 }, { key: 'off_ball_value', grade: 7 }, { key: 'processing_speed', grade: 8 },
      { key: 'scalability', grade: 9 }, { key: 'defensive_versatility', grade: 8 }
    ],
    weightedTraitScore: 84.5, riskPenalty: 2.5, finalBoardScore: 82.0,
    risks: [{ key: 'shooting_risk', level: 1 }, { key: 'physical_translation_risk', level: 0 }, { key: 'creation_translation_risk', level: 1 }, { key: 'defensive_role_risk', level: 0 }, { key: 'processing_risk', level: 0 }, { key: 'age_upside_risk', level: 0 }, { key: 'motor_consistency_risk', level: 0 }, { key: 'medical_risk', level: 0 }],
    writeup: "Darryn Peterson enters the 2026 draft as one of the most intriguing prospects in recent memory. With elite athleticism and a developing skill set that suggests significant upside. His ability to create advantages off the dribble and finish at the rim makes him a constant threat in the half-court and transition.",
    developmentPlan: "Peterson needs to refine his shot selection and continue developing his three-point consistency. Working on his handle under pressure and defensive positioning will be key to reaching his ceiling.",
    roleOutlook: "Projects as a primary scoring wing who can create advantages, defend multiple positions, and grow into a franchise cornerstone.",
    comps: [{ type: 'high', player: 'Anthony Edwards' }, { type: 'median', player: 'Jalen Green' }, { type: 'low', player: 'Gary Harris' }, { type: 'style', player: 'Donovan Mitchell' }],
    stats: { ppg: 19.2, rpg: 5.8, apg: 3.2, stl: 1.4, blk: 0.6, threePct: '36.5%', ts: '58.7%', usg: '28.8%', ast: '22.5%', tov: '11.2%', bpm: '+7.5', obpm: '+5.2' },
    supportingTraits: [
      { name: 'Rim Finishing', grade: 9, category: 'offensive' }, { name: 'Rim Pressure', grade: 9, category: 'offensive' },
      { name: 'Self-Creation', grade: 8, category: 'offensive' }, { name: 'Mid-Range Shotmaking', grade: 7, category: 'offensive' },
      { name: 'Three-Point Shooting', grade: 6, category: 'offensive' }, { name: 'Transition Offense', grade: 9, category: 'offensive' },
      { name: 'On-Ball Defense', grade: 7, category: 'defensive' }, { name: 'Team Defense', grade: 6, category: 'defensive' },
      { name: 'Switchability', grade: 8, category: 'defensive' }, { name: 'First Step', grade: 9, category: 'physical' },
      { name: 'Vertical Explosion', grade: 9, category: 'physical' }, { name: 'Frame', grade: 7, category: 'physical' }
    ]
  },
  2: {
    summary: "A physically dominant big with elite feel and passing vision. Projects as a modern offensive hub with defensive versatility.",
    archetype: 'Modern Big Creator',
    draftRange: 'Top 3',
    tier: 'Tier 1 — Franchise Player',
    badges: ['advantage_creation', 'decision_making', 'passing_creation', 'scalability', 'pantheon_potential'],
    projection: { offensiveRole: 'Offensive hub / facilitator', defensiveRole: 'Anchor / switchable big' },
    strengths: ['Elite passing vision for a big', 'Strong finisher around the rim', 'Can switch defensively', 'High rebounding efficiency', 'Good feel for the game'],
    weaknesses: ['Jump shot needs work', 'Can be turnover prone', 'Free throw percentage concerns', 'Post game still developing'],
    coreTraits: [
      { key: 'advantage_creation', grade: 8 }, { key: 'decision_making', grade: 9 }, { key: 'passing_creation', grade: 8 },
      { key: 'shooting_gravity', grade: 6 }, { key: 'off_ball_value', grade: 8 }, { key: 'processing_speed', grade: 8 },
      { key: 'scalability', grade: 9 }, { key: 'defensive_versatility', grade: 8 }
    ],
    weightedTraitScore: 85.2, riskPenalty: 1.5, finalBoardScore: 83.7,
    risks: [{ key: 'shooting_risk', level: 1 }, { key: 'physical_translation_risk', level: 0 }, { key: 'creation_translation_risk', level: 0 }, { key: 'defensive_role_risk', level: 1 }, { key: 'processing_risk', level: 0 }, { key: 'age_upside_risk', level: 0 }, { key: 'motor_consistency_risk', level: 0 }, { key: 'medical_risk', level: 0 }],
    writeup: "Cam Boozer combines rare physical tools with elite basketball IQ. His passing vision and defensive versatility make him a perfect modern big. At 6'9 with a 7'2 wingspan, he has the size to protect the rim and the mobility to switch onto perimeter players.",
    developmentPlan: "Continue developing outside shot and free throw consistency. Expand post game repertoire while maintaining passing efficiency.",
    roleOutlook: "Projects as a Bam Adebayo-type modern big who can facilitate, defend, and anchor a defense.",
    comps: [{ type: 'high', player: 'Bam Adebayo' }, { type: 'median', player: 'Al Horford' }, { type: 'low', player: 'Jarrett Allen' }, { type: 'style', player: 'Chris Webber' }],
    stats: { ppg: 16.8, rpg: 9.2, apg: 4.5, stl: 1.1, blk: 1.8, threePct: '28.5%', ts: '61.2%', usg: '24.5%', ast: '28.5%', tov: '14.2%', bpm: '+9.2', obpm: '+6.8' },
    supportingTraits: [
      { name: 'Rim Finishing', grade: 9, category: 'offensive' }, { name: 'Post Game', grade: 7, category: 'offensive' },
      { name: 'Passing Vision', grade: 9, category: 'offensive' }, { name: 'Three-Point Shooting', grade: 5, category: 'offensive' },
      { name: 'Screen Setting', grade: 8, category: 'offensive' }, { name: 'Rim Protection', grade: 8, category: 'defensive' },
      { name: 'Team Defense', grade: 8, category: 'defensive' }, { name: 'Switchability', grade: 7, category: 'defensive' }
    ]
  },
  3: {
    summary: "A dynamic downhill creator with real star-pathway upside, but with shooting and role-translation questions still shaping the final outcome.",
    archetype: 'Versatile Wing Creator',
    draftRange: 'Top 3',
    tier: 'Tier 1 — Franchise Player',
    badges: ['advantage_creation', 'shooting_gravity', 'processing_speed', 'scalability'],
    projection: { offensiveRole: 'Primary scorer / facilitator', defensiveRole: 'Helper / chaser' },
    strengths: ['Elite two-way potential with NBA-ready frame', 'Versatile scoring ability at all three levels', 'High motor and competitive toughness', 'Strong finisher in transition'],
    weaknesses: ['Shot selection can improve', 'Three-point consistency needs development', 'Playmaking reads still developing', 'Defensive discipline inconsistent'],
    coreTraits: [
      { key: 'advantage_creation', grade: 9 }, { key: 'decision_making', grade: 7 }, { key: 'passing_creation', grade: 6 },
      { key: 'shooting_gravity', grade: 8 }, { key: 'off_ball_value', grade: 7 }, { key: 'processing_speed', grade: 8 },
      { key: 'scalability', grade: 9 }, { key: 'defensive_versatility', grade: 8 }
    ],
    weightedTraitScore: 84.5, riskPenalty: 2.5, finalBoardScore: 82.0,
    risks: [{ key: 'shooting_risk', level: 1 }, { key: 'physical_translation_risk', level: 0 }, { key: 'creation_translation_risk', level: 1 }, { key: 'defensive_role_risk', level: 0 }, { key: 'processing_risk', level: 0 }, { key: 'age_upside_risk', level: 0 }, { key: 'motor_consistency_risk', level: 0 }, { key: 'medical_risk', level: 0 }],
    writeup: "AJ Dybantsa enters the 2026 draft as one of the most intriguing prospects in recent memory. At 6'9 with a 7'0 wingspan, he possesses ideal wing size combined with elite athleticism and a developing skill set.",
    developmentPlan: "Dybantsa needs to refine his shot selection and continue developing his three-point consistency. Improving defensive discipline and positioning will be key.",
    roleOutlook: "Projects as a primary scoring wing who can create advantages, defend multiple positions, and grow into a franchise cornerstone.",
    comps: [{ type: 'high', player: 'Paul George' }, { type: 'median', player: 'Franz Wagner' }, { type: 'low', player: 'Rudy Gay' }, { type: 'style', player: 'Jayson Tatum' }],
    stats: { ppg: 17.8, rpg: 6.5, apg: 2.8, stl: 1.2, blk: 0.8, threePct: '38.5%', ts: '59.7%', usg: '26.8%', ast: '18.5%', tov: '12.2%', bpm: '+8.5', obpm: '+6.2' },
    supportingTraits: [
      { name: 'Rim Finishing', grade: 9, category: 'offensive' }, { name: 'Rim Pressure', grade: 9, category: 'offensive' },
      { name: 'Self-Creation', grade: 8, category: 'offensive' }, { name: 'Mid-Range Shotmaking', grade: 7, category: 'offensive' },
      { name: 'Three-Point Shooting', grade: 7, category: 'offensive' }, { name: 'Transition Offense', grade: 9, category: 'offensive' }
    ]
  }
};

// Default details generator for prospects 4-25
const getDefaultDetails = (prospect) => ({
  summary: `${prospect.name} is a promising ${prospect.position} prospect from ${prospect.school} with intriguing upside and development potential.`,
  archetype: `${prospect.position} Prospect`,
  draftRange: prospect.rank <= 14 ? 'Lottery' : 'Mid-Late First',
  tier: prospect.tier === 1 ? 'Tier 1 — Franchise Player' : prospect.tier === 2 ? 'Tier 2 — High-Level Starter' : prospect.tier === 3 ? 'Tier 3 — Rotation Player' : 'Tier 4 — Developmental',
  badges: ['scalability', 'defensive_versatility'],
  projection: { offensiveRole: 'Rotation player', defensiveRole: 'Team defender' },
  strengths: ['Solid fundamentals', 'Good size for position', 'Coachable player', 'Competitive spirit'],
  weaknesses: ['Needs to add strength', 'Jump shot consistency', 'Decision making under pressure'],
  coreTraits: [{ key: 'advantage_creation', grade: 6 }, { key: 'decision_making', grade: 6 }, { key: 'passing_creation', grade: 5 }, { key: 'shooting_gravity', grade: 6 }, { key: 'off_ball_value', grade: 6 }, { key: 'processing_speed', grade: 6 }, { key: 'scalability', grade: 7 }, { key: 'defensive_versatility', grade: 7 }],
  weightedTraitScore: 72.5, riskPenalty: 3.0, finalBoardScore: 69.5,
  risks: [{ key: 'shooting_risk', level: 1 }, { key: 'physical_translation_risk', level: 1 }, { key: 'creation_translation_risk', level: 1 }, { key: 'defensive_role_risk', level: 1 }, { key: 'processing_risk', level: 1 }, { key: 'age_upside_risk', level: 0 }, { key: 'motor_consistency_risk', level: 1 }, { key: 'medical_risk', level: 0 }],
  writeup: `${prospect.name} shows promise as a ${prospect.position} with solid fundamentals and room for growth. Has the tools to become a solid contributor at the NBA level with proper development.`,
  developmentPlan: "Focus on strength training and shooting consistency. Expand offensive repertoire and improve defensive fundamentals.",
  roleOutlook: `Projects as a solid rotation ${prospect.position} with starter potential.`,
  comps: [{ type: 'high', player: 'NBA Starter' }, { type: 'median', player: 'Rotation Player' }, { type: 'low', player: 'End of Bench' }, { type: 'style', player: prospect.position }],
  stats: { ppg: 12.5, rpg: 4.5, apg: 2.0, stl: 0.8, blk: 0.5, threePct: '33.5%', ts: '55.0%', usg: '22.0%', ast: '15.0%', tov: '13.0%', bpm: '+3.5', obpm: '+2.0' },
  supportingTraits: [{ name: 'Fundamentals', grade: 7, category: 'offensive' }, { name: 'Size', grade: 7, category: 'physical' }, { name: 'Athleticism', grade: 6, category: 'physical' }, { name: 'Defense', grade: 6, category: 'defensive' }]
});

const badgeLabels = {
  'advantage_creation': 'Paint Touch Creator', 'decision_making': 'Decision Maker', 'passing_creation': 'Playmaker',
  'shooting_gravity': 'Warps Spacing', 'off_ball_value': 'Off-Ball Threat', 'processing_speed': 'Fast Processor',
  'scalability': 'Plug-and-Play', 'defensive_versatility': 'Switchable Coverage', 'rim_pressure': 'Rim Pressure',
  'pantheon_potential': 'Pantheon Potential'
};

const traitLabels = {
  'advantage_creation': 'Advantage Creation', 'decision_making': 'Decision Making', 'passing_creation': 'Passing Creation',
  'shooting_gravity': 'Shooting Gravity', 'off_ball_value': 'Off-Ball Value', 'processing_speed': 'Processing Speed',
  'scalability': 'Scalability', 'defensive_versatility': 'Defensive Versatility'
};

const riskLabels = {
  'shooting_risk': 'Shooting Translation', 'physical_translation_risk': 'Physical Translation', 'creation_translation_risk': 'Creation Translation',
  'defensive_role_risk': 'Defensive Role', 'processing_risk': 'Processing', 'age_upside_risk': 'Age/Upside',
  'motor_consistency_risk': 'Motor/Consistency', 'medical_risk': 'Medical'
};

// Prospect Profile Component with 4 View Modes
const ProspectProfile = ({ prospectId, onBack, favorites, toggleFavorite, isFavorite }) => {
  const [viewMode, setViewMode] = useState('summary'); // snapshot, summary, report, full
  const prospect = topProspects.find(p => p.id === prospectId) || topProspects[0];
  const details = prospectDetails[prospectId] || getDefaultDetails(prospect);

  const getTierBadgeColor = (tier) => {
    if (tier?.includes('1')) return 'bg-green-100 text-green-800';
    if (tier?.includes('2')) return 'bg-blue-100 text-blue-800';
    if (tier?.includes('3')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-neutral-100 text-neutral-600';
  };

  const getRiskLevel = (level) => {
    if (level === 0) return { label: 'None', color: 'bg-green-100 text-green-800' };
    if (level === 1) return { label: 'Low', color: 'bg-blue-100 text-blue-800' };
    if (level === 2) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'High', color: 'bg-red-100 text-red-800' };
  };

  const viewModes = [
    { id: 'snapshot', label: 'Snapshot', desc: 'Quick look' },
    { id: 'summary', label: 'Summary', desc: 'Key info' },
    { id: 'report', label: 'Report', desc: 'Detailed' },
    { id: 'full', label: 'Full Profile', desc: 'Everything' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black">NBA</span>
              <span className="text-xl font-black text-red-600">DRAFT</span>
              <span className="text-xl font-black">HQ</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
              {viewModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === mode.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => toggleFavorite(prospect.id)}
              className="text-3xl hover:scale-110 transition-transform"
            >
              {isFavorite(prospect.id) ? '⭐' : '☆'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Column - Player Card */}
          <div className="w-[380px] flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-[#faf8f3] rounded-2xl shadow-xl p-6 transform -rotate-1" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                <div className="absolute -top-3 -left-3 bg-red-600 text-white rounded-xl px-4 py-2 shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider">Rank</span>
                  <div className="text-3xl font-black leading-none">{prospect.rank}</div>
                </div>
                <div className="absolute -top-2 right-4 w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center">
                  <span className="text-2xl font-black text-neutral-400">{prospect.school?.charAt(0)}</span>
                </div>
                <div className="mt-8 mb-4 aspect-[3/4] bg-gradient-to-b from-neutral-200 to-neutral-300 rounded-xl flex items-end justify-center overflow-hidden relative">
                  <div className="text-neutral-400 text-center pb-8">
                    <div className="text-6xl mb-2">🏀</div>
                    <div className="text-sm font-medium">{prospect.name}</div>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-black text-neutral-900 leading-tight mb-1">{prospect.firstName}<br />{prospect.lastName}</h2>
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-600">
                    <span className="bg-neutral-200 px-2 py-1 rounded">{prospect.position}</span>
                    <span>•</span>
                    <span>{prospect.school}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div><div className="text-xs text-neutral-500 uppercase font-bold">Height</div><div className="text-lg font-bold">{prospect.height}</div></div>
                    <div><div className="text-xs text-neutral-500 uppercase font-bold">Weight</div><div className="text-lg font-bold">{prospect.weight}</div></div>
                    <div><div className="text-xs text-neutral-500 uppercase font-bold">Age</div><div className="text-lg font-bold">{prospect.age}</div></div>
                    <div><div className="text-xs text-neutral-500 uppercase font-bold">Wingspan</div><div className="text-lg font-bold">{prospect.wingspan}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content Based on View Mode */}
          <div className="flex-1 min-w-0">
            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-7xl md:text-8xl font-black text-neutral-900 uppercase tracking-tight leading-[0.9] mb-6">
                {prospect.firstName}<br /><span className="text-red-600">{prospect.lastName}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-lg font-semibold text-neutral-600 mb-4">
                <span className="bg-neutral-900 text-white px-3 py-1 rounded-lg">{prospect.position}</span>
                <span className="text-neutral-400">•</span>
                <span>{prospect.school}</span>
                <span className="text-neutral-400">•</span>
                <span>Class of {prospect.classYear}</span>
              </div>
            </div>

            {/* SNAPSHOT MODE */}
            {(viewMode === 'snapshot' || viewMode === 'summary' || viewMode === 'report' || viewMode === 'full') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTierBadgeColor(details.tier)}`}>{details.tier}</span>
                  <span className="text-neutral-600">{details.archetype}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-600">{details.draftRange}</span>
                </div>
                <p className="text-xl text-neutral-700 leading-relaxed font-medium italic border-l-4 border-red-600 pl-6">
                  "{details.summary}"
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {details.badges.slice(0, 4).map((badge, i) => (
                    <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-sm font-semibold border border-neutral-300">
                      {badgeLabels[badge] || badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SUMMARY MODE */}
            {(viewMode === 'summary' || viewMode === 'report' || viewMode === 'full') && (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Role Projection</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-xs text-neutral-500 uppercase mb-1">Offensive Role</div><div className="text-lg font-bold text-neutral-900">{details.projection.offensiveRole}</div></div>
                    <div><div className="text-xs text-neutral-500 uppercase mb-1">Defensive Role</div><div className="text-lg font-bold text-neutral-900">{details.projection.defensiveRole}</div></div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-600 mb-4">Strengths</h3>
                    <ul className="space-y-2">
                      {details.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-700"><span className="text-green-500 font-bold">+</span><span>{s}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-4">Weaknesses</h3>
                    <ul className="space-y-2">
                      {details.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-700"><span className="text-red-500 font-bold">−</span><span>{w}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>

                {viewMode === 'summary' && details.badges.length > 4 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">All Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {details.badges.map((badge, i) => (
                        <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-sm font-semibold border border-neutral-300">
                          {badgeLabels[badge] || badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* REPORT MODE */}
            {(viewMode === 'report' || viewMode === 'full') && (
              <>
                {/* Core Traits */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Core Traits</h3>
                  <div className="space-y-3">
                    {details.coreTraits.map(trait => (
                      <div key={trait.key} className="flex items-center gap-4">
                        <div className="w-40 text-sm font-semibold text-neutral-700">{traitLabels[trait.key]}</div>
                        <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full ${trait.grade >= 8 ? 'bg-green-500' : trait.grade >= 6 ? 'bg-blue-500' : 'bg-yellow-500'}`} style={{ width: `${(trait.grade / 9) * 100}%` }} />
                        </div>
                        <div className="w-8 text-right font-bold text-neutral-900">{trait.grade}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><div className="text-xs text-neutral-500 uppercase">Weighted Score</div><div className="text-2xl font-black">{details.weightedTraitScore.toFixed(1)}</div></div>
                      <div><div className="text-xs text-neutral-500 uppercase">Risk Penalty</div><div className="text-2xl font-black text-red-600">-{details.riskPenalty.toFixed(1)}</div></div>
                      <div className="bg-neutral-900 rounded-lg p-2"><div className="text-xs text-neutral-400 uppercase">Final Score</div><div className="text-3xl font-black text-white">{details.finalBoardScore.toFixed(1)}</div></div>
                    </div>
                  </div>
                </div>

                {/* Risk Panel */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Risk Assessment</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {details.risks.map(risk => {
                      const level = getRiskLevel(risk.level);
                      return (
                        <div key={risk.key} className="bg-neutral-50 rounded-lg p-3">
                          <div className="text-xs text-neutral-500 mb-1">{riskLabels[risk.key]}</div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${level.color}`}>{level.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Core Stats */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Statistics (2025-26)</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {Object.entries(details.stats).slice(0, 8).map(([key, value]) => (
                      <div key={key} className="bg-neutral-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-neutral-500 uppercase">{key}</div>
                        <div className="text-xl font-black text-neutral-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Writeup */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Scouting Report</h3>
                  <p className="text-neutral-700 leading-relaxed">{details.writeup}</p>
                </div>

                {/* Comps */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Player Comparisons</h3>
                  <div className="flex flex-wrap gap-3">
                    {details.comps.map((comp, i) => (
                      <div key={i} className={`px-4 py-2 rounded-xl text-white font-semibold ${
                        comp.type === 'high' ? 'bg-green-500' : comp.type === 'median' ? 'bg-blue-500' : comp.type === 'low' ? 'bg-neutral-500' : 'bg-purple-500'
                      }`}>
                        <span className="text-xs uppercase opacity-75">{comp.type}</span>
                        <div className="font-bold">{comp.player}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* FULL PROFILE MODE */}
            {viewMode === 'full' && (
              <>
                {/* Full Stats */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Full Statistics</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {Object.entries(details.stats).map(([key, value]) => (
                      <div key={key} className="bg-neutral-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-neutral-500 uppercase">{key}</div>
                        <div className="text-xl font-black text-neutral-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supporting Traits */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Supporting Traits</h3>
                  {['offensive', 'defensive', 'physical'].map(category => (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {details.supportingTraits.filter(t => t.category === category).map((trait, i) => (
                          <span key={i} className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                            trait.grade >= 8 ? 'bg-green-100 text-green-800 border-green-300' :
                            trait.grade >= 6 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}>
                            {trait.name} {trait.grade}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Development & Role */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Development Plan</h3>
                    <p className="text-neutral-700 leading-relaxed">{details.developmentPlan}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">NBA Role Outlook</h3>
                    <p className="text-neutral-700 leading-relaxed">{details.roleOutlook}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Favorites Hook for shared state
const useFavorites = () => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (prospectId) => {
    const newFavorites = favorites.includes(prospectId)
      ? favorites.filter(id => id !== prospectId)
      : [...favorites, prospectId];
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const isFavorite = (prospectId) => favorites.includes(prospectId);

  return { favorites, toggleFavorite, isFavorite };
};

// Main App
const App = () => {
  const [view, setView] = useState('home');
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('nba-draft-hq-darkmode') === 'true';
  });
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nba-draft-hq-darkmode', darkMode);
  }, [darkMode]);

  const handleNavigate = (newView) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleSelectProspect = (id) => {
    setSelectedProspect(id);
    setView('profile');
    window.scrollTo(0, 0);
  };

  const handleBackHome = () => {
    setView('home');
    setSelectedProspect(null);
    window.scrollTo(0, 0);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

// Custom Scoring System Component
const CustomScoring = ({ onBack, onSelectProspect, favorites, toggleFavorite, isFavorite }) => {
  const CUSTOM_WEIGHTS_KEY = 'nba-draft-hq-custom-weights-v2';
  const CUSTOM_TRAITS_KEY = 'nba-draft-hq-custom-traits';
  const CUSTOM_PROFILES_KEY = 'nba-draft-hq-custom-profiles';

  const defaultTraits = {
    // Core 8 Traits
    advantage_creation: { label: 'Advantage Creation', description: 'Ability to create scoring opportunities off the dribble and break down defenses', defaultWeight: 20, category: 'core' },
    decision_making: { label: 'Decision Making', description: 'Quality of choices with the ball, shot selection, and basketball IQ', defaultWeight: 16, category: 'core' },
    shooting_gravity: { label: 'Shooting Gravity', description: 'Ability to stretch the floor and draw defensive attention with shooting threat', defaultWeight: 14, category: 'core' },
    scalability: { label: 'Scalability', description: 'How well skills translate to NBA level and fit within different team contexts', defaultWeight: 14, category: 'core' },
    defensive_versatility: { label: 'Defensive Versatility', description: 'Ability to guard multiple positions and switch effectively on defense', defaultWeight: 12, category: 'core' },
    processing_speed: { label: 'Processing Speed', description: 'How quickly a player reads the game and makes decisions under pressure', defaultWeight: 10, category: 'core' },
    passing_creation: { label: 'Passing Creation', description: 'Ability to create for others through playmaking and passing vision', defaultWeight: 8, category: 'core' },
    off_ball_value: { label: 'Off-Ball Value', description: 'Contributions without the ball: cutting, screening, relocation, team defense', defaultWeight: 6, category: 'core' },
    // Additional Optional Traits
    rim_protection: { label: 'Rim Protection', description: 'Ability to block shots and deter drives at the rim', defaultWeight: 0, category: 'optional' },
    rebounding: { label: 'Rebounding', description: 'Ability to secure boards on both ends of the floor', defaultWeight: 0, category: 'optional' },
    transition_play: { label: 'Transition Play', description: 'Ability to run the floor and finish in open court', defaultWeight: 0, category: 'optional' },
    pick_roll_play: { label: 'Pick & Roll Play', description: 'Ability to execute as ball handler or roll man in P&R', defaultWeight: 0, category: 'optional' },
    isolation_scoring: { label: 'Isolation Scoring', description: 'Ability to create and convert one-on-one matchups', defaultWeight: 0, category: 'optional' },
    catch_shoot: { label: 'Catch & Shoot', description: 'Ability to knock down shots off the catch without dribbling', defaultWeight: 0, category: 'optional' },
    post_game: { label: 'Post Game', description: 'Ability to score and create from the post', defaultWeight: 0, category: 'optional' },
    motor_consistency: { label: 'Motor & Consistency', description: 'Energy level and reliability game-to-game', defaultWeight: 0, category: 'optional' }
  };

  const [activeTraits, setActiveTraits] = useState(() => {
    const saved = localStorage.getItem(CUSTOM_TRAITS_KEY);
    return saved ? JSON.parse(saved) : Object.keys(defaultTraits);
  });

  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem(CUSTOM_WEIGHTS_KEY);
    if (saved) return JSON.parse(saved);
    const initial = {};
    Object.entries(defaultTraits).forEach(([key, trait]) => {
      initial[key] = trait.defaultWeight;
    });
    return initial;
  });

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showTraitManager, setShowTraitManager] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [savedProfiles, setSavedProfiles] = useState(() => {
    const saved = localStorage.getItem(CUSTOM_PROFILES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const presets = {
    'Default': { advantage_creation: 20, decision_making: 16, shooting_gravity: 14, scalability: 14, defensive_versatility: 12, processing_speed: 10, passing_creation: 8, off_ball_value: 6 },
    'Star Hunter': { advantage_creation: 25, decision_making: 18, shooting_gravity: 16, scalability: 12, defensive_versatility: 10, processing_speed: 8, passing_creation: 6, off_ball_value: 5 },
    'Safe Pick': { advantage_creation: 15, decision_making: 20, shooting_gravity: 12, scalability: 18, defensive_versatility: 15, processing_speed: 12, passing_creation: 4, off_ball_value: 4 },
    '3&D Focus': { advantage_creation: 10, decision_making: 12, shooting_gravity: 25, scalability: 20, defensive_versatility: 20, processing_speed: 8, passing_creation: 3, off_ball_value: 2 },
    'Playmaker': { advantage_creation: 18, decision_making: 22, shooting_gravity: 10, scalability: 12, defensive_versatility: 8, processing_speed: 15, passing_creation: 12, off_ball_value: 3 }
  };

  const calculateCustomScore = (prospect) => {
    const details = prospectDetails[prospect.id] || getDefaultDetails(prospect);
    if (!details.coreTraits) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    details.coreTraits.forEach(trait => {
      if (activeTraits.includes(trait.key)) {
        const weight = weights[trait.key] || 0;
        weightedSum += trait.grade * weight;
        totalWeight += weight;
      }
    });

    const weightedScore = totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;
    const riskPenalty = details.riskPenalty || 0;
    return weightedScore - riskPenalty;
  };

  const customRankings = [...topProspects]
    .map(p => ({ ...p, customScore: calculateCustomScore(p) }))
    .sort((a, b) => b.customScore - a.customScore)
    .map((p, index) => ({ ...p, customRank: index + 1 }));

  const handleWeightChange = (trait, value) => {
    const newValue = parseInt(value) || 0;
    
    // Allow any value 0-50, but warn if over 100% total
    const newWeights = { ...weights, [trait]: newValue };
    setWeights(newWeights);
    localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(newWeights));
  };

  const getWeightSuggestions = () => {
    const suggestions = [];
    const currentTotal = totalWeight;
    const remaining = 100 - currentTotal;
    
    if (remaining > 0) {
      // Suggest equal distribution of remaining
      const perTrait = Math.floor(remaining / activeTraits.length);
      suggestions.push({
        label: `Distribute ${remaining}% equally`,
        action: () => {
          const newWeights = { ...weights };
          activeTraits.forEach(key => {
            newWeights[key] = (newWeights[key] || 0) + perTrait;
          });
          setWeights(newWeights);
          localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(newWeights));
        }
      });
      
      // Suggest putting all remaining into top weighted trait
      const topTrait = activeTraits.reduce((a, b) => (weights[a] || 0) > (weights[b] || 0) ? a : b);
      suggestions.push({
        label: `Add ${remaining}% to ${defaultTraits[topTrait].label}`,
        action: () => {
          const newWeights = { ...weights };
          newWeights[topTrait] = (newWeights[topTrait] || 0) + remaining;
          setWeights(newWeights);
          localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(newWeights));
        }
      });
    }
    
    if (currentTotal > 100) {
      const excess = currentTotal - 100;
      suggestions.push({
        label: `Reduce all by ${Math.ceil(excess / activeTraits.length)}% to reach 100%`,
        action: () => {
          const newWeights = { ...weights };
          const reduction = Math.ceil(excess / activeTraits.length);
          activeTraits.forEach(key => {
            newWeights[key] = Math.max(0, (newWeights[key] || 0) - reduction);
          });
          setWeights(newWeights);
          localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(newWeights));
        }
      });
    }
    
    return suggestions;
  };

  const handleReset = () => {
    const initial = {};
    Object.entries(defaultTraits).forEach(([key, trait]) => {
      initial[key] = trait.defaultWeight;
    });
    setWeights(initial);
    setActiveTraits(Object.keys(defaultTraits));
    localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(initial));
    localStorage.setItem(CUSTOM_TRAITS_KEY, JSON.stringify(Object.keys(defaultTraits)));
  };

  const toggleTrait = (traitKey) => {
    let newActive;
    if (activeTraits.includes(traitKey)) {
      newActive = activeTraits.filter(t => t !== traitKey);
    } else {
      newActive = [...activeTraits, traitKey];
    }
    setActiveTraits(newActive);
    localStorage.setItem(CUSTOM_TRAITS_KEY, JSON.stringify(newActive));
  };

  const applyPreset = (presetName) => {
    setWeights(presets[presetName]);
    setActiveTraits(Object.keys(defaultTraits));
    localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(presets[presetName]));
    localStorage.setItem(CUSTOM_TRAITS_KEY, JSON.stringify(Object.keys(defaultTraits)));
    setShowPresetModal(false);
  };

  const totalWeight = activeTraits.reduce((sum, key) => sum + (weights[key] || 0), 0);
  const remainingWeight = 100 - totalWeight;

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    const newProfiles = {
      ...savedProfiles,
      [profileName]: { weights, activeTraits, createdAt: new Date().toISOString() }
    };
    setSavedProfiles(newProfiles);
    localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(newProfiles));
    setProfileName('');
    setShowSaveModal(false);
  };

  const handleLoadProfile = (name) => {
    const profile = savedProfiles[name];
    if (profile) {
      setWeights(profile.weights);
      setActiveTraits(profile.activeTraits);
      localStorage.setItem(CUSTOM_WEIGHTS_KEY, JSON.stringify(profile.weights));
      localStorage.setItem(CUSTOM_TRAITS_KEY, JSON.stringify(profile.activeTraits));
    }
    setShowLoadModal(false);
  };

  const handleDeleteProfile = (name) => {
    const newProfiles = { ...savedProfiles };
    delete newProfiles[name];
    setSavedProfiles(newProfiles);
    localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(newProfiles));
  };

  const filteredRankings = showFavoritesOnly
    ? customRankings.filter(p => favorites.includes(p.id))
    : customRankings;

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={onBack} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-semibold">← Back</button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black">NBA</span>
              <span className="text-xl font-black text-red-600">DRAFT</span>
              <span className="text-xl font-black">HQ</span>
            </div>
            <button onClick={() => setShowHelp(true)} className="text-sm text-neutral-500 hover:text-neutral-700">❓ Help</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-neutral-900 mb-2">Custom Scoring System</h1>
          <p className="text-neutral-600">Create your own big board by adjusting trait weights (max 100% total)</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Weight Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-neutral-900">Trait Weights</h2>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${totalWeight === 100 ? 'bg-green-100 text-green-700' : remainingWeight > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {totalWeight}% / 100%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-neutral-100 rounded-full mb-6 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${totalWeight > 100 ? 'bg-red-500' : totalWeight === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(totalWeight, 100)}%` }}
                />
              </div>

              {remainingWeight > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-bold">{remainingWeight}%</span> remaining to allocate
                  </p>
                </div>
              )}

              {totalWeight > 100 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ Total exceeds 100%! Reduce some weights.
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {activeTraits.map(key => {
                  const trait = defaultTraits[key];
                  return (
                    <div key={key} className="p-3 rounded-lg border bg-white border-neutral-200">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-semibold text-neutral-700">{trait.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={weights[key]}
                            onChange={(e) => handleWeightChange(key, e.target.value)}
                            className="w-14 text-right text-sm font-bold border border-neutral-300 rounded px-1 py-0.5"
                          />
                          <span className="text-sm font-bold text-neutral-900">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={weights[key]}
                        onChange={(e) => handleWeightChange(key, e.target.value)}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <p className="text-xs text-neutral-500 mt-1">{trait.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Suggestions */}
              {getWeightSuggestions().length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-bold text-blue-800 mb-2">💡 Suggestions:</p>
                  <div className="space-y-1">
                    {getWeightSuggestions().map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={suggestion.action}
                        className="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        • {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowPresetModal(true)} className="flex-1 min-w-[70px] bg-neutral-100 text-neutral-700 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors text-sm">
                  Presets
                </button>
                <button onClick={() => setShowTraitManager(true)} className="flex-1 min-w-[70px] bg-neutral-100 text-neutral-700 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors text-sm">
                  Traits
                </button>
                <button onClick={() => setShowSaveModal(true)} className="flex-1 min-w-[70px] bg-blue-100 text-blue-700 py-2 rounded-lg font-semibold hover:bg-blue-200 transition-colors text-sm">
                  Save
                </button>
                <button onClick={() => setShowLoadModal(true)} className="flex-1 min-w-[70px] bg-green-100 text-green-700 py-2 rounded-lg font-semibold hover:bg-green-200 transition-colors text-sm">
                  Load
                </button>
                <button onClick={handleReset} className="flex-1 min-w-[70px] bg-neutral-100 text-neutral-700 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition-colors text-sm">
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Rankings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Your Custom Big Board</h2>
                  <p className="text-sm text-neutral-500">Rankings based on your {activeTraits.length} active traits</p>
                </div>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    showFavoritesOnly 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {showFavoritesOnly ? '⭐ Favorites Only' : '☆ Show All'}
                </button>
              </div>

              <div className="divide-y divide-neutral-200">
                {filteredRankings.map((prospect) => {
                  const schoolColor = schoolColors[prospect.school] || '#666';
                  const rankDiff = prospect.rank - prospect.customRank;
                  
                  return (
                    <div 
                      key={prospect.id}
                      className="p-4 hover:bg-neutral-50 transition-colors flex items-center gap-4 group"
                    >
                      <button
                        onClick={() => toggleFavorite(prospect.id)}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        {favorites.includes(prospect.id) ? '⭐' : '☆'}
                      </button>
                      
                      <div 
                        className="flex-1 flex items-center gap-4 cursor-pointer"
                        onClick={() => onSelectProspect(prospect.id)}
                      >
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl font-black text-neutral-700">{prospect.customRank}</span>
                      </div>
                      
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: schoolColor }}>
                        {prospect.school.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{prospect.name}</span>
                          {rankDiff > 0 && <span className="text-xs text-green-600 font-bold">↑{rankDiff}</span>}
                          {rankDiff < 0 && <span className="text-xs text-red-600 font-bold">↓{Math.abs(rankDiff)}</span>}
                          {rankDiff === 0 && <span className="text-xs text-neutral-400">−</span>}
                        </div>
                        <div className="text-sm text-neutral-500">{prospect.position} • {prospect.school}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-black text-red-600">{prospect.customScore.toFixed(1)}</div>
                        <div className="text-xs text-neutral-400">Default: #{prospect.rank}</div>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Choose a Preset</h3>
            <div className="space-y-3">
              {Object.keys(presets).map(preset => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className="w-full p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-left transition-colors"
                >
                  <div className="font-bold text-neutral-900">{preset}</div>
                  <div className="text-sm text-neutral-500">
                    {preset === 'Default' && 'Balanced evaluation across all traits'}
                    {preset === 'Star Hunter' && 'Prioritizes upside and star potential'}
                    {preset === 'Safe Pick' && 'Values NBA readiness and floor'}
                    {preset === '3&D Focus' && 'Emphasizes shooting and defense'}
                    {preset === 'Playmaker' && 'Prioritizes creation and passing'}
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowPresetModal(false)}
              className="w-full mt-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Trait Manager Modal */}
      {showTraitManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Manage Traits</h3>
            <p className="text-sm text-neutral-500 mb-4">Toggle traits on/off. Inactive traits won't count toward rankings.</p>
            
            <div className="mb-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase mb-2">Core Traits</h4>
              <div className="space-y-2">
                {Object.entries(defaultTraits).filter(([,t]) => t.category === 'core').map(([key, trait]) => (
                  <button
                    key={key}
                    onClick={() => toggleTrait(key)}
                    className={`w-full p-3 rounded-xl text-left transition-colors flex items-center gap-3 ${
                      activeTraits.includes(key) 
                        ? 'bg-green-50 border-2 border-green-200' 
                        : 'bg-neutral-50 border-2 border-neutral-200 opacity-60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${activeTraits.includes(key) ? 'bg-green-500 text-white' : 'bg-neutral-300'}`}>
                      {activeTraits.includes(key) ? '✓' : ''}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{trait.label}</div>
                      <div className="text-xs text-neutral-500">{trait.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase mb-2">Additional Traits (Optional)</h4>
              <div className="space-y-2">
                {Object.entries(defaultTraits).filter(([,t]) => t.category === 'optional').map(([key, trait]) => (
                  <button
                    key={key}
                    onClick={() => toggleTrait(key)}
                    className={`w-full p-3 rounded-xl text-left transition-colors flex items-center gap-3 ${
                      activeTraits.includes(key) 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'bg-neutral-50 border-2 border-neutral-200 opacity-60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${activeTraits.includes(key) ? 'bg-blue-500 text-white' : 'bg-neutral-300'}`}>
                      {activeTraits.includes(key) ? '✓' : ''}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{trait.label}</div>
                      <div className="text-xs text-neutral-500">{trait.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-bold">{activeTraits.length}</span> traits active ({activeTraits.filter(k => defaultTraits[k]?.category === 'core').length} core, {activeTraits.filter(k => defaultTraits[k]?.category === 'optional').length} optional)
              </p>
            </div>
            <button 
              onClick={() => setShowTraitManager(false)}
              className="w-full py-2 bg-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-300"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Save Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Save Scoring Profile</h3>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter profile name (e.g., 'My Star Hunter')"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={!profileName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => { setShowSaveModal(false); setProfileName(''); }}
                className="flex-1 bg-neutral-200 text-neutral-700 py-2 rounded-lg font-semibold hover:bg-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Profile Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Load Scoring Profile</h3>
            {Object.keys(savedProfiles).length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No saved profiles yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {Object.entries(savedProfiles).map(([name, profile]) => (
                  <div key={name} className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl">
                    <button
                      onClick={() => handleLoadProfile(name)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold text-neutral-900">{name}</div>
                      <div className="text-xs text-neutral-500">
                        {Object.keys(profile.weights).length} traits • {new Date(profile.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(name)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadModal(false)}
              className="w-full py-2 bg-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">How Custom Scoring Works</h3>
            <div className="space-y-4 text-sm text-neutral-700">
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">1. Adjust Weights</h4>
                <p>Use the sliders to set how much each trait matters to you. The total cannot exceed 100%.</p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">2. Enable/Disable Traits</h4>
                <p>Click "Edit Traits" to toggle which traits are included in your scoring system.</p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">3. Use Presets</h4>
                <p>Quick-start with preset philosophies like "Star Hunter" or "Safe Pick".</p>
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 mb-1">4. View Rankings</h4>
                <p>Your custom big board updates automatically. Arrows show how prospects moved vs default rankings.</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <h4 className="font-bold text-neutral-900 mb-2">Trait Definitions:</h4>
                {Object.entries(defaultTraits).map(([key, trait]) => (
                  <div key={key} className="mb-2">
                    <span className="font-semibold">{trait.label}:</span> {trait.description}
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-300"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ... rest of the switch statement
  switch(view) {
    case 'mock-draft':
      return <MockDraft onBack={handleBackHome} />;
    case 'team-needs':
      return <TeamNeeds onBack={handleBackHome} />;
    case 'big-board':
      return <BigBoard onBack={handleBackHome} onSelectProspect={handleSelectProspect} favorites={favorites} toggleFavorite={toggleFavorite} isFavorite={isFavorite} />;
    case 'profile':
      return <ProspectProfile prospectId={selectedProspect} onBack={handleBackHome} favorites={favorites} toggleFavorite={toggleFavorite} isFavorite={isFavorite} />;
    case 'custom-scoring':
      return <CustomScoring onBack={handleBackHome} onSelectProspect={handleSelectProspect} favorites={favorites} toggleFavorite={toggleFavorite} isFavorite={isFavorite} />;
    default:
      return <Home onNavigate={handleNavigate} onSelectProspect={handleSelectProspect} darkMode={darkMode} toggleDarkMode={toggleDarkMode} favorites={favorites} toggleFavorite={toggleFavorite} isFavorite={isFavorite} />;
  }
};

export default App
