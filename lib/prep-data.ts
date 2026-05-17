import type {
  EventPrep,
  Quiz,
  QuizQuestion,
  ResourceItem,
  TestBankItem,
} from "./prep-types";

export const eventPrepData: EventPrep[] = [
  {
    id: "designer-genes",
    name: "Designer Genes",
    category: "Study",
    eventLead: "Unassigned",
    shortDescription:
      "Genetics-focused event covering inheritance, molecular biology, biotechnology, and problem solving.",
    starterPath: [
      {
        id: "dg-start-rules",
        phase: "Start",
        title: "Read the rules and topic boundaries",
        description:
          "Start by reading the official rules and listing every testable topic. Do not jump straight into random tests before knowing what can appear.",
        estimatedTime: "20 min",
        resourceIds: ["dg-rules-guide"],
      },
      {
        id: "dg-foundation-core",
        phase: "Foundation",
        title: "Build the core genetics foundation",
        description:
          "Review Mendelian genetics, inheritance patterns, pedigrees, DNA structure, transcription, translation, mutations, and biotechnology basics.",
        estimatedTime: "1-2 hrs",
        resourceIds: ["dg-beginner-notes", "dg-cheat-sheet"],
      },
      {
        id: "dg-practice-basic",
        phase: "Practice",
        title: "Complete beginner practice questions",
        description:
          "Answer a small set of questions untimed first. Focus on why each wrong answer is wrong, not just whether you got it right.",
        estimatedTime: "30 min",
        quizIds: ["dg-beginner-quiz"],
      },
      {
        id: "dg-review-mistakes",
        phase: "Review",
        title: "Create a mistake log",
        description:
          "Write down missed topics, confusing vocabulary, and question types that took too long. This becomes your personal scouting report.",
        estimatedTime: "20 min",
      },
      {
        id: "dg-test-mini",
        phase: "Test",
        title: "Take a timed mini-test",
        description:
          "Take a short timed test to check whether you can apply the material under pressure.",
        estimatedTime: "30-45 min",
        testIds: ["dg-mini-test-1"],
      },
      {
        id: "dg-advanced-drill",
        phase: "Advanced",
        title: "Move into mixed-topic drilling",
        description:
          "Once the basics are stable, practice mixed questions across pedigrees, probability, molecular genetics, and biotechnology.",
        estimatedTime: "1 hr",
        quizIds: ["dg-mixed-quiz"],
      },
    ],
    scoutingReport: {
      commonMistakes: [
        "Memorizing vocabulary without practicing problem solving.",
        "Skipping pedigrees and probability because they feel slower.",
        "Not reviewing missed questions after practice.",
        "Mixing up codominance, incomplete dominance, and sex-linked inheritance.",
      ],
      medalistHabits: [
        "Keeps a mistake log by topic.",
        "Practices under time pressure before competition.",
        "Can explain why wrong answers are wrong.",
        "Uses resources to patch weak topics instead of rereading everything.",
      ],
      highValueSkills: [
        "Pedigree analysis",
        "Genetic probability",
        "Molecular genetics vocabulary",
        "Biotechnology applications",
        "Fast elimination on multiple choice",
      ],
      defaultNextMove:
        "Take the beginner quiz, then review the weakest topic shown in your results.",
    },
  },
  {
    id: "engineering-cad",
    name: "Engineering CAD",
    category: "Build",
    eventLead: "Unassigned",
    shortDescription:
      "CAD-focused engineering event requiring fast modeling, clean constraints, and accurate interpretation of design prompts.",
    starterPath: [
      {
        id: "ecad-start-tools",
        phase: "Start",
        title: "Set up the CAD environment",
        description:
          "Make sure you can access the required CAD software and know how to create, rename, export, and organize files.",
        estimatedTime: "20 min",
        resourceIds: ["ecad-setup-guide"],
      },
      {
        id: "ecad-foundation-sketches",
        phase: "Foundation",
        title: "Practice sketch constraints",
        description:
          "Drill dimensions, constraints, symmetry, offsets, construction lines, and clean sketches before moving into complex parts.",
        estimatedTime: "1 hr",
        resourceIds: ["ecad-sketch-guide"],
      },
      {
        id: "ecad-practice-parts",
        phase: "Practice",
        title: "Model basic parts from prompts",
        description:
          "Complete short modeling prompts and compare your final geometry against the requirements.",
        estimatedTime: "45 min",
        quizIds: ["ecad-concepts-quiz"],
      },
      {
        id: "ecad-review-errors",
        phase: "Review",
        title: "Review modeling mistakes",
        description:
          "Track whether mistakes come from sketching, feature order, measurements, or misunderstanding the prompt.",
        estimatedTime: "20 min",
      },
      {
        id: "ecad-test-speed",
        phase: "Test",
        title: "Run a timed CAD sprint",
        description:
          "Practice finishing a clean model under time pressure without overcomplicating the design tree.",
        estimatedTime: "45 min",
        testIds: ["ecad-sprint-1"],
      },
    ],
    scoutingReport: {
      commonMistakes: [
        "Starting features before the sketch is fully constrained.",
        "Ignoring prompt details and losing easy points.",
        "Making models that look right but are dimensionally wrong.",
        "Spending too much time on cosmetic details too early.",
      ],
      medalistHabits: [
        "Builds simple, stable sketches first.",
        "Checks dimensions before exporting.",
        "Uses construction geometry efficiently.",
        "Practices timed prompts instead of only watching tutorials.",
      ],
      highValueSkills: [
        "Constraint discipline",
        "Feature order",
        "Prompt interpretation",
        "Fast dimension checking",
        "Clean exports",
      ],
      defaultNextMove:
        "Complete one timed modeling sprint and record where time was lost.",
    },
  },
  {
    id: "thermodynamics",
    name: "Thermodynamics",
    category: "Hybrid",
    eventLead: "Unassigned",
    shortDescription:
      "Thermal science event combining conceptual physics, calculations, and device/design understanding.",
    starterPath: [
      {
        id: "thermo-start-rules",
        phase: "Start",
        title: "Understand scoring and allowed materials",
        description:
          "Read the rules and identify what parts are test-based, build-based, or calculation-heavy.",
        estimatedTime: "20 min",
        resourceIds: ["thermo-rules-guide"],
      },
      {
        id: "thermo-foundation-concepts",
        phase: "Foundation",
        title: "Learn heat transfer basics",
        description:
          "Review conduction, convection, radiation, insulation, heat capacity, and temperature change calculations.",
        estimatedTime: "1-2 hrs",
        resourceIds: ["thermo-beginner-notes"],
      },
      {
        id: "thermo-practice-quiz",
        phase: "Practice",
        title: "Try basic calculation questions",
        description:
          "Practice identifying givens, units, and formulas before doing timed tests.",
        estimatedTime: "30 min",
        quizIds: ["thermo-beginner-quiz"],
      },
      {
        id: "thermo-review",
        phase: "Review",
        title: "Separate concept misses from math misses",
        description:
          "Track whether mistakes come from formulas, unit conversion, or misunderstanding the heat transfer concept.",
        estimatedTime: "20 min",
      },
      {
        id: "thermo-test",
        phase: "Test",
        title: "Take a timed mixed set",
        description:
          "Combine conceptual and calculation questions under time pressure.",
        estimatedTime: "35 min",
        testIds: ["thermo-mini-test-1"],
      },
    ],
    scoutingReport: {
      commonMistakes: [
        "Knowing formulas but not when to use them.",
        "Losing points from unit mistakes.",
        "Treating all heat transfer problems the same way.",
      ],
      medalistHabits: [
        "Writes units through every calculation.",
        "Can explain conduction, convection, and radiation clearly.",
        "Practices both conceptual and math questions.",
      ],
      highValueSkills: [
        "Formula selection",
        "Unit conversion",
        "Heat transfer concepts",
        "Device reasoning",
      ],
      defaultNextMove:
        "Do a short calculation quiz and review every unit mistake.",
    },
  },
];

