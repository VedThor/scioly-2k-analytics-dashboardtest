import type { Difficulty, SciolyEventHub, SciolyPracticePrompt, SciolyQuestion, SciolyTest } from "@/lib/resource-data";

type PracticeSeed = Pick<SciolyEventHub, "name" | "category" | "description" | "topics" | "starterPath">;

const practiceThemes: Array<{
  name: string;
  focus: string;
  format: SciolyTest["format"];
  difficulty: Difficulty;
  durationMinutes: number;
}> = [
  { name: "Foundation Check", focus: "core vocabulary, mechanisms, and accurate explanations", format: "Full Test", difficulty: "Rookie", durationMinutes: 45 },
  { name: "Connections", focus: "relationships among major topics", format: "Full Test", difficulty: "Rookie", durationMinutes: 45 },
  { name: "Data and Diagrams", focus: "reading evidence before drawing conclusions", format: "Full Test", difficulty: "Rookie", durationMinutes: 50 },
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

function makeMcqQuestions(seed: PracticeSeed, testIndex: number): SciolyPracticePrompt[] {
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
      prompt: `Which response would best explain ${a} in a ${seed.name} tournament setting?`,
      options: [
        "A memorized definition with no supporting evidence",
        "A definition, a cause-and-effect mechanism, and a relevant observation or measurement",
        "A list of related vocabulary in alphabetical order",
        "A conclusion based only on what usually happens",
      ],
      correctOption: 1,
      answer: `A complete explanation connects an accurate definition of ${a} to a mechanism and evidence that could be observed or measured.`,
    },
    {
      number: 2,
      points: 5,
      prompt: `What is the strongest way to compare ${a} with ${b}?`,
      options: [
        "Describe only the feature they share",
        "Choose whichever term sounds more familiar",
        "State a meaningful distinction, explain their connection, and apply it to a concrete case",
        "Treat the two ideas as interchangeable",
      ],
      correctOption: 2,
      answer: `A useful comparison defines both ideas, identifies a defensible distinction and connection, and shows why the difference matters in ${seed.name}.`,
    },
    {
      number: 3,
      points: 5,
      prompt: `Which plan would produce the most defensible evidence about ${c}?`,
      options: [
        "Change several conditions at once and keep only the best result",
        "Use one trial and omit units to save time",
        "Start with the conclusion and select observations that agree",
        "Define the measured outcome, control relevant conditions, repeat the work, and record values with units",
      ],
      correctOption: 3,
      answer: applicationAnswer(seed, c),
    },
    {
      number: 4,
      points: 5,
      prompt: `A teammate claims that ${d} alone determines the outcome. Which response is most scientific?`,
      options: [
        "Accept the claim because it is simple",
        "Identify plausible interacting factors and propose evidence that could separate their effects",
        "Reject the claim without collecting evidence",
        "Repeat the claim using more technical vocabulary",
      ],
      correctOption: 1,
      answer: "A defensible response considers alternative factors and uses evidence or a controlled comparison to distinguish their effects.",
    },
    {
      number: 5,
      points: 5,
      prompt: `Which causal chain involving ${a}, ${b}, and ${c} would earn the most credit?`,
      options: [
        "Three topic names joined by unlabeled arrows",
        "A sequence chosen only because the terms appear in that order in notes",
        "A logical sequence whose arrows name mechanisms and whose assumptions are stated",
        "Any sequence, provided it uses all three terms",
      ],
      correctOption: 2,
      answer: "A causal chain must explain every connection and identify an assumption or condition under which the relationship could change or fail.",
    },
    {
      number: 6,
      points: 5,
      prompt: `Which version best turns “${firstStep}” into a useful six-minute station?`,
      options: [
        "Tell the student to study harder for six minutes",
        "Assign a specific observable task, require evidence, and score accuracy and reasoning with a short rubric",
        "Ask the student to reread notes without producing anything",
        "Score only whether the student finishes early",
      ],
      correctOption: 1,
      answer: "The station should have a time-bounded task, an observable product or measurement, and a rubric that rewards accurate reasoning and evidence.",
    },
    {
      number: 7,
      points: 5,
      prompt: `Which sources control a rules-specific decision for ${seed.name}?`,
      options: [
        "An old invitational test and an online discussion",
        "A teammate's memory of last season",
        "The official 2027 rules, national corrections and clarifications, and tournament-specific notices",
        "Any study guide with a recent-looking cover",
      ],
      correctOption: 2,
      answer: "Current official rules and updates control. Tournament notices must also be checked for local procedures or modifications.",
    },
    {
      number: 8,
      points: 5,
      prompt: "Which post-test correction plan is measurable?",
      options: [
        "Review everything sometime before competition",
        "Choose a specific gap, revisit an authoritative source, and set a numerical or observable retest target",
        "Memorize the answer key without finding the cause of the error",
        "Avoid the weakest topic on the next test",
      ],
      correctOption: 1,
      answer: "A useful correction plan identifies the exact gap, matches it to a trustworthy source, and defines what improvement will be measured on the retest.",
    },
    {
      number: 9,
      points: 5,
      prompt: `Which record would make a conclusion about ${b} easiest to audit?`,
      options: [
        "A final conclusion with the raw observations omitted",
        "Measurements with units, conditions, repeated trials, and any excluded values identified",
        "Only the trial that best matches the prediction",
        "A verbal summary written from memory after practice",
      ],
      correctOption: 1,
      answer: "An auditable record preserves measurements, units, conditions, repeats, and transparent treatment of every value.",
    },
    {
      number: 10,
      points: 5,
      prompt: `A result involving ${c} differs from the expected pattern. What should happen first?`,
      options: [
        "Delete the value immediately",
        "Change the prediction so the value fits",
        "Check the procedure, units, instrument, and raw record before deciding whether the value is anomalous",
        "Average it with an invented value",
      ],
      correctOption: 2,
      answer: "Unexpected data should be investigated against the procedure and raw record before it is retained, repeated, or excluded with justification.",
    },
    {
      number: 11,
      points: 5,
      prompt: `Which statement best separates accuracy from precision when working with ${d}?`,
      options: [
        "Accuracy is closeness to a reference; precision is consistency among repeated measurements",
        "Accuracy and precision are always identical",
        "Precision means using more decimal places",
        "Accuracy can be judged without any reference or expectation",
      ],
      correctOption: 0,
      answer: "Accuracy concerns closeness to an accepted or reference value, while precision concerns repeatability.",
    },
    {
      number: 12,
      points: 5,
      prompt: `Which graphing choice would best support a quantitative claim about ${a}?`,
      options: [
        "Axes without labels so the graph looks cleaner",
        "A decorative chart chosen before seeing the variables",
        "Labeled axes with units, an appropriate scale, plotted data, and uncertainty when available",
        "A graph containing only the expected trendline",
      ],
      correctOption: 2,
      answer: "A defensible graph identifies variables and units, uses a readable scale, shows the observations, and represents uncertainty when the data support it.",
    },
    {
      number: 13,
      points: 5,
      prompt: `When testing a claim that links ${a} and ${b}, which design is strongest?`,
      options: [
        "Change one relevant factor, define the response, control competing factors, and repeat the comparison",
        "Change every factor at once to save time",
        "Use the most successful single trial",
        "Skip a baseline because the relationship seems obvious",
      ],
      correctOption: 0,
      answer: "A strong comparison isolates the factor of interest, defines the measured response, controls alternatives, includes a baseline where relevant, and repeats trials.",
    },
    {
      number: 14,
      points: 5,
      prompt: `Which response to a unit mismatch in a ${seed.name} calculation is correct?`,
      options: [
        "Ignore units if the numerical answer looks reasonable",
        "Convert quantities to compatible units, show the conversion, and carry units through the calculation",
        "Remove units from every value",
        "Round all inputs before converting",
      ],
      correctOption: 1,
      answer: "Compatible units and explicit conversions are required for a meaningful quantitative result.",
    },
    {
      number: 15,
      points: 5,
      prompt: `What is the best reason to repeat an observation or trial involving ${c}?`,
      options: [
        "To guarantee the preferred answer",
        "To estimate consistency, reveal variation, and reduce the influence of a single unusual result",
        "To avoid recording the first result",
        "To replace the need for controls",
      ],
      correctOption: 1,
      answer: "Repeated work shows variation and repeatability; it does not replace controls or justify discarding inconvenient data.",
    },
    {
      number: 16,
      points: 5,
      prompt: `Which statement is a supported inference about ${d}?`,
      options: [
        "A claim that goes beyond every observation provided",
        "A restatement of the desired conclusion",
        "A conclusion linked to the observations through a named principle, with a limitation stated",
        "A conclusion based on one unlabeled image",
      ],
      correctOption: 2,
      answer: "A supported inference identifies the evidence and the principle connecting it to the conclusion, while acknowledging an important limit.",
    },
    {
      number: 17,
      points: 5,
      prompt: `Two teammates disagree about an interpretation of ${a}. What is the best next step?`,
      options: [
        "Choose the interpretation from the more experienced teammate",
        "List the evidence each interpretation predicts and check those predictions against the data or an authoritative source",
        "Combine both conclusions without checking them",
        "Vote and move on",
      ],
      correctOption: 1,
      answer: "Competing interpretations should be tested by their predictions and checked against evidence or an appropriate authoritative source.",
    },
    {
      number: 18,
      points: 5,
      prompt: `Which answer format is clearest for a multi-step ${seed.name} problem?`,
      options: [
        "A final number with no work",
        "Unlabeled calculations in the margin",
        "A claim followed by organized evidence, calculations with units, and a short explanation of the reasoning",
        "A long paragraph that never states a conclusion",
      ],
      correctOption: 2,
      answer: "Clear work states the claim, preserves units and evidence, and explains how the reasoning reaches the conclusion.",
    },
    {
      number: 19,
      points: 5,
      prompt: `Before using a tool, specimen, dataset, or device in ${seed.name}, what should a competitor verify?`,
      options: [
        "Only whether a teammate used it last year",
        "That it is allowed by the current official rules and tournament notices, and that required safety procedures are followed",
        "That it produces the fastest result",
        "That it appears in an unofficial study guide",
      ],
      correctOption: 1,
      answer: "Current official rules, updates, tournament notices, and applicable safety procedures control what may be used and how.",
    },
    {
      number: 20,
      points: 5,
      prompt: `Which final review best demonstrates mastery across ${a}, ${b}, ${c}, and ${d}?`,
      options: [
        "Recite four isolated definitions",
        "Explain a mechanism that connects the topics, apply it to new evidence, and identify a condition that could change the conclusion",
        "Copy the answer key word for word",
        "Choose one topic and ignore the others",
      ],
      correctOption: 1,
      answer: "Mastery combines accurate knowledge, connected mechanisms, transfer to unfamiliar evidence, and awareness of assumptions or limits.",
    },
  ];
}

