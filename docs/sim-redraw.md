# Sim redraw tracker (Phase 15.5-v3e)

Every sim, redrawn to DESIGN.md §5.6 in batches of 15, in unit order U7, U6, U5, U10, U4, U3, U2, U1, U9, U8, U0 (the first batch also promoted the three v3a pilots).

**Per sim:** golden values are recorded before editing (`npm run golden:record`, into `tests/sims.golden.json`): params and limits, handle keys and axes, and every readout (raw value, text, tone) at min, default and objective-met. Then the visuals are redrawn (`SimDef.v3`), and `npm run test:golden` must match exactly. `npm run audit:sim` checks every redrawn sim against §5.6 and checks this table.

**Frame:** a redrawn sim draws in `0 0 400 viewH`, keeping the legacy origin and the 400 × 240 box, so the lesson hotspot pins (lesson content) still land on what they explain.

Status: `todo`, `done` (redrawn to v3, §5.6), `done-v2` (redrawn to v3.2, §5.6d) or `unsure: <reason>` (redrawn, needs a look). Phase 15.5-v3e (all remaining) redoes every `done` row to v3.2 and then every `todo` row; resume from the first row that is not `done-v2` or `unsure`. Golden: the result of `test:golden` after the redraw (`exact` = all 3 states identical).

