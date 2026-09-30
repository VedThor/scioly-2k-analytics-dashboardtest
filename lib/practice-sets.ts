import type { Difficulty, SciolyEventHub, SciolyPracticePrompt, SciolyTest } from "@/lib/resource-data";

type PracticeSeed = Pick<SciolyEventHub, "name" | "category" | "description" | "topics" | "starterPath">;

const practiceThemes: Array<{
  name: string;
  focus: string;
  format: SciolyTest["format"];
  difficulty: Difficulty;
  durationMinutes: number;
}> = [
  { name: "Foundation Check", focus: "core vocabulary, mechanisms, and accurate explanations", format: "Mini Test", difficulty: "Rookie", durationMinutes: 25 },
  { name: "Connections", focus: "relationships among major topics", format: "Mini Test", difficulty: "Rookie", durationMinutes: 30 },
  { name: "Data and Diagrams", focus: "reading evidence before drawing conclusions", format: "Mini Test", difficulty: "Rookie", durationMinutes: 30 },
  { name: "Applied Reasoning", focus: "using knowledge in unfamiliar situations", format: "Full Test", difficulty: "Pro", durationMinutes: 40 },
  { name: "Error Analysis", focus: "finding weak assumptions, measurements, and procedures", format: "Full Test", difficulty: "Pro", durationMinutes: 40 },
  { name: "Timed Stations", focus: "concise answers under tournament pacing", format: "Full Test", difficulty: "Pro", durationMinutes: 45 },
  { name: "Rules and Strategy", focus: "preparation decisions that must be checked against current official materials", format: "Full Test", difficulty: "Pro", durationMinutes: 40 },
  { name: "Advanced Synthesis", focus: "multi-step explanations and defensible tradeoffs", format: "Full Test", difficulty: "All-Star", durationMinutes: 50 },
  { name: "Invitational Simulation", focus: "mixed-format competition practice", format: "Testoff Set", difficulty: "All-Star", durationMinutes: 50 },
  { name: "Testoff Challenge", focus: "communication, troubleshooting, and mastery under pressure", format: "Testoff Set", difficulty: "All-Star", durationMinutes: 50 },
];

function at(items: string[], index: number) {
  return items[index % items.length];
}

function applicationPrompt(seed: PracticeSeed, topic: string) {
  if (seed.category === "Build") {
    return `Design a controlled build trial focused on ${topic}. Identify the variable you will change, the result you will measure, three controls, and the data that would justify the next design revision.`;
  }
  if (seed.category === "Lab") {
    return `Plan a safe, repeatable investigation involving ${topic}. State the variables, controls, measurements, units, and one source of uncertainty.`;
  }
  if (seed.category === "Hybrid") {
    return `Connect a content prediction about ${topic} to a hands-on or build decision. State what you predict, how you would test it, and what result would make you revise the decision.`;
  }
  return `A tournament station gives a diagram, specimen, or dataset about ${topic}. List the observations you would record first, the principle you would apply, and one conclusion the evidence would not support.`;
}

function applicationAnswer(seed: PracticeSeed, topic: string) {
  if (seed.category === "Build") {
    return `A full-credit plan changes one clearly named ${topic} variable, defines a measurable response, controls materials and conditions, uses repeated trials, and links the evidence to one specific revision.`;
  }
  if (seed.category === "Lab") {
    return `A full-credit plan is safe and repeatable, names independent and dependent variables, holds relevant conditions constant, records values with units and replicates, and identifies a realistic uncertainty affecting ${topic}.`;
  }
  if (seed.category === "Hybrid") {
    return `A full-credit response states a mechanism-based prediction, a measurable test, a decision threshold, and a revision that follows logically if the ${topic} result conflicts with the prediction.`;
  }
  return `A full-credit response separates observation from inference, applies a relevant ${topic} principle, cites evidence from the provided material, and identifies a limitation or alternative explanation.`;
}

