/**
 * Statutory rules used across STRATA, each with a citation and a verification status.
 *
 * status:
 *  - "verified":    either checked against reproductions of the cited text in the Phase 6 audit (verifiedBy "text")
 *                   or supplied as verified by the project owner in Phase 7 (verifiedBy "owner")
 *  - "standard":    long-established citation not re-checked against primary text in this audit
 *  - "unconfirmed": widely taught figure whose current (CMR 2017 / OSH&WC) provision or number could NOT be confirmed
 */

export type StatuteStatus = "verified" | "standard" | "unconfirmed";

export interface StatuteQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface Statute {
  id: string;
  topic: "Gases & ventilation" | "Workings & support" | "Electrical" | "Blasting" | "Heat & lighting" | "Duties & hours" | "Mineral levies";
  rule: string;
  citation: string;
  status: StatuteStatus;
  /** For verified rules: who verified it. */
  verifiedBy?: "text" | "owner";
  note?: string;
  q?: StatuteQuestion;
}

/** CMR 2017 Reg. 111(4): minimum pillar centre-to-centre distance (m) by depth band and gallery width. */
export const PILLAR_TABLE = {
  widths: [3.0, 3.6, 4.2, 4.8],
  rows: [
    { maxDepth: 60, label: "≤ 60 m", c: [12.0, 15.0, 18.0, 19.5] },
    { maxDepth: 90, label: "60–90 m", c: [13.5, 16.5, 19.5, 21.0] },
    { maxDepth: 150, label: "90–150 m", c: [16.5, 19.5, 22.5, 25.5] },
    { maxDepth: 240, label: "150–240 m", c: [22.5, 25.5, 30.5, 34.5] },
    { maxDepth: 360, label: "240–360 m", c: [28.5, 34.5, 39.5, 45.0] },
    { maxDepth: Infinity, label: "> 360 m", c: [39.0, 42.0, 45.0, 48.0] },
  ],
};

/** Minimum pillar centres (m) under CMR 2017 Reg. 111(4), using the next-higher gallery-width column. */
export function minPillarCentres(depth: number, galleryWidth: number): number | null {
  const row = PILLAR_TABLE.rows.find((r) => depth <= r.maxDepth)!;
  const col = PILLAR_TABLE.widths.findIndex((w) => galleryWidth <= w + 1e-9);
  return col < 0 ? null : row.c[col];
}