export const resources: ResourceItem[] = [
  {
    id: "dg-rules-guide",
    eventId: "designer-genes",
    title: "Designer Genes Rules Breakdown",
    type: "Rules",
    url: "#",
    description:
      "A beginner-friendly guide for understanding what the event can test.",
    tags: ["Rookie-friendly", "Officer Approved"],
    featured: true,
  },
  {
    id: "dg-beginner-notes",
    eventId: "designer-genes",
    title: "Designer Genes Beginner Notes",
    type: "Notes",
    url: "#",
    description:
      "Core genetics notes covering inheritance, pedigrees, DNA, and biotechnology.",
    tags: ["Rookie-friendly", "Notes", "Featured"],
    featured: true,
  },
  {
    id: "dg-cheat-sheet",
    eventId: "designer-genes",
    title: "Genetics Quick Cheat Sheet",
    type: "Cheat Sheet",
    url: "#",
    description:
      "Fast review sheet for inheritance patterns, vocabulary, and common traps.",
    tags: ["Cheat Sheet", "High Yield"],
    featured: true,
  },
  {
    id: "ecad-setup-guide",
    eventId: "engineering-cad",
    title: "Engineering CAD Setup Guide",
    type: "Study Guide",
    url: "#",
    description:
      "Setup and workflow guide for getting started with CAD practice.",
    tags: ["Rookie-friendly", "Build"],
    featured: true,
  },
  {
    id: "ecad-sketch-guide",
    eventId: "engineering-cad",
    title: "CAD Sketch Constraint Guide",
    type: "Build Guide",
    url: "#",
    description:
      "Guide to clean sketches, dimensions, constraints, and construction geometry.",
    tags: ["Build", "High Yield"],
  },
  {
    id: "thermo-rules-guide",
    eventId: "thermodynamics",
    title: "Thermodynamics Rules Guide",
    type: "Rules",
    url: "#",
    description:
      "Overview of the event structure, scoring, and prep priorities.",
    tags: ["Rookie-friendly", "Officer Approved"],
  },
  {
    id: "thermo-beginner-notes",
    eventId: "thermodynamics",
    title: "Thermodynamics Beginner Notes",
    type: "Notes",
    url: "#",
    description:
      "Intro notes for heat transfer, heat capacity, insulation, and calculations.",
    tags: ["Notes", "Rookie-friendly"],
  },
];

