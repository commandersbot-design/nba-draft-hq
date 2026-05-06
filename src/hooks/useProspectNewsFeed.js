import { useMemo } from 'react';
import NEWS_DATA from '../data/prospectNews.json';
import { isActive, getTickerPriority } from '../lib/prospectAliases';

// Returns a unified, time-sorted news feed for the top ticker bar.
//
// Sources merged:
//   1. src/data/prospectNews.json — hand-authored items (workouts, injuries,
//      performances, transfers, generic news). Edit that file to add updates.
//   2. PROSPECTS[*].movement — existing static field on each prospect record.
//      Non-zero deltas become synthetic `kind: "movement"` items so movement
//      keeps showing in the ticker without duplicating it in the news file.
//
// Filtering:
//   - News items older than `staleDays` (default 14) are dropped unless
//     `pinned: true`. Movement items have no timestamp, so they always
//     render — but they sit at the END of the list (after fresh news).
//
// Ordering:
//   - Newest first by timestamp. Items missing a timestamp (movements) sort
//     last with a stable internal order keyed by movement magnitude.
//
// Future migration:
//   - When you wire a real backend feed, replace the NEWS_DATA import with
//     a `useEffect` polling hook that returns items in the same shape. The
//     ticker won't need to change.
export function useProspectNewsFeed(prospects, options = {}) {
  const { staleDays = 14, max = 50 } = options;

  return useMemo(() => {
    const prospectsById = Object.fromEntries((prospects || []).map((p) => [p.id, p]));
    const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
    const items = [];

    // 1) Authored news items
    //    Active flag: skip items whose prospect is flagged active=false in
    //    prospectAliases.json (e.g., declared/withdrew). Ticker priority is
    //    used as a sort boost so high-priority prospects' items rise to the
    //    top within the freshness window.
    for (const raw of NEWS_DATA.items || []) {
      const prospect = prospectsById[raw.prospectId];
      if (!prospect) continue;
      if (!isActive(prospect)) continue;
      const ts = raw.timestamp ? new Date(raw.timestamp).getTime() : 0;
      if (!raw.pinned && ts < cutoff) continue;
      items.push({
        id: raw.id,
        kind: raw.kind || 'news',
        prospectId: raw.prospectId,
        prospect,
        headline: raw.headline || '',
        severity: raw.severity || null,
        timestamp: ts,
        timestampISO: raw.timestamp || null,
        sourceUrl: raw.sourceUrl || null,
        pinned: !!raw.pinned,
        priority: getTickerPriority(prospect),
      });
    }

    // 2) Synthetic movement items from PROSPECTS[*].movement
    for (const p of prospects || []) {
      if (!isActive(p)) continue;
      const raw = p.movement;
      if (!raw || raw === '' || raw === '0') continue;
      const delta = parseInt(raw, 10);
      if (!Number.isFinite(delta) || delta === 0) continue;
      items.push({
        id: `mv-${p.id}`,
        kind: 'movement',
        prospectId: p.id,
        prospect: p,
        headline: '',
        delta,
        // Movements have no real timestamp, sort to end with magnitude order
        timestamp: 0,
        timestampISO: null,
        sourceUrl: null,
        pinned: false,
        priority: getTickerPriority(p),
      });
    }

    // Sort: high priority items first, then newest first, with movement
    // magnitude as the final tiebreaker. Priority is a coarse bucket (high /
    // normal / low) so within a bucket we still respect timestamp.
    const priorityRank = (p) => (p === 'high' ? 0 : p === 'low' ? 2 : 1);
    items.sort((a, b) => {
      const pa = priorityRank(a.priority);
      const pb = priorityRank(b.priority);
      if (pa !== pb) return pa - pb;
      if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
      const am = Math.abs(a.delta || 0);
      const bm = Math.abs(b.delta || 0);
      if (am !== bm) return bm - am;
      return (a.prospect?.rank ?? 999) - (b.prospect?.rank ?? 999);
    });

    return items.slice(0, max);
  }, [prospects, staleDays, max]);
}

// Helper: returns a "2h ago" / "yesterday" / "May 3" relative-time string.
// Used in ticker tooltips so the timestamp is visible on hover without
// taking up bar real estate.
export function formatRelativeTime(timestamp, now = Date.now()) {
  if (!timestamp) return '';
  const diff = now - timestamp;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 2) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return 'yesterday';
  if (day < 14) return `${day} days ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