function makeQuestions(seed: PracticeSeed, testIndex: number): SciolyPracticePrompt[] {
  const topics = seed.topics.length ? seed.topics : [seed.name];
  const a = at(topics, testIndex);
  const b = at(topics, testIndex + 1);
  const c = at(topics, testIndex + 2);
  const d = at(topics, testIndex + 3);
  const firstStep = at(seed.starterPath.length ? seed.starterPath : [seed.description], testIndex);

  return [
    {
      number: 1,
      points: 5,
      prompt: `Explain ${a} in your own words. Include one mechanism and one observation or measurement that would support the explanation in ${seed.name}.`,
      answer: `Full credit requires an accurate explanation of ${a}, a cause-and-effect mechanism, and an event-relevant observation or measurement with units where applicable. A label or memorized definition alone is incomplete.`,
    },
    {
      number: 2,
      points: 5,
      prompt: `Compare ${a} with ${b}. Give one important distinction, one meaningful connection, and one situation in which confusing them would lead to a wrong answer or design choice.`,
      answer: `Full credit defines both ideas, states a defensible difference and connection, and applies that distinction to a concrete ${seed.name} decision or interpretation.`,
    },
    {
      number: 3,
      points: 5,
      prompt: applicationPrompt(seed, c),
      answer: applicationAnswer(seed, c),
    },
    {
      number: 4,
      points: 5,
      prompt: `A teammate says that ${d} alone determines the outcome. Evaluate the claim, name at least two other factors, and describe evidence that would distinguish among the explanations.`,
      answer: `Full credit rejects an unsupported single-factor conclusion, identifies two plausible interacting factors, and proposes evidence or a controlled comparison that could separate their effects.`,
    },
    {
      number: 5,
      points: 5,
      prompt: `Create a causal chain that connects ${a}, ${b}, and ${c}. Label each arrow with the mechanism, assumption, or constraint that makes the connection valid.`,
      answer: `Full credit includes all three topics in a logical order, explains each connection rather than drawing unlabeled arrows, and states at least one assumption or condition under which the chain could fail.`,
    },
    {
      number: 6,
      points: 5,
      prompt: `Turn this preparation step into a six-minute practice station: “${firstStep}” Specify the task, the evidence a teammate must produce, and a quick scoring rubric.`,
      answer: `Full credit creates a time-bounded, observable task with a clear product or measurement and a rubric that rewards accuracy, reasoning, and complete evidence rather than speed alone.`,
    },
    {
      number: 7,
      points: 5,
      prompt: `Write a pre-tournament rules audit for ${seed.name}. List the current official sources to check and the categories of details that must be confirmed before practicing or competing. Do not guess numerical limits.`,
      answer: `The audit should name the official 2027 rules, national corrections and clarifications, and tournament-specific notices. It should verify allowed resources and tools, safety, construction or lab constraints, timing, impound/setup where relevant, scoring, and any local modifications.`,
    },
    {
      number: 8,
      points: 5,
      prompt: `After this test, choose the weakest response and write a correction plan. Identify the missing knowledge or skill, one authoritative resource to revisit, and a measurable retest target.`,
      answer: `Full credit identifies a specific gap, selects a source appropriate to that gap, and sets a concrete retest target such as accuracy, completion time, measurement spread, or successful repeated trials.`,
    },
  ];
}

export function buildPracticeTests(seed: PracticeSeed): SciolyTest[] {
  return practiceThemes.map((theme, index) => ({
    testNumber: index + 1,
    title: `Practice Test ${index + 1}: ${theme.name}`,
    format: theme.format,
    difficulty: theme.difficulty,
    durationMinutes: theme.durationMinutes,
    description: `${theme.focus[0].toUpperCase()}${theme.focus.slice(1)} across the published 2027 ${seed.name} scope.`,
    body: `Original team practice material. Suggested time: ${theme.durationMinutes} minutes. Complete all eight prompts before opening the answer guide. Use the official 2027 rules, corrections, clarifications, and your tournament notices for every rule-specific decision.`,
    questions: makeQuestions(seed, index),
  }));
}