| Sim | Unit | Status | Golden | Title |
|---|---|---|---|---|
| `u7-coward` | U7 | done-v2 | exact (min, default, objective-met) | Coward's explosibility triangle — methane in air |
| `u7-network` | U7 | done-v2 | exact (min, default, objective-met) | Ventilation network — Atkinson's law, splits and a regulator |
| `u7-fan` | U7 | done-v2 | exact (min, default, objective-met) | Axial fan characteristic, mine curve, stall and NVP |
| `u7-psychro` | U7 | unsure: pin 3 statutory-lines (160,72) sits ~40 units above the wet-bulb limit lines (lesson pin; a real mismatch, not the inset) | exact (min, default, objective-met) | Psychrometry & heat stress at the face |
| `u7-sponcom` | U7 | done-v2 | exact (min, default, objective-met) | Spontaneous heating early-warning analyser |
| `u7-dust` | U7 | done-v2 | exact (min, default, objective-met) | Roadway dust — incombustible content and stone dusting |
| `u7-pump` | U7 | done-v2 | exact (min, default, objective-met) | Mine dewatering — multistage pump head, power and NPSH |
| `u6-goaf` | U6 | done-v2 | exact (min, default, objective-met) | Depillaring goaf — immediate caving, main fall and air blast |
| `u6-longwall` | U6 | done-v2 | exact (min, default, objective-met) | Longwall face — abutment pressure and shield capacity |
| `u6-stope` | U6 | done-v2 | exact (min, default, objective-met) | Metalliferous stope — overbreak (ELOS) and dilution |
| `u6-cave` | U6 | done-v2 | exact (min, default, objective-met) | Block caving — draw ellipsoids and drawpoint spacing |
| `u6-lwcycle` | U6 | done-v2 | exact (min, default, objective-met) | Longwall face cycle — DERD shearer, AFC snake and shield advance |
| `u6-thick` | U6 | done-v2 | exact (min, default, objective-met) | Thick-seam extraction — Blasting Gallery vs Longwall Top Coal Caving |
| `u5-pit` | U5 | done-v2 | exact (min, default, objective-met) | Pit cross-section — stripping ratio vs break-even stripping ratio |
| `u5-dragline` | U5 | done-v2 | exact (min, default, objective-met) | Dragline side-casting — spoil geometry and rehandle |
| `u5-match` | U5 | unsure: pin 4 Match factor (150,24) sits over empty stage | exact (min, default, objective-met) | Truck–shovel match factor and queueing |
| `u5-haul` | U5 | done-v2 | exact (min, default, objective-met) | Haul road physics — resistance, rimpull, speed and super-elevation |
| `u5-dump` | U5 | done-v2 | exact (min, default, objective-met) | Multi-deck waste dump — overall slope and stability |
| `u10-roles` | U10 | done-v2 | exact (min, default, objective-met) | Statutory architecture & duty explorer |
| `u10-gassy` | U10 | done-v2 | exact (min, default, objective-met) | Degree of gassiness classifier (coal seams) |
| `u10-risk` | U10 | done-v2 | exact (min, default, objective-met) | Risk matrix — hazard rating and hierarchy of controls |
| `u10-fta` | U10 | done-v2 | exact (min, default, objective-met) | Fault tree — firedamp explosion |
| `u10-scba` | U10 | done-v2 | exact (min, default, objective-met) | Rescue mission planner — closed-circuit oxygen breathing apparatus |
| `u4-drill` | U4 | done-v2 | exact (min, default, objective-met) | Rock drilling — percussive, DTH and rotary penetration |
| `u4-explosive` | U4 | done-v2 | exact (min, default, objective-met) | ANFO thermochemistry — oxygen balance, VOD, pressure, impedance |
| `u4-kuzram` | U4 | done-v2 | exact (min, default, objective-met) | Kuz-Ram blast optimiser — bench round fragmentation |
| `u4-delay` | U4 | done-v2 | exact (min, default, objective-met) | NONEL firing-wave visualiser — spot the cut-offs |
| `u4-vibe` | U4 | done-v2 | exact (min, default, objective-met) | Scaled distance — PPV, DGMS limits and airblast |
| `u3-kirsch` | U3 | done-v2 | exact (min, default, objective-met) | Kirsch solution — boundary stress around an opening |
| `u3-failure` | U3 | done-v2 | exact (min, default, objective-met) | Failure envelopes — Mohr–Coulomb vs Hoek–Brown (σ1–σ3 space) |
| `u3-rmr` | U3 | done-v2 | exact (min, default, objective-met) | RMR (Bieniawski 1989) scorer with Q and GSI |
| `u3-bolt` | U3 | done-v2 | exact (min, default, objective-met) | Roof bolting — suspension and beam-building |
| `u3-pillar` | U3 | done-v2 | exact (min, default, objective-met) | Bord & pillar — tributary-area stress vs pillar strength |
| `u3-slope` | U3 | done-v2 | exact (min, default, objective-met) | Plane failure — limit equilibrium of a sliding block |
| `u3-subsidence` | U3 | done-v2 | exact (min, default, objective-met) | Subsidence trough — sub-critical, critical, super-critical |
| `u3-slope-modes` | U3 | done-v2 | exact (min, default, objective-met) | Slope failure modes — plane, wedge, circular (Bishop) and toppling |
| `u2-access` | U2 | unsure: at D=max the incline is drawn over the "Incline" label and capex bars (label looks struck through) | exact (min, default, objective-met) | Access trade-off — adit, incline or shaft |
| `u2-sinking` | U2 | done-v2 | exact (min, default, objective-met) | Conventional sinking cycle & Galloway stage |
| `u2-freeze` | U2 | done-v2 | exact (min, default, objective-met) | Freeze-wall design through a running-sand aquifer |
| `u2-burncut` | U2 | done-v2 | exact (min, default, objective-met) | Parallel-hole burn cut — pull and firing sequence |
| `u2-cutting` | U2 | todo | — | Rock-cutting machines — specific energy and cutting rate |
| `u1-coalrank` | U1 | unsure: pin 4 (150,178) only lands on the Ro pointer at some depths | exact (min, default, objective-met) | Coalification furnace — burial, heat and time |
| `u1-supergene` | U1 | done-v2 | exact (min, default, objective-met) | Supergene enrichment profile |
| `u1-dip` | U1 | unsure: pin 1 (67,136) sits ~11 units below the strike line (as before the redraw) | exact (min, default, objective-met) | True vs apparent dip — plan and section |
| `u1-fault` | U1 | todo | — | Fault displacement — throw, heave, gap and overlap |
| `u1-rqd` | U1 | done-v2 | exact (min, default, objective-met) | Diamond core tray — RQD logger |
| `u1-unfc` | U1 | done-v2 | exact (min, default, objective-met) | UNFC three-axis classifier (MEMC Rules 2015) |
| `u1-dip3` | U1 | todo | — | Three-point problem — seam dip & strike from three boreholes |
| `u9-npv` | U9 | todo | — | Project DCF — NPV, IRR and payback with royalty, DMF and NMET |
| `u9-cutoff` | U9 | todo | — | Grade–tonnage curve and break-even cut-off grade |
| `u9-pit` | U9 | todo | — | Lerchs–Grossmann 2-D ultimate pit (45° slopes) |
| `u9-radar` | U9 | todo | — | Slope stability radar — Fukuzono inverse-velocity forecast |
| `u8-bowditch` | U8 | todo | — | Closed traverse — misclosure and Bowditch adjustment |
| `u8-weisbach` | U8 | todo | — | Shaft plumbing — Weisbach triangle error control |
| `u8-bond` | U8 | todo | — | Comminution energy — Bond's third theory |
| `u8-wash` | U8 | todo | — | Coal washability — cut-point, yield, ash and near-gravity material |
| `u8-earth` | U8 | todo | — | Earth fault on a UG feeder — restricted neutral & earth-leakage relay |
| `u8-koepe` | U8 | todo | — | Koepe friction winder — rope slip check |
| `u8-flot` | U8 | todo | — | Froth flotation circuit — reagents, aeration, grade–recovery |
| `u8-zones` | U8 | todo | — | FLP vs IS — gassy-mine electrical zoning troubleshooter |
| `u0-overburden` | U0 | done-v2 | exact (min, default, objective-met) | Overburden column — vertical stress gauge |