export const STATUTES: Statute[] = [
  {
    id: "air-quality",
    topic: "Gases & ventilation",
    rule: "Air at every place where persons work or pass must contain not less than 19 % oxygen and not more than 0.5 % carbon dioxide, and no noxious gas in quantities likely to affect health.",
    citation: "CMR 2017, Reg. 153 (Standard of ventilation)",
    status: "verified",
    verifiedBy: "text",
    q: { prompt: "Under CMR 2017, the minimum oxygen content of air where persons work or pass is:", options: ["17 %", "19 %", "19.5 %", "20.9 %"], answer: 1, explain: "Reg. 153: not less than 19 % O₂ and not more than 0.5 % CO₂." },
  },
  {
    id: "ch4-limits",
    topic: "Gases & ventilation",
    rule: "Inflammable gas must not exceed 0.75 % in the general body of the return air of any ventilating district, nor 1.25 % in any place in the mine.",
    citation: "CMR 2017, Reg. 153(2)(c)",
    status: "verified",
    verifiedBy: "text",
    q: { prompt: "Maximum inflammable gas permitted in the general body of return air of a ventilating district (CMR 2017):", options: ["0.5 %", "0.75 %", "1.25 %", "2.0 %"], answer: 1, explain: "Reg. 153(2)(c): 0.75 % in return air; 1.25 % at any place." },
  },
  {
    id: "elec-cutoff",
    topic: "Electrical",
    rule: "Where electricity is used in a ventilating district and the inflammable gas determined there exceeds 1.25 %, the electric supply to that district's cables and apparatus must be cut off immediately and reported.",
    citation: "CMR 2017, Reg. 169(1)(e)",
    status: "verified",
    verifiedBy: "text",
    q: { prompt: "Electric supply to a ventilating district must be cut off when inflammable gas in the general body exceeds:", options: ["0.75 %", "1.0 %", "1.25 %", "2.0 %"], answer: 2, explain: "Reg. 169(1)(e): more than 1.25 % → cut off electricity and report." },
  },
  {
    id: "gas-detected",
    topic: "Gases & ventilation",
    rule: "Inflammable gas is deemed 'detected' at ≥ 0.1 % by methane detector in Degree I mines, ≥ 0.5 % in Degree II mines, and ≥ 1.25 % (or a lowered flame-lamp cap) in Degree III mines. Where gas is detected, all persons are withdrawn from the place and it is fenced off; during removal, persons not needed are withdrawn from the return side of the district.",
    citation: "CMR 2017, Reg. 166(1), (3), (4)",
    status: "verified",
    verifiedBy: "text",
    note: "Replaces the legacy teaching figure of 'withdraw persons at 2 %', which could not be found in CMR 2017.",
    q: { prompt: "In a mine with Degree II seams, inflammable gas is deemed 'detected' (requiring withdrawal from that place) at a methane-detector reading of:", options: ["0.1 %", "0.5 %", "1.25 %", "2.0 %"], answer: 1, explain: "Reg. 166(1)(ii): 0.5 % or more for Degree II; 0.1 % for Degree I; 1.25 % for Degree III." },
  },
  {
    id: "gassiness",
    topic: "Gases & ventilation",
    rule: "Degree I: general-body inflammable gas ≤ 0.1 % AND emission ≤ 1 m³ per tonne of coal produced. Degree II: emission > 1 and ≤ 10 m³/t (or general body > 0.1 %). Degree III: emission > 10 m³/t.",
    citation: "CMR 2017, Reg. 2 (definitions); Degree III: Reg. 2(1)(zc) — emission > 10 m³ per tonne of coal produced in belowground workings",
    status: "verified",
    verifiedBy: "text",
    note: "Degree I and II wording checked against the text in Phase 6; the Degree III clause reference and wording were confirmed by the project owner in Phase 7.",
    q: { prompt: "A seam emits 12 m³ of methane per tonne of coal produced. Its classification is:", options: ["Degree I", "Degree II", "Degree III", "Non-gassy"], answer: 2, explain: "Emission > 10 m³/t → Degree III." },
  },
  {
    id: "gallery-size",
    topic: "Workings & support",
    rule: "No gallery in a seam or section shall exceed 3 m in height or 4.8 m in width at any place, except with the prior written permission of the Regional Inspector (and subject to his conditions).",
    citation: "CMR 2017, Reg. 111",
    status: "verified",
    verifiedBy: "text",
    q: { prompt: "Without written permission, the maximum gallery width in bord & pillar workings (CMR 2017) is:", options: ["3.0 m", "4.2 m", "4.8 m", "6.0 m"], answer: 2, explain: "Reg. 111: ≤ 3 m high and ≤ 4.8 m wide unless the Regional Inspector permits in writing." },
  },
  {
    id: "split-gallery",
    topic: "Workings & support",
    rule: "Split galleries driven during depillaring must not exceed the width specified for galleries under Reg. 111(4).",
    citation: "CMR 2017, Reg. 112",
    status: "verified",
    verifiedBy: "text",
  },
  {
    id: "pillar-table",
    topic: "Workings & support",
    rule: "Minimum pillar centre-to-centre distance by depth, for gallery widths ≤ 3.0 / 3.6 / 4.2 / 4.8 m: ≤ 60 m: 12.0/15.0/18.0/19.5 m · 60–90 m: 13.5/16.5/19.5/21.0 · 90–150 m: 16.5/19.5/22.5/25.5 · 150–240 m: 22.5/25.5/30.5/34.5 · 240–360 m: 28.5/34.5/39.5/45.0 · > 360 m: 39.0/42.0/45.0/48.0.",
    citation: "CMR 2017, Reg. 111(4)",
    status: "verified",
    verifiedBy: "owner",
    note: "Statutory minimum only — an engineered pillar must also achieve an adequate factor of safety.",
    q: { prompt: "Minimum pillar centres for a seam at 120 m depth with 4.8 m galleries (CMR 2017 Reg. 111(4)):", options: ["19.5 m", "21.0 m", "25.5 m", "34.5 m"], answer: 2, explain: "90–150 m band, 4.8 m column → 25.5 m centres." },
  },
  {
    id: "wet-bulb",
    topic: "Heat & lighting",
    rule: "Where wet-bulb temperature exceeds 30.5 °C, air must move at not less than 1 m/s; no person may work where wet-bulb temperature exceeds 33.5 °C.",
    citation: "CMR 2017, Reg. 153(2)(d)",
    status: "verified",
    verifiedBy: "owner",
    q: { prompt: "Under CMR 2017 Reg. 153(2)(d), no person may work where the wet-bulb temperature exceeds:", options: ["30.5 °C", "32.0 °C", "33.5 °C", "35.0 °C"], answer: 2, explain: "33.5 °C maximum; above 30.5 °C the air velocity must be at least 1.0 m/s." },
  },
  {
    id: "co-limit",
    topic: "Gases & ventilation",
    rule: "Carbon monoxide maximum permissible limit 50 ppm (0.005 %); persons are withdrawn where CO is 50 ppm or more.",
    citation: "CMR 2017 (noxious gases, Reg. 153) & DGMS circulars",
    status: "verified",
    verifiedBy: "owner",
    q: { prompt: "The maximum permissible carbon monoxide concentration in mine air, at or above which persons are withdrawn, is:", options: ["10 ppm", "25 ppm", "50 ppm", "100 ppm"], answer: 2, explain: "50 ppm (0.005 %) — CMR 2017 & DGMS circulars." },
  },
  {
    id: "air-quantity",
    topic: "Gases & ventilation",
    rule: "Air quantity at least the greater of 6 m³/min per person employed in the largest shift and 2.5 m³/min per tonne of daily output.",
    citation: "CMR 2017, Reg. 153(2)(a)",
    status: "verified",
    verifiedBy: "owner",
    q: { prompt: "Largest shift 150 persons; output 1200 t/day. Minimum air quantity under CMR 2017 Reg. 153(2)(a):", options: ["900 m³/min", "1350 m³/min", "3000 m³/min", "3900 m³/min"], answer: 2, explain: "max(6 × 150 = 900, 2.5 × 1200 = 3000) = 3000 m³/min." },
  },
  {
    id: "lighting",
    topic: "Heat & lighting",
    rule: "Underground: working faces 10 lux, haulage/travelling roads 5 lux, pit bottom 20 lux (DGMS Circular 18/1975). Opencast: HEMM working face 15 lux horizontal / 25 lux vertical, haul roads 10 lux horizontal, dumps/loading points 15 lux H / 15 lux V (DGMS Circular (Legis.) 02/2017), with a written illumination scheme and a monthly-updated illumination plan.",
    citation: "CMR 2017, Reg. 146 & DGMS Circulars 18/1975 (UG) and (Legis.) 02/2017 (OC)",
    status: "verified",
    verifiedBy: "owner",
    note: "Regulation number as supplied by the project owner. The Phase 6 lookup found lighting provisions at Regs. 175–178 (Reg. 178(2)(b): standards of lighting) in the reproduced text — check which number your copy of the Gazette uses.",
    q: { prompt: "Minimum illumination at an underground coal working face (DGMS Circular 18/1975):", options: ["5 lux", "10 lux", "20 lux", "25 lux"], answer: 1, explain: "Working faces 10 lux; haulage/travelling roads 5 lux; pit bottom 20 lux." },
  },
  {
    id: "ppv",
    topic: "Blasting",
    rule: "Permissible PPV for structures not belonging to the owner: domestic/kuccha 5 / 10 / 15 mm/s; industrial 10 / 20 / 25; historical/sensitive 2 / 5 / 10 (for < 8, 8–25, > 25 Hz).",
    citation: "DGMS Technical Circular No. 7 of 1997",
    status: "standard",
    q: { prompt: "DGMS permissible PPV for domestic (kuccha) houses at dominant frequency < 8 Hz:", options: ["2 mm/s", "5 mm/s", "10 mm/s", "15 mm/s"], answer: 1, explain: "TC 7/1997: 5 mm/s (< 8 Hz), 10 (8–25 Hz), 15 (> 25 Hz)." },
  },
  {
    id: "danger-zone",
    topic: "Blasting",
    rule: "Opencast blasting danger zone of 500 m: persons cleared, shelters, guards and warning signals.",
    citation: "Opencast blasting provisions of CMR/MMR (regulation number not re-confirmed)",
    status: "standard",
  },
  {
    id: "restricted-neutral",
    topic: "Electrical",
    rule: "Earth-fault current is limited to 750 mA in 250 V – 1100 V underground systems, and to 50 A in 1.1 – 11 kV opencast systems, with protective equipment disconnecting the supply on earth fault.",
    citation: "CEA (Measures relating to Safety and Electric Supply) Regulations 2023, Reg. 103",
    status: "verified",
    verifiedBy: "owner",
    note: "Regulation number as supplied by the project owner. The same 750 mA / 50 A limits appear in the earlier Indian Electricity Rules and CEA 2010 regulations under different rule numbers.",
    q: { prompt: "Maximum earth-fault current in a 550 V underground coal-mine system (CEA Safety Regulations 2023):", options: ["50 mA", "750 mA", "5 A", "50 A"], answer: 1, explain: "750 mA for 250–1100 V underground systems; 50 A for 1.1–11 kV opencast systems (Reg. 103)." },
  },
  {
    id: "act-17-18",
    topic: "Duties & hours",
    rule: "Every mine must be under a qualified manager (Sec. 17). Owner, agent and manager are each responsible for compliance and are liable for contraventions (Sec. 18).",
    citation: "Mines Act 1952, Secs. 17 & 18 (now consolidated in the OSH&WC Code 2020)",
    status: "standard",
  },
  {
    id: "act-22-23",
    topic: "Duties & hours",
    rule: "Inspectors may prohibit work or require withdrawal where there is danger (Sec. 22). Notice of accidents to the authorities (Sec. 23).",
    citation: "Mines Act 1952, Secs. 22 & 23",
    status: "standard",
  },
  {
    id: "act-hours",
    topic: "Duties & hours",
    rule: "Weekly hours ≤ 48 (Sec. 28); above ground ≤ 9 h/day (Sec. 30); below ground ≤ 8 h/day (Sec. 31); no person below 18 to work in a mine (Sec. 40, apprentices/trainees excepted).",
    citation: "Mines Act 1952, Secs. 28, 30, 31, 40",
    status: "standard",
    q: { prompt: "Maximum daily working hours below ground under the Mines Act 1952:", options: ["6 h", "8 h", "9 h", "10 h"], answer: 1, explain: "Sec. 31: 8 hours below ground; Sec. 30: 9 hours above ground; Sec. 28: 48 h/week." },
  },
  {
    id: "levies",
    topic: "Mineral levies",
    rule: "Coal royalty 14 % ad valorem; DMF = 30 % of royalty (leases before 12 Jan 2015) or 10 % (auctioned); NMET = 2 % of royalty.",
    citation: "MMDR Act 1957 (Second Schedule; Secs. 9B, 9C as amended 2015) and DMF/NMET rules",
    status: "standard",
    q: { prompt: "NMET contribution payable by a leaseholder is:", options: ["2 % of royalty", "10 % of royalty", "30 % of royalty", "2 % of sales value"], answer: 0, explain: "NMET = 2 % of royalty (MMDR Amendment 2015)." },
  },
];

export const STATUS_LABEL: Record<StatuteStatus, string> = {
  verified: "Verified",
  standard: "Standard citation",
  unconfirmed: "Unconfirmed — check Gazette",
};

export function statusLabel(st: Statute): string {
  if (st.status !== "verified") return STATUS_LABEL[st.status];
  return st.verifiedBy === "owner" ? "Verified · project owner" : "Verified · text-checked";
}
