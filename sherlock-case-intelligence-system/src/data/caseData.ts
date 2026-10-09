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
  id: "SH-2048",
  title: "THE BLACKWOOD AFFAIR",
  status: "ACTIVE",
  opened: "12 OCT 1897",
  confidence: 87,
  summary:
    "Investigation into suspicious circumstances at Blackwood Estate following the reported incident of 23:47, 14 October 1897.",
};

/* ── Evidence ─────────────────────────────────────────────────────── */
export const EVIDENCE: Evidence[] = [
  {
    id: "E-024",
    exhibit: "EXHIBIT A",
    title: "Handwritten Letter",
    type: "DOCUMENT",
    discovered: "14 OCT 1897",
    location: "Study desk",
    confidence: 94,
    img: "/img/ev-letter.jpg",
    description:
      "A letter written in blue-black ink, matching the composition of three prior documents. Contains references to a meeting on the night of the incident.",
    analysis:
      "The handwriting analysis reveals a 94% correlation with three previously catalogued documents from the estate archives. The ink composition suggests the letter was written within the same period as Evidence #017 and #019 — and the pressure pattern of the final signature betrays deliberate hesitation, as though the hand were guided, not willing.",
    connections: ["S-01", "L-01", "T-06", "E-031", "E-017"],
  },
  {
    id: "E-017",
    exhibit: "EXHIBIT B",
    title: "Torn Photograph",
    type: "PHOTOGRAPH",
    discovered: "13 OCT 1897",
    location: "Library floor",
    confidence: 78,
    img: "/img/ev-photo.jpg",
    description:
      "A photograph deliberately torn in half. The remaining portion shows the east wing of Blackwood Estate at dusk.",
    analysis:
      "The tear is recent — fibres at the separation have not yet oxidised. The missing half would show whoever stood before the east wing. Someone wanted that person erased from the record, yet kept the half that proves the location mattered.",
    connections: ["L-01", "E-024"],
  },
  {
    id: "E-019",
    exhibit: "EXHIBIT C",
    title: "Train Ticket Stub",
    type: "PHYSICAL",
    discovered: "14 OCT 1897",
    location: "Coat pocket",
    confidence: 88,
    img: "/img/ev-ticket.jpg",
    description:
      "A return ticket from London Paddington to Blackwood Halt, dated 14 October. The journey takes approximately 90 minutes.",
    analysis:
      "The punch-mark places the bearer on the 18:05 departure, arriving Blackwood Halt at 19:42 — eighty minutes before the unknown carriage was sighted. The crease pattern indicates the stub was folded twice and carried against the body, in an inner pocket. It was meant to survive the evening.",
    connections: ["S-02", "T-03"],
  },
  {
    id: "E-031",
    exhibit: "EXHIBIT D",
    title: "Chemical Residue",
    type: "FORENSIC",
    discovered: "15 OCT 1897",
    location: "Study carpet",
    confidence: 91,
    img: null,
    description:
      "A chemical compound found on the study carpet near the window. Analysis suggests phosphorus-based origin.",
    analysis:
      "Phosphorus sesquisulfide — the compound ignites at low temperature and leaves precisely this signature. Traced in an arc from the window casing toward the hearth, it indicates a fuse line, lit from outside the room. Whatever burned in that study at 23:47 was lit by a hand that never entered it.",
    connections: ["L-01", "T-06", "E-024"],
  },
  {
    id: "E-012",
    exhibit: "EXHIBIT E",
    title: "Witness Testimony",
    type: "TESTIMONY",
    discovered: "13 OCT 1897",
    location: "Village pub",
    confidence: 62,
    img: null,
    description:
      "Mrs. Pemberton reports seeing an unfamiliar carriage arrive at the estate at approximately 21:00. She noted the driver wore a distinctive grey coat.",
    analysis:
      "Mrs. Pemberton's account is internally consistent across three separate interviews — rare for a witness of her years. The 21:00 arrival cannot be reconciled with Dr. Crawford's stated 21:15 arrival unless one of them is protecting the other. The grey coat remains our only description of the third party.",
    connections: ["S-03", "T-01", "T-02"],
  },
  {
    id: "E-008",
    exhibit: "EXHIBIT F",
    title: "Financial Ledger",
    type: "DOCUMENT",
    discovered: "12 OCT 1897",
    location: "Estate safe",
    confidence: 85,
    img: null,
    description:
      "The estate's financial records show three unusual withdrawals in the week prior to the incident, totaling £450.",
    analysis:
      "Three withdrawals, each below the threshold that would require a co-signature — the pattern of a man paying for something in instalments without alerting his solicitors. The final withdrawal was made on the morning of the 14th. £450 buys silence, passage, or phosphorus.",
    connections: ["S-01", "S-02"],
  },
  {
    id: "E-033",
    exhibit: "EXHIBIT G",
    title: "Broken Pocket Watch",
    type: "PHYSICAL",
    discovered: "15 OCT 1897",
    location: "Garden path",
    confidence: 96,
    img: "/img/ev-watch.jpg",
    description:
      "A gentleman's pocket watch, stopped at precisely 23:47. The glass is cracked from impact.",
    analysis:
      "Stopped at precisely 23:47 — the minute of the incident. Yet the watch was found fifty paces from the study, on the garden path, beneath the east window. A man does not drop his watch indoors and find it in the garden. It was carried there, broken deliberately, and left as a signature. This is the keystone of the case.",
    connections: ["T-06", "L-02"],
  },
];

