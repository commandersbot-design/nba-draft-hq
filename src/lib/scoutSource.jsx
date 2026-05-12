import React from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

/**
 * Global scout-source context. Two modes:
 *   - "yours"   (DEFAULT)  → only the platform user's own scouting content
 *                            (Floor→Ceiling tier calls, tags, scout notes
 *                            from localStorage). Founder's pre-baked authored
 *                            content (e.g., the 14 hand-curated Floor→Ceiling
 *                            comp ladders in authoredComps.json) is HIDDEN.
 *   - "founder"            → everything shows, including the founder's
 *                            personal authored content. Useful when the
 *                            founder is using the platform themselves and
 *                            wants to see their authored layer alongside.
 *
 * The Deep Dives section ALWAYS shows everything regardless of toggle —
 * that's the founder's designated space and stays as-is.
 *
 * Choice of default: the platform isn't supposed to be organized around the
 * founder's opinion. Default "yours" so the main app surfaces the user's
 * own work first.
 */

const ScoutSourceContext = React.createContext({
  source: "yours",
  setSource: () => {},
});

const STORAGE_KEY = "prospera.terminal.scout-source";

export function ScoutSourceProvider({ children }) {
  const [source, setSource] = useLocalStorageState(STORAGE_KEY, "yours");
  const value = React.useMemo(() => ({ source, setSource }), [source, setSource]);
  return (
    <ScoutSourceContext.Provider value={value}>
      {children}
    </ScoutSourceContext.Provider>
  );
}

export function useScoutSource() {
  return React.useContext(ScoutSourceContext);
}

/**
 * Convenience boolean: should founder's pre-baked authored content render?
 * False in "yours" mode (default), true in "founder" mode.
 *
 * Components inside the Deep Dives section should NOT use this — they always
 * render founder content. This is for the main site surfaces only.
 */
export function useShowFounderContent() {
  return useScoutSource().source === "founder";
}
