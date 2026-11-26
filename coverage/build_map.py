#!/usr/bin/env python3
"""Builds coverage/map.json + coverage/MAP.md.
Inputs: coverage/inventory.json (lessons/stages dumped from src/content), coverage/_cmr_regs.json
(CMR 2017 regulation headings, from sources/CMR 2017.txt), sources/nitr/MN*.txt.
Mapping is by topic rules (regex on the syllabus line text). Review the rules, not just the output.
Run: python3 -I coverage/build_map.py"""
import re, json, glob, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
inv = json.load(open(f"{ROOT}/coverage/inventory.json"))
LES = {l["lesson"]: l for l in inv}

# ---- covered topics: id, regex, lessons -------------------------------------------------
COVERED = [
 ("coal-genesis", r"formation of coal|origin of coal|coal petrograph|lithotype|maceral|coal rank|eras of coal", ["u1-l1"]),
 ("ore-genesis", r"ore genesis|supergene|ore deposit|types of ore ?bod|distribution of mineral deposits|mineral deposits", ["u1-l2"]),
 ("dip-strike", r"\bdip\b|strike|outcrop|apparent dip", ["u1-l3"]),
 ("faults", r"\bfault|throw|heave", ["u1-l4"]),
 ("exploration-drilling", r"core drill|\brqd\b|exploration|borehole sampl", ["u1-l5"]),
 ("reserve-classification", r"unfc|jorc|resource classification|reserve estimation|estimation of reserves|resource.reserve|mineral resource classification", ["u1-l6"]),
 ("access-shaft", r"mine access|methods of entry|selection of mine access|shaft pillar|shaft sinking|sinking|\bshafts?\b", ["u2-l1", "u2-l2"]),
 ("special-sinking", r"freezing|cementation|special sinking", ["u2-l3"]),
 ("drivage", r"drift|roadheader|tunnel boring|\btbm\b|mechanical excavation|primary development|development of (?:drift|stratified|mineral)", ["u2-l4", "u2-l5"]),
 ("in-situ-stress", r"in-?situ stress|stress around|rock stress|kirsch|stress.strain|mohr.s circle", ["u3-l1"]),
 ("failure-criteria", r"failure criteri|theories of rock failure|rock strength|hoek|mohr.coulomb|griffith|anisotropy", ["u3-l2"]),
 ("rock-mass-class", r"rock mass classification|classification system|\brmr\b|\bgsi\b|q-system|rock load", ["u3-l3"]),
 ("support-bolting", r"bolt|roof support|rock reinforcement|roadway and face supports|applied support|support systems|supports", ["u3-l4"]),
 ("pillar-design", r"pillar design|natural support|coal pillar|design of (?:rhombus|underground)|pillar strength|barrier pillar|rib pillar|pillars?", ["u3-l5"]),
 ("slope-stability", r"slope stab|slope fail|rock slope|bench slope|stability of slopes|slope analysis|slope stabili", ["u3-l6"]),
 ("subsidence", r"subsidence|rock ?burst|bump|surface subsidence", ["u3-l7"]),
 ("rock-drilling", r"\bdrills?\b|drilling", ["u4-l1"]),
 ("explosives", r"explosive|detonation|thermochemi|detonator|magazine", ["u4-l2"]),
 ("blast-design", r"burden|spacing|fragmentation|blast design|bench blasting|cut holes|cut patterns|theory of breakage|controlled blasting|blasting of hot", ["u4-l3"]),
 ("initiation-misfire", r"initiation|\bdelay|nonel|misfire|safety fuse|detonating cord|fuses", ["u4-l4"]),
 ("blast-environment", r"ground vibration|airblast|flyrock|environmental impact of blasting|risk assessment and risk control during blasting", ["u4-l5"]),
 ("pit-geometry", r"stripping ratio|pit geometry|bench (?:geometry|height|width)|design of benches|methods of stripping|surface mining methods|opencast mining methods|layout of opencast|applicability and limitations", ["u5-l1"]),
 ("dragline-excavator", r"dragline|excavator|shovel", ["u5-l2"]),
 ("truck-shovel", r"truck|loading, and transportation|equipment used for different operations|heavy earth moving|hemm|match factor", ["u5-l3"]),
 ("haul-road", r"haul road|haul ?road", ["u5-l4"]),
 ("waste-dump", r"waste dump|waste rock dump|\bwrds?\b|overburden waste|reclamation|dump", ["u5-l5"]),
 ("bord-pillar", r"bord and pillar|bord & pillar|depillaring|extraction of locked|goaf|stall", ["u6-l1"]),
 ("longwall", r"longwall|powered support|face mechani[sz]ation|face machinery|coal cutting|support systems for continuous miner", ["u6-l2"]),
 ("stoping", r"stoping|sublevel open|cut and fill|shrinkage|square set|\bvcr\b|dilution|room and pillar", ["u6-l3"]),
 ("caving", r"block caving|sublevel caving|caving method|caveab|caving|draw control", ["u6-l4"]),
 ("mine-gases", r"eruption of gas|mine gases|composition of mine air|methane layer|firedamp|damp\b|black damp|after.?damp|coward|gas(?:es)? (?:detection|monitoring)|explosive limit", ["u7-l1"]),
 ("airflow-networks", r"resistance of airways|equivalent orifice|atkinson|network analysis|hardy.cross|kirchoff|kirchhoff|distribution of air|ventilation (?:survey|design|layout|standard)|ventilation systems?|ventilation network|airflow|air current|leakage|recirculation|auxiliary ventilation|ascensional|antitropal", ["u7-l2"]),
 ("fans-natural-vent", r"\bfans?\b|natural ventilation|\bnvp\b|booster|fan laws|evas[eé]e|diffuser|mine ventilation fan", ["u7-l3"]),
 ("psychrometry", r"psychromet|cooling power|thermal environment|heat load|air.condition|humidity|thermodynamic", ["u7-l4"]),
 ("spon-comb", r"spontaneous|incubation|mine fire|heating of coal|fire gas|classification of mine fire|genesis of mine fire|fire.fighting|carbon monoxide|fire stopping|fire-?fighting|against fire|fire has broken|fire exists", ["u7-l5"]),
 ("dust-explosions", r"coal dust|mine dust|stone dust|dust explosion|dusts|dust control|against dust", ["u7-l6"]),
 ("mine-drainage", r"\bpumps?\b|mine drainage|dewater|\bnpsh\b|pumping", ["u7-l7"]),
 ("traverse-survey", r"traverse|traversing|bowditch|traverse closure|dial traverse|compass survey", ["u8-l1"]),
 ("correlation-gyro", r"correlation survey|correlation of surface|verticality of shafts|shaft plumb|weisbach|gyro", ["u8-l2"]),
 ("comminution", r"comminution|crushing|grinding|liberation|rittinger|bond", ["u8-l3"]),
 ("washing-flotation", r"coal washing|washab|flotation|settling|jigging|clean coal|coal preparation|beneficiation", ["u8-l4"]),
 ("mine-electrical", r"earthing|\bflp\b|flame.?proof|intrinsic|electrical (?:safety|installation)", ["u8-l5"]),
 ("winding-koepe", r"winding|koepe|mine hoist|winders?|man.winding|hoist", ["u8-l6"]),
 ("economics-dcf", r"\bnpv\b|\birr\b|discounted cash|present and future value|mine investment|mineral taxation|mine taxation|royalt|investment analysis|economics of depleting", ["u9-l1"]),
 ("sampling-cutoff", r"sampling|cut-?off grade|grade.tonnage|mine sampling|compositing", ["u9-l2"]),
 ("pit-limits", r"ultimate pit|lerchs|pit limit|ultimate pit design", ["u9-l3"]),
 ("digital-mining", r"digital|dispatch|telemetry|tele-?monitoring|radar|drones?|lidar|automation|robotics|digital twin|\biot\b", ["u9-l4"]),
 ("statutory-arch", r"mine legislation|mines act|principal provisions|coal mines regulation|metalliferous mines regulation|general principles of mining law|statutory requirements", ["u10-l1"]),
 ("gassiness", r"degree of gassiness|gassy seam|statutory air|air standards|inflammable gas", ["u10-l2"]),
 ("risk-mgmt", r"risk assessment|safety management|hazard identification|\bhira\b|\bwrac\b|safety management plan|\bsmp\b|safety risk", ["u10-l3"]),
 ("fault-tree", r"fault tree", ["u10-l4"]),
 ("rescue-firstaid", r"rescue|breathing apparatus|first.?aid|rescue room|rescue station|recovery and exploratory", ["u10-l5"]),
 ("rock-mech-basics", r"geotechnical engineering|soil and rock|discontinuit|rock characteri|elastic and non-elastic|time on rock", ["u3-l1", "u3-l2"]),
]