/* ── Suspects ─────────────────────────────────────────────────────── */
export const SUSPECTS: Suspect[] = [
  {
    id: "S-01",
    name: "Lord Thomas Blackwood",
    initials: "TB",
    role: "PRIMARY SUSPECT",
    description:
      "Owner of Blackwood Estate. Claims to have retired early. £450 withdrawn in the week prior.",
    lastSeen: "Last seen at the estate, 22:00",
    connectionCount: 6,
    status: "UNDER INVESTIGATION",
  },
  {
    id: "S-02",
    name: "Dr. James Crawford",
    initials: "JC",
    role: "PERSON OF INTEREST",
    description:
      "Family physician. Arrived by train from London on the day of the incident. Claims the visit was routine.",
    lastSeen: "Ticket stub places him on the 18:05",
    connectionCount: 4,
    status: "UNDER INVESTIGATION",
  },
  {
    id: "S-03",
    name: "Unknown Visitor",
    initials: "?",
    role: "UNIDENTIFIED",
    description:
      "Arrived by carriage at approximately 21:00. Described as wearing a grey coat. Identity unconfirmed.",
    lastSeen: "Carriage sighted 21:00, estate gates",
    connectionCount: 3,
    status: "UNIDENTIFIED",
  },
  {
    id: "S-04",
    name: "Eleanor Blackwood",
    initials: "EB",
    role: "WITNESS",
    description:
      "Wife of Lord Blackwood. Reports hearing raised voices at approximately 22:30. Currently staying with relatives.",
    lastSeen: "Statement recorded, 13 Oct",
    connectionCount: 2,
    status: "COOPERATIVE",
  },
  {
    id: "S-05",
    name: "Mr. Hargreaves",
    initials: "MH",
    role: "PERSON OF INTEREST",
    description:
      "Estate butler of 12 years. Discovered the broken pocket watch. Reported the incident to authorities at 00:15.",
    lastSeen: "Quartered at the estate, 00:15",
    connectionCount: 3,
    status: "COOPERATIVE",
  },
];

/* ── Timeline ─────────────────────────────────────────────────────── */
export const TIMELINE: TimelineEvent[] = [
  { id: "T-01", time: "19:30", event: "Dr. Crawford departs London", type: "MOVEMENT", connected: ["S-02", "E-019"] },
  { id: "T-02", time: "21:00", event: "Unknown carriage arrives", type: "WITNESS REPORT", critical: true, connected: ["S-03", "E-012"] },
  { id: "T-03", time: "21:15", event: "Dr. Crawford arrives at estate", type: "MOVEMENT", connected: ["S-02", "E-019"] },
  { id: "T-04", time: "22:00", event: "Lord Blackwood retires to study", type: "STATEMENT", connected: ["S-01"] },
  { id: "T-05", time: "22:30", event: "Raised voices heard", type: "WITNESS REPORT", critical: true, connected: ["S-04"] },
  { id: "T-06", time: "23:47", event: "The Incident", type: "CRITICAL EVENT", critical: true, connected: ["E-033", "E-031", "E-024"] },
  { id: "T-07", time: "00:15", event: "Incident reported to authorities", type: "RECORD", connected: ["S-05"] },
  { id: "T-08", time: "08:00", event: "Investigation commenced", type: "RECORD", connected: [] },
];

