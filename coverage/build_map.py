#!/usr/bin/env python3
"""Builds coverage/map.json + coverage/MAP.md.
Inputs: coverage/inventory.json (lessons/stages dumped from src/content),
sources/Gazette_Notification_of_Exam_Bye_Laws_Under_CMR_2017.txt (G.S.R. 910(E), Annexure I = the First Class
Manager's syllabus: the DGMS side), sources/nitr/MN*.txt (the NITR side).
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
# ---- DGMS-only rules (syllabus wording differs from NITR's; NITR stays on the rules above) -------------
# Extra regex per existing topic id (syllabus wording, incl. its own spellings: "psychometrics", "Airbone dust").
DGMS_EXTRA = {
 "coal-genesis": r"occurrence of coal seams",
 "dip-strike": r"geological structures",
 "exploration-drilling": r"bore ?hole survey|methods of boring|boring through",
 "reserve-classification": r"indicated and proved",
 "special-sinking": r"running sand|water logged grounds",
 "access-shaft": r"outlets|vertical shaft|inclined shaft|\binclines?\b",
 "in-situ-stress": r"stress, strain|poisson|young.s modulus|lithostatic",
 "pillar-design": r"stooks",
 "support-bolting": r"roof management|support resistance|yielding",
 "subsidence": r"protection of surface structures|ground movement",
 "rock-drilling": r"performance parameters",
 "blast-design": r"\bblasting\b|charge per hole|deep hol",
 "pit-geometry": r"box cut|production benches|selection of site|preparation for excavation",
 "dragline-excavator": r"side cast|calculation of reach|bucket capacity",
 "truck-shovel": r"cycle time|productivity calculation|equipment fleet|shovel dumper",
 "haul-road": r"mine roads",
 "mine-gases": r"mine atmosphere|methane content|methanometer|multi.?gas|chromatograph|monitoring of different gases",
 "airflow-networks": r"air flow in mines|laws of air flow|ventilation planning|splitting|flow control|air velocit|air quantity|pressure requirement|standards of ventilation|ventilation calculation|ventilation plans",
 "fans-natural-vent": r"mechanical ventilation|reversal of air",
 "psychrometry": r"psychometric|heat and humidity|geothermal|heat flow|heat transfer|temperature rise|sources of heat",
 "dust-explosions": r"airbo?r?ne dust|dust suppression|mine explosions|fire ?damp and coal dust|explosion in quarries|water gas explosion|stone dust barrier|water barrier",
 "mine-drainage": r"drainage system|catchment|\bsump",
 "mine-electrical": r"central electricity authority",
 "economics-dcf": r"payback|project evaluation|capital budgeting",
 "risk-mgmt": r"risk management|standard operating procedure|hazard management plan|tarp|triggered action|job safety analysis|\bjsa\b|risk matrix|hierarchy of controls|due diligence|control effectiveness",
 "rescue-firstaid": r"resuscitat|reviving|emergency|disaster management",
 "g-lamps-lighting": r"methanometer|gas detector|illumination|photometry|\blamp",
 "g-inrush-water": r"water logged|sources of water|water dams|water lodgement|monsoon|safety boring|pattern of hole|water bodies",
 "g-mine-working-statutory": r"statutory provision|legal requirement",
 "g-thick-multi-seam": r"high.wall|thin seams|wide stall|opencast mining over developed|liquidation of developed",
 "g-special-mining": r"coal gasification|hydraulic mining",
 "g-ground-instrumentation": r"monitoring of rock mass|measuring instruments|monitoring systems",
 "g-mine-geomech-design": r"structures in rock",
 "g-mine-finance": r"cost analysis|cost control|break-even|working capital|\berp\b|enterprise resources",
 "g-sustainability": r"\bcsr\b|corporate social|community",
 "g-accidents-safety": r"frequency rate|severity|\btrap\b|cost of accident|incident|workers participation|\biso\b|tripartite|bipartite|safety conferences|information technology in safety|duty of care|industrial accident",
 "g-machinery": r"coal handling|transport system",
 "g-coal-seam-development": r"pit-bottom|shaft- top|choice of methods of mining",
}
# Gap topics only the syllabus needs: id, regex, placement, title, note, section filter (None = any).
DGMS_GAPS = [
 ("g-mgmt-org", r"^(?:introduction|personal management|behavioural sciences)", ("lesson", "u9"), "Mine management: organisation, leadership, conflict & motivation", "Paper (a) Mine Management. NITR has no matching subject. Owner decision 5: the Management book is re-sourced.", "Mine Management"),
 ("g-production-mgmt", r"^(?:production management|materials management)", ("lesson", "u9"), "Production & materials management: work study, productivity, inventory", "Paper (a) Mine Management.", "Mine Management"),
 ("g-occupational-health", r"occupational|silicosis|pneumoconiosis|diseases|sanitation|biological hazard|chemical hazard|working at heights|extreme weather|breathing in dust|dust sampling|counting and analysis|preventions and treatment|hazards due to dust|ambulance", ("lesson", "u10"), "Occupational health & hazards: diseases, dust sampling, heights, weather", "Paper (a) General Safety.", None),
 ("g-continuous-opencast", r"ripp|surface miner|non-blasting|bucket wheel|in-pit crushing|strip-mining|shiftable|high angle conveyor|scrapper|push pull|oitds|truck dispatch", ("lesson", "u5"), "Rippers, surface miners, BWE, IPCC & dispatch", "Paper (b) Opencast Mining; u5 covers dragline and truck-shovel only.", None),
 ("g-coalfields-maps", r"indian coalfields|geological maps|application of geology", ("screens", "u1-l1"), "Indian coalfields & reading geological maps", "Paper (b) Geology.", None),
]
DGMS_SKIP_GAPS = set()
# Known false hits of the shared rules on syllabus wording.
DGMS_NEG = {
 "g-mine-plans": r"mine planning|closure plan",
 "g-inrush-water": r"dust barrier|water barrier|sinking",
 "g-mine-geomech-design": r"methane|haul roads",
 "g-machinery": r"tubing",
 "g-ground-instrumentation": r"environment",
 "g-numerical-geomech": r"risk",
 "g-tailings-closure": r"fires",
 "g-accidents-safety": r"human resources",
 "bord-pillar": r"installation",
 "drivage": r"fan drift",
 "blast-design": r"blasting gallery|non-blasting",
 "waste-dump": r"dump trucks",
 "g-data-analytics": r"accident statistics",
}
# paper (c): heat loads of "belt conveyor"/longwall machines, shaft sizing and ventilation modelling are ventilation topics
DGMS_PAPER_SKIP = {"c": {"g-machinery", "g-numerical-geomech", "longwall", "bord-pillar", "access-shaft"}}
# Shared rules that misfire on syllabus wording: replaced, for DGMS only, by a rule on the item text alone (not its topic).
DGMS_OVERRIDE = {
 "pillar-design": r"design of bord and pillar|stooks|shaft pillar|pillar design|pillar strength|barrier pillar",  # not "developed pillars"
 "sampling-cutoff": r"cut-?off grade|grade.tonnage|ore sampling",  # dust/air sampling is not ore sampling
 "comminution": r"comminution|grinding|liberation",  # "in-pit crushing" is a transport system
 "waste-dump": r"waste dump|\bdumps\b|dump (?:stab|management|construction|slope|failure)|dumping|reclamation|bench and dump",
}
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

def classify_dgms(text, paper, section):
    """DGMS lines: the shared rules plus DGMS_EXTRA, DGMS_GAPS and the filters above. Kept separate so the NITR
    side classifies exactly as before."""
    t = text.lower(); item = t.split(": ", 1)[-1]
    def hit(cid, rx):
        if cid in DGMS_OVERRIDE: return re.search(DGMS_OVERRIDE[cid], item)
        return re.search(rx, t) or (cid in DGMS_EXTRA and re.search(DGMS_EXTRA[cid], t))
    cov = [(cid, lessons, rx) for cid, rx, lessons in COVERED if hit(cid, rx)]
    cov = [c for c in cov if not (c[0] in DGMS_NEG and re.search(DGMS_NEG[c[0]], t)) and c[0] not in DGMS_PAPER_SKIP.get(paper, ())]
    gap = [g[0] for g in GAPS if hit(g[0], g[1])]
    gap += [g[0] for g in DGMS_GAPS if (g[5] is None or g[5] == section) and re.search(g[1], t)]
    gap = [g for g in gap if not (g in DGMS_NEG and re.search(DGMS_NEG[g], t)) and g not in DGMS_PAPER_SKIP.get(paper, ())]
    return cov, gap

def classify(text):
    t = text.lower()
    cov = [(cid, lessons, rx) for cid, rx, lessons in COVERED if re.search(rx, t)]
    gap = [g[0] for g in GAPS if re.search(g[1], t)]
    return cov, gap

# ---- DGMS lines: G.S.R. 910(E) Annexure I ------------------------------------------------
GAZ = f"{ROOT}/sources/Gazette_Notification_of_Exam_Bye_Laws_Under_CMR_2017.txt"
PAPERS = {"a": "Mine Management, Legislation and General Safety", "b": "Winning and Working", "c": "Mine Ventilation"}
SECTIONS = {"MINE MANAGEMENT": "Mine Management", "LEGISLATION": "Legislation", "GENERAL SAFETY": "General Safety"}
def parse_annex1(path):
    raw = [l.replace("\f", "") for l in open(path, encoding="utf-8").read().split("\n")]
    start = next(i for i, l in enumerate(raw) if re.match(r"\s*ANNEXURE – I\s*$", l) and i > 3000)
    end = next(i for i in range(start + 1, len(raw)) if re.match(r"\s*ANNEXURE – II\s*$", raw[i]))
    page = max(int(m.group(1)) for l in raw[:start] if (m := re.match(r"=== PAGE (\d+) ===", l)))
    paras, cur, paper, section, pend = [], None, None, None, False
    HEAD = re.compile(r"^([A-Z][A-Za-z /&()’,-]{2,110}?)\s*:-?\s*(.*)$")
    def flush():
        nonlocal cur
        if cur and cur["body"].strip(): paras.append(cur)
        cur = None
    for l in raw[start + 1:end]:
        if (m := re.match(r"=== PAGE (\d+) ===", l)): page = int(m.group(1)); continue
        if re.search(r"THE GAZETTE OF INDIA|Hkkjr dk jkti=k", l): continue
        s = l.strip()
        if not s: pend = True; continue
        if pend and cur and re.match(r"[a-z]", s): pend = False; cur["body"] += " " + s; continue
        if pend: flush(); pend = False
        if re.match(r"SYLLABUS FOR|CERTIFICATE OF COMPETENCY|\(UNDER COAL", s): continue
        if (m := re.match(r"\(([abc])\)\s+(.*)$", s)): flush(); paper, section = m.group(1), None; continue
        if (m := re.match(r"(MINE MANAGEMENT|LEGISLATION|GENERAL SAFETY):-?$", s)): flush(); section = SECTIONS[m.group(1)]; continue
        hm = HEAD.match(s)
        new = cur is None or (hm and cur["body"].rstrip().endswith("."))
        if new:
            flush()
            if hm: cur = {"paper": paper, "section": section, "page": page, "heading": hm.group(1).strip(), "body": hm.group(2)}
            else: cur = {"paper": paper, "section": section, "page": page, "heading": None, "body": s}
        else: cur["body"] += " " + s
    flush()
    rows, n = [], {}
    for p in paras:
        body = re.sub(r"\s+", " ", p["body"]).strip()
        head = p["heading"] or re.split(r"[,;]", body)[0].rstrip(".")
        k = p["paper"]; n[k] = n.get(k, 0) + 1
        items = [x.strip(" .,") for x in body.split(";")]
        items = [x for x in items if len(x) > 2]
        for j, it in enumerate(items, 1):
            rows.append({"id": f"FC.{k}{n[k]:02d}.{j}", "paper": k, "paperName": PAPERS[k], "section": p["section"] or PAPERS[k],
                         "topic": head, "line": it, "page": p["page"]})
    return rows

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
    out = {"generated": "2026-11-27",
           "dgms_syllabus_source": "G.S.R. 910(E), Board of Mining Examinations (Coal), Dhanbad 14-09-2018, Gazette of India Extraordinary No. 672 of 24-09-2018: Annexure I, First Class Manager's Certificate syllabus (pages 41-45)",
           "dgms_papers": PAPERS,
           "sources": {"dgms": "sources/Gazette_Notification_of_Exam_Bye_Laws_Under_CMR_2017.pdf", "nitr": "sources/nitr/"}, "lessons": sorted(LES), "dgms": [], "nitr": [], "gaps": []}
    prev = ""
    for r in parse_annex1(GAZ):
        cov, gap = classify_dgms(f"{r['topic']}: {r['line']}", r["paper"], r["section"])
        if not cov and not gap:  # generic items ("types", "safety aspects") take the previous item's context
            cov, gap = classify_dgms(f"{r['topic']}: {prev} {r['line']}", r["paper"], r["section"])
            prev = f"{prev} {r['line']}"
        else: prev = r["line"]
        if not cov and not gap: gap = ["g-other"]
        r.update(covered=[c[0] for c in cov], lessons=sorted({l for c in cov for l in c[1]}), gaps=gap)
        out["dgms"].append(r)
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
    gtab = {g[0]: g for g in GAPS + DGMS_GAPS}; gtab["g-other"] = OTHER
    for gid, g in gtab.items():
        d = [r["id"] for r in out["dgms"] if gid in r["gaps"]]
        nl = [r for r in out["nitr"] if gid in r["gaps"] and "dupOf" not in r]
        out["gaps"].append({"id": gid, "title": g[3], "placement": {"type": g[2][0], "target": g[2][1]}, "note": g[4],
                            "dgms_lines": d, "nitr_lines": [r["id"] for r in nl], "nitr_subjects": sorted({r["code"] for r in nl})})
    out["gaps"] = [g for g in out["gaps"] if g["dgms_lines"] or g["nitr_lines"]]
    out["gaps"].sort(key=lambda g: (-len(g["dgms_lines"]), -len(g["nitr_lines"])))
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
    print("unclassified dgms:", [r["id"] + " " + r["line"][:60] for r in out["dgms"] if "g-other" in r["gaps"]])
    print("unclassified nitr:", [(r["id"], r["text"][:70]) for r in out["nitr"] if "g-other" in r["gaps"]][:60])

def unit_counts(out):
    """Per unit: syllabus lines with a covered lesson in that unit (DGMS total, per paper) and unique NITR theory lines.
    Same rule as the Phase 15 order (covered lessons only, gaps not counted); NITR breaks ties."""
    c = {}
    for r in out["dgms"]:
        for u in {l.split("-")[0] for l in r["lessons"]}:
            e = c.setdefault(u, {"dgms": 0, "a": 0, "b": 0, "c": 0, "nitr": 0}); e["dgms"] += 1; e[r["paper"]] += 1
    for r in out["nitr"]:
        if r["nature"] != "Theory" or "dupOf" in r: continue
        for u in {l.split("-")[0] for l in r["lessons"]}:
            c.setdefault(u, {"dgms": 0, "a": 0, "b": 0, "c": 0, "nitr": 0})["nitr"] += 1
    c.pop("u0", None)  # u0 is the orientation unit, not in the Phase 16 order
    full = sorted(c, key=lambda u: (-c[u]["dgms"], -c[u]["nitr"], int(u[1:])))
    pa = sorted(c, key=lambda u: (-c[u]["a"], -c[u]["dgms"], -c[u]["nitr"], int(u[1:])))
    return c, full, pa

def write_md(out):
    L = []
    nt = [r for r in out["nitr"] if r["nature"] == "Theory"]
    d = out["dgms"]
    L += ["# STRATA coverage map", "", "Generated by `coverage/build_map.py` from `coverage/inventory.json` (real lesson/stage ids), the G.S.R. 910(E) text in `sources/Gazette_Notification_of_Exam_Bye_Laws_Under_CMR_2017.txt` and `sources/nitr/`. Machine-readable twin: `coverage/map.json`.", "",
          "## How to read this", "",
          "- **DGMS side = the official syllabus.** Annexure I of G.S.R. 910(E) (Board of Mining Examinations (Coal), notification dated Dhanbad 14-09-2018, published in the Gazette of India Extraordinary No. 672 on 24-09-2018; gazette pages 41–45): *Syllabus for the examination for First Class Manager's Certificate of Competency (under CMR 2017)*. Each line here is one `;`-separated item of a syllabus paragraph; ids are `FC.<paper><paragraph>.<item>`.",
          "- **Three papers:** (a) Mine Management, Legislation and General Safety; (b) Winning and Working; (c) Mine Ventilation. Under §11.1 a mining **degree** holder sits only (a); a mining **diploma** holder or a candidate with other qualifications sits (a), (b) and (c).",
          "- **Marks:** G.S.R. 555(E) (11-08-2021) substituted §2: each subject is one 3-hour CBT, maximum 150 marks, pass at 75. The original 80 CBT + 20 oral scheme of §2.4–2.6 no longer applies. Neither document gives marks per topic, so lines are counted unweighted.",
          "- **Legislation line is dated.** The 2018 syllabus names the Mines Act 1952, Mines Rules 1955, Mines Rescue Rules 1985 and MVTR 1966. For STRATA those are historical: the OSH Code 2020 and the OSH (Central) Rules 2026 replace them (see CLAUDE.md). The syllabus line is mapped as written; teaching follows current law.",
          "- **Mapping is topical.** A line is COVERED when a lesson's subject matches it by the rules in `build_map.py`; it does not prove depth. Only u0-l1, u7-l1 (stage 0) and u10-l3 (stage 0) are sourced ConceptFlows.",
          "- Screen ids are `lessonId#stageIndex` (a stage's position in `src/content/units/*.ts`). ConceptFlow screens live inside stage 0 of their lesson.",
          "- NITR: 64 of 93 MN-coded subjects on the curriculum page have a published syllabus; 29 show \"Course Syllabus Not Found\" (listed in `sources/README.md`). Duplicate subjects (same text under old and new codes) are mapped once; labs and projects are not mapped.", "",
          "## Totals", "",
          "| Paper | Topics | Lines | Covered | With a gap | Fully GAP |", "|---|---|---|---|---|---|"]
    for k, name in PAPERS.items():
        rs = [r for r in d if r["paper"] == k]
        L.append(f"| ({k}) {name} | {len({r['topic'] for r in rs})} | {len(rs)} | {sum(1 for r in rs if r['lessons'])} | {sum(1 for r in rs if r['gaps'])} | {sum(1 for r in rs if not r['lessons'])} |")
    L.append(f"| **All** | {len({(r['paper'], r['topic']) for r in d})} | {len(d)} | {sum(1 for r in d if r['lessons'])} | {sum(1 for r in d if r['gaps'])} | {sum(1 for r in d if not r['lessons'])} |")
    L += ["", f"- NITR theory lines (unique): {sum(1 for r in nt if 'dupOf' not in r)}; with a covered lesson: {sum(1 for r in nt if 'dupOf' not in r and r['lessons'])}; with a gap: {sum(1 for r in nt if 'dupOf' not in r and r['gaps'])}; fully GAP: {sum(1 for r in nt if 'dupOf' not in r and not r['lessons'])}", ""]
    c, full, pa = unit_counts(out)
    L += ["## Lines per unit (Phase 16 order)", "", "Syllabus lines with a covered lesson in the unit (a line can count for several units). Order = DGMS lines, then NITR lines. Paper (a) only = the order for a degree holder, who sits only paper (a).", "",
          "| Unit | DGMS lines | (a) | (b) | (c) | NITR lines | Order (all papers) | Order (paper a only) |", "|---|---|---|---|---|---|---|---|"]
    for u in sorted(c, key=lambda u: int(u[1:])):
        e = c[u]; L.append(f"| {u.upper()} | {e['dgms']} | {e['a']} | {e['b']} | {e['c']} | {e['nitr']} | {full.index(u) + 1} | {pa.index(u) + 1} |")
    L += ["", f"All papers: {' → '.join(u.upper() for u in full)}", "", f"Paper (a) only: {' → '.join(u.upper() for u in pa)}", ""]
    L += ["## Ranked gap list", "", "Rank = DGMS syllabus lines touching the topic, then NITR (unique syllabus lines). Placement: **screens** = new screens/stage in an existing lesson; **new lesson** = appended at the end of the unit (stage indexes untouched).", "",
          "| # | Gap | DGMS lines | (a)/(b)/(c) | NITR lines | Placement | Note |", "|---|---|---|---|---|---|---|"]
    pap = {r["id"]: r["paper"] for r in d}
    for g in out["gaps"]:
        pl = f"screens in `{g['placement']['target']}`" if g["placement"]["type"] == "screens" else (f"new lesson in `{g['placement']['target']}`" if g["placement"]["type"] == "lesson" else "review")
        bp = "/".join(str(sum(1 for i in g["dgms_lines"] if pap[i] == k)) for k in "abc")
        L.append(f"| {g['rank']} | {g['title']} (`{g['id']}`) | {len(g['dgms_lines'])} | {bp} | {len(g['nitr_lines'])} | {pl} | {g['note']} |")
    L += ["", "## DGMS side: G.S.R. 910(E) Annexure I syllabus line → lesson / GAP", "", "| Line | Paper | Topic | Syllabus line (first 90 chars) | Lessons (screens) | Gap | Page |", "|---|---|---|---|---|---|---|"]
    for r in d:
        scr = ", ".join(f"{e['lesson']}" + (f" ({', '.join(s.split('#')[1] for s in e['stages'])})" if e["stages"] else "") for e in r["screens"]) or "–"
        top = r["topic"] if r["paper"] != "a" else f"{r['section']}: {r['topic']}"
        L.append(f"| {r['id']} | ({r['paper']}) | {top} | {r['line'][:90].replace('|', '/')} | {scr} | {', '.join(r['gaps']) or '–'} | {r['page']} |")
    L += ["", "## NITR side: syllabus line → lesson / GAP", "", "| Line | Subject | Topic (first 90 chars) | Lessons (screens) | Gap |", "|---|---|---|---|---|"]
    for r in nt:
        txt = re.sub(r"^(?:\d+\.\s*)?Module ?-?\s*\d+\s*:?\s*", "", r["text"])[:90].replace("|", "/")
        if "dupOf" in r: L.append(f"| {r['id']} | {r['subject']} | = {r['dupOf']} (same text) | see {r['dupOf']} | |"); continue
        scr = ", ".join(f"{e['lesson']}" + (f" ({', '.join(s.split('#')[1] for s in e['stages'])})" if e["stages"] else "") for e in r["screens"]) or "–"
        L.append(f"| {r['id']} | {r['subject']} | {txt} | {scr} | {', '.join(r['gaps']) or '–'} |")
    open(f"{ROOT}/coverage/MAP.md", "w").write("\n".join(L) + "\n")

main()