# ---- gap topics: id, regex, placement, title, note --------------------------------------
# placement: ("screens", lesson) = new screens in an existing lesson (needs a new stage appended or flow screens);
#            ("lesson", unit)    = a new lesson appended at the end of that unit (boss untouched).
GAPS = [
 ("g-statute-admin", r"notices?\b|certificates? of|inspectors?\b|mine officials|appointment|duties|penalt|powers|miscellaneous|repeal|schedule|bye-?laws|exempt|concession rules|conservation rules|mines rules|industrial disputes|forest act|electricity rules", ("lesson", "u10"), "Officials, returns, certificates & managerial duties (CMR Ch II–V, XVII)", "Core of the Legislation paper. Phase 17 law books may supersede; do via statute gate."),
 ("g-mine-plans", r"plans? and sections?|surface plan|mine plans?|plan of|digital mine plan|photogrammetry", ("lesson", "u8"), "Mine plans & sections: statutory requirements (CMR Ch VI)", "Statutory plans, scales, updating, preservation."),
 ("g-survey-instruments", r"definition of survey|importance of (?:mine )?survey|types of survey|surveying definition|tacheometr|levelling|leveling|contour|chain survey|ranging|chaining|setting out|triangulation|\bgps\b|areas and volumes|special mine surveys|linear and angular|theodolite|types of level", ("lesson", "u8"), "Levelling, tacheometry, setting-out & GPS", "u8-l1 covers traverse closure only."),
 ("g-winding-statutory", r"winding|\bcages?\b|onsetter|detaching hook|banksman|capping|signalling", ("screens", "u8-l6"), "Winding in shafts: statutory provisions (CMR Ch VIII)", "Facet of u8-l6; needs source/statute-gate for numbers."),
 ("g-machinery", r"wire rope|transmission|gear|compressor|compressed air|conveyor|ropeway|scraper|locomotive|rope haulage|\blhd\b|\bsdl\b|shuttle car|loader|haulage|machinery|belt|tub|trolley|chair lift|man riding|diesel", ("lesson", "u8"), "Mining machinery & haulage: ropes, conveyors, compressors, locomotives", "CMR Ch IX and XV; NITR MN3001/3103/3105/5021."),
 ("g-lamps-lighting", r"lighting|safety lamp|cap lamp|lamp room|flame safety|lamps", ("lesson", "u7"), "Safety lamps, cap lamps & gas detectors (CMR Ch XIII)", "u7-l1 covers gases but not the lamps/detectors."),
 ("g-inrush-water", r"inundation|inrush|water danger|barrier|boreholes? ahead|flooding|water-logged|waterlogged|abandoned workings", ("lesson", "u7"), "Inrush, inundation & advance boreholes", "CMR Ch XI water provisions; u7-l7 covers pumping only."),
 ("g-methane-drainage-cbm", r"methane drainage|degasification|coal ?bed methane|\bcbm\b|\bcmm\b|\bamm\b|gas content|isotherm|desorption|sequestration|\bccs\b|co2|unconventional reservoir|extraction of methane|methane extraction|pipeline", ("lesson", "u7"), "Methane drainage, CBM & CMM extraction (CMR Ch XVI)", "18 CMR regs; NITR MN5244, MN2202 M1."),
 ("g-mine-working-statutory", r"(?!)", ("screens", "u6-l1"), "Statutory provisions for mine working (CMR Ch X)", "Seam/pillar/gallery rules; screens in u6-l1 and u3-l4."),
 ("g-stowing-filling", r"stowing|filling|backfill|back filling|stope fill|hydraulic fill|sand stowing|paste fill", ("lesson", "u6"), "Stowing & stope backfill", "NITR MN2102 M5, MN3101 M6."),
 ("g-thick-multi-seam", r"thick seams?|multiple seams?|multi.seam|chirimiri|blasting gallery|integral caving|non-effective width|wide stall|high ?wall mining|boundary pillar|narrow vein|locked.up|advanced coal mining|deep seated|underneath surface features", ("lesson", "u6"), "Thick-seam, multi-seam & special extraction methods", "NITR MN6162, MN5027, MN6120."),
 ("g-special-mining", r"placer|sea ?bed|ocean|dredg|hydraulick|ground sluicing|solution mining|in.situ leach|bioleach|heap leach|oil sand|extra-terrestrial|deep sea|arctic", ("lesson", "u6"), "Placer, marine & solution mining", "NITR only; low rank."),
 ("g-numerical-geomech", r"numerical|finite (?:element|difference|volume)|\bfdm\b|\bfem\b|\bfvm\b|simulation|seepage|\blem\b|modell?ing|scientific comput|matrix", ("lesson", "u3"), "Numerical modelling in geomechanics", "NITR only; u3-l6 touches LEM slopes only."),
 ("g-ground-instrumentation", r"instrumentation|extensometer|convergence|load cell|strain gauge|stress capsule|monitoring methods|slope monitoring|borehole camera|transducer|\butm\b|\bmts\b", ("lesson", "u3"), "Ground-control instrumentation & monitoring", "NITR MN3024, MN6122 M5."),
 ("g-mine-geomech-design", r"design of underground|structural design|wilson|cut-out distance|roadway design|slope stabili[sz]ation|stabili[sz]ation|retaining|drainage", ("screens", "u3-l4"), "Design of roadways & slope stabilisation", "Extra screens in u3-l4/u3-l6."),
 ("g-mine-finance", r"cost accounting|cost.volume|depreciation|cost of capital|joint stock|partnership|capital formation|mine finance|mineral markets|market structure|decision tree|trade|economy|national mineral polic|mine valuation|mineral industry of india", ("screens", "u9-l1"), "Mine finance, valuation & mineral markets", "Facet of u9-l1."),
 ("g-geostatistics", r"geostatistic|variogram|kriging|regionali[sz]ed|spatial|moving window|indicator map|global estimation", ("lesson", "u9"), "Geostatistics & resource modelling", "NITR MN3006."),
 ("g-mine-planning", r"mine planning|planning and design|production planning|scheduling|optimum mine size|taylor|lane.s|infrastructure planning|ore loss|grade control|mine.to.mill|reconciliation|benchmarking|technical auditing|stope planning|remnant pillar|computeri[sz]ed|software|optimal output|mine life|mine closure", ("lesson", "u9"), "Mine planning, scheduling & closure planning", "NITR MN4021, MN4103."),
 ("g-data-analytics", r"data analytics|regression|anova|principal component|machine learning|statistics|data (?:foundation|representation)|programming|flowchart|algorithm|curve fitting", ("lesson", "u9"), "Data analytics & statistics for mining", "NITR MN3004, MN5002; low rank."),
 ("g-environment", r"air pollution|water pollution|noise|environmental (?:engineering|issues|impact|legislation|problems|parameters)|ep act|acid mine drainage|eco-friendly|land (?:degradation|reclamation)|biodiversity|environment|soil chemistry|water quality|air pollutants", ("lesson", "u5"), "Mine environment: air, water, noise & EIA", "NITR MN4201, MN4223, MN2002."),
 ("g-tailings-closure", r"tailings|\btsfs?\b|mine waste|terminologies, sources|waste (?:sources|management|handling)|re-?use and utili|closure|rehabilitation|waste dumps?", ("lesson", "u5"), "Tailings storage, mine waste & closure", "u5-l5 covers dumps; TSFs/closure are new."),
 ("g-sustainability", r"sustainab|three pillars|esg|social aspects|economic benefits and costs", ("lesson", "u9"), "Sustainable mining (concepts & frameworks)", "NITR MN2002; low rank."),
 ("g-accidents-safety", r"accident|investigation|safety audit|occupational health|safety education|training|vocational|safety management systems|hazards? encountered|statistics", ("lesson", "u10"), "Accidents, investigation, safety audit & training", "NITR MN3202 M4–M6; CMR Ch IV/V training regs."),
 ("g-coal-quality", r"proximate|ultimate analysis|calorific|coal propert|classification of coal(?! seams)|coal characteri|solid fuel|clean coal technolog|coal structure", ("screens", "u1-l1"), "Coal quality, analysis & classification", "Extra screens in u1-l1 / u8-l4."),
 ("g-coal-seam-development", r"choice of mine size|gathering and transportation|bulk material|men and material|special men", ("screens", "u6-l1"), "Mine layout, capacity choice & material transport", "NITR MN2102."),
]
# anything left over gets this
OTHER = ("g-other", "(?!)", ("review", ""), "Unclassified (review)", "")