/* ── Constellation (viewBox 1000 × 580) ───────────────────────────── */
export const NODES: GraphNode[] = [
  { id: "CASE", kind: "case", label: "THE BLACKWOOD AFFAIR", name: "The Blackwood Affair", sub: "CASE FILE SH-2048", x: 500, y: 296, labelAbove: true },
  { id: "E-024", kind: "evidence", label: "HANDWRITTEN LETTER", name: "Handwritten Letter", sub: "EVIDENCE E-024 • 94%", x: 330, y: 140 },
  { id: "E-017", kind: "evidence", label: "TORN PHOTOGRAPH", name: "Torn Photograph", sub: "EVIDENCE E-017 • 78%", x: 654, y: 106 },
  { id: "E-019", kind: "evidence", label: "TRAIN TICKET", name: "Train Ticket Stub", sub: "EVIDENCE E-019 • 88%", x: 800, y: 262 },
  { id: "E-031", kind: "evidence", label: "CHEMICAL RESIDUE", name: "Chemical Residue", sub: "EVIDENCE E-031 • 91%", x: 328, y: 452 },
  { id: "E-012", kind: "evidence", label: "WITNESS TESTIMONY", name: "Witness Testimony", sub: "EVIDENCE E-012 • 62%", x: 148, y: 300 },
  { id: "E-008", kind: "evidence", label: "FINANCIAL LEDGER", name: "Financial Ledger", sub: "EVIDENCE E-008 • 85%", x: 644, y: 470 },
  { id: "E-033", kind: "evidence", label: "POCKET WATCH", name: "Broken Pocket Watch", sub: "EVIDENCE E-033 • 96%", x: 852, y: 440 },
  { id: "S-01", kind: "suspect", label: "LORD BLACKWOOD", name: "Lord Thomas Blackwood", sub: "PRIMARY SUSPECT • S-01", x: 196, y: 102 },
  { id: "S-02", kind: "suspect", label: "DR. CRAWFORD", name: "Dr. James Crawford", sub: "PERSON OF INTEREST • S-02", x: 904, y: 126 },
  { id: "S-03", kind: "suspect", label: "UNKNOWN VISITOR", name: "Unknown Visitor", sub: "UNIDENTIFIED • S-03", x: 70, y: 196 },
  { id: "S-04", kind: "suspect", label: "ELEANOR B.", name: "Eleanor Blackwood", sub: "WITNESS • S-04", x: 122, y: 496 },
  { id: "S-05", kind: "suspect", label: "MR. HARGREAVES", name: "Mr. Hargreaves", sub: "PERSON OF INTEREST • S-05", x: 212, y: 432 },
  { id: "L-01", kind: "location", label: "THE STUDY", name: "Blackwood Estate — Study", sub: "PRIMARY SCENE • L-01", x: 470, y: 58 },
  { id: "L-02", kind: "location", label: "GARDEN PATH", name: "Blackwood Estate — Garden Path", sub: "SECONDARY SCENE • L-02", x: 930, y: 512 },
  { id: "T-06", kind: "event", label: "23:47 INCIDENT", name: "The Incident", sub: "CRITICAL EVENT • T-06", x: 562, y: 190 },
  { id: "T-02", kind: "event", label: "CARRIAGE ARRIVES", name: "Unknown carriage arrives", sub: "WITNESS REPORT • T-02", x: 254, y: 344 },
  { id: "T-05", kind: "event", label: "RAISED VOICES", name: "Raised voices heard", sub: "WITNESS REPORT • T-05", x: 288, y: 528 },
];

