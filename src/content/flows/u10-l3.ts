import type { FlowScreen } from "@/lib/types";

/** Concept flow for u10-l3 stage 0 (hierarchy of controls). Every claim traces to research/u10-l3.md. */
export const U10L3_FLOW: FlowScreen[] = [
  {
    kind: "predict",
    q: "Workers keep getting hurt by the same hazard. Which kind of fix protects them best, in general?",
    options: ["Better PPE for everyone", "More training and rest breaks", "Removing the hazard at its source", "Warning signs at the entry"],
    answer: 2,
    why: [
      "PPE works only when every worker wears it correctly, every time.",
      "Work practices cut how long or how often people are exposed, but the hazard stays.",
      "Right. If the hazard is gone, no exposure can occur. That is why elimination comes first.",
      "Signs are an administrative measure at best. They depend on people noticing and obeying them, and the hazard stays in place.",
    ],
    concept: "Elimination is the most effective control",
    src: ["niosh-hoc"],
  },
  {
    kind: "explain",
    text: "NIOSH ranks five kinds of control by general effectiveness: elimination, substitution, engineering controls, administrative controls, then personal protective equipment. Work from the top down.",
    visual: { focus: [1] },
    src: ["niosh-hoc"],
  },
  {
    kind: "explain",
    text: "Why the top three win: they control exposure without depending much on what people do. Administrative controls and PPE can still reduce exposure, but they need ongoing effort from workers and supervisors, and PPE works only when worn correctly.",
    src: ["niosh-hoc"],
  },
  {
    kind: "check",
    q: "A plant replaces a toxic solvent with a safer one. Which level of the hierarchy is that?",
    options: ["Elimination", "Substitution", "Engineering control", "Administrative control"],
    answer: 1,
    why: [
      "Elimination removes the hazard altogether. Here a hazard still exists, just a smaller one.",
      "Right. A less harmful option takes the place of what caused the hazard.",
      "Engineering controls keep a hazard away from the worker. Here the hazard itself has changed.",
      "Administrative controls change how people work, not what the hazard is.",
    ],
    hint: "Has the hazard gone, or been swapped for something milder?",
    concept: "Substitution swaps in a safer alternative",
    src: ["niosh-hoc"],
  },
  {
    kind: "misconception",
    claim: "Swapping in a 'safer' option always lowers the risk.",
    truth: "A substitute can bring new hazards of its own. Weigh its risks against the original, including how it interacts with other agents present in the workplace, before you call it safer.",
    src: ["niosh-hoc"],
  },
  {
    kind: "explain",
    text: "The best engineering controls are built into the original design. They block the hazard at its source, can't easily be defeated, and need little action from the user. They can cost more up front but often less over time.",
    src: ["niosh-hoc"],
  },
  {
    kind: "check",
    q: "Which of these is an administrative control?",
    options: ["A machine guard with an interlock", "Job rotation to shorten each person's exposure", "Respirators", "Redesigning the process to drop the hazard"],
    answer: 1,
    why: [
      "A guard physically separates people from the hazard, so it is an engineering control.",
      "Right. Administrative controls change the duration, frequency or intensity of exposure through work practices.",
      "Respirators are worn by the worker, so they are PPE.",
      "Dropping the hazard from the process is elimination.",
    ],
    hint: "Look for the option that changes how long or how often people are exposed.",
    concept: "Administrative controls change work practices",
    src: ["niosh-hoc"],
  },
  {
    kind: "nudge",
    sim: "u10-risk",
    ask: "A fatal-potential hazard is rated likely. Pick a control that brings residual risk down to Medium or lower.",
    goal: (p, o) => p.L === 4 && p.C === 5 && o.br <= 1,
    after: "Only substitution and elimination, which change the hazard itself, got it that low here. Engineering, training and PPE reduce exposure but leave the hazard in place.",
    src: ["niosh-hoc"],
  },
  {
    kind: "check",
    q: "When is PPE the right answer?",
    options: ["Always first, because it is cheapest", "While better controls are being developed, or when they can't reduce exposure enough", "Never in a mine", "Only for visitors"],
    answer: 1,
    why: [
      "PPE can look cheap but can grow costly over time, especially for many workers every day, and it shouldn't be relied on alone when other effective options exist.",
      "Right. PPE is required when other controls are still being developed or can't bring exposure down to safe levels.",
      "PPE has a clear role. It is the last line, not a banned one.",
      "Anyone exposed to the hazard needs protection, not only visitors.",
    ],
    concept: "PPE is the last line of defence",
    src: ["niosh-hoc"],
  },
];