def stage_ids(lessons, rx):
    out = []
    for lid in lessons:
        L = LES.get(lid)
        if not L: raise SystemExit(f"NO LESSON {lid}")
        hit = [f"{lid}#{s['i']}" for s in L["stages"] if re.search(rx, (s["title"] + " " + s["text"]).lower())]
        out.append({"lesson": lid, "stages": hit[:4]})
    return out

def classify(text):
    t = text.lower()
    cov = [(cid, lessons, rx) for cid, rx, lessons in COVERED if re.search(rx, t)]
    gap = [g[0] for g in GAPS if re.search(g[1], t)]
    return cov, gap

# ---- NITR lines --------------------------------------------------------------------------
def nitr_lines():
    rows, seen = [], {}
    for f in sorted(glob.glob(f"{ROOT}/sources/nitr/MN*.txt")):
        t = open(f).read()
        m = re.search(r"Subject \{L-T-P / C\} :\s*\n?\s*(MN\d+) :\s*(.*?)\s*\{", t)
        code, name = m.group(1), m.group(2)
        nat = re.search(r"Subject Nature :\s*\n\s*(\w+)", t).group(1)
        s = re.split(r"Subject Nature :\s*\n\s*\w+\s*\n\s*Syllabus", t, maxsplit=1)[1]
        s = re.split(r"Course Objective|Course Outcome", s)[0]
        s = re.sub(r"(^|\n)\s*Module \d+ :\s*(?=\n)", "\n", s)
        s = re.sub(r"^[\s]*(a\))?\s*", "", s)
        parts = re.split(r"\n\s*(?=(?:\d+\.\s*)?Module ?-?\s*\d)", s.strip())
        ps = []
        for p in parts:
            p = re.sub(r"\s+", " ", p).strip()
            if len(p) < 40 or re.match(r"(Total contact|Module ?\d+: ?\d+ ?Hrs)", p): continue
            if len(parts) == 1 and len(p) > 300:
                sub = [x.strip() for x in re.split(r"(?<=[a-z\)\]])\.\s+(?=[A-Z])", p)]
                merged = []
                for x in sub:
                    if merged and len(x) < 60: merged[-1] += ". " + x
                    else: merged.append(x)
                ps += [x for x in merged if len(x) >= 25]
            else: ps.append(p)
        for i, p in enumerate(ps, 1):
            key = re.sub(r"[^a-z]", "", re.sub(r"^.*?module ?\d+:?", "", p.lower()))[:160]
            row = {"id": f"{code}.{i}", "code": code, "subject": name, "nature": nat, "text": p}
            if nat == "Theory" and key in seen: row["dupOf"] = seen[key]
            elif nat == "Theory": seen[key] = row["id"]
            rows.append(row)
    return rows

