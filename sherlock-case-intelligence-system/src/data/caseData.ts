/* ── SHERLOCK // CASE INTELLIGENCE — dossier data ────────────────────
   All case content lives here so it can be swapped wholesale.        */

export interface Evidence {
  id: string;
  exhibit: string;
  title: string;
  type: string;
  discovered: string;
  location: string;
  confidence: number;
  description: string;
  analysis: string;
  img: string | null;
  connections: string[];
}

export interface Suspect {
  id: string;
  name: string;
  initials: string;
  role: "PRIMARY SUSPECT" | "PERSON OF INTEREST" | "WITNESS" | "UNIDENTIFIED";
  description: string;
  alibi: string;
  clueAgainst: string;
  photo: string;
  lastSeen: string;
  connectionCount: number;
  status: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  event: string;
  type: string;
  critical?: boolean;
  connected: string[];
}

export interface Contradiction {
  id: string;
  items: string[];
  description: string;
  significance: "high" | "critical";
}

export type NodeKind = "case" | "evidence" | "suspect" | "location" | "event";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  name: string;
  sub: string;
  x: number; // viewBox 0..1000
  y: number; // viewBox 0..580
  labelAbove?: boolean;
}

export interface GraphEdge {
  a: string;
  b: string;
  contradiction?: boolean;
  bend?: number;
}

export const CASE = {
  id: "SH-4091",
  title: "THE SAPPHIRE THEFT",
  status: "ACTIVE",
  opened: "14 NOV 1897",
  confidence: 72,
  summary:
    "A priceless sapphire was stolen during a high-society party. Five suspects were present, each with an alibi, but evidence points to foul play.",
};

/* ── Evidence ─────────────────────────────────────────────────────── */
export const EVIDENCE: Evidence[] = [
  {
    id: "E-101",
    exhibit: "EXHIBIT A",
    title: "Overdue Promissory Notes",
    type: "DOCUMENT",
    discovered: "14 NOV 1897",
    location: "Earl's Study",
    confidence: 90,
    img: "/img/ev-letter.jpg",
    description: "Several overdue debts signed by the Earl, indicating imminent financial ruin.",
    analysis: "The Earl was desperate for funds to avoid bankruptcy.",
    connections: ["S-01"],
  },
  {
    id: "E-102",
    exhibit: "EXHIBIT B",
    title: "Vault Key Missing",
    type: "PHYSICAL",
    discovered: "14 NOV 1897",
    location: "Hallway near vault",
    confidence: 85,
    img: "/img/ev-ticket.jpg",
    description: "A witness saw the Countess near the vault right before the theft was discovered.",
    analysis: "The Countess had opportunity and proximity to the missing sapphire.",
    connections: ["S-02"],
  },
  {
    id: "E-103",
    exhibit: "EXHIBIT C",
    title: "Muddy Footprints",
    type: "FORENSIC",
    discovered: "14 NOV 1897",
    location: "Balcony Window",
    confidence: 88,
    img: "/img/ev-photo.jpg",
    description: "Muddy footprints size 10 matching the Butler's shoes.",
    analysis: "The Butler claims to have been inside serving drinks, but the mud suggests otherwise.",
    connections: ["S-03"],
  },
  {
    id: "E-104",
    exhibit: "EXHIBIT D",
    title: "Glass Cutter",
    type: "PHYSICAL",
    discovered: "14 NOV 1897",
    location: "Gallery floor",
    confidence: 95,
    img: "/img/ev-watch.jpg",
    description: "A professional diamond-tipped glass cutter dropped in the gallery.",
    analysis: "Only a professional gemologist would carry such a specialized tool to a party.",
    connections: ["S-04"],
  },
  {
    id: "E-105",
    exhibit: "EXHIBIT E",
    title: "Fingerprint on Display Case",
    type: "FORENSIC",
    discovered: "14 NOV 1897",
    location: "Display Room",
    confidence: 92,
    img: "/img/board-bg.jpg",
    description: "A smudge on the display case matching the Maid's fingers.",
    analysis: "The Maid was seen examining the sapphire earlier that day, showing unusual interest.",
    connections: ["S-05"],
  }
];

/* ── Suspects ─────────────────────────────────────────────────────── */
export const SUSPECTS: Suspect[] = [
  {
    id: "S-01",
    name: "The Earl",
    initials: "TE",
    role: "PERSON OF INTEREST",
    description: "Host of the party. Deep in debt.",
    alibi: "Entertaining guests in the ballroom.",
    clueAgainst: "Overdue debts (Motive)",
    photo: "/sus/781e8c81-cc76-4c6d-9e07-470e099262f4.png",
    lastSeen: "Ballroom, 21:00",
    connectionCount: 1,
    status: "UNDER INVESTIGATION",
  },
  {
    id: "S-02",
    name: "The Countess",
    initials: "TC",
    role: "PERSON OF INTEREST",
    description: "Wife of the Earl. Found near the vault.",
    alibi: "Resting in her chambers.",
    clueAgainst: "Seen near the vault",
    photo: "/sus/8914b23d-06b2-4017-b344-1eee57d95845.png",
    lastSeen: "Hallway, 21:15",
    connectionCount: 1,
    status: "UNDER INVESTIGATION",
  },
  {
    id: "S-03",
    name: "The Butler",
    initials: "TB",
    role: "PERSON OF INTEREST",
    description: "Loyal servant. Suspicious footprints.",
    alibi: "Serving drinks in the lounge.",
    clueAgainst: "Muddy footprints near window",
    photo: "/sus/9494adc6-8183-4997-8d5d-12f49181d346.png",
    lastSeen: "Lounge, 21:10",
    connectionCount: 1,
    status: "UNDER INVESTIGATION",
  },
  {
    id: "S-04",
    name: "The Gemologist",
    initials: "TG",
    role: "PERSON OF INTEREST",
    description: "Rival collector. Dropped a tool.",
    alibi: "Admiring paintings in the gallery.",
    clueAgainst: "Dropped a glass cutter",
    photo: "/sus/9a1deb8c-f24c-49f2-86ae-b17ddbc0874a.png",
    lastSeen: "Gallery, 20:50",
    connectionCount: 1,
    status: "UNDER INVESTIGATION",
  },
  {
    id: "S-05",
    name: "The Maid",
    initials: "TM",
    role: "PERSON OF INTEREST",
    description: "New employee. Admired the gem.",
    alibi: "Cleaning the kitchen.",
    clueAgainst: "Fingerprints on the display case",
    photo: "/sus/c44311ed-3f6b-41a9-8934-a68a8fe4e144.png",
    lastSeen: "Kitchen, 21:30",
    connectionCount: 1,
    status: "UNDER INVESTIGATION",
  }
];