export const quizzes: Quiz[] = [
  {
    id: "dg-beginner-quiz",
    eventId: "designer-genes",
    title: "Designer Genes Beginner Quiz",
    description:
      "Short quiz covering inheritance patterns, pedigrees, and molecular genetics basics.",
    difficulty: "Beginner",
    questionIds: ["dg-q1", "dg-q2", "dg-q3", "dg-q4", "dg-q5"],
  },
  {
    id: "dg-mixed-quiz",
    eventId: "designer-genes",
    title: "Designer Genes Mixed Drill",
    description:
      "Mixed-topic practice for students who already know the basics.",
    difficulty: "Intermediate",
    questionIds: ["dg-q1", "dg-q2", "dg-q3", "dg-q4", "dg-q5"],
  },
  {
    id: "ecad-concepts-quiz",
    eventId: "engineering-cad",
    title: "Engineering CAD Concepts Quiz",
    description:
      "Checks CAD workflow, constraints, dimensions, and prompt interpretation.",
    difficulty: "Beginner",
    questionIds: ["ecad-q1", "ecad-q2", "ecad-q3"],
  },
  {
    id: "thermo-beginner-quiz",
    eventId: "thermodynamics",
    title: "Thermodynamics Beginner Quiz",
    description:
      "Basic heat transfer and calculation practice.",
    difficulty: "Beginner",
    questionIds: ["thermo-q1", "thermo-q2", "thermo-q3"],
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "dg-q1",
    eventId: "designer-genes",
    quizId: "dg-beginner-quiz",
    topic: "Inheritance Patterns",
    difficulty: "Beginner",
    question:
      "Which inheritance pattern shows both alleles fully expressed in the phenotype?",
    choices: [
      "Incomplete dominance",
      "Codominance",
      "Polygenic inheritance",
      "Sex-linked inheritance",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Codominance means both alleles are expressed. A common example is AB blood type.",
    recommendedResourceIds: ["dg-cheat-sheet"],
  },
  {
    id: "dg-q2",
    eventId: "designer-genes",
    quizId: "dg-beginner-quiz",
    topic: "Molecular Genetics",
    difficulty: "Beginner",
    question: "During transcription, DNA is used as a template to make what?",
    choices: ["Protein", "mRNA", "tRNA only", "A chromosome"],
    correctAnswerIndex: 1,
    explanation:
      "Transcription produces mRNA from a DNA template. Translation later uses mRNA to build protein.",
    recommendedResourceIds: ["dg-beginner-notes"],
  },
  {
    id: "dg-q3",
    eventId: "designer-genes",
    quizId: "dg-beginner-quiz",
    topic: "Pedigrees",
    difficulty: "Beginner",
    question:
      "In a pedigree, two unaffected parents have an affected child. Which inheritance pattern is most likely?",
    choices: [
      "Autosomal dominant",
      "Autosomal recessive",
      "Codominance",
      "Mitochondrial inheritance",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Unaffected parents can have an affected child if both parents are carriers for an autosomal recessive trait.",
    recommendedResourceIds: ["dg-cheat-sheet"],
  },
  {
    id: "dg-q4",
    eventId: "designer-genes",
    quizId: "dg-beginner-quiz",
    topic: "Biotechnology",
    difficulty: "Beginner",
    question: "What is gel electrophoresis commonly used for?",
    choices: [
      "Copying DNA",
      "Separating DNA fragments by size",
      "Making ribosomes",
      "Destroying mutations",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Gel electrophoresis separates DNA fragments by size as they move through a gel.",
    recommendedResourceIds: ["dg-beginner-notes"],
  },
  {
    id: "dg-q5",
    eventId: "designer-genes",
    quizId: "dg-beginner-quiz",
    topic: "Probability",
    difficulty: "Beginner",
    question:
      "If two heterozygous parents are crossed for a simple recessive trait, what fraction of offspring are expected to show the recessive phenotype?",
    choices: ["1/4", "1/2", "3/4", "All offspring"],
    correctAnswerIndex: 0,
    explanation:
      "Aa x Aa gives AA, Aa, Aa, aa. Only aa shows the recessive phenotype, so the expected fraction is 1/4.",
    recommendedResourceIds: ["dg-cheat-sheet"],
  },
  {
    id: "ecad-q1",
    eventId: "engineering-cad",
    quizId: "ecad-concepts-quiz",
    topic: "Sketch Constraints",
    difficulty: "Beginner",
    question:
      "Why is it important to fully constrain a CAD sketch before creating features?",
    choices: [
      "It makes the part colorful",
      "It prevents geometry from shifting unexpectedly",
      "It automatically exports the file",
      "It removes the need for dimensions",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Fully constrained sketches are stable and less likely to break when features or dimensions change.",
    recommendedResourceIds: ["ecad-sketch-guide"],
  },
  {
    id: "ecad-q2",
    eventId: "engineering-cad",
    quizId: "ecad-concepts-quiz",
    topic: "Prompt Interpretation",
    difficulty: "Beginner",
    question:
      "What should you do first when given a CAD modeling prompt?",
    choices: [
      "Start extruding immediately",
      "Read all requirements and identify key dimensions",
      "Add colors and materials",
      "Export before modeling",
    ],
    correctAnswerIndex: 1,
    explanation:
      "Reading the prompt carefully prevents missed requirements and dimension errors.",
    recommendedResourceIds: ["ecad-setup-guide"],
  },
  {
    id: "ecad-q3",
    eventId: "engineering-cad",
    quizId: "ecad-concepts-quiz",
    topic: "Feature Order",
    difficulty: "Beginner",
    question:
      "Which approach usually creates a cleaner CAD model?",
    choices: [
      "Random feature order",
      "Base shape first, then details",
      "Fillets first",
      "Suppress all sketches",
    ],
    correctAnswerIndex: 1,
    explanation:
      "A stable base shape followed by secondary features usually creates a cleaner, more editable model.",
    recommendedResourceIds: ["ecad-sketch-guide"],
  },
  {
    id: "thermo-q1",
    eventId: "thermodynamics",
    quizId: "thermo-beginner-quiz",
    topic: "Heat Transfer",
    difficulty: "Beginner",
    question:
      "Which type of heat transfer occurs mainly through direct contact?",
    choices: ["Conduction", "Convection", "Radiation", "Evaporation"],
    correctAnswerIndex: 0,
    explanation:
      "Conduction is heat transfer through direct contact between particles or objects.",
    recommendedResourceIds: ["thermo-beginner-notes"],
  },
  {
    id: "thermo-q2",
    eventId: "thermodynamics",
    quizId: "thermo-beginner-quiz",
    topic: "Heat Transfer",
    difficulty: "Beginner",
    question:
      "Which heat transfer method does not require matter to travel through?",
    choices: ["Conduction", "Convection", "Radiation", "Condensation"],
    correctAnswerIndex: 2,
    explanation:
      "Radiation can transfer energy through empty space, such as sunlight reaching Earth.",
    recommendedResourceIds: ["thermo-beginner-notes"],
  },
  {
    id: "thermo-q3",
    eventId: "thermodynamics",
    quizId: "thermo-beginner-quiz",
    topic: "Calculations",
    difficulty: "Beginner",
    question:
      "In heat calculations, why are units important?",
    choices: [
      "They are optional",
      "They prevent formula use",
      "They help keep values consistent",
      "They make graphs unnecessary",
    ],
    correctAnswerIndex: 2,
    explanation:
      "Consistent units help prevent calculation mistakes and make formulas work correctly.",
    recommendedResourceIds: ["thermo-beginner-notes"],
  },
];

export const testBankItems: TestBankItem[] = [
  {
    id: "dg-mini-test-1",
    eventId: "designer-genes",
    title: "Designer Genes Mini Test 1",
    difficulty: "Beginner",
    format: "PDF",
    url: "#",
    description:
      "Short timed test for checking beginner genetics readiness.",
    estimatedTime: "30 min",
    answerKeyAvailable: true,
    tags: ["Test", "Rookie-friendly"],
  },
  {
    id: "ecad-sprint-1",
    eventId: "engineering-cad",
    title: "Engineering CAD Timed Sprint 1",
    difficulty: "Beginner",
    format: "PDF",
    url: "#",
    description:
      "Short CAD prompt for practicing modeling speed and prompt interpretation.",
    estimatedTime: "45 min",
    answerKeyAvailable: false,
    tags: ["Build", "Practice"],
  },
  {
    id: "thermo-mini-test-1",
    eventId: "thermodynamics",
    title: "Thermodynamics Mini Test 1",
    difficulty: "Beginner",
    format: "PDF",
    url: "#",
    description:
      "Timed mixed set for heat transfer concepts and basic calculations.",
    estimatedTime: "35 min",
    answerKeyAvailable: true,
    tags: ["Test", "Practice"],
  },
];