def main():
    out = {"generated": "2026-11-26", "dgms_syllabus_source": "MISSING (G.S.R. 910(E) original syllabus not available; CMR 2017 regulation headings used as proxy lines)",
           "sources": {"cmr": "sources/CMR 2017.pdf", "nitr": "sources/nitr/"}, "lessons": sorted(LES), "dgms": [], "nitr": [], "gaps": []}
    cmr = json.load(open(f"{ROOT}/coverage/_cmr_regs.json"))
    chap_title = dict(cmr["chapters"])
    chap_default = {"II": ["g-statute-admin"], "III": ["g-statute-admin"], "IV": ["g-statute-admin"], "V": ["g-statute-admin"], "VI": ["g-mine-plans"],
                    "VIII": ["g-winding-statutory"], "IX": ["g-machinery"], "X": ["g-mine-working-statutory"], "XIII": ["g-lamps-lighting"],
                    "XV": ["g-machinery"], "XVI": ["g-methane-drainage-cbm"], "XVII": ["g-statute-admin"]}
    for n, title, ch in cmr["regs"]:
        text = f"{title}"
        cov, gap = classify(text)
        gap = [g for g in gap if g != "g-statute-admin" or ch in ("II", "III", "IV", "V", "XVII", "I")]
        if ch in chap_default and not (cov and ch in ("X", "XI", "XII", "XIV")): gap = list(dict.fromkeys(chap_default[ch] + gap))
        if ch == "I": cov = cov or [("statutory-arch", ["u10-l1"], "")]
        if ch == "VII" and not cov: cov = [("access-shaft", ["u2-l1"], "")]
        if ch == "XII" and not cov: cov = [("airflow-networks", ["u7-l2"], "")]
        if ch == "XI" and not cov and not gap: gap = ["g-inrush-water"] if re.search(r"water|inundat", text.lower()) else []
        if ch == "XIV" and not cov: cov = [("explosives", ["u4-l2"], "")]
        if re.search(r'powers of inspectors|pointing out|^saving', text.lower()): gap = ['g-statute-admin']
        # one-per-chapter fallbacks
        if not cov and not gap: gap = ["g-other"]
        out["dgms"].append({"id": f"CMR.{n}", "ch": ch, "chapter": chap_title[ch], "line": title, "covered": [c[0] for c in cov],
                            "lessons": sorted({l for c in cov for l in c[1]}), "gaps": gap})
    for r in nitr_lines():
        if r["nature"] != "Theory":
            r.update(covered=[], lessons=[], gaps=[], note="practical/lab - not mapped"); out["nitr"].append(r); continue
        cov, gap = classify(r["text"])
        if not cov and not gap: gap = ["g-other"]
        r.update(covered=[c[0] for c in cov], lessons=sorted({l for c in cov for l in c[1]}), gaps=gap); out["nitr"].append(r)
    # stage ids for covered topics
    rxmap = {cid: (rx, ls) for cid, rx, ls in COVERED}
    for grp in ("dgms", "nitr"):
        for r in out[grp]:
            r["screens"] = []
            for cid in r["covered"]:
                rx, ls = rxmap[cid]
                for e in stage_ids(ls, rx): r["screens"].append(e)
            seen = set(); u = []
            for e in r["screens"]:
                k = (e["lesson"], tuple(e["stages"]))
                if k not in seen: seen.add(k); u.append(e)
            r["screens"] = u
    # gap aggregation
    gtab = {g[0]: g for g in GAPS}; gtab["g-other"] = OTHER
    for gid, g in gtab.items():
        d = [r["id"] for r in out["dgms"] if gid in r["gaps"]]
        nl = [r for r in out["nitr"] if gid in r["gaps"] and "dupOf" not in r]
        out["gaps"].append({"id": gid, "title": g[3], "placement": {"type": g[2][0], "target": g[2][1]}, "note": g[4],
                            "dgms_regs": d, "nitr_lines": [r["id"] for r in nl], "nitr_subjects": sorted({r["code"] for r in nl})})
    out["gaps"] = [g for g in out["gaps"] if g["dgms_regs"] or g["nitr_lines"]]
    out["gaps"].sort(key=lambda g: (-len(g["dgms_regs"]), -len(g["nitr_lines"])))
    for i, g in enumerate(out["gaps"], 1): g["rank"] = i
    # verify every referenced id is real
    for grp in ("dgms", "nitr"):
        for r in out[grp]:
            for e in r["screens"]:
                assert e["lesson"] in LES
                for s in e["stages"]:
                    l, i = s.split("#"); assert int(i) < len(LES[l]["stages"]), s
    json.dump(out, open(f"{ROOT}/coverage/map.json", "w"), indent=1)
    write_md(out)
    print("dgms lines", len(out["dgms"]), "nitr lines", len(out["nitr"]), "gaps", len(out["gaps"]))
    print("unclassified dgms:", [r["id"] + " " + r["line"] for r in out["dgms"] if "g-other" in r["gaps"]][:40])
    print("unclassified nitr:", [(r["id"], r["text"][:70]) for r in out["nitr"] if "g-other" in r["gaps"]][:60])