/* ── Timeline ─────────────────────────────────────────────────────── */
export const TIMELINE: TimelineEvent[] = [
  { id: "T-1", time: "20:00", event: "Party begins", type: "RECORD", connected: [] },
  { id: "T-2", time: "21:00", event: "Sapphire last confirmed safe", type: "RECORD", connected: [] },
  { id: "T-3", time: "21:30", event: "Theft discovered", type: "CRITICAL EVENT", critical: true, connected: ["S-01", "S-02", "S-03", "S-04", "S-05"] },
];

/* ── Constellation (viewBox 1000 × 580) ───────────────────────────── */
export const NODES: GraphNode[] = [
  { id: "CASE", kind: "case", label: "THE SAPPHIRE THEFT", name: "The Sapphire Theft", sub: "CASE FILE SH-4091", x: 500, y: 290, labelAbove: true },
  { id: "E-101", kind: "evidence", label: "PROMISSORY NOTES", name: "Overdue Notes", sub: "EVIDENCE • 90%", x: 300, y: 150 },
  { id: "E-102", kind: "evidence", label: "MISSING KEY", name: "Vault Key Missing", sub: "EVIDENCE • 85%", x: 700, y: 150 },
  { id: "E-103", kind: "evidence", label: "MUDDY FOOTPRINTS", name: "Footprints", sub: "EVIDENCE • 88%", x: 800, y: 350 },
  { id: "E-104", kind: "evidence", label: "GLASS CUTTER", name: "Glass Cutter", sub: "EVIDENCE • 95%", x: 500, y: 480 },
  { id: "E-105", kind: "evidence", label: "FINGERPRINTS", name: "Display Smudge", sub: "EVIDENCE • 92%", x: 200, y: 350 },
  
  { id: "S-01", kind: "suspect", label: "THE EARL", name: "The Earl", sub: "SUSPECT", x: 200, y: 100 },
  { id: "S-02", kind: "suspect", label: "THE COUNTESS", name: "The Countess", sub: "SUSPECT", x: 800, y: 100 },
  { id: "S-03", kind: "suspect", label: "THE BUTLER", name: "The Butler", sub: "SUSPECT", x: 900, y: 450 },
  { id: "S-04", kind: "suspect", label: "THE GEMOLOGIST", name: "The Gemologist", sub: "SUSPECT", x: 500, y: 550 },
  { id: "S-05", kind: "suspect", label: "THE MAID", name: "The Maid", sub: "SUSPECT", x: 100, y: 450 },
];

export const EDGES: GraphEdge[] = [
  { a: "CASE", b: "E-101" }, { a: "CASE", b: "E-102" }, { a: "CASE", b: "E-103" }, { a: "CASE", b: "E-104" }, { a: "CASE", b: "E-105" },
  { a: "E-101", b: "S-01" },
  { a: "E-102", b: "S-02" },
  { a: "E-103", b: "S-03" },
  { a: "E-104", b: "S-04" },
  { a: "E-105", b: "S-05" }
];

export const CONTRADICTIONS: Contradiction[] = [];

/* ── Deduction ────────────────────────────────────────────────────── */
export const DEDUCTION = {
  confidence: 87,
  statement: "Reviewing all clues and alibis, one suspect's story completely unravels when placed against the physical evidence found at the scene.",
  supporting: ["E-101", "E-102", "E-103", "E-104", "E-105"],
  contradictions: [],
};

/* ── Activity feed ────────────────────────────────────────────────── */
export interface ActivityItem {
  time: string;
  title: string;
  detail: string;
  tone: "normal" | "critical" | "success";
}

export const ACTIVITY: ActivityItem[] = [
  { time: "JUST NOW", title: "All Suspects Interviewed", detail: "5 alibis collected.", tone: "success" },
];

/* ── Lookups ──────────────────────────────────────────────────────── */
export const evidenceById = (id: string) => EVIDENCE.find((e) => e.id === id);
export const suspectById = (id: string) => SUSPECTS.find((s) => s.id === id);
export const nodeById = (id: string) => NODES.find((n) => n.id === id);

export function entityName(id: string): string {
  if (id === "CASE") return CASE.title;
  const e = evidenceById(id);
  if (e) return e.title;
  const s = suspectById(id);
  if (s) return s.name;
  const n = nodeById(id);
  if (n) return n.name;
  return id;
}

export function kindLabel(id: string): string {
  const n = nodeById(id);
  if (!n) return "RECORD";
  return n.kind.toUpperCase();
}

/** neighbours of a node in the constellation */
export function neighbours(id: string): Set<string> {
  const set = new Set<string>();
  for (const e of EDGES) {
    if (e.a === id) set.add(e.b);
    if (e.b === id) set.add(e.a);
  }
  return set;
}