export function buildPracticeQuestions(seed: PracticeSeed): SciolyQuestion[] {
  const topics = seed.topics.length ? seed.topics : [seed.name];
  const a = at(topics, 0);
  const b = at(topics, 1);
  const c = at(topics, 2);
  const d = at(topics, 3);

  return [
    {
      topic: a,
      difficulty: "Rookie",
      question: `What makes an explanation of ${a} complete?`,
      answer: `Define ${a} accurately, describe a cause-and-effect mechanism, and cite one relevant observation or measurement.`,
      explanation: "Strong Science Olympiad answers connect knowledge to evidence instead of stopping at a memorized definition.",
    },
    {
      topic: `${a} and ${b}`,
      difficulty: "Rookie",
      question: `What should a strong comparison of ${a} and ${b} include?`,
      answer: "One meaningful distinction, one defensible connection, and a concrete situation in which the distinction changes an answer, interpretation, or design choice.",
      explanation: "Comparisons earn credit when they explain why a similarity or difference matters.",
    },
    {
      topic: c,
      difficulty: "Pro",
      question: `How should you separate observation from inference in a station about ${c}?`,
      answer: "Record what is directly visible or measured first, including units and uncertainty where relevant, then state the principle used to interpret that evidence.",
      explanation: "Keeping observations separate from conclusions makes the reasoning auditable and reduces overclaiming.",
    },
    {
      topic: d,
      difficulty: "Pro",
      question: `What would make a practice investigation or trial involving ${d} defensible?`,
      answer: applicationAnswer(seed, d),
      explanation: "The best plan defines evidence before the trial and controls enough conditions to support a clear conclusion.",
    },
    {
      topic: "Rules and strategy",
      difficulty: "All-Star",
      question: `What must a pre-tournament rules audit for ${seed.name} verify?`,
      answer: "Check the official 2027 rules, national corrections and clarifications, and tournament notices for allowed resources and tools, safety, construction or lab constraints, timing, setup or impound where relevant, scoring, and local modifications.",
      explanation: "Rule-specific decisions should come from current official sources; practice material should never invent numerical limits.",
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
    description: `${index < 3 ? `Multiple-choice practice for ${theme.focus}` : `${theme.focus[0].toUpperCase()}${theme.focus.slice(1)}`} across the published 2027 ${seed.name} scope.`,
    body: `Original team practice material. Suggested time: ${theme.durationMinutes} minutes. Complete all ${index < 3 ? 20 : 8} questions before opening the answer guide. Use the official 2027 rules, corrections, clarifications, and your tournament notices for every rule-specific decision.`,
    questions: index < 3 ? makeMcqQuestions(seed, index) : makeQuestions(seed, index),
  }));
}