def write_md(out):
    L = []
    nt = [r for r in out["nitr"] if r["nature"] == "Theory"]
    L += ["# STRATA coverage map", "", "Generated by `coverage/build_map.py` from `coverage/inventory.json` (real lesson/stage ids), `sources/CMR 2017.txt` and `sources/nitr/`. Machine-readable twin: `coverage/map.json`.", "",
          "## How to read this", "",
          "- **Syllabus source missing (DGMS First Class).** The original bye-laws G.S.R. 910(E) (14-09-2018), which hold the First Class Manager's subject syllabus, are not in `sources/` and `egazette.gov.in` could not be reached. `sources/AMENDMENTS…CMR, 2017.pdf` holds only the 2021 amendments (G.S.R. 555–559(E)). The CBT notification (02-02-2025) names no papers. So the DGMS side uses **each CMR 2017 regulation heading as a proxy syllabus line**. It is a coverage check against the statute, not against the published paper syllabus.",
          "- **DGMS paper weight is unknown.** No source in `sources/` gives marks per paper or per topic. The gap ranking uses the number of CMR regulations that touch the gap topic, as a stated stand-in.",
          "- **Mapping is topical.** A line is COVERED when a lesson's subject matches it by the rules in `build_map.py`; it does not prove depth. Only u0-l1, u7-l1 (stage 0) and u10-l3 (stage 0) are sourced ConceptFlows. Everything else is legacy briefing content that Phase 16 re-sources.",
          "- Screen ids are `lessonId#stageIndex` (a stage's position in `src/content/units/*.ts`). ConceptFlow screens live inside stage 0 of their lesson.",
          "- NITR: 64 of 93 MN-coded subjects on the curriculum page have a published syllabus; 29 show \"Course Syllabus Not Found\" (listed in `sources/README.md`). Duplicate subjects (same text under old and new codes) are mapped once; labs and projects are not mapped.", "",
          "## Totals", "",
          f"- DGMS proxy lines (CMR regulations): {len(out['dgms'])}; with a covered lesson: {sum(1 for r in out['dgms'] if r['lessons'])}; with a gap: {sum(1 for r in out['dgms'] if r['gaps'])}; fully GAP (no lesson): {sum(1 for r in out['dgms'] if not r['lessons'])}",
          f"- NITR theory lines (unique): {sum(1 for r in nt if 'dupOf' not in r)}; with a covered lesson: {sum(1 for r in nt if 'dupOf' not in r and r['lessons'])}; with a gap: {sum(1 for r in nt if 'dupOf' not in r and r['gaps'])}; fully GAP: {sum(1 for r in nt if 'dupOf' not in r and not r['lessons'])}", ""]
    L += ["## Ranked gap list", "", "Rank = DGMS first (CMR regulations touching the topic), then NITR (unique syllabus lines). Placement: **screens** = new screens/stage in an existing lesson; **new lesson** = appended at the end of the unit (stage indexes untouched).", "",
          "| # | Gap | DGMS regs | NITR lines | Placement | Note |", "|---|---|---|---|---|---|"]
    for g in out["gaps"]:
        pl = f"screens in `{g['placement']['target']}`" if g["placement"]["type"] == "screens" else (f"new lesson in `{g['placement']['target']}`" if g["placement"]["type"] == "lesson" else "review")
        L.append(f"| {g['rank']} | {g['title']} (`{g['id']}`) | {len(g['dgms_regs'])} | {len(g['nitr_lines'])} | {pl} | {g['note']} |")
    L += ["", "## DGMS side: CMR 2017 regulation → lesson / GAP", "", "| Reg | Chapter | Heading | Lessons (screens) | Gap |", "|---|---|---|---|---|"]
    for r in out["dgms"]:
        scr = ", ".join(f"{e['lesson']}" + (f" ({', '.join(s.split('#')[1] for s in e['stages'])})" if e["stages"] else "") for e in r["screens"]) or "–"
        L.append(f"| {r['id'][4:]} | {r['ch']} | {r['line']} | {scr} | {', '.join(r['gaps']) or '–'} |")
    L += ["", "## NITR side: syllabus line → lesson / GAP", "", "| Line | Subject | Topic (first 90 chars) | Lessons (screens) | Gap |", "|---|---|---|---|---|"]
    for r in nt:
        txt = re.sub(r"^(?:\d+\.\s*)?Module ?-?\s*\d+\s*:?\s*", "", r["text"])[:90].replace("|", "/")
        if "dupOf" in r: L.append(f"| {r['id']} | {r['subject']} | = {r['dupOf']} (same text) | see {r['dupOf']} | |"); continue
        scr = ", ".join(f"{e['lesson']}" + (f" ({', '.join(s.split('#')[1] for s in e['stages'])})" if e["stages"] else "") for e in r["screens"]) or "–"
        L.append(f"| {r['id']} | {r['subject']} | {txt} | {scr} | {', '.join(r['gaps']) or '–'} |")
    open(f"{ROOT}/coverage/MAP.md", "w").write("\n".join(L) + "\n")
main()