export const EDGES: GraphEdge[] = [
  { a: "CASE", b: "E-024" }, { a: "CASE", b: "E-017" }, { a: "CASE", b: "E-019" },
  { a: "CASE", b: "E-031" }, { a: "CASE", b: "E-012" }, { a: "CASE", b: "E-008" },
  { a: "CASE", b: "E-033" },
  { a: "E-024", b: "S-01" }, { a: "E-024", b: "E-017" }, { a: "E-024", b: "T-06" },
  { a: "E-024", b: "E-031", bend: -38 },
  { a: "E-019", b: "S-02" },
  { a: "E-012", b: "S-03" }, { a: "E-012", b: "T-02" },
  { a: "E-008", b: "S-01", bend: 42 }, { a: "E-008", b: "S-02" },
  { a: "E-033", b: "T-06", bend: 30 }, { a: "E-033", b: "L-02" },
  { a: "E-031", b: "L-01", bend: -30 },
  { a: "E-017", b: "L-01" },
  { a: "S-01", b: "S-02", bend: -30 },
  { a: "S-04", b: "T-05" },
  { a: "S-05", b: "S-01" },
  { a: "E-012", b: "S-02", contradiction: true, bend: -60 },
  { a: "S-01", b: "T-05", contradiction: true, bend: 34 },
];

/* ── Contradictions ───────────────────────────────────────────────── */
export const CONTRADICTIONS: Contradiction[] = [
  {
    id: "C-01",
    items: ["E-012", "S-02"],
    description:
      "Mrs. Pemberton describes the visitor arriving at 21:00 in a grey coat. Dr. Crawford claims arrival at 21:15 wearing a black overcoat. Either the witness is mistaken, or there were two separate arrivals.",
    significance: "high",
  },
  {
    id: "C-02",
    items: ["S-01", "T-05"],
    description:
      "Lord Blackwood claims to have retired early and alone. Eleanor Blackwood reports raised voices at 22:30 from the study. Someone else was present.",
    significance: "critical",
  },
];

/* ── Deduction ────────────────────────────────────────────────────── */
export const DEDUCTION = {
  confidence: 87,
  statement:
    "The evidence indicates that the incident at 23:47 was deliberately staged. The convergence of the handwritten letter, chemical residue, and the precisely stopped pocket watch suggests premeditation rather than accident. The 17-minute discrepancy between witness testimonies regarding arrivals points to a coordinated effort involving at least two parties.",
  supporting: ["E-024", "E-031", "E-033", "E-012"],
  contradictions: ["C-01", "C-02"],
};

/* ── Activity feed ────────────────────────────────────────────────── */
export interface ActivityItem {
  time: string;
  title: string;
  detail: string;
  tone: "normal" | "critical" | "success";
}

export const ACTIVITY: ActivityItem[] = [
  { time: "12 MIN AGO", title: "New connection discovered", detail: "Evidence #024 linked to Suspect #03 via testimony", tone: "normal" },
  { time: "1 HOUR AGO", title: "Discrepancy detected", detail: "C-02 raised to critical — two statements cannot both be true", tone: "critical" },
  { time: "2 HOURS AGO", title: "Case confidence recalculated", detail: "Certainty increased: 84% → 87%", tone: "success" },
  { time: "5 HOURS AGO", title: "Chemical analysis complete", detail: "Phosphorus base confirmed in study carpet sample", tone: "normal" },
  { time: "9 HOURS AGO", title: "Evidence catalogued", detail: "Broken pocket watch filed as Exhibit G // E-033", tone: "normal" },
  { time: "YESTERDAY 22:14", title: "Witness interview logged", detail: "Eleanor Blackwood — raised voices, 22:30", tone: "normal" },
  { time: "YESTERDAY 16:40", title: "Financial record subpoenaed", detail: "Estate accounts, week of 7 Oct — three withdrawals", tone: "normal" },
  { time: "2 DAYS AGO", title: "Timeline updated", detail: "17-minute discrepancy mapped between arrivals", tone: "critical" },
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
