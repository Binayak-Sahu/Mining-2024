/**
 * Statutory rules used across STRATA, each with a citation and a verification status.
 *
 * status:
 *  - "verified":    wording checked against the text of the cited instrument during the Phase 6 audit
 *                   (secondary reproductions of the Gazette text; re-check the official Gazette before relying on it)
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
  note?: string;
  q?: StatuteQuestion;
}

export const STATUTES: Statute[] = [
  {
    id: "air-quality",
    topic: "Gases & ventilation",
    rule: "Air at every place where persons work or pass must contain not less than 19 % oxygen and not more than 0.5 % carbon dioxide, and no noxious gas in quantities likely to affect health.",
    citation: "CMR 2017, Reg. 153 (Standard of ventilation)",
    status: "verified",
    q: { prompt: "Under CMR 2017, the minimum oxygen content of air where persons work or pass is:", options: ["17 %", "19 %", "19.5 %", "20.9 %"], answer: 1, explain: "Reg. 153: not less than 19 % O₂ and not more than 0.5 % CO₂." },
  },
  {
    id: "ch4-limits",
    topic: "Gases & ventilation",
    rule: "Inflammable gas must not exceed 0.75 % in the general body of the return air of any ventilating district, nor 1.25 % in any place in the mine.",
    citation: "CMR 2017, Reg. 153(2)(c)",
    status: "verified",
    q: { prompt: "Maximum inflammable gas permitted in the general body of return air of a ventilating district (CMR 2017):", options: ["0.5 %", "0.75 %", "1.25 %", "2.0 %"], answer: 1, explain: "Reg. 153(2)(c): 0.75 % in return air; 1.25 % at any place." },
  },
  {
    id: "elec-cutoff",
    topic: "Electrical",
    rule: "Where electricity is used in a ventilating district and the inflammable gas determined there exceeds 1.25 %, the electric supply to that district's cables and apparatus must be cut off immediately and reported.",
    citation: "CMR 2017, Reg. 169(1)(e)",
    status: "verified",
    q: { prompt: "Electric supply to a ventilating district must be cut off when inflammable gas in the general body exceeds:", options: ["0.75 %", "1.0 %", "1.25 %", "2.0 %"], answer: 2, explain: "Reg. 169(1)(e): more than 1.25 % → cut off electricity and report." },
  },
  {
    id: "gas-detected",
    topic: "Gases & ventilation",
    rule: "Inflammable gas is deemed 'detected' at ≥ 0.1 % by methane detector in Degree I mines, ≥ 0.5 % in Degree II mines, and ≥ 1.25 % (or a lowered flame-lamp cap) in Degree III mines. Where gas is detected, all persons are withdrawn from the place and it is fenced off; during removal, persons not needed are withdrawn from the return side of the district.",
    citation: "CMR 2017, Reg. 166(1), (3), (4)",
    status: "verified",
    note: "Replaces the legacy teaching figure of 'withdraw persons at 2 %', which could not be found in CMR 2017.",
    q: { prompt: "In a mine with Degree II seams, inflammable gas is deemed 'detected' (requiring withdrawal from that place) at a methane-detector reading of:", options: ["0.1 %", "0.5 %", "1.25 %", "2.0 %"], answer: 1, explain: "Reg. 166(1)(ii): 0.5 % or more for Degree II; 0.1 % for Degree I; 1.25 % for Degree III." },
  },
  {
    id: "gassiness",
    topic: "Gases & ventilation",
    rule: "Degree I: general-body inflammable gas ≤ 0.1 % AND emission ≤ 1 m³ per tonne of coal produced. Degree II: emission > 1 and ≤ 10 m³/t (or general body > 0.1 %). Degree III: emission > 10 m³/t.",
    citation: "CMR 2017, Reg. 2 (definitions — gassy seams of the first, second and third degree)",
    status: "verified",
    note: "Degree I and II wording verified; the Degree III wording was confirmed only in the 2010 draft text — check the final Gazette definition.",
    q: { prompt: "A seam emits 12 m³ of methane per tonne of coal produced. Its classification is:", options: ["Degree I", "Degree II", "Degree III", "Non-gassy"], answer: 2, explain: "Emission > 10 m³/t → Degree III." },
  },
  {
    id: "gallery-size",
    topic: "Workings & support",
    rule: "No gallery in a seam or section shall exceed 3 m in height or 4.8 m in width at any place, except with the prior written permission of the Regional Inspector (and subject to his conditions).",
    citation: "CMR 2017, Reg. 111",
    status: "verified",
    q: { prompt: "Without written permission, the maximum gallery width in bord & pillar workings (CMR 2017) is:", options: ["3.0 m", "4.2 m", "4.8 m", "6.0 m"], answer: 2, explain: "Reg. 111: ≤ 3 m high and ≤ 4.8 m wide unless the Regional Inspector permits in writing." },
  },
  {
    id: "split-gallery",
    topic: "Workings & support",
    rule: "Split galleries driven during depillaring must not exceed the width specified for galleries under Reg. 111(4).",
    citation: "CMR 2017, Reg. 112",
    status: "verified",
  },
  {
    id: "pillar-table",
    topic: "Workings & support",
    rule: "Minimum pillar dimensions are prescribed by depth of cover and gallery width (e.g. a classic table gives 19.5 m centres at ≤ 60 m depth with 4.8 m galleries, rising with depth).",
    citation: "CMR 2017 pillar-size provision (believed Reg. 111 / its schedule)",
    status: "unconfirmed",
    note: "The table values circulating online may be from CMR 1957. Use engineered design (FoS) plus the current Gazette table.",
  },
  {
    id: "wet-bulb",
    topic: "Heat & lighting",
    rule: "Where wet-bulb temperature exceeds 30.5 °C, air must move at not less than 1 m/s; no person may work where wet-bulb temperature exceeds 33.5 °C.",
    citation: "Coal mines ventilation standard (CMR 1957 Reg. 130; carried in the 2011 draft)",
    status: "unconfirmed",
    note: "Wording found in the 2011 draft regulations; the corresponding CMR 2017 clause was not confirmed in this audit.",
    q: { prompt: "Under the classic coal-mine heat standard, no person may work where the wet-bulb temperature exceeds:", options: ["30.5 °C", "32.0 °C", "33.5 °C", "35.0 °C"], answer: 2, explain: "33.5 °C wet bulb; above 30.5 °C air velocity ≥ 1 m/s. (Confirm the CMR 2017 clause.)" },
  },
  {
    id: "co-limit",
    topic: "Gases & ventilation",
    rule: "Carbon monoxide is commonly controlled to ≤ 50 ppm (0.005 %) in mine air.",
    citation: "Reg. 153 general clause on noxious gases; numerical CO limit not confirmed in CMR 2017",
    status: "unconfirmed",
  },
  {
    id: "air-quantity",
    topic: "Gases & ventilation",
    rule: "Air quantity at least the larger of 6 m³/min per person employed at any one time and 2.5 m³/min per tonne of average daily output.",
    citation: "CMR 1957 Reg. 130(1)(b) (legacy)",
    status: "unconfirmed",
    note: "Legacy 1957 figure; the CMR 2017 standard-of-ventilation text (Reg. 153) was not confirmed to retain it.",
  },
  {
    id: "lighting",
    topic: "Heat & lighting",
    rule: "Standards of lighting for specified places are laid down by the Chief Inspector. Example (opencast coal): workplace of heavy machinery ≥ 15 lux horizontal and 25 lux vertical, with a written illumination scheme and monthly-updated illumination plan.",
    citation: "CMR 2017, Reg. 178(2)(b); DGMS Circular (Legis.) 02 of 2017 (opencast coal)",
    status: "verified",
    note: "Underground face/roadway lux values were not located in this audit — consult the current DGMS underground illumination circular.",
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
    rule: "Underground coal-mine power systems restrict earth-fault current (commonly to 750 mA) and use earth-leakage protection.",
    citation: "CEA (Measures relating to Safety and Electric Supply) Regulations — mines chapter (clause not re-confirmed)",
    status: "unconfirmed",
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
  verified: "Verified · CMR 2017 text",
  standard: "Standard citation",
  unconfirmed: "Unconfirmed — check Gazette",
};
