import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ExternalLink,
  FileText,
  Download,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Menu,
  Star,
  GitCompare,
} from "lucide-react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import HISTORICAL_PROSPECTS from "../data/historicalProspects.json";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ---------- THEME TOKENS ----------
const T = {
  bg: "#050A12",
  surface: "#0A0F1C",
  surface2: "#0F172A",
  card: "rgba(17, 24, 39, 0.72)",
  border: "#1F2937",
  borderSoft: "rgba(31, 41, 55, 0.6)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  cyan: "#22D3EE",
  blue: "#3B82F6",
  warn: "#F59E0B",
  danger: "#EF4444",
  purple: "#A855F7",
  grid: "rgba(59, 130, 246, 0.08)",
};

const mono = {
  fontFamily:
    'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// ---------- MOCK PROSPECT DATA ----------
const PROSPECTS = [{"id":"p1","rank":1,"name":"AJ Dybantsa","first":"AJ","last":"DYBANTSA","initials":"AD","school":"BYU","team":"BYU","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"210 lb","wingspan":"7'0\"","age":19,"cls":"Fr.","movement":"","country":"USA","statsSource":"NCAA","score":81.9,"weightedTraitScore":84.44,"riskPenalty":2.5,"tier":"Tier 3 - Starter","percentile":100,"traits":{"Scoring":75,"Playmaking":67,"Defense":75,"Feel":70,"Athleticism":67},"traits9":{"Advantage Creation":8,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":7,"Off-Ball Value":7,"Processing Speed":7,"Scalability":8,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":0,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"}]},{"id":"p2","rank":2,"name":"Darryn Peterson","first":"DARRYN","last":"PETERSON","initials":"DP","school":"Kansas","team":"Kansas","pos":"SG","pos2":"PG","archetype":"Lead Creator","height":"6'5\"","weight":"200 lb","wingspan":"6'10\"","age":18,"cls":"Fr.","movement":"+1","country":"USA","statsSource":"NCAA","score":77.7,"weightedTraitScore":80.22,"riskPenalty":2.5,"tier":"Tier 3 - Starter","percentile":98,"traits":{"Scoring":80,"Playmaking":67,"Defense":70,"Feel":67,"Athleticism":67},"traits9":{"Advantage Creation":8,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":8,"Off-Ball Value":6,"Processing Speed":7,"Scalability":8,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":0,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"}]},{"id":"p3","rank":3,"name":"Cameron Boozer","first":"CAMERON","last":"BOOZER","initials":"CB","school":"Duke","team":"Duke","pos":"PF","pos2":"C","archetype":"Lead Creator","height":"6'9\"","weight":"240 lb","wingspan":"7'0\"","age":18,"cls":"Fr.","movement":"+2","country":"USA","statsSource":"NCAA","score":65.3,"weightedTraitScore":71.56,"riskPenalty":6.25,"tier":"Tier 5 - Developmental","percentile":60,"traits":{"Scoring":75,"Playmaking":77,"Defense":75,"Feel":77,"Athleticism":67},"traits9":{"Advantage Creation":8,"Decision Making":8,"Passing Creation":7,"Shooting Gravity":7,"Off-Ball Value":7,"Processing Speed":8,"Scalability":8,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":0,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"}]},{"id":"p4","rank":4,"name":"Caleb Wilson","first":"CALEB","last":"WILSON","initials":"CW","school":"North Carolina","team":"North Carolina","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"215 lb","wingspan":"6'11\"","age":20,"cls":"Fr.","movement":"","country":"USA","statsSource":"NCAA","score":56.6,"weightedTraitScore":65.33,"riskPenalty":8.75,"tier":"Tier 5 - Developmental","percentile":30,"traits":{"Scoring":65,"Playmaking":57,"Defense":65,"Feel":63,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":7,"Processing Speed":6,"Scalability":7,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p5","rank":5,"name":"Kingston Flemings","first":"KINGSTON","last":"FLEMINGS","initials":"KF","school":"Houston","team":"Houston","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"190 lb","wingspan":"6'6\"","age":20,"cls":"Fr.","movement":"+8","country":"USA","statsSource":"NCAA","score":69.1,"weightedTraitScore":72.89,"riskPenalty":3.75,"tier":"Tier 4 - Rotation","percentile":85,"traits":{"Scoring":65,"Playmaking":67,"Defense":60,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p16","rank":6,"name":"Darius Acuff","first":"DARIUS","last":"ACUFF","initials":"DA","school":"Arkansas","team":"Arkansas","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'1\"","weight":"175 lb","wingspan":"6'4\"","age":20,"cls":"Fr.","movement":"","country":"USA","statsSource":"NCAA","score":65.1,"weightedTraitScore":68.89,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":57,"traits":{"Scoring":70,"Playmaking":70,"Defense":60,"Feel":67,"Athleticism":63},"traits9":{"Advantage Creation":8,"Decision Making":7,"Passing Creation":7,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p10","rank":7,"name":"Mikel Brown","first":"MIKEL","last":"BROWN","initials":"MB","school":"Louisville","team":"Louisville","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"185 lb","wingspan":"6'6\"","age":19,"cls":"Fr.","movement":"+2","country":"USA","statsSource":"NCAA","score":64.6,"weightedTraitScore":69.56,"riskPenalty":5.0,"tier":"Tier 5 - Developmental","percentile":55,"traits":{"Scoring":65,"Playmaking":73,"Defense":70,"Feel":70,"Athleticism":67},"traits9":{"Advantage Creation":8,"Decision Making":7,"Passing Creation":7,"Shooting Gravity":5,"Off-Ball Value":6,"Processing Speed":8,"Scalability":8,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p11","rank":8,"name":"Keaton Wagler","first":"KEATON","last":"WAGLER","initials":"KW","school":"Illinois","team":"Illinois","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'6\"","weight":"200 lb","wingspan":"6'8\"","age":20,"cls":"Fr.","movement":"+3","country":"USA","statsSource":"NCAA","score":68.6,"weightedTraitScore":74.89,"riskPenalty":6.25,"tier":"Tier 4 - Rotation","percentile":80,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p33","rank":9,"name":"Brayden Burries","first":"BRAYDEN","last":"BURRIES","initials":"BB","school":"Arizona","team":"Arizona","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"195 lb","wingspan":"6'7\"","age":20,"cls":"Fr.","movement":"+10","country":"USA","statsSource":"NCAA","score":59.8,"weightedTraitScore":63.56,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":38,"traits":{"Scoring":70,"Playmaking":57,"Defense":60,"Feel":60,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p8","rank":10,"name":"Yaxel Lendeborg","first":"YAXEL","last":"LENDEBORG","initials":"YL","school":"Michigan","team":"Michigan","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'8\"","weight":"230 lb","wingspan":"7'1\"","age":24,"cls":"Sr.","movement":"+4","country":"USA","statsSource":"NCAA","score":64.2,"weightedTraitScore":68.0,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":50,"traits":{"Scoring":65,"Playmaking":57,"Defense":60,"Feel":63,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":7,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p13","rank":11,"name":"Labaron Philon","first":"LABARON","last":"PHILON","initials":"LP","school":"Alabama","team":"Alabama","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'3\"","weight":"180 lb","wingspan":"6'5\"","age":21,"cls":"So.","movement":"+1","country":"USA","statsSource":"NCAA","score":68.0,"weightedTraitScore":71.78,"riskPenalty":3.75,"tier":"Tier 4 - Rotation","percentile":70,"traits":{"Scoring":65,"Playmaking":60,"Defense":60,"Feel":57,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":5,"Processing Speed":6,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p23","rank":12,"name":"Chris Cenac","first":"CHRIS","last":"CENAC","initials":"CC","school":"Houston","team":"Houston","pos":"C","pos2":"PF","archetype":"Two-Way Wing","height":"6'9\"","weight":"240 lb","wingspan":"7'4\"","age":19,"cls":"Fr.","movement":"+15","country":"USA","statsSource":"NCAA","score":62.0,"weightedTraitScore":68.22,"riskPenalty":6.25,"tier":"Tier 5 - Developmental","percentile":48,"traits":{"Scoring":50,"Playmaking":47,"Defense":70,"Feel":50,"Athleticism":57},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":7,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p22","rank":13,"name":"Amari Allen","first":"AMARI","last":"ALLEN","initials":"AA","school":"Alabama","team":"Alabama","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"210 lb","wingspan":"6'10\"","age":21,"cls":"Fr.","movement":"-6","country":"USA","statsSource":"NCAA","score":66.2,"weightedTraitScore":70.0,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":65,"traits":{"Scoring":55,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":1,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p18","rank":14,"name":"Nate Ament","first":"NATE","last":"AMENT","initials":"NA","school":"Tennessee","team":"Tennessee","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"215 lb","wingspan":"7'0\"","age":20,"cls":"Fr.","movement":"+2","country":"USA","statsSource":"NCAA","score":52.3,"weightedTraitScore":59.78,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":3,"traits":{"Scoring":65,"Playmaking":57,"Defense":65,"Feel":60,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":7,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p36","rank":15,"name":"Isaiah Evans","first":"ISAIAH","last":"EVANS","initials":"IE","school":"Duke","team":"Duke","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'6\"","weight":"200 lb","wingspan":"6'8\"","age":21,"cls":"So.","movement":"+5","country":"USA","statsSource":"NCAA","score":68.2,"weightedTraitScore":72.0,"riskPenalty":3.75,"tier":"Tier 4 - Rotation","percentile":75,"traits":{"Scoring":60,"Playmaking":47,"Defense":55,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":6,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p15","rank":16,"name":"Cameron Carr","first":"CAMERON","last":"CARR","initials":"CC","school":"Baylor","team":"Baylor","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'6\"","weight":"205 lb","wingspan":"6'8\"","age":22,"cls":"Jr.","movement":"+1","country":"USA","statsSource":"NCAA","score":54.5,"weightedTraitScore":62.0,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":18,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p9","rank":17,"name":"Hannes Steinbach","first":"HANNES","last":"STEINBACH","initials":"HS","school":"Washington","team":"Washington","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"245 lb","wingspan":"7'3\"","age":21,"cls":"Fr.","movement":"+1","country":"Germany","statsSource":"NONE","score":56.5,"weightedTraitScore":64.0,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":28,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p37","rank":18,"name":"Meleek Thomas","first":"MELEEK","last":"THOMAS","initials":"MT","school":"Arkansas","team":"Arkansas","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'5\"","weight":"200 lb","wingspan":"6'7\"","age":19,"cls":"Fr.","movement":"-10","country":"USA","statsSource":"NCAA","score":64.5,"weightedTraitScore":68.22,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":53,"traits":{"Scoring":70,"Playmaking":57,"Defense":65,"Feel":63,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":7,"Processing Speed":6,"Scalability":7,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p21","rank":20,"name":"Benett Stirtz","first":"BENETT","last":"STIRTZ","initials":"BS","school":"Iowa","team":"Iowa","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"190 lb","wingspan":"6'6\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":74.4,"weightedTraitScore":76.89,"riskPenalty":2.5,"tier":"Tier 4 - Rotation","percentile":95,"traits":{"Scoring":65,"Playmaking":67,"Defense":60,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p26","rank":20,"name":"Karim Lopez","first":"KARIM","last":"LOPEZ","initials":"KL","school":"NZ Breakers","team":"NZ Breakers","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"220 lb","wingspan":"6'11\"","age":20,"cls":"2007","movement":"+6","country":"Spain","statsSource":"NONE","score":69.1,"weightedTraitScore":72.89,"riskPenalty":3.75,"tier":"Tier 4 - Rotation","percentile":83,"traits":{"Scoring":65,"Playmaking":57,"Defense":65,"Feel":60,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":7,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p12","rank":22,"name":"Thomas Haugh","first":"THOMAS","last":"HAUGH","initials":"TH","school":"Florida","team":"Florida","pos":"PF","pos2":"C","archetype":"Lead Creator","height":"6'9\"","weight":"235 lb","wingspan":"7'0\"","age":24,"cls":"Jr.","movement":"-1","country":"USA","statsSource":"NCAA","score":70.1,"weightedTraitScore":75.11,"riskPenalty":5.0,"tier":"Tier 4 - Rotation","percentile":88,"traits":{"Scoring":55,"Playmaking":47,"Defense":60,"Feel":53,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":6,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":1,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p29","rank":24,"name":"Dash Daniels","first":"DASH","last":"DANIELS","initials":"DD","school":"Melbourne United","team":"Melbourne United","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'6\"","weight":"200 lb","wingspan":"6'8\"","age":19,"cls":"2007","movement":"","country":"Australia","statsSource":"NONE","score":61.7,"weightedTraitScore":66.67,"riskPenalty":5.0,"tier":"Tier 5 - Developmental","percentile":40,"traits":{"Scoring":55,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":1,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p6","rank":25,"name":"Jayden Quaintance","first":"JAYDEN","last":"QUAINTANCE","initials":"JQ","school":"Kentucky","team":"Kentucky","pos":"C","pos2":"PF","archetype":"Two-Way Wing","height":"6'10\"","weight":"240 lb","wingspan":"7'4\"","age":20,"cls":"So.","movement":"-15","country":"USA","statsSource":"NCAA","score":72.6,"weightedTraitScore":77.56,"riskPenalty":5.0,"tier":"Tier 4 - Rotation","percentile":93,"traits":{"Scoring":55,"Playmaking":50,"Defense":70,"Feel":53,"Athleticism":57},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":7,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p17","rank":26,"name":"Braylon Mullins","first":"BRAYLON","last":"MULLINS","initials":"BM","school":"Connecticut","team":"Connecticut","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'5\"","weight":"195 lb","wingspan":"6'7\"","age":21,"cls":"Fr.","movement":"+2","country":"USA","statsSource":"NCAA","score":68.2,"weightedTraitScore":72.0,"riskPenalty":3.75,"tier":"Tier 4 - Rotation","percentile":78,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":63,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":7,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p7","rank":27,"name":"Koa Peat","first":"KOA","last":"PEAT","initials":"KP","school":"Arizona","team":"Arizona","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"220 lb","wingspan":"6'11\"","age":20,"cls":"Fr.","movement":"+7","country":"USA","statsSource":"NCAA","score":58.1,"weightedTraitScore":65.56,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":33,"traits":{"Scoring":65,"Playmaking":57,"Defense":70,"Feel":63,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":7,"Processing Speed":6,"Scalability":7,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p52","rank":28,"name":"Morez Johnson","first":"MOREZ","last":"JOHNSON","initials":"MJ","school":"Michigan","team":"Michigan","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"235 lb","wingspan":"7'2\"","age":21,"cls":"So.","movement":"+11","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p30","rank":29,"name":"Killyan Toure","first":"KILLYAN","last":"TOURE","initials":"KT","school":"Iowa State","team":"Iowa State","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'3\"","weight":"185 lb","wingspan":"6'5\"","age":21,"cls":"Fr.","movement":"+67","country":"USA","statsSource":"NCAA","score":53.8,"weightedTraitScore":61.33,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":13,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p44","rank":30,"name":"Alex Condon","first":"ALEX","last":"CONDON","initials":"AC","school":"Florida","team":"Florida","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'11\"","weight":"245 lb","wingspan":"7'4\"","age":22,"cls":"So.","movement":"+12","country":"Australia","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p31","rank":31,"name":"Dailyn Swain","first":"DAILYN","last":"SWAIN","initials":"DS","school":"Texas","team":"Texas","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"210 lb","wingspan":"6'10\"","age":21,"cls":"Jr.","movement":"+38","country":"USA","statsSource":"NCAA","score":53.8,"weightedTraitScore":61.33,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":10,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p28","rank":34,"name":"Henri Veesaar","first":"HENRI","last":"VEESAAR","initials":"HV","school":"North Carolina","team":"North Carolina","pos":"C","pos2":"PF","archetype":"Defensive Anchor","height":"7'0\"","weight":"240 lb","wingspan":"7'4\"","age":23,"cls":"Jr.","movement":"-2","country":"Estonia","statsSource":"NONE","score":55.2,"weightedTraitScore":62.67,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":20,"traits":{"Scoring":55,"Playmaking":53,"Defense":65,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p35","rank":34,"name":"Richie Saunders","first":"RICHIE","last":"SAUNDERS","initials":"RS","school":"BYU","team":"BYU","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'5\"","weight":"205 lb","wingspan":"6'8\"","age":25,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":70.3,"weightedTraitScore":75.33,"riskPenalty":5.0,"tier":"Tier 4 - Rotation","percentile":90,"traits":{"Scoring":65,"Playmaking":57,"Defense":50,"Feel":63,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":7,"Processing Speed":6,"Scalability":6,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p20","rank":35,"name":"Christian Anderson","first":"CHRISTIAN","last":"ANDERSON","initials":"CA","school":"Texas Tech","team":"Texas Tech","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'2\"","weight":"180 lb","wingspan":"6'5\"","age":21,"cls":"So.","movement":"+3","country":"USA","statsSource":"NCAA","score":66.0,"weightedTraitScore":69.78,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":63,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p19","rank":36,"name":"Joshua Jefferson","first":"JOSHUA","last":"JEFFERSON","initials":"JJ","school":"Iowa State","team":"Iowa State","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"220 lb","wingspan":"6'11\"","age":23,"cls":"Sr.","movement":"+8","country":"USA","statsSource":"NCAA","score":58.6,"weightedTraitScore":63.56,"riskPenalty":5.0,"tier":"Tier 5 - Developmental","percentile":35,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p94","rank":37,"name":"Trevon Brazile","first":"TREVON","last":"BRAZILE","initials":"TB","school":"Arkansas","team":"Arkansas","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"230 lb","wingspan":"7'2\"","age":24,"cls":"Sr.","movement":"-15","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p25","rank":38,"name":"Tounde Yessoufou","first":"TOUNDE","last":"YESSOUFOU","initials":"TY","school":"Baylor","team":"Baylor","pos":"SF","pos2":"PF","archetype":"Two-Way Wing","height":"6'4\"","weight":"215 lb","wingspan":"6'10\"","age":18,"cls":"Fr.","movement":"+21","country":"USA","statsSource":"NCAA","score":66.7,"weightedTraitScore":70.44,"riskPenalty":3.75,"tier":"Tier 5 - Developmental","percentile":68,"traits":{"Scoring":55,"Playmaking":47,"Defense":65,"Feel":53,"Athleticism":57},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":6,"Processing Speed":5,"Scalability":7,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":1,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p40","rank":39,"name":"JoJo Tugler","first":"JOJO","last":"TUGLER","initials":"JT","school":"Houston","team":"Houston","pos":"C","pos2":"PF","archetype":"Defensive Anchor","height":"6'8\"","weight":"230 lb","wingspan":"7'1\"","age":21,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":56.4,"weightedTraitScore":62.67,"riskPenalty":6.25,"tier":"Tier 5 - Developmental","percentile":23,"traits":{"Scoring":50,"Playmaking":47,"Defense":65,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p46","rank":39,"name":"Milan Momcilovic","first":"MILAN","last":"MOMCILOVIC","initials":"MM","school":"Iowa State","team":"Iowa State","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'8\"","weight":"220 lb","wingspan":"6'11\"","age":22,"cls":"Jr.","movement":"-2","country":"Serbia","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":53,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p41","rank":40,"name":"Sergio De Larrea","first":"SERGIO","last":"DE LARREA","initials":"SD","school":"Valencia","team":"Valencia","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'5\"","weight":"190 lb","wingspan":"6'6\"","age":21,"cls":"\u2014","movement":"","country":"Spain","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p79","rank":40,"name":"Keyshawn Hall","first":"KEYSHAWN","last":"HALL","initials":"KH","school":"Auburn","team":"Auburn","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'7\"","weight":"230 lb","wingspan":"7'0\"","age":24,"cls":"Sr.","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p71","rank":42,"name":"Baba Miller","first":"BABA","last":"MILLER","initials":"BM","school":"Cincinnati","team":"Cincinnati","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'11\"","weight":"220 lb","wingspan":"7'2\"","age":23,"cls":"Sr.","movement":"+10","country":"Sweden","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p55","rank":43,"name":"Jaden Bradley","first":"JADEN","last":"BRADLEY","initials":"JB","school":"Arizona","team":"Arizona","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'3\"","weight":"190 lb","wingspan":"6'5\"","age":23,"cls":"Sr.","movement":"+40","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":60,"Defense":60,"Feel":60,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p45","rank":44,"name":"Tamin Lipsey","first":"TAMIN","last":"LIPSEY","initials":"TL","school":"Iowa State","team":"Iowa State","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'1\"","weight":"180 lb","wingspan":"6'4\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":60,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p59","rank":44,"name":"Adam Atamna","first":"ADAM","last":"ATAMNA","initials":"AA","school":"ASVEL","team":"ASVEL","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'5\"","weight":"190 lb","wingspan":"6'6\"","age":19,"cls":"2007","movement":"+11","country":"France","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p47","rank":45,"name":"Milos Uzan","first":"MILOS","last":"UZAN","initials":"MU","school":"Houston","team":"Houston","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'3\"","weight":"185 lb","wingspan":"6'5\"","age":24,"cls":"Sr.","movement":"+4","country":"France","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p48","rank":47,"name":"Johann Grunloh","first":"JOHANN","last":"GRUNLOH","initials":"JG","school":"Virginia","team":"Virginia","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'11\"","weight":"250 lb","wingspan":"7'5\"","age":21,"cls":"\u2014","movement":"","country":"Germany","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p14","rank":48,"name":"Patrick Ngongba","first":"PATRICK","last":"NGONGBA","initials":"PN","school":"Duke","team":"Duke","pos":"C","pos2":"PF","archetype":"Two-Way Wing","height":"6'11\"","weight":"250 lb","wingspan":"7'6\"","age":21,"cls":"So.","movement":"+6","country":"USA","statsSource":"NCAA","score":52.4,"weightedTraitScore":61.11,"riskPenalty":8.75,"tier":"Tier 5 - Developmental","percentile":8,"traits":{"Scoring":50,"Playmaking":47,"Defense":70,"Feel":50,"Athleticism":57},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":7,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p34","rank":49,"name":"Alex Karaban","first":"ALEX","last":"KARABAN","initials":"AK","school":"Connecticut","team":"Connecticut","pos":"SF","pos2":"PF","archetype":"Shot Maker","height":"6'6\"","weight":"220 lb","wingspan":"6'9\"","age":24,"cls":"Sr.","movement":"+52","country":"USA","statsSource":"NCAA","score":61.9,"weightedTraitScore":66.89,"riskPenalty":5.0,"tier":"Tier 5 - Developmental","percentile":45,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":63,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":7,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p51","rank":50,"name":"Braden Huff","first":"BRADEN","last":"HUFF","initials":"BH","school":"Gonzaga","team":"Gonzaga","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'10\"","weight":"240 lb","wingspan":"7'3\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p49","rank":52,"name":"Nate Bittle","first":"NATE","last":"BITTLE","initials":"NB","school":"Oregon","team":"Oregon","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'11\"","weight":"245 lb","wingspan":"7'4\"","age":24,"cls":"Sr.","movement":"+1","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p53","rank":52,"name":"Bruce Thornton","first":"BRUCE","last":"THORNTON","initials":"BT","school":"Ohio State","team":"Ohio State","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'2\"","weight":"185 lb","wingspan":"6'4\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p90","rank":53,"name":"Lamar Wilkerson","first":"LAMAR","last":"WILKERSON","initials":"LW","school":"Indiana","team":"Indiana","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"200 lb","wingspan":"6'7\"","age":25,"cls":"Sr.","movement":"+48","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":70,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p43","rank":55,"name":"Tarris Reed","first":"TARRIS","last":"REED","initials":"TR","school":"Connecticut","team":"Connecticut","pos":"C","pos2":"PF","archetype":"Defensive Anchor","height":"6'11\"","weight":"250 lb","wingspan":"7'5\"","age":23,"cls":"Sr.","movement":"-9","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":53,"Defense":65,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p57","rank":56,"name":"Silas DeMary","first":"SILAS","last":"DEMARY","initials":"SD","school":"Connecticut","team":"Connecticut","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"195 lb","wingspan":"6'6\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p50","rank":57,"name":"Flory Bidunga","first":"FLORY","last":"BIDUNGA","initials":"FB","school":"Kansas","team":"Kansas","pos":"C","pos2":"PF","archetype":"Defensive Anchor","height":"6'7\"","weight":"230 lb","wingspan":"7'1\"","age":22,"cls":"So.","movement":"-10","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":65,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":7,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p58","rank":57,"name":"MoMo Faye","first":"MOMO","last":"FAYE","initials":"MF","school":"Paris Basketball","team":"Paris Basketball","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"240 lb","wingspan":"7'3\"","age":22,"cls":"\u2014","movement":"","country":"France","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p39","rank":58,"name":"Ryan Conwell","first":"RYAN","last":"CONWELL","initials":"RC","school":"Louisville","team":"Louisville","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"195 lb","wingspan":"6'6\"","age":23,"cls":"Sr.","movement":"+12","country":"USA","statsSource":"NCAA","score":68.2,"weightedTraitScore":72.0,"riskPenalty":3.75,"tier":"Tier 4 - Rotation","percentile":73,"traits":{"Scoring":70,"Playmaking":57,"Defense":50,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p56","rank":59,"name":"Zuby Ejiofor","first":"ZUBY","last":"EJIOFOR","initials":"ZE","school":"St. John's","team":"St. John's","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"235 lb","wingspan":"7'2\"","age":23,"cls":"Sr.","movement":"+5","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p61","rank":60,"name":"Kwame Evans","first":"KWAME","last":"EVANS","initials":"KE","school":"Oregon","team":"Oregon","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"215 lb","wingspan":"7'0\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p62","rank":61,"name":"Paul McNeil","first":"PAUL","last":"MCNEIL","initials":"PM","school":"NC State","team":"NC State","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'5\"","weight":"200 lb","wingspan":"6'8\"","age":21,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p63","rank":62,"name":"Pryce Sandfort","first":"PRYCE","last":"SANDFORT","initials":"PS","school":"Nebraska","team":"Nebraska","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'6\"","weight":"205 lb","wingspan":"6'9\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p64","rank":63,"name":"Nolan Winter","first":"NOLAN","last":"WINTER","initials":"NW","school":"Wisconsin","team":"Wisconsin","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"7'0\"","weight":"245 lb","wingspan":"7'4\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p54","rank":64,"name":"Juke Harris","first":"JUKE","last":"HARRIS","initials":"JH","school":"Wake Forest","team":"Wake Forest","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'7\"","weight":"210 lb","wingspan":"6'10\"","age":21,"cls":"So.","movement":"-7","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p66","rank":65,"name":"D'Shayne Montgomery","first":"D'SHAYNE","last":"MONTGOMERY","initials":"DM","school":"Dayton","team":"Dayton","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"200 lb","wingspan":"6'7\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p67","rank":66,"name":"Blue Cain","first":"BLUE","last":"CAIN","initials":"BC","school":"Georgia","team":"Georgia","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'5\"","weight":"195 lb","wingspan":"6'6\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p69","rank":68,"name":"Tahaad Pettiford","first":"TAHAAD","last":"PETTIFORD","initials":"TP","school":"Auburn","team":"Auburn","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'0\"","weight":"170 lb","wingspan":"6'2\"","age":21,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":70,"Playmaking":70,"Defense":55,"Feel":67,"Athleticism":63},"traits9":{"Advantage Creation":8,"Decision Making":7,"Passing Creation":7,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p32","rank":69,"name":"Aday Mara","first":"ADAY","last":"MARA","initials":"AM","school":"Michigan","team":"Michigan","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"7'3\"","weight":"260 lb","wingspan":"7'8\"","age":22,"cls":"Jr.","movement":"-13","country":"Spain","statsSource":"NONE","score":56.4,"weightedTraitScore":62.67,"riskPenalty":6.25,"tier":"Tier 5 - Developmental","percentile":25,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p70","rank":69,"name":"K.J. Lewis","first":"K.J.","last":"LEWIS","initials":"KL","school":"Georgetown","team":"Georgetown","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"195 lb","wingspan":"6'6\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p72","rank":71,"name":"Ja'Kobi Gillespie","first":"JA'KOBI","last":"GILLESPIE","initials":"JG","school":"Tennessee","team":"Tennessee","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'1\"","weight":"180 lb","wingspan":"6'4\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":70,"Playmaking":57,"Defense":50,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p73","rank":72,"name":"Motiejus Krivas","first":"MOTIEJUS","last":"KRIVAS","initials":"MK","school":"Arizona","team":"Arizona","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"7'2\"","weight":"270 lb","wingspan":"7'8\"","age":22,"cls":"\u2014","movement":"","country":"Lithuania","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p74","rank":73,"name":"Tyler Bilodeau","first":"TYLER","last":"BILODEAU","initials":"TB","school":"UCLA","team":"UCLA","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'9\"","weight":"230 lb","wingspan":"7'1\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p75","rank":74,"name":"Darrion Williams","first":"DARRION","last":"WILLIAMS","initials":"DW","school":"NC State","team":"NC State","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'4\"","weight":"215 lb","wingspan":"6'8\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p76","rank":75,"name":"Nick Martinelli","first":"NICK","last":"MARTINELLI","initials":"NM","school":"Northwestern","team":"Northwestern","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'6\"","weight":"205 lb","wingspan":"6'9\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p65","rank":76,"name":"JT Toppin","first":"JT","last":"TOPPIN","initials":"JT","school":"Texas Tech","team":"Texas Tech","pos":"PF","pos2":"C","archetype":"Lead Creator","height":"6'7\"","weight":"225 lb","wingspan":"7'0\"","age":22,"cls":"Jr.","movement":"-41","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p77","rank":76,"name":"Cade Tyson","first":"CADE","last":"TYSON","initials":"CT","school":"Minnesota","team":"Minnesota","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'7\"","weight":"210 lb","wingspan":"6'10\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p24","rank":77,"name":"Neoklis Avdalas","first":"NEOKLIS","last":"AVDALAS","initials":"NA","school":"Virginia Tech","team":"Virginia Tech","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'7\"","weight":"205 lb","wingspan":"6'9\"","age":21,"cls":"Fr.","movement":"-4","country":"Greece","statsSource":"NONE","score":54.5,"weightedTraitScore":62.0,"riskPenalty":7.5,"tier":"Tier 5 - Developmental","percentile":15,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p78","rank":77,"name":"William Kyle","first":"WILLIAM","last":"KYLE","initials":"WK","school":"Syracuse","team":"Syracuse","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"240 lb","wingspan":"7'3\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p80","rank":79,"name":"Emanuel Sharp","first":"EMANUEL","last":"SHARP","initials":"ES","school":"Houston","team":"Houston","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'3\"","weight":"190 lb","wingspan":"6'5\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p81","rank":80,"name":"Nick Boyd","first":"NICK","last":"BOYD","initials":"NB","school":"Wisconsin","team":"Wisconsin","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'3\"","weight":"185 lb","wingspan":"6'5\"","age":26,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p38","rank":81,"name":"Braden Smith","first":"BRADEN","last":"SMITH","initials":"BS","school":"Purdue","team":"Purdue","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'0\"","weight":"175 lb","wingspan":"6'2\"","age":23,"cls":"So.","movement":"-20","country":"USA","statsSource":"NCAA","score":61.9,"weightedTraitScore":66.89,"riskPenalty":5.0,"tier":"Tier 5 - Developmental","percentile":43,"traits":{"Scoring":75,"Playmaking":70,"Defense":55,"Feel":67,"Athleticism":63},"traits9":{"Advantage Creation":8,"Decision Making":7,"Passing Creation":7,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p82","rank":81,"name":"Donovan Dent","first":"DONOVAN","last":"DENT","initials":"DD","school":"UCLA","team":"UCLA","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'2\"","weight":"180 lb","wingspan":"6'4\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p83","rank":82,"name":"Maliq Brown","first":"MALIQ","last":"BROWN","initials":"MB","school":"Duke","team":"Duke","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"235 lb","wingspan":"7'2\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p84","rank":83,"name":"Trey Kaufman-Renn","first":"TREY","last":"KAUFMAN-RENN","initials":"TK","school":"Purdue","team":"Purdue","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'9\"","weight":"245 lb","wingspan":"7'4\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p85","rank":84,"name":"Tucker DeVries","first":"TUCKER","last":"DEVRIES","initials":"TD","school":"Indiana","team":"Indiana","pos":"SF","pos2":"SG","archetype":"Shot Maker","height":"6'7\"","weight":"215 lb","wingspan":"6'10\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":7,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p86","rank":85,"name":"Joshua Dix","first":"JOSHUA","last":"DIX","initials":"JD","school":"Creighton","team":"Creighton","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'6\"","weight":"200 lb","wingspan":"6'8\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p87","rank":86,"name":"John Blackwell","first":"JOHN","last":"BLACKWELL","initials":"JB","school":"Wisconsin","team":"Wisconsin","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"195 lb","wingspan":"6'6\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p68","rank":87,"name":"Andrej Stojakovic","first":"ANDREJ","last":"STOJAKOVIC","initials":"AS","school":"Illinois","team":"Illinois","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'7\"","weight":"210 lb","wingspan":"6'10\"","age":22,"cls":"Jr.","movement":"+14","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p88","rank":87,"name":"Otega Oweh","first":"OTEGA","last":"OWEH","initials":"OO","school":"Kentucky","team":"Kentucky","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"210 lb","wingspan":"6'9\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":60,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p89","rank":88,"name":"Elijah Mahi","first":"ELIJAH","last":"MAHI","initials":"EM","school":"Santa Clara","team":"Santa Clara","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'7\"","weight":"220 lb","wingspan":"6'11\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p60","rank":90,"name":"Tomislav Ivisic","first":"TOMISLAV","last":"IVISIC","initials":"TI","school":"Illinois","team":"Illinois","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"7'1\"","weight":"260 lb","wingspan":"7'6\"","age":23,"cls":"Jr.","movement":"-6","country":"Croatia","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p91","rank":90,"name":"Kylan Boswell","first":"KYLAN","last":"BOSWELL","initials":"KB","school":"Illinois","team":"Illinois","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'2\"","weight":"180 lb","wingspan":"6'4\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p92","rank":91,"name":"Dillon Mitchell","first":"DILLON","last":"MITCHELL","initials":"DM","school":"St. John's","team":"St. John's","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'8\"","weight":"215 lb","wingspan":"6'11\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p93","rank":92,"name":"Ben Henshall","first":"BEN","last":"HENSHALL","initials":"BH","school":"Perth Wildcats","team":"Perth Wildcats","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'5\"","weight":"195 lb","wingspan":"6'6\"","age":23,"cls":"\u2014","movement":"","country":"Australia","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":57,"Defense":55,"Feel":60,"Athleticism":57},"traits9":{"Advantage Creation":7,"Decision Making":6,"Passing Creation":5,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":6,"Scalability":6,"Defensive Versatility":5,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p95","rank":94,"name":"Michael Ruzic","first":"MICHAEL","last":"RUZIC","initials":"MR","school":"Joventut","team":"Joventut","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'11\"","weight":"250 lb","wingspan":"7'5\"","age":20,"cls":"\u2014","movement":"","country":"Croatia","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":47,"Defense":60,"Feel":50,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":5,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":5,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":1,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Physical Translation risk flagged"},{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p96","rank":95,"name":"Michael Ajayi","first":"MICHAEL","last":"AJAYI","initials":"MA","school":"Butler","team":"Butler","pos":"SF","pos2":"PF","archetype":"Lead Creator","height":"6'7\"","weight":"215 lb","wingspan":"6'11\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p27","rank":96,"name":"Tyler Tanner","first":"TYLER","last":"TANNER","initials":"TT","school":"Vanderbilt","team":"Vanderbilt","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"5'11\"","weight":"170 lb","wingspan":"6'2\"","age":21,"cls":"So.","movement":"+4","country":"USA","statsSource":"NCAA","score":52.4,"weightedTraitScore":61.11,"riskPenalty":8.75,"tier":"Tier 5 - Developmental","percentile":5,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p97","rank":96,"name":"Oscar Cluff","first":"OSCAR","last":"CLUFF","initials":"OC","school":"Purdue","team":"Purdue","pos":"C","pos2":"PF","archetype":"Lead Creator","height":"6'11\"","weight":"255 lb","wingspan":"7'5\"","age":25,"cls":"\u2014","movement":"","country":"Australia","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":50,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":4,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]},{"id":"p42","rank":97,"name":"Dame Sarr","first":"DAME","last":"SARR","initials":"DS","school":"Duke","team":"Duke","pos":"SF","pos2":"SG","archetype":"Lead Creator","height":"6'7\"","weight":"210 lb","wingspan":"6'10\"","age":21,"cls":"Fr.","movement":"+4","country":"France","statsSource":"NONE","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"}]},{"id":"p98","rank":97,"name":"Jordan Burks","first":"JORDAN","last":"BURKS","initials":"JB","school":"UCF","team":"UCF","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'9\"","weight":"220 lb","wingspan":"7'0\"","age":22,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p99","rank":98,"name":"Fletcher Loyer","first":"FLETCHER","last":"LOYER","initials":"FL","school":"Purdue","team":"Purdue","pos":"PG","pos2":"SG","archetype":"Lead Creator","height":"6'4\"","weight":"185 lb","wingspan":"6'5\"","age":23,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":65,"Playmaking":67,"Defense":55,"Feel":67,"Athleticism":60},"traits9":{"Advantage Creation":7,"Decision Making":7,"Passing Creation":6,"Shooting Gravity":6,"Off-Ball Value":6,"Processing Speed":7,"Scalability":7,"Defensive Versatility":4,"Confidence":4},"risks":{"Shooting":1,"Physical Translation":0,"Creation Translation":1,"Defensive Role":1,"Processing":0,"Age / Upside":1,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Shooting risk flagged"},{"lvl":"orange","note":"Creation Translation risk flagged"},{"lvl":"orange","note":"Defensive Role risk flagged"},{"lvl":"orange","note":"Age / Upside risk flagged"}]},{"id":"p100","rank":99,"name":"Bryce Hopkins","first":"BRYCE","last":"HOPKINS","initials":"BH","school":"St. John's","team":"St. John's","pos":"PF","pos2":"SF","archetype":"Lead Creator","height":"6'7\"","weight":"230 lb","wingspan":"7'1\"","age":24,"cls":"\u2014","movement":"","country":"USA","statsSource":"NCAA","score":null,"weightedTraitScore":null,"riskPenalty":null,"tier":null,"percentile":null,"traits":{"Scoring":55,"Playmaking":53,"Defense":60,"Feel":57,"Athleticism":53},"traits9":{"Advantage Creation":6,"Decision Making":6,"Passing Creation":4,"Shooting Gravity":5,"Off-Ball Value":5,"Processing Speed":6,"Scalability":6,"Defensive Versatility":6,"Confidence":4},"risks":{"Shooting":2,"Physical Translation":0,"Creation Translation":2,"Defensive Role":0,"Processing":1,"Age / Upside":0,"Motor / Consistency":0,"Medical":0},"flags":[{"lvl":"orange","note":"Processing risk flagged"}]}];

// ---------- ATOMS ----------
function deriveStory(p) {
  if (!p.traits9 || Object.keys(p.traits9).length === 0) {
    return `${p.name} — ${p.archetype}. ${p.school || "—"}, ${p.cls || ""}. Stat coverage limited; evaluation lean.`;
  }
  const sorted = Object.entries(p.traits9).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 2).map((x) => x[0].toLowerCase());
  const flagged = (p.flags || []).length;
  const tierPhrase = p.tier ? p.tier.split(" - ")[1] || p.tier : "developmental";
  const heightPhrase = p.height && p.wingspan ? `${p.height} / ${p.wingspan}` : (p.height || "");
  const classPhrase = p.cls === "Fr." ? "true freshman" : p.cls === "So." ? "sophomore" : p.cls === "Jr." ? "junior" : p.cls === "Sr." ? "upperclassman" : "international prospect";
  return `${p.archetype} from ${p.school}. ${heightPhrase} ${classPhrase} whose game leans on ${top[0]} and ${top[1]}. ${flagged > 0 ? `${flagged} active risk flag${flagged > 1 ? "s" : ""}; profiles as a ${tierPhrase.toLowerCase()} outcome.` : `Profiles as a ${tierPhrase.toLowerCase()} outcome.`}`;
}

const Label = ({ children, style }) => (
  <div
    style={{
      ...mono,
      fontSize: 10,
      letterSpacing: "0.14em",
      color: T.textMute,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

const PlayerImg = ({ p, size = 40 }) => (
  <div
    style={{
      width: size,
      height: size,
      background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
      border: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...mono,
      fontSize: size * 0.32,
      letterSpacing: "0.05em",
      color: T.cyan,
      flexShrink: 0,
    }}
  >
    {p.initials}
  </div>
);

const MetricBar = ({ value, max = 100, color = T.cyan }) => {
  const blocks = 10;
  const filled = Math.round((value / max) * blocks);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 6,
            background: i < filled ? color : "rgba(31, 41, 55, 0.6)",
            opacity: i < filled ? 0.4 + (i / blocks) * 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
};

const FlagDot = ({ lvl }) => {
  const c = lvl === "red" ? T.danger : lvl === "orange" ? T.warn : "#FACC15";
  return (
    <div
      style={{
        width: 8,
        height: 8,
        background: c,
        boxShadow: `0 0 8px ${c}`,
        flexShrink: 0,
        marginTop: 6,
      }}
    />
  );
};

// ---------- TOP NAV ----------
const NAV_ITEMS = ["Big Board", "My Board", "Dashboard", "Compare", "Notes", "Historical", "Reports"];

const TopNav = ({ active, setActive, onMenu }) => (
  <div
    className="prospera-topbar"
    style={{
      height: 52,
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 24,
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}
  >
    <button
      onClick={onMenu}
      style={{
        background: "none",
        border: "none",
        color: T.text,
        cursor: "pointer",
        display: "none",
        padding: 4,
      }}
      className="prospera-mobile-only"
    >
      <Menu size={18} />
    </button>

    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 22,
          height: 22,
          background: T.cyan,
          clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
        }}
      />
      <div
        style={{
          ...mono,
          fontSize: 13,
          letterSpacing: "0.22em",
          color: T.text,
          fontWeight: 600,
        }}
      >
        PROSPERA
      </div>
      <div
        className="prospera-brand-version"
        style={{
          ...mono,
          fontSize: 9,
          letterSpacing: "0.18em",
          color: T.textMute,
          padding: "2px 6px",
          border: `1px solid ${T.border}`,
        }}
      >
        v3.1
      </div>
    </div>

    <div className="prospera-nav-items" style={{ display: "flex", gap: 2, flex: 1, minWidth: 0 }}>
      {NAV_ITEMS.map((n) => {
        const isActive = active === n;
        return (
          <button
            key={n}
            onClick={() => setActive(n)}
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: isActive ? T.cyan : T.textDim,
              background: "none",
              border: "none",
              padding: "8px 14px",
              borderBottom: `2px solid ${isActive ? T.cyan : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>

    <div className="prospera-desktop-only" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        style={{
          background: T.surface2,
          border: `1px solid ${T.border}`,
          color: T.textDim,
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          ...mono,
          fontSize: 11,
        }}
      >
        <Search size={12} />
        SEARCH
        <span style={{ color: T.textMute, marginLeft: 12 }}>⌘K</span>
      </button>
      <div
        style={{
          width: 28,
          height: 28,
          background: T.surface2,
          border: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...mono,
          fontSize: 11,
          color: T.cyan,
        }}
      >
        SC
      </div>
    </div>
  </div>
);

// ---------- BIG BOARD RAIL ----------
const BigBoardRail = ({ selectedId, onSelect, open, onClose }) => (
  <aside
    style={{
      width: 240,
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      height: "calc(100vh - 52px)",
      position: "sticky",
      top: 52,
      overflowY: "auto",
      flexShrink: 0,
      display: open ? "block" : undefined,
    }}
    className="prospera-rail"
  >
    <div
      style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Label>Big Board</Label>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.textDim,
            padding: 4,
            cursor: "pointer",
          }}
          title="Export"
        >
          <Download size={11} />
        </button>
        <button
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.textDim,
            padding: 4,
            cursor: "pointer",
          }}
          title="Note"
        >
          <FileText size={11} />
        </button>
      </div>
    </div>

    <div style={{ padding: "8px 0" }}>
      {PROSPECTS.map((p) => {
        const isActive = p.id === selectedId;
        return (
          <button
            key={p.id}
            onClick={() => {
              onSelect(p.id);
              onClose && onClose();
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              background: isActive ? "rgba(34, 211, 238, 0.08)" : "transparent",
              borderTop: "none",
              borderRight: "none",
              borderBottom: "none",
              borderLeft: `2px solid ${isActive ? T.cyan : "transparent"}`,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = "rgba(34, 211, 238, 0.03)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                ...mono,
                fontSize: 11,
                color: isActive ? T.cyan : T.textMute,
                width: 22,
              }}
            >
              {String(p.rank).padStart(2, "0")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  color: isActive ? T.text : T.textDim,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 9,
                  color: T.textMute,
                  letterSpacing: "0.1em",
                  marginTop: 2,
                }}
              >
                {p.pos} · {p.school.split(" ")[0].toUpperCase()}
              </div>
            </div>
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: isActive ? T.cyan : T.textMute,
              }}
            >
              {p.score != null ? p.score.toFixed(1) : "—"}
            </div>
          </button>
        );
      })}
    </div>
  </aside>
);

// ---------- PROSPECT STREAM CARD ----------
const ProspectStreamCard = ({ p, isSelected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0,
      width: 168,
      background: T.card,
      border: `1px solid ${isSelected ? T.cyan : T.border}`,
      padding: 0,
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.15s",
      position: "relative",
    }}
    onMouseEnter={(e) => {
      if (!isSelected) e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.5)";
    }}
    onMouseLeave={(e) => {
      if (!isSelected) e.currentTarget.style.borderColor = T.border;
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        ...mono,
        fontSize: 10,
        color: T.cyan,
        background: "rgba(5, 10, 18, 0.9)",
        padding: "2px 6px",
        border: `1px solid ${T.border}`,
        zIndex: 2,
      }}
    >
      #{p.rank}
    </div>
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        ...mono,
        fontSize: 10,
        color: T.text,
        background: "rgba(5, 10, 18, 0.9)",
        padding: "2px 6px",
        border: `1px solid ${T.border}`,
        zIndex: 2,
      }}
    >
      {p.score?.toFixed(1) ?? "—"}
    </div>

    <div
      style={{
        height: 124,
        background: `
          linear-gradient(180deg, rgba(34, 211, 238, 0.06), transparent 60%),
          linear-gradient(135deg, ${T.surface2}, ${T.surface})
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: `1px solid ${T.border}`,
        position: "relative",
      }}
    >
      <div
        style={{
          ...mono,
          fontSize: 44,
          color: isSelected ? T.cyan : T.textDim,
          letterSpacing: "0.05em",
          opacity: 0.95,
        }}
      >
        {p.initials}
      </div>
    </div>

    <div style={{ padding: "10px 12px" }}>
      <div
        style={{
          fontSize: 13,
          color: T.text,
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {p.name}
      </div>
      <div
        style={{
          ...mono,
          fontSize: 9,
          color: T.textMute,
          letterSpacing: "0.12em",
          marginTop: 4,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{p.school.split(" ")[0].toUpperCase()}</span>
        <span style={{ color: T.cyan }}>{p.pos}</span>
      </div>
    </div>
  </button>
);

// ---------- SELECTED PROSPECT DASHBOARD CARD ----------
const DashboardCard = ({ p, onOpen, onRemove }) => {
  if (!p) return null;
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <PlayerImg p={p} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: T.text, fontWeight: 600 }}>{p.name}</div>
          <div
            style={{
              ...mono,
              fontSize: 10,
              color: T.textMute,
              letterSpacing: "0.1em",
              marginTop: 2,
            }}
          >
            {p.school.toUpperCase()} · {p.pos} · {p.cls}
          </div>
        </div>
        <select
          style={{
            ...mono,
            fontSize: 10,
            color: T.textDim,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            padding: "4px 6px",
            cursor: "pointer",
          }}
          defaultValue="2024-25"
        >
          <option>2024-25</option>
          <option>2023-24</option>
        </select>
        <button
          onClick={onOpen}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.cyan,
            padding: 6,
            cursor: "pointer",
          }}
          title="Open profile"
        >
          <ExternalLink size={12} />
        </button>
        <button
          onClick={onRemove}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            color: T.textMute,
            padding: 6,
            cursor: "pointer",
          }}
          title="Remove"
        >
          <X size={12} />
        </button>
      </div>

      {p.statsSource === "NONE" ? (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: T.textMute,
            ...mono,
            fontSize: 11,
            letterSpacing: "0.1em",
          }}
        >
          Pre-NBA stats not available
        </div>
      ) : (
        <div style={{ padding: 16, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ScorePanel title="Board Score" value={p.score} sub={p.tier} color={T.cyan} />
            <ScorePanel title="Trait Score" value={p.weightedTraitScore} sub={p.percentile ? `${p.percentile}th pct` : "—"} color={T.blue} />
          </div>

          <div>
            <Label style={{ marginBottom: 8 }}>Trait Snapshot</Label>
            <div style={{ display: "grid", gap: 6 }}>
              {Object.entries(p.traits || {}).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 32px",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: "0.08em" }}>
                    {k.toUpperCase()}
                  </span>
                  <MetricBar value={v} />
                  <span style={{ ...mono, fontSize: 10, color: T.text, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {p.flags && p.flags.length > 0 && (
            <div>
              <Label style={{ marginBottom: 8 }}>Flags</Label>
              <div style={{ display: "grid", gap: 6 }}>
                {p.flags.slice(0, 3).map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <FlagDot lvl={f.lvl} />
                    <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>{f.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            style={{
              ...mono,
              fontSize: 10,
              letterSpacing: "0.14em",
              color: T.cyan,
              background: "transparent",
              border: `1px solid ${T.border}`,
              padding: "8px 12px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            + ADD NOTE
          </button>
        </div>
      )}
    </div>
  );
};

const ScorePanel = ({ title, value, sub, color }) => (
  <div style={{ background: T.surface2, border: `1px solid ${T.borderSoft}`, padding: 14 }}>
    <Label style={{ marginBottom: 8, color }}>{title}</Label>
    <div style={{ ...mono, fontSize: 28, color: T.text, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
      {value != null ? value.toFixed(1) : "—"}
    </div>
    <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginTop: 6 }}>
      {sub ? sub.toUpperCase() : ""}
    </div>
  </div>
);

const MetricPanel = ({ title, rows, color }) => (
  <div
    style={{
      background: T.surface2,
      border: `1px solid ${T.borderSoft}`,
      padding: 12,
    }}
  >
    <Label style={{ marginBottom: 10, color: color }}>{title}</Label>
    <div style={{ display: "grid", gap: 8 }}>
      {(rows || []).map((r) => (
        <div key={r.k}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: T.textDim }}>{r.k}</span>
            <span style={{ ...mono, fontSize: 10, color: T.text }}>{r.v}</span>
          </div>
          <MetricBar value={r.v} color={color} />
        </div>
      ))}
    </div>
  </div>
);

// ---------- DASHBOARD PAGE ----------
const DashboardPage = ({ selected, setSelected, onOpenProfile, addToSelected, removeFromSelected, dashSelected }) => {
  const [view, setView] = useState("Overview");
  const [query, setQuery] = useState("");

  const filtered = query
    ? PROSPECTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : PROSPECTS;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Label>Workspace · 2025 Class</Label>
        <h1
          style={{
            fontSize: 32,
            color: T.text,
            margin: "6px 0 4px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Draft Dashboard
        </h1>
        <div style={{ fontSize: 13, color: T.textDim }}>Multi-card prospect analysis</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Label style={{ marginBottom: 8 }}>Add Prospect</Label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: T.surface,
            border: `1px solid ${T.border}`,
            padding: "10px 14px",
          }}
        >
          <Search size={14} color={T.textMute} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search top prospects..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: T.text,
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Label>Prospect Stream</Label>
          <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em" }}>
            {filtered.length} PROSPECTS
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 8,
          }}
        >
          {filtered.map((p) => (
            <ProspectStreamCard
              key={p.id}
              p={p}
              isSelected={dashSelected.includes(p.id)}
              onClick={() => addToSelected(p.id)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, border: `1px solid ${T.border}`, width: "fit-content" }}>
        {["Overview", "Factors"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "10px 24px",
              background: view === v ? "rgba(34, 211, 238, 0.08)" : "transparent",
              color: view === v ? T.cyan : T.textDim,
              border: "none",
              borderRight: `1px solid ${T.border}`,
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {dashSelected.length === 0 ? (
        <div
          style={{
            background: T.card,
            border: `1px dashed ${T.border}`,
            padding: 48,
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...mono,
              fontSize: 11,
              color: T.textMute,
              letterSpacing: "0.14em",
            }}
          >
            SELECT A PROSPECT FROM THE STREAM TO OPEN THEIR DASHBOARD
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: dashSelected.length === 1 ? "1fr" : "1fr 1fr",
            gap: 16,
          }}
          className="prospera-dash-grid"
        >
          {dashSelected.map((id) => {
            const p = PROSPECTS.find((x) => x.id === id);
            return (
              <DashboardCard
                key={id}
                p={p}
                onOpen={() => onOpenProfile(id)}
                onRemove={() => removeFromSelected(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- PLAYER PROFILE PAGE ----------
const PROFILE_TABS = ["Prospect Stats", "Evaluation", "Traits", "Reports", "Shot Chart", "Notes"];

const TAG_OPTIONS = ["upside", "risk", "wing", "lottery", "sleeper", "international"];
const TIER_OPTIONS = ["Tier 1 - Franchise", "Tier 2 - All-Star", "Tier 3 - Starter", "Tier 4 - Rotation", "Tier 5 - Developmental"];

const PlayerProfilePage = ({ p: rawP, onBack, notes = [], onAddNote, onDeleteNote, customTier = "", customTags = [], onSetCustomTier, onToggleCustomTag }) => {
  const [tab, setTab] = useState("Prospect Stats");
  const p = useMemo(
    () => ({ ...rawP, tier: customTier || rawP.tier, customTags }),
    [rawP, customTier, customTags]
  );
  return (
    <div style={{ padding: "20px 28px 60px", maxWidth: 1400, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: T.textDim,
          ...mono,
          fontSize: 11,
          letterSpacing: "0.14em",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 0",
          marginBottom: 16,
        }}
      >
        <ChevronLeft size={14} /> RETURN TO BIG BOARD
      </button>

      {/* HERO */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          padding: 28,
          position: "relative",
          marginBottom: 16,
          backgroundImage: `
            linear-gradient(135deg, transparent 0%, rgba(34, 211, 238, 0.04) 100%),
            radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.06), transparent 60%)
          `,
        }}
      >
        {/* Cyan corner accents */}
        {[
          { top: 0, left: 0, borderTop: `2px solid ${T.cyan}`, borderLeft: `2px solid ${T.cyan}` },
          { top: 0, right: 0, borderTop: `2px solid ${T.cyan}`, borderRight: `2px solid ${T.cyan}` },
          { bottom: 0, left: 0, borderBottom: `2px solid ${T.cyan}`, borderLeft: `2px solid ${T.cyan}` },
          { bottom: 0, right: 0, borderBottom: `2px solid ${T.cyan}`, borderRight: `2px solid ${T.cyan}` },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 16, height: 16, ...s }} />
        ))}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 28,
            alignItems: "center",
          }}
          className="prospera-hero-grid"
        >
          {/* Image */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 132,
                height: 132,
                background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
                border: `1px solid ${T.cyan}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...mono,
                fontSize: 56,
                color: T.cyan,
                letterSpacing: "0.05em",
                boxShadow: `0 0 0 4px rgba(34, 211, 238, 0.08)`,
              }}
            >
              {p.initials}
            </div>
            <div
              style={{
                position: "absolute",
                top: -8,
                left: -8,
                background: T.cyan,
                color: T.bg,
                ...mono,
                fontSize: 11,
                letterSpacing: "0.1em",
                padding: "4px 8px",
                fontWeight: 700,
              }}
            >
              #{p.rank}
            </div>
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: T.textMute,
                letterSpacing: "0.12em",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              {p.school?.toUpperCase()}
            </div>
          </div>

          {/* Center info */}
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <div
                style={{
                  ...mono,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: T.cyan,
                  background: "rgba(34, 211, 238, 0.08)",
                  border: `1px solid rgba(34, 211, 238, 0.3)`,
                  padding: "3px 8px",
                }}
              >
                {p.archetype?.toUpperCase()}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: T.textDim,
                  border: `1px solid ${T.border}`,
                  padding: "3px 8px",
                }}
              >
                {p.pos}
              </div>
              {(p.customTags || []).map((tag) => (
                <div
                  key={tag}
                  style={{
                    ...mono,
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    color: T.purple,
                    background: "rgba(168, 85, 247, 0.08)",
                    border: `1px solid rgba(168, 85, 247, 0.4)`,
                    padding: "3px 8px",
                    textTransform: "uppercase",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 60,
                lineHeight: 0.95,
                color: T.text,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                fontStretch: "condensed",
              }}
              className="prospera-name"
            >
              {p.first}
              <br />
              <span style={{ color: T.cyan }}>{p.last}</span>
            </h1>
            <div
              style={{
                marginTop: 16,
                fontSize: 14,
                color: T.textDim,
                lineHeight: 1.55,
                maxWidth: 520,
                fontStyle: "italic",
              }}
            >
              "{deriveStory(p)}"
            </div>
          </div>

          {/* Score */}
          <div
            style={{
              textAlign: "right",
              borderLeft: `1px solid ${T.border}`,
              paddingLeft: 24,
            }}
            className="prospera-hero-score"
          >
            <Label>Prospera Score</Label>
            <div
              style={{
                ...mono,
                fontSize: 56,
                color: T.cyan,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginTop: 8,
              }}
            >
              {p.score != null ? p.score.toFixed(1) : "—"}
            </div>
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: T.textMute,
                letterSpacing: "0.14em",
                marginTop: 6,
              }}
            >
              CLASS RANK · #{p.rank}
            </div>
          </div>
        </div>
      </div>

      {/* META STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          background: T.surface,
          border: `1px solid ${T.border}`,
          marginBottom: 20,
        }}
        className="prospera-meta-strip"
      >
        {[
          ["Height", p.height],
          ["Weight", p.weight],
          ["Wingspan", p.wingspan],
          ["Age", p.age],
          ["Class", p.cls],
          ["Position", [p.pos, p.pos2].filter(Boolean).join("/")],
          ["Country", p.country],
        ].map(([k, v], i) => (
          <div
            key={k}
            style={{
              padding: "14px 16px",
              borderRight: i < 6 ? `1px solid ${T.border}` : "none",
            }}
          >
            <Label>{k}</Label>
            <div style={{ ...mono, fontSize: 16, color: T.text, marginTop: 4 }}>{v ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${T.border}`,
          marginBottom: 20,
          overflowX: "auto",
        }}
      >
        {PROFILE_TABS.map((t) => {
          const isA = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...mono,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: isA ? T.cyan : T.textDim,
                background: "transparent",
                border: "none",
                padding: "12px 18px",
                borderBottom: `2px solid ${isA ? T.cyan : "transparent"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "Prospect Stats" && <ProspectStatsTab p={p} />}
      {tab === "Evaluation" && (
        <EvaluationTab
          p={p}
          customTier={customTier}
          customTags={customTags}
          onSetCustomTier={onSetCustomTier}
          onToggleCustomTag={onToggleCustomTag}
        />
      )}
      {tab === "Traits" && <TraitsTab p={p} />}
      {tab === "Reports" && <EmptyState label="No scouting reports filed yet." />}
      {tab === "Shot Chart" && <ShotChartTab p={p} />}
      {tab === "Notes" && <NotesTab p={p} notes={notes} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />}
    </div>
  );
};

// ---------- PROSPECT STATS TAB ----------
const ProspectStatsTab = ({ p }) => {
  if (p.statsSource === "NONE") {
    return (
      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="prospera-stat-grid">
          <StatProfilePanelFromTraits title="Offensive Profile" traits9={p.traits9} subset={["Advantage Creation","Shooting Gravity","Passing Creation","Off-Ball Value"]} color={T.cyan} />
          <StatProfilePanelFromTraits title="Defensive Profile" traits9={p.traits9} subset={["Defensive Versatility","Scalability","Processing Speed","Decision Making"]} color={T.blue} />
        </div>
        <EmptyState label="Per-game stats not available for international prospects." />
      </div>
    );
  }

  // Build strengths / weaknesses from real traits9
  const sortedTraits = Object.entries(p.traits9 || {}).sort((a, b) => b[1] - a[1]);
  const strengths = sortedTraits.slice(0, 4).map(([k, v]) => ({ k, v: `${v}/10` }));
  const weaknesses = sortedTraits.slice(-3).reverse().map(([k, v]) => ({ k, v: `${v}/10` }));

  // Build "advanced" tables from score data (real)
  const coreOverview = {
    "BOARD SCORE": p.score != null ? p.score.toFixed(1) : "—",
    TIER: p.tier ? p.tier.split(" - ")[0] : "—",
    PCTILE: p.percentile != null ? `${p.percentile}` : "—",
    RANK: `#${p.rank}`,
  };
  const traitBreakdown = p.traits || {};
  const measurements = {
    HT: p.height || "—",
    WT: p.weight || "—",
    WING: p.wingspan || "—",
    AGE: p.age != null ? p.age : "—",
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Stat Profile from traits */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="prospera-stat-grid">
        <StatProfilePanelFromTraits title="Offensive Profile" traits9={p.traits9} subset={["Advantage Creation","Shooting Gravity","Passing Creation","Off-Ball Value"]} color={T.cyan} />
        <StatProfilePanelFromTraits title="Defensive Profile" traits9={p.traits9} subset={["Defensive Versatility","Scalability","Processing Speed","Decision Making"]} color={T.blue} />
      </div>

      {/* Advanced metrics from real score data */}
      <div>
        <h2 style={{ ...mono, fontSize: 13, letterSpacing: "0.18em", color: T.text, textAlign: "center", margin: "16px 0 14px", fontWeight: 600 }}>
          ADVANCED METRICS
        </h2>
        <div style={{ display: "grid", gap: 10 }}>
          <AdvancedTable title="Core Overview" data={coreOverview} />
          <AdvancedTable title="Trait Breakdown (5-bucket)" data={traitBreakdown} />
          <AdvancedTable title="Measurements" data={measurements} />
        </div>
      </div>

      {/* Strengths / Weaknesses derived from traits9 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="prospera-sw-grid">
        <SWPanel title="Strengths" items={strengths} color={T.cyan} icon={TrendingUp} />
        <SWPanel title="Weaknesses" items={weaknesses} color={T.danger} icon={TrendingDown} />
      </div>

      {/* Per-game stats not yet ingested */}
      <div>
        <Label style={{ marginBottom: 10 }}>Game Log</Label>
        <EmptyState label="Per-game stats not yet ingested for this prospect." compact />
      </div>
    </div>
  );
};

const StatProfilePanelFromTraits = ({ title, traits9, subset, color }) => {
  const rows = (subset || []).map((k) => ({
    k,
    v: traits9 && traits9[k] != null ? traits9[k] : null,
  })).filter((r) => r.v != null);
  if (rows.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 18 }}>
        <Label style={{ color, fontSize: 11, marginBottom: 12 }}>{title}</Label>
        <div style={{ ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.1em" }}>
          NO TRAIT DATA
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Label style={{ color, fontSize: 11 }}>{title}</Label>
        <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>1–10 SCALE</div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.k}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: T.textDim }}>{r.k}</span>
              <span style={{ ...mono, fontSize: 11, color }}>{r.v}/10</span>
            </div>
            <MetricBar value={r.v * 10} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
};

const StatProfilePanel = ({ title, rows, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 18 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <Label style={{ color, fontSize: 11 }}>{title}</Label>
      <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>VS CLASS</div>
    </div>
    <div style={{ display: "grid", gap: 12 }}>
      {(rows || []).map((r) => (
        <div key={r.k}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: T.textDim }}>{r.k}</span>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ ...mono, fontSize: 11, color: T.text }}>{r.v}</span>
              <span style={{ ...mono, fontSize: 10, color, letterSpacing: "0.05em" }}>{r.pct}%</span>
            </div>
          </div>
          <MetricBar value={r.v} color={color} />
        </div>
      ))}
    </div>
  </div>
);

const AdvancedTable = ({ title, data }) => {
  if (!data) return null;
  const entries = Object.entries(data);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface2,
        }}
      >
        <Label>{title}</Label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${entries.length}, 1fr)` }}>
        {entries.map(([k, v], i) => (
          <div
            key={k}
            style={{
              padding: "12px 14px",
              borderRight: i < entries.length - 1 ? `1px solid ${T.borderSoft}` : "none",
            }}
          >
            <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>{k}</div>
            <div style={{ ...mono, fontSize: 16, color: T.text, marginTop: 4 }}>
              {typeof v === "number" && v < 1 && v > 0 ? v.toFixed(3) : v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SWPanel = ({ title, items, color, icon: Icon }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <Icon size={14} color={color} />
      <Label style={{ color }}>{title}</Label>
      <div style={{ flex: 1 }} />
      <div style={{ ...mono, fontSize: 11, color }}>{items?.length || 0}</div>
    </div>
    <div style={{ display: "grid", gap: 8 }}>
      {(items || []).map((it, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 10px",
            background: T.surface2,
            border: `1px solid ${T.borderSoft}`,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ ...mono, fontSize: 9, color: T.textMute }}>0{i + 1}</span>
            <span style={{ fontSize: 12, color: T.text }}>{it.k}</span>
          </div>
          {it.v && (
            <span style={{ ...mono, fontSize: 10, color, letterSpacing: "0.08em" }}>{it.v}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const GameLogTable = ({ log }) => {
  if (!log || log.length === 0) {
    return (
      <div>
        <Label style={{ marginBottom: 8 }}>Game Log</Label>
        <EmptyState label="Game log not available." compact />
      </div>
    );
  }
  const cols = ["DATE", "OPP", "MIN", "USG", "TS%", "PTS", "REB", "AST", "TO", "STL", "FG", "3P", "FT", "GMSC"];
  const keys = ["date", "opp", "min", "usg", "ts", "p", "r", "a", "to", "st", "fg", "tp", "ft", "gs"];
  return (
    <div>
      <Label style={{ marginBottom: 10 }}>Game Log</Label>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", ...mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surface2 }}>
              {cols.map((c) => (
                <th
                  key={c}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${T.border}`,
                    color: T.textMute,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    fontSize: 9,
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.map((g, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${T.borderSoft}`,
                }}
              >
                {keys.map((k) => (
                  <td
                    key={k}
                    style={{
                      padding: "9px 12px",
                      color: k === "date" || k === "opp" ? T.textDim : T.text,
                      fontSize: k === "ts" ? 10 : 11,
                    }}
                  >
                    {k === "ts" ? (g.ts * 100).toFixed(1) + "%" : g[k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RollingAverageChart = ({ log }) => {
  const [s1, setS1] = useState("usg");
  const [s2, setS2] = useState("ts");
  const data = useMemo(
    () =>
      log
        .slice()
        .reverse()
        .map((g, i) => ({
          name: g.date,
          [s1]: typeof g[s1] === "number" ? (s1 === "ts" ? g[s1] * 100 : g[s1]) : 0,
          [s2]: typeof g[s2] === "number" ? (s2 === "ts" ? g[s2] * 100 : g[s2]) : 0,
        })),
    [log, s1, s2]
  );

  const opts = [
    { v: "usg", l: "Usage" },
    { v: "ts", l: "TS%" },
    { v: "p", l: "Points" },
    { v: "a", l: "Assists" },
    { v: "r", l: "Rebounds" },
    { v: "gs", l: "Game Score" },
  ];

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <Label>Rolling Averages</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={s1} onChange={setS1} options={opts} color={T.cyan} />
          <Select value={s2} onChange={setS2} options={opts} color={T.purple} />
        </div>
      </div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={T.grid} strokeDasharray="2 3" />
            <XAxis dataKey="name" stroke={T.textMute} tick={{ fontSize: 10, fill: T.textMute, fontFamily: mono.fontFamily }} />
            <YAxis stroke={T.textMute} tick={{ fontSize: 10, fill: T.textMute, fontFamily: mono.fontFamily }} />
            <Tooltip
              contentStyle={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                fontFamily: mono.fontFamily,
                fontSize: 11,
              }}
              labelStyle={{ color: T.textDim }}
            />
            <Line type="monotone" dataKey={s1} stroke={T.cyan} strokeWidth={2} dot={{ r: 3, fill: T.cyan }} />
            <Line type="monotone" dataKey={s2} stroke={T.purple} strokeWidth={2} dot={{ r: 3, fill: T.purple }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Select = ({ value, onChange, options, color }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      ...mono,
      fontSize: 10,
      letterSpacing: "0.1em",
      color: color,
      background: T.surface2,
      border: `1px solid ${T.border}`,
      borderLeft: `2px solid ${color}`,
      padding: "5px 8px",
      cursor: "pointer",
    }}
  >
    {options.map((o) => (
      <option key={o.v} value={o.v}>
        {o.l.toUpperCase()}
      </option>
    ))}
  </select>
);

const ShotProfileGrid = ({ shot }) => {
  const cards = [
    { k: "USG", v: shot.USG?.toFixed(1), suffix: "" },
    { k: "TS%", v: (shot.TS * 100).toFixed(1), suffix: "%" },
    { k: "RIM", v: (shot.RIM * 100).toFixed(1), suffix: "%" },
    { k: "MID", v: (shot.MID * 100).toFixed(1), suffix: "%" },
    { k: "3PT", v: (shot["3PT"] * 100).toFixed(1), suffix: "%" },
    { k: "FT", v: (shot.FT * 100).toFixed(1), suffix: "%" },
  ];
  return (
    <div>
      <Label style={{ marginBottom: 10 }}>Shot Profile</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }} className="prospera-shot-grid">
        {cards.map((c) => (
          <div
            key={c.k}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              padding: "16px 14px",
              borderTop: `2px solid ${T.cyan}`,
            }}
          >
            <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em" }}>{c.k}</div>
            <div style={{ ...mono, fontSize: 22, color: T.text, marginTop: 6, fontWeight: 600 }}>
              {c.v}
              <span style={{ fontSize: 12, color: T.textDim, marginLeft: 1 }}>{c.suffix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- EVALUATION TAB ----------
const EvaluationTab = ({ p, customTier = "", customTags = [], onSetCustomTier, onToggleCustomTag }) => (
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="prospera-eval-grid">
    <div style={{ display: "grid", gap: 16 }}>
      <Section title="The Story">
        <div style={{ fontSize: 14, color: T.textDim, lineHeight: 1.65 }}>{deriveStory(p)}</div>
      </Section>

      <Section title="Overrides">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <Label style={{ marginBottom: 6 }}>Tier override</Label>
            <select
              value={customTier}
              onChange={(e) => onSetCustomTier?.(e.target.value)}
              style={{
                ...mono,
                fontSize: 11,
                letterSpacing: "0.06em",
                color: customTier ? T.cyan : T.textDim,
                background: T.surface2,
                border: `1px solid ${T.border}`,
                padding: "6px 8px",
                cursor: "pointer",
              }}
            >
              <option value="">DEFAULT ({p.tier || "—"})</option>
              {TIER_OPTIONS.map((tier) => (
                <option key={tier} value={tier}>{tier.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <Label style={{ marginBottom: 6 }}>Custom tags</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TAG_OPTIONS.map((tag) => {
                const active = customTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleCustomTag?.(tag)}
                    style={{
                      ...mono,
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: active ? T.cyan : T.textDim,
                      background: active ? "rgba(34, 211, 238, 0.08)" : "transparent",
                      border: `1px solid ${active ? T.cyan : T.border}`,
                      padding: "5px 9px",
                      cursor: "pointer",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {customTags.length > 0 && (
              <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginTop: 8 }}>
                {customTags.length} TAG{customTags.length === 1 ? "" : "S"} ATTACHED
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Trait Snapshot">
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(p.traits || {}).map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 36px",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span style={{ ...mono, fontSize: 11, color: T.textDim, letterSpacing: "0.1em" }}>
                {k.toUpperCase()}
              </span>
              <MetricBar value={v} />
              <span style={{ ...mono, fontSize: 12, color: T.text, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="What's Driving the Grade">
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {[
            "Elite handle and live-dribble passing in pick-and-roll sets",
            "Tightening pull-up jumper and growing 3PT range off movement",
            "Defensive instincts that translate up against NBA spacing",
          ].map((s, i) => (
            <li
              key={i}
              style={{
                fontSize: 13,
                color: T.textDim,
                padding: "8px 12px",
                borderLeft: `2px solid ${T.cyan}`,
                background: "rgba(34, 211, 238, 0.03)",
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Player DNA">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["Pace", "FAST"],
            ["Style", "ON-BALL"],
            ["Range", "EXTENDED"],
            ["Read", "POSSESSION-LATE"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: T.surface2,
                border: `1px solid ${T.borderSoft}`,
                padding: 12,
              }}
            >
              <Label>{k}</Label>
              <div style={{ ...mono, fontSize: 13, color: T.cyan, marginTop: 4, letterSpacing: "0.06em" }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>

    <div style={{ display: "grid", gap: 16 }}>
      <Section title="Questions & Concerns">
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {[
            "Will the frame hold up against NBA-level physicality?",
            "Catch-and-shoot consistency vs. pull-up volume",
            "Off-ball value when not in primary actions",
          ].map((q, i) => (
            <li key={i} style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5, paddingLeft: 12, borderLeft: `1px solid ${T.warn}` }}>
              {q}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Swing Skill">
        <div
          style={{
            ...mono,
            fontSize: 13,
            letterSpacing: "0.1em",
            color: T.cyan,
            padding: "14px 12px",
            border: `1px solid ${T.cyan}`,
            background: "rgba(34, 211, 238, 0.04)",
            textAlign: "center",
          }}
        >
          PULL-UP 3PT CONSISTENCY
        </div>
        <div style={{ fontSize: 11, color: T.textMute, marginTop: 8, lineHeight: 1.5 }}>
          The skill that most likely determines whether the prospect plateaus as a starter or reaches an All-Star outcome.
        </div>
      </Section>

      <Section title="Flags">
        {p.flags && p.flags.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {p.flags.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", border: `1px solid ${T.borderSoft}` }}>
                <FlagDot lvl={f.lvl} />
                <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{f.note}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.textMute }}>No active flags.</div>
        )}
      </Section>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 18 }}>
    <Label style={{ marginBottom: 14 }}>{title}</Label>
    {children}
  </div>
);

const TraitsTab = ({ p }) => {
  const flaggedRisks = Object.entries(p.risks || {}).filter(([, v]) => v === 1);
  const cleanRisks = Object.entries(p.risks || {}).filter(([, v]) => v === 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="prospera-eval-grid">
      <div style={{ display: "grid", gap: 16 }}>
        <Section title="9-Trait Profile">
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginBottom: 14 }}>
            FULL EVALUATION TAXONOMY · 1–10 SCALE
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {Object.entries(p.traits9 || {}).map(([k, v]) => (
              <div key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.text }}>{k}</span>
                  <span style={{ ...mono, fontSize: 12, color: T.cyan }}>{v} / 10</span>
                </div>
                <MetricBar value={v * 10} />
              </div>
            ))}
            {Object.keys(p.traits9 || {}).length === 0 && (
              <div style={{ fontSize: 12, color: T.textMute }}>No trait evaluation on file.</div>
            )}
          </div>
        </Section>

        <Section title="5-Bucket Snapshot">
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginBottom: 14 }}>
            DERIVED FROM 9-TRAIT PROFILE · 0–100 SCALE
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {Object.entries(p.traits || {}).map(([k, v]) => (
              <div key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: T.textDim }}>{k}</span>
                  <span style={{ ...mono, fontSize: 11, color: T.cyan }}>{v}</span>
                </div>
                <MetricBar value={v} />
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        <Section title="Risk Profile">
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginBottom: 12 }}>
            8-DIMENSION RISK TAXONOMY
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {flaggedRisks.length === 0 && (
              <div style={{ fontSize: 12, color: T.textMute }}>No active risks flagged.</div>
            )}
            {flaggedRisks.map(([k]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${T.borderSoft}`, borderLeft: `2px solid ${T.warn}` }}>
                <AlertTriangle size={12} color={T.warn} />
                <span style={{ fontSize: 12, color: T.text }}>{k}</span>
                <span style={{ flex: 1 }} />
                <span style={{ ...mono, fontSize: 9, color: T.warn, letterSpacing: "0.1em" }}>FLAGGED</span>
              </div>
            ))}
          </div>
          {cleanRisks.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.borderSoft}` }}>
              <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginBottom: 8 }}>CLEAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {cleanRisks.map(([k]) => (
                  <span key={k} style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.06em", padding: "3px 6px", border: `1px solid ${T.borderSoft}` }}>
                    {k.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {p.tier && (
          <Section title="Model Output">
            <div style={{ display: "grid", gap: 10 }}>
              <Row k="Tier" v={p.tier} />
              <Row k="Final Score" v={p.score?.toFixed(2) ?? "—"} />
              <Row k="Weighted Trait" v={p.weightedTraitScore?.toFixed(2) ?? "—"} />
              <Row k="Risk Penalty" v={p.riskPenalty?.toFixed(2) ?? "—"} />
              <Row k="Percentile" v={p.percentile != null ? `${p.percentile}` : "—"} />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

const ShotChartTab = ({ p }) => (
  <Section title="Shot Distribution">
    {p.shot ? (
      <ShotProfileGrid shot={p.shot} />
    ) : (
      <EmptyState label="Shot distribution not available." compact />
    )}
  </Section>
);

const NotesTab = ({ p, notes = [], onAddNote, onDeleteNote }) => {
  const [draft, setDraft] = useState("");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }} className="prospera-eval-grid">
      <Section title="Evaluation Notes">
        {notes.length === 0 ? (
          <div style={{ fontSize: 13, color: T.textMute, padding: "20px 0" }}>
            No notes yet. Add your first evaluation note.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {notes.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: 12,
                  background: T.surface2,
                  border: `1px solid ${T.borderSoft}`,
                  borderLeft: `2px solid ${T.cyan}`,
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, paddingRight: 24 }}>{n.text}</div>
                <div style={{ ...mono, fontSize: 9, color: T.textMute, marginTop: 6, letterSpacing: "0.1em" }}>
                  {n.time}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteNote?.(n.id)}
                  title="Delete note"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "transparent",
                    border: "none",
                    color: T.textMute,
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write evaluation note..."
            rows={3}
            style={{
              width: "100%",
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: 12,
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = T.cyan)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
          <button
            onClick={() => {
              if (draft.trim()) {
                onAddNote?.(p.id, draft.trim());
                setDraft("");
              }
            }}
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.14em",
              color: T.bg,
              background: T.cyan,
              border: "none",
              padding: "9px 16px",
              marginTop: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ADD NOTE
          </button>
        </div>
      </Section>

      <div style={{ display: "grid", gap: 12 }}>
        <Section title="Note Stats">
          <div style={{ display: "grid", gap: 8 }}>
            <Row k="Total Notes" v={notes.length} />
            <Row k="Last Update" v={notes.length ? notes[0].time : "—"} />
          </div>
        </Section>
      </div>
    </div>
  );
};

const NotesWorkspacePage = ({ notes = {}, onSelectPlayer, onDeleteNote }) => {
  const entries = Object.entries(notes)
    .map(([playerId, list]) => {
      const player = PROSPECTS.find((p) => p.id === playerId);
      return player ? { player, notes: list } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.player.rank - b.player.rank);
  const totalNotes = entries.reduce((acc, e) => acc + e.notes.length, 0);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospera-notes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Label>Workspace</Label>
          <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Notes
          </h1>
          <div style={{ fontSize: 13, color: T.textDim }}>
            {totalNotes} note{totalNotes === 1 ? "" : "s"} across {entries.length} player{entries.length === 1 ? "" : "s"}
          </div>
        </div>
        {totalNotes > 0 && (
          <button
            type="button"
            onClick={exportJson}
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: T.cyan,
              background: "transparent",
              border: `1px solid ${T.border}`,
              padding: "8px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Download size={12} />
            EXPORT JSON
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState label="No notes yet. Open a prospect profile and add a note." />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {entries.map(({ player, notes: list }) => (
            <div key={player.id} style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <button
                type="button"
                onClick={() => onSelectPlayer?.(player.id)}
                style={{
                  width: "100%",
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: T.surface2,
                  border: "none",
                  borderBottom: `1px solid ${T.border}`,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ ...mono, fontSize: 11, color: T.cyan, width: 28 }}>#{String(player.rank).padStart(2, "0")}</div>
                <PlayerImg p={player} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{player.name}</div>
                  <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2 }}>
                    {player.school?.toUpperCase()} · {player.pos}
                  </div>
                </div>
                <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: "0.12em" }}>
                  {list.length} NOTE{list.length === 1 ? "" : "S"}
                </div>
                <ChevronRight size={14} color={T.textMute} />
              </button>
              <div style={{ display: "grid", gap: 8, padding: 14 }}>
                {list.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: 12,
                      background: T.surface2,
                      border: `1px solid ${T.borderSoft}`,
                      borderLeft: `2px solid ${T.cyan}`,
                      position: "relative",
                    }}
                  >
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, paddingRight: 24 }}>{n.text}</div>
                    <div style={{ ...mono, fontSize: 9, color: T.textMute, marginTop: 6, letterSpacing: "0.1em" }}>
                      {n.time}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteNote?.(n.id)}
                      title="Delete note"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "transparent",
                        border: "none",
                        color: T.textMute,
                        cursor: "pointer",
                        padding: 2,
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Row = ({ k, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
    <span style={{ fontSize: 12, color: T.textDim }}>{k}</span>
    <span style={{ ...mono, fontSize: 12, color: T.text }}>{v}</span>
  </div>
);

const EmptyState = ({ label, compact }) => (
  <div
    style={{
      background: T.card,
      border: `1px dashed ${T.border}`,
      padding: compact ? 24 : 48,
      textAlign: "center",
      ...mono,
      fontSize: 11,
      color: T.textMute,
      letterSpacing: "0.14em",
    }}
  >
    {label.toUpperCase()}
  </div>
);

// ---------- BIG BOARD PAGE (full) ----------
const BigBoardPage = ({ onOpenProfile, watchlist = [], compareIds = [], onToggleWatchlist, onToggleCompare, onOpenCompare, savedViews = [], onSaveView, onDeleteView }) => {
  const [watchOnly, setWatchOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [viewName, setViewName] = useState("");
  const lowered = query.trim().toLowerCase();
  const rows = PROSPECTS.filter((p) => {
    if (watchOnly && !watchlist.includes(p.id)) return false;
    if (!lowered) return true;
    const haystack = [p.name, p.school, p.pos, p.archetype, p.country].join(" ").toLowerCase();
    return haystack.includes(lowered);
  });
  const applyView = (state) => {
    setWatchOnly(Boolean(state?.watchOnly));
    setQuery(state?.query || "");
  };
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <Label>Class · 2025</Label>
      <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
        Big Board
      </h1>
      <div style={{ fontSize: 13, color: T.textDim, marginBottom: 18 }}>
        Ranked prospect index · live ordering
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", background: T.surface, border: `1px solid ${T.border}`, padding: "8px 12px" }}>
        <Search size={14} color={T.textMute} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, school, archetype, country…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: T.text,
            fontSize: 13,
            minWidth: 0,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 2, display: "flex" }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          placeholder="Save current view as…"
          style={{
            flex: "1 1 200px",
            minWidth: 160,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            color: T.text,
            padding: "6px 10px",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => { onSaveView?.(viewName, { watchOnly, query }); setViewName(""); }}
          disabled={!viewName.trim()}
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: viewName.trim() ? T.cyan : T.textMute,
            background: "transparent",
            border: `1px solid ${viewName.trim() ? T.cyan : T.border}`,
            padding: "6px 10px",
            cursor: viewName.trim() ? "pointer" : "not-allowed",
          }}
        >
          SAVE VIEW
        </button>
      </div>

      {savedViews.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {savedViews.map((view) => (
            <div key={view.id} style={{ display: "flex", alignItems: "stretch", border: `1px solid ${T.border}` }}>
              <button
                type="button"
                onClick={() => applyView(view.state)}
                style={{
                  ...mono,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: T.textDim,
                  background: "transparent",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
                title={`Filter: ${view.state?.watchOnly ? "watchlist" : "all"}${view.state?.query ? ` · "${view.state.query}"` : ""}`}
              >
                {view.name.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => onDeleteView?.(view.id)}
                title="Delete view"
                style={{
                  background: "transparent",
                  border: "none",
                  borderLeft: `1px solid ${T.border}`,
                  color: T.textMute,
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setWatchOnly((v) => !v)}
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: watchOnly ? T.cyan : T.textDim,
            background: watchOnly ? "rgba(34, 211, 238, 0.08)" : "transparent",
            border: `1px solid ${watchOnly ? T.cyan : T.border}`,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Star size={12} fill={watchOnly ? T.cyan : "transparent"} />
          {watchOnly ? `WATCHLIST · ${watchlist.length}` : `SHOW WATCHLIST · ${watchlist.length}`}
        </button>
        <button
          type="button"
          onClick={onOpenCompare}
          disabled={compareIds.length < 2}
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.12em",
            color: compareIds.length >= 2 ? T.cyan : T.textMute,
            background: "transparent",
            border: `1px solid ${T.border}`,
            padding: "8px 12px",
            cursor: compareIds.length >= 2 ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <GitCompare size={12} />
          {compareIds.length >= 2 ? `OPEN COMPARE · ${compareIds.length}` : `COMPARE QUEUE · ${compareIds.length}/3`}
        </button>
      </div>

      <div style={{ overflowX: "auto", background: T.surface, border: `1px solid ${T.border}` }}>
        <div style={{ minWidth: 720 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 80px 70px 90px 70px 80px",
              padding: "10px 16px",
              background: T.surface2,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            {["RANK", "PROSPECT", "POS", "CLASS", "SCHOOL", "SCORE", "ACTIONS"].map((h) => (
              <div key={h} style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em" }}>
                {h}
              </div>
            ))}
          </div>
          {rows.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.12em" }}>
              NO PROSPECTS IN WATCHLIST · CLICK ☆ TO SAVE
            </div>
          )}
          {rows.map((p) => {
            const isWatched = watchlist.includes(p.id);
            const isCompared = compareIds.includes(p.id);
            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 80px 70px 90px 70px 80px",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${T.borderSoft}`,
                  alignItems: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34, 211, 238, 0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div onClick={() => onOpenProfile(p.id)} style={{ ...mono, fontSize: 13, color: T.cyan, cursor: "pointer" }}>{String(p.rank).padStart(2, "0")}</div>
                <div onClick={() => onOpenProfile(p.id)} style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, cursor: "pointer" }}>
                  <PlayerImg p={p} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.archetype?.toUpperCase() || "—"}
                    </div>
                  </div>
                </div>
                <div onClick={() => onOpenProfile(p.id)} style={{ ...mono, fontSize: 11, color: T.textDim, cursor: "pointer" }}>{p.pos}</div>
                <div onClick={() => onOpenProfile(p.id)} style={{ ...mono, fontSize: 11, color: T.textDim, cursor: "pointer" }}>{p.cls || "—"}</div>
                <div onClick={() => onOpenProfile(p.id)} style={{ ...mono, fontSize: 11, color: T.textDim, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.school?.split(" ")[0]}</div>
                <div onClick={() => onOpenProfile(p.id)} style={{ ...mono, fontSize: 12, color: T.cyan, fontWeight: 600, cursor: "pointer" }}>{p.score?.toFixed(1) || "—"}</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(p.id); }}
                    title={isWatched ? "Remove from watchlist" : "Save to watchlist"}
                    style={{
                      background: "transparent",
                      border: `1px solid ${isWatched ? T.cyan : T.border}`,
                      color: isWatched ? T.cyan : T.textMute,
                      padding: 4,
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <Star size={12} fill={isWatched ? T.cyan : "transparent"} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleCompare?.(p.id); }}
                    title={isCompared ? "Remove from compare" : "Add to compare"}
                    style={{
                      background: "transparent",
                      border: `1px solid ${isCompared ? T.cyan : T.border}`,
                      color: isCompared ? T.cyan : T.textMute,
                      padding: 4,
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <GitCompare size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------- MY BOARD PAGE (custom rank order, exports, saved boards) ----------
function escapeCsvCell(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildBoardRows(orderedPlayers) {
  return orderedPlayers.map((p, index) => ({
    customRank: index + 1,
    defaultRank: p.rank,
    name: p.name,
    school: p.school,
    pos: p.pos,
    pos2: p.pos2,
    cls: p.cls,
    country: p.country,
    height: p.height,
    weight: p.weight,
    wingspan: p.wingspan,
    age: p.age,
    archetype: p.archetype,
    tier: p.tier,
    score: p.score,
    weightedTraitScore: p.weightedTraitScore,
    riskPenalty: p.riskPenalty,
    percentile: p.percentile,
  }));
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const MyBoardPage = ({
  myBoard = [],
  savedBoards = [],
  onReorder,
  onReset,
  onSaveBoard,
  onLoadBoard,
  onDeleteBoard,
  onOpenProfile,
}) => {
  const [name, setName] = useState("");
  const [draggingIndex, setDraggingIndex] = useState(null);
  const orderedPlayers = myBoard.map((id) => PROSPECTS.find((p) => p.id === id)).filter(Boolean);

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      board: buildBoardRows(orderedPlayers),
    };
    downloadBlob(
      `prospera-my-board-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const exportCsv = () => {
    const rows = buildBoardRows(orderedPlayers);
    const header = Object.keys(rows[0] || { customRank: "" });
    const lines = [header.join(",")];
    for (const row of rows) lines.push(header.map((k) => escapeCsvCell(row[k])).join(","));
    downloadBlob(
      `prospera-my-board-${new Date().toISOString().slice(0, 10)}.csv`,
      lines.join("\n"),
      "text/csv"
    );
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Label>Workspace</Label>
          <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            My Board
          </h1>
          <div style={{ fontSize: 13, color: T.textDim }}>
            Drag to reorder · {orderedPlayers.length} prospects
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={onReset} style={pillButtonStyle()}>
            RESET TO DEFAULT
          </button>
          <button type="button" onClick={exportJson} style={pillButtonStyle(T.cyan)}>
            <Download size={11} /> EXPORT JSON
          </button>
          <button type="button" onClick={exportCsv} style={pillButtonStyle(T.cyan)}>
            <Download size={11} /> EXPORT CSV
          </button>
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Save current board as…"
            style={{
              flex: "1 1 220px",
              minWidth: 180,
              background: T.surface2,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "8px 10px",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => { onSaveBoard?.(name); setName(""); }}
            disabled={!name.trim()}
            style={{
              ...pillButtonStyle(name.trim() ? T.cyan : T.textMute),
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            SAVE
          </button>
        </div>
        {savedBoards.length > 0 && (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {savedBoards.map((entry) => (
              <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${T.borderSoft}`, background: T.surface2 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{entry.name}</div>
                  <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2 }}>
                    {new Date(entry.createdAt).toLocaleString().toUpperCase()}
                  </div>
                </div>
                <button type="button" onClick={() => onLoadBoard?.(entry.id)} style={inlineActionStyle(T.cyan)}>LOAD</button>
                <button type="button" onClick={() => onDeleteBoard?.(entry.id)} style={inlineActionStyle(T.textMute)}>DELETE</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "44px 56px 1fr 70px 70px 60px",
            padding: "10px 14px",
            background: T.surface2,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          {["", "MY", "PROSPECT", "POS", "DEFAULT", "SCORE"].map((h) => (
            <div key={h} style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em" }}>{h}</div>
          ))}
        </div>
        {orderedPlayers.map((p, i) => {
          const isDragging = draggingIndex === i;
          return (
            <div
              key={p.id}
              draggable
              onDragStart={(e) => {
                setDraggingIndex(i);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(i));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = Number(e.dataTransfer.getData("text/plain"));
                if (Number.isFinite(fromIndex) && fromIndex !== i) onReorder?.(fromIndex, i);
                setDraggingIndex(null);
              }}
              onDragEnd={() => setDraggingIndex(null)}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 56px 1fr 70px 70px 60px",
                padding: "10px 14px",
                borderBottom: `1px solid ${T.borderSoft}`,
                alignItems: "center",
                background: isDragging ? "rgba(34, 211, 238, 0.06)" : "transparent",
                opacity: isDragging ? 0.5 : 1,
                cursor: "grab",
              }}
            >
              <div style={{ ...mono, fontSize: 14, color: T.textMute, lineHeight: 1, userSelect: "none" }} title="Drag to reorder">≡</div>
              <div style={{ ...mono, fontSize: 12, color: T.cyan }}>{String(i + 1).padStart(2, "0")}</div>
              <div onClick={() => onOpenProfile?.(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, cursor: "pointer" }}>
                <PlayerImg p={p} size={28} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.school?.toUpperCase()} · {p.cls || "—"}
                  </div>
                </div>
              </div>
              <div style={{ ...mono, fontSize: 11, color: T.textDim }}>{p.pos}</div>
              <div style={{ ...mono, fontSize: 11, color: T.textMute }}>#{String(p.rank).padStart(2, "0")}</div>
              <div style={{ ...mono, fontSize: 12, color: T.cyan, fontWeight: 600 }}>{p.score?.toFixed(1) || "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function pillButtonStyle(color) {
  return {
    ...mono,
    fontSize: 11,
    letterSpacing: "0.12em",
    color: color || T.textDim,
    background: "transparent",
    border: `1px solid ${color || T.border}`,
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
}

function inlineActionStyle(color) {
  return {
    ...mono,
    fontSize: 10,
    letterSpacing: "0.12em",
    color: color || T.textDim,
    background: "transparent",
    border: `1px solid ${T.border}`,
    padding: "5px 8px",
    cursor: "pointer",
  };
}

const ComparePage = ({ compareIds = [], onRemoveCompare, onClearCompare, onOpenProfile }) => {
  const players = compareIds.map((id) => PROSPECTS.find((p) => p.id === id)).filter(Boolean);
  const cols = Math.max(players.length, 1);
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Label>Manual</Label>
          <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Compare
          </h1>
          <div style={{ fontSize: 13, color: T.textDim }}>
            Side-by-side prospect comparison · {players.length}/3 queued
          </div>
        </div>
        {players.length > 0 && (
          <button
            type="button"
            onClick={onClearCompare}
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.12em",
              color: T.textDim,
              background: "transparent",
              border: `1px solid ${T.border}`,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            CLEAR ALL
          </button>
        )}
      </div>

      {players.length === 0 ? (
        <EmptyState label="Add prospects from the Big Board to start a comparison." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(260px, 1fr))`, gap: 12, minWidth: cols * 260 }}>
            {players.map((p) => (
              <CompareColumn key={p.id} p={p} onOpenProfile={onOpenProfile} onRemove={() => onRemoveCompare?.(p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CompareColumn = ({ p, onOpenProfile, onRemove }) => {
  const flagged = Object.entries(p.risks || {}).filter(([, v]) => v === 1);
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <PlayerImg p={p} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...mono, fontSize: 10, color: T.cyan, letterSpacing: "0.12em" }}>#{String(p.rank).padStart(2, "0")}</div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2 }}>
            {p.school?.toUpperCase()} · {p.pos}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenProfile?.(p.id)}
          title="Open profile"
          style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.cyan, padding: 6, cursor: "pointer" }}
        >
          <ExternalLink size={12} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove from compare"
          style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textMute, padding: 6, cursor: "pointer" }}
        >
          <X size={12} />
        </button>
      </div>

      <div style={{ padding: 14, display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <ScorePanel title="Board" value={p.score} sub={p.tier} color={T.cyan} />
          <ScorePanel title="Trait" value={p.weightedTraitScore} sub={p.percentile != null ? `${p.percentile}th pct` : "—"} color={T.blue} />
        </div>

        <div>
          <Label style={{ marginBottom: 8 }}>Trait Snapshot</Label>
          <div style={{ display: "grid", gap: 6 }}>
            {Object.entries(p.traits || {}).map(([k, v]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "84px 1fr 28px", gap: 8, alignItems: "center" }}>
                <span style={{ ...mono, fontSize: 9, color: T.textDim, letterSpacing: "0.08em" }}>{k.toUpperCase()}</span>
                <MetricBar value={v} />
                <span style={{ ...mono, fontSize: 10, color: T.text, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label style={{ marginBottom: 8 }}>Risk Profile</Label>
          {flagged.length === 0 ? (
            <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.12em" }}>NO ACTIVE RISKS</div>
          ) : (
            <div style={{ display: "grid", gap: 4 }}>
              {flagged.map(([k]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: `1px solid ${T.borderSoft}`, borderLeft: `2px solid ${T.warn}` }}>
                  <AlertTriangle size={11} color={T.warn} />
                  <span style={{ fontSize: 11, color: T.text }}>{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label style={{ marginBottom: 8 }}>Measurements</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Row k="Height" v={p.height || "—"} />
            <Row k="Weight" v={p.weight || "—"} />
            <Row k="Wing" v={p.wingspan || "—"} />
            <Row k="Age" v={p.age != null ? p.age : "—"} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- HISTORICAL PAGE ----------
const OUTCOME_TIER_COLORS = {
  Outlier: T.cyan,
  Star: T.cyan,
  Swing: T.warn,
  Rotation: T.blue,
  Bust: T.danger,
};

const HistoricalPage = () => {
  const [yearFilter, setYearFilter] = useState("ALL");
  const [posFilter, setPosFilter] = useState("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const years = useMemo(
    () => [...new Set(HISTORICAL_PROSPECTS.map((p) => p.draftYear))].sort((a, b) => b - a),
    []
  );
  const positionFamilies = useMemo(
    () => [...new Set(HISTORICAL_PROSPECTS.map((p) => p.positionFamily).filter(Boolean))].sort(),
    []
  );
  const outcomeTiers = useMemo(
    () => [...new Set(HISTORICAL_PROSPECTS.map((p) => p.outcomeTier).filter(Boolean))].sort(),
    []
  );

  const lowered = query.trim().toLowerCase();
  const filtered = HISTORICAL_PROSPECTS.filter((p) => {
    if (yearFilter !== "ALL" && p.draftYear !== Number(yearFilter)) return false;
    if (posFilter !== "ALL" && p.positionFamily !== posFilter) return false;
    if (outcomeFilter !== "ALL" && p.outcomeTier !== outcomeFilter) return false;
    if (lowered) {
      const haystack = [p.name, p.school, p.position, p.archetype, p.roleOutcome].join(" ").toLowerCase();
      if (!haystack.includes(lowered)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <Label>Archive{years.length > 0 ? ` · ${years[years.length - 1]}–${years[0]}` : ''}</Label>
        <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Historical
        </h1>
        <div style={{ fontSize: 13, color: T.textDim }}>
          {filtered.length} of {HISTORICAL_PROSPECTS.length} prospects across {years.length} draft classes
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", background: T.surface, border: `1px solid ${T.border}`, padding: "8px 12px" }}>
        <Search size={14} color={T.textMute} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, school, archetype…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: T.text,
            fontSize: 13,
            minWidth: 0,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <FilterSelect label="Year" value={yearFilter} onChange={setYearFilter} options={[["ALL", "All years"], ...years.map((y) => [String(y), String(y)])]} />
        <FilterSelect label="Position" value={posFilter} onChange={setPosFilter} options={[["ALL", "All positions"], ...positionFamilies.map((p) => [p, p])]} />
        <FilterSelect label="Outcome" value={outcomeFilter} onChange={setOutcomeFilter} options={[["ALL", "All outcomes"], ...outcomeTiers.map((o) => [o, o])]} />
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState label="No historical records match the current filters." />
        ) : (
          filtered.map((p) => <HistoricalCard key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, padding: "6px 10px" }}>
    <Label style={{ fontSize: 9 }}>{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...mono,
        fontSize: 11,
        letterSpacing: "0.06em",
        color: value === "ALL" ? T.textDim : T.cyan,
        background: T.surface2,
        border: `1px solid ${T.border}`,
        padding: "4px 8px",
        cursor: "pointer",
      }}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  </div>
);

const HistoricalCard = ({ p }) => {
  const tierColor = OUTCOME_TIER_COLORS[p.outcomeTier] || T.textMute;
  const initials = p.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${tierColor}` }}>
      <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "44px 56px 1fr auto", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
            border: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...mono,
            fontSize: 14,
            color: T.cyan,
            letterSpacing: "0.05em",
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.12em" }}>{p.draftYear}</div>
          <div style={{ ...mono, fontSize: 13, color: T.cyan, letterSpacing: "0.05em" }}>#{String(p.draftSlot).padStart(2, "0")}</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, color: T.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 3 }}>
            {p.school?.toUpperCase()} · {p.position} · {p.height}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ ...mono, fontSize: 9, letterSpacing: "0.12em", color: tierColor, border: `1px solid ${tierColor}`, padding: "2px 6px", textTransform: "uppercase" }}>
              {p.outcomeTier}
            </span>
            <span style={{ ...mono, fontSize: 9, letterSpacing: "0.12em", color: T.textDim, border: `1px solid ${T.borderSoft}`, padding: "2px 6px", textTransform: "uppercase" }}>
              {p.archetype}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: `1px solid ${T.borderSoft}` }}>
        {[
          ["PPG", p.pointsPerGame],
          ["RPG", p.reboundsPerGame],
          ["APG", p.assistsPerGame],
          ["TS%", p.trueShooting],
          ["BPM", p.bpm?.toFixed?.(1) ?? p.bpm],
        ].map(([k, v], i) => (
          <div
            key={k}
            style={{
              padding: "10px 12px",
              borderRight: i < 4 ? `1px solid ${T.borderSoft}` : "none",
            }}
          >
            <div style={{ ...mono, fontSize: 8, color: T.textMute, letterSpacing: "0.14em" }}>{k}</div>
            <div style={{ ...mono, fontSize: 13, color: T.text, marginTop: 4 }}>{v ?? "—"}</div>
          </div>
        ))}
      </div>

      {p.notes && (
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.borderSoft}`, fontSize: 12, color: T.textDim, lineHeight: 1.55, fontStyle: "italic" }}>
          "{p.notes}"
        </div>
      )}

      <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.borderSoft}`, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>
          ROLE: <span style={{ color: T.text }}>{p.roleOutcome || "—"}</span>
        </span>
        <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>
          ERA: <span style={{ color: T.text }}>{p.eraBucket || "—"}</span>
        </span>
        <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>
          SLOT: <span style={{ color: T.text }}>{p.draftSlotBand || "—"}</span>
        </span>
      </div>
    </div>
  );
};

// ---------- MAIN ----------
export default function ProsperaApp() {
  const [route, setRoute] = useState("Dashboard");
  const [selectedId, setSelectedId] = useState("p1");
  const [dashSelected, setDashSelected] = useState(["p1", "p2"]);
  const [profileId, setProfileId] = useState(null);
  const [railOpen, setRailOpen] = useState(false);
  const [watchlist, setWatchlist] = useLocalStorageState("prospera.terminal.watchlist", []);
  const [compareIds, setCompareIds] = useLocalStorageState("prospera.terminal.compare", []);
  const [notesByPlayer, setNotesByPlayer] = useLocalStorageState("prospera.terminal.notes", {});
  const [myBoard, setMyBoard] = useLocalStorageState("prospera.terminal.my-board", PROSPECTS.map((p) => p.id));
  const [savedBoards, setSavedBoards] = useLocalStorageState("prospera.terminal.saved-boards", []);
  const [customTiers, setCustomTiers] = useLocalStorageState("prospera.terminal.custom-tiers", {});
  const [customTags, setCustomTags] = useLocalStorageState("prospera.terminal.custom-tags", {});
  const [savedViews, setSavedViews] = useLocalStorageState("prospera.terminal.saved-views", []);

  const saveView = (name, state) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    setSavedViews((curr) => [
      { id: `${Date.now()}`, name: trimmed, state, createdAt: new Date().toISOString() },
      ...curr.filter((entry) => entry.name !== trimmed),
    ]);
  };

  const deleteView = (id) => {
    setSavedViews((curr) => curr.filter((entry) => entry.id !== id));
  };

  const setCustomTier = (id, tier) => {
    setCustomTiers((curr) => {
      if (!tier) {
        const { [id]: _removed, ...rest } = curr;
        return rest;
      }
      return { ...curr, [id]: tier };
    });
  };

  const toggleCustomTag = (id, tag) => {
    setCustomTags((curr) => {
      const existing = curr[id] || [];
      const next = existing.includes(tag) ? existing.filter((t) => t !== tag) : [...existing, tag];
      if (next.length === 0) {
        const { [id]: _removed, ...rest } = curr;
        return rest;
      }
      return { ...curr, [id]: next };
    });
  };

  React.useEffect(() => {
    setMyBoard((curr) => {
      const validIds = new Set(PROSPECTS.map((p) => p.id));
      const persisted = curr.filter((id) => validIds.has(id));
      const missing = PROSPECTS.map((p) => p.id).filter((id) => !persisted.includes(id));
      if (persisted.length === curr.length && missing.length === 0) return curr;
      return [...persisted, ...missing];
    });
  }, [setMyBoard]);

  const reorderMyBoard = (fromIndex, toIndex) => {
    setMyBoard((curr) => {
      const next = [...curr];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const resetMyBoard = () => {
    setMyBoard(PROSPECTS.map((p) => p.id));
  };

  const saveCurrentBoard = (name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    setSavedBoards((curr) => [
      { id: `${Date.now()}`, name: trimmed, boardIds: myBoard, createdAt: new Date().toISOString() },
      ...curr.filter((entry) => entry.name !== trimmed),
    ]);
  };

  const loadSavedBoard = (id) => {
    const board = savedBoards.find((entry) => entry.id === id);
    if (board) setMyBoard(board.boardIds);
  };

  const deleteSavedBoard = (id) => {
    setSavedBoards((curr) => curr.filter((entry) => entry.id !== id));
  };

  const addNote = (playerId, text) => {
    const note = {
      id: `${playerId}-${Date.now()}`,
      text,
      time: new Date().toLocaleString().toUpperCase(),
    };
    setNotesByPlayer((curr) => ({
      ...curr,
      [playerId]: [note, ...(curr[playerId] || [])],
    }));
  };

  const deleteNote = (noteId) => {
    setNotesByPlayer((curr) => {
      const next = {};
      for (const [playerId, list] of Object.entries(curr)) {
        const filtered = list.filter((n) => n.id !== noteId);
        if (filtered.length > 0) next[playerId] = filtered;
      }
      return next;
    });
  };

  const toggleWatchlist = (id) => {
    setWatchlist((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  };

  const toggleCompare = (id) => {
    setCompareIds((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= 3) return [...curr.slice(1), id];
      return [...curr, id];
    });
  };

  const addToSelected = (id) => {
    setDashSelected((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= 2) return [curr[1], id];
      return [...curr, id];
    });
    setSelectedId(id);
  };

  const removeFromSelected = (id) => {
    setDashSelected((curr) => curr.filter((x) => x !== id));
  };

  const onOpenProfile = (id) => {
    setProfileId(id);
    setSelectedId(id);
    setRoute("Player");
  };

  const profilePlayer = profileId ? PROSPECTS.find((p) => p.id === profileId) : null;

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.text,
        fontFamily:
          '-apple-system, "Segoe UI", system-ui, "Helvetica Neue", sans-serif',
        backgroundImage: `
          linear-gradient(${T.grid} 1px, transparent 1px),
          linear-gradient(90deg, ${T.grid} 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <style>{`
        html, body { overflow-x: hidden; }
        @media (max-width: 880px) {
          .prospera-rail { display: ${railOpen ? "block" : "none"} !important; position: fixed !important; left: 0; top: 52px; z-index: 40; height: calc(100vh - 52px) !important; box-shadow: 0 0 40px rgba(0,0,0,0.6); }
          .prospera-mobile-only { display: inline-flex !important; }
          .prospera-desktop-only { display: none !important; }
          .prospera-nav-items { overflow-x: auto; min-width: 0; flex-wrap: nowrap !important; scrollbar-width: none; }
          .prospera-nav-items::-webkit-scrollbar { display: none; }
          .prospera-nav-items button { flex-shrink: 0; padding: 8px 10px !important; }
          .prospera-topbar { gap: 10px !important; padding: 0 12px !important; }
          .prospera-brand-version { display: none !important; }
          .prospera-dash-grid { grid-template-columns: 1fr !important; }
          .prospera-stat-grid, .prospera-sw-grid, .prospera-eval-grid { grid-template-columns: 1fr !important; }
          .prospera-shot-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .prospera-meta-strip { grid-template-columns: repeat(3, 1fr) !important; }
          .prospera-name { font-size: 40px !important; }
          .prospera-hero-grid { grid-template-columns: 1fr !important; gap: 18px !important; text-align: left; }
          .prospera-hero-score { border-left: none !important; padding-left: 0 !important; border-top: 1px solid ${T.border}; padding-top: 16px; text-align: left !important; }
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${T.surface}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.cyan}; }
      `}</style>

      <TopNav active={route === "Player" ? "Big Board" : route} setActive={setRoute} onMenu={() => setRailOpen(!railOpen)} />

      <div style={{ display: "flex" }}>
        <BigBoardRail
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (route === "Dashboard") {
              addToSelected(id);
            } else if (route === "Big Board" || route === "Player") {
              onOpenProfile(id);
            }
          }}
          open={railOpen}
          onClose={() => setRailOpen(false)}
        />

        <main style={{ flex: 1, minWidth: 0 }}>
          {route === "Dashboard" && (
            <DashboardPage
              selected={selectedId}
              setSelected={setSelectedId}
              onOpenProfile={onOpenProfile}
              addToSelected={addToSelected}
              removeFromSelected={removeFromSelected}
              dashSelected={dashSelected}
            />
          )}
          {route === "Big Board" && (
            <BigBoardPage
              onOpenProfile={onOpenProfile}
              watchlist={watchlist}
              compareIds={compareIds}
              onToggleWatchlist={toggleWatchlist}
              onToggleCompare={toggleCompare}
              onOpenCompare={() => setRoute("Compare")}
              savedViews={savedViews}
              onSaveView={saveView}
              onDeleteView={deleteView}
            />
          )}
          {route === "My Board" && (
            <MyBoardPage
              myBoard={myBoard}
              savedBoards={savedBoards}
              onReorder={reorderMyBoard}
              onReset={resetMyBoard}
              onSaveBoard={saveCurrentBoard}
              onLoadBoard={loadSavedBoard}
              onDeleteBoard={deleteSavedBoard}
              onOpenProfile={onOpenProfile}
            />
          )}
          {route === "Compare" && (
            <ComparePage
              compareIds={compareIds}
              onRemoveCompare={toggleCompare}
              onClearCompare={() => setCompareIds([])}
              onOpenProfile={onOpenProfile}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
              onToggleCompare={toggleCompare}
            />
          )}
          {route === "Notes" && (
            <NotesWorkspacePage
              notes={notesByPlayer}
              onSelectPlayer={onOpenProfile}
              onDeleteNote={deleteNote}
            />
          )}
          {route === "Historical" && <HistoricalPage />}
          {route === "Reports" && (
            <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
              <Label>Generated</Label>
              <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 24px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Reports
              </h1>
              <EmptyState label="No reports generated yet." />
            </div>
          )}
          {route === "Player" && profilePlayer && (
            <PlayerProfilePage
              p={profilePlayer}
              onBack={() => setRoute("Big Board")}
              notes={notesByPlayer[profilePlayer.id] || []}
              onAddNote={addNote}
              onDeleteNote={deleteNote}
              customTier={customTiers[profilePlayer.id] || ""}
              customTags={customTags[profilePlayer.id] || []}
              onSetCustomTier={(tier) => setCustomTier(profilePlayer.id, tier)}
              onToggleCustomTag={(tag) => toggleCustomTag(profilePlayer.id, tag)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
