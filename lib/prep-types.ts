export type EventDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ResourceType =
  | "Rules"
  | "Notes"
  | "Cheat Sheet"
  | "Study Guide"
  | "Practice"
  | "Video"
  | "Test"
  | "Answer Key"
  | "Build Guide"
  | "Other";

export type StarterPhase =
  | "Start"
  | "Foundation"
  | "Practice"
  | "Review"
  | "Test"
  | "Advanced";

export type ResourceTag =
  | "Featured"
  | "Rookie-friendly"
  | "Officer Approved"
  | "Cheat Sheet"
  | "Notes"
  | "Practice"
  | "Test"
  | "Build"
  | "High Yield"
  | "Needs Review";

export type EventPrep = {
  id: string;
  name: string;
  category: "Study" | "Build" | "Lab" | "Hybrid";
  eventLead: string;
  shortDescription: string;
  starterPath: StarterPathStep[];
  scoutingReport: ScoutingReport;
};

export type StarterPathStep = {
  id: string;
  phase: StarterPhase;
  title: string;
  description: string;
  estimatedTime: string;
  resourceIds?: string[];
  quizIds?: string[];
  testIds?: string[];
};

export type ScoutingReport = {
  commonMistakes: string[];
  medalistHabits: string[];
  highValueSkills: string[];
  defaultNextMove: string;
};

export type ResourceItem = {
  id: string;
  eventId: string;
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  tags: ResourceTag[];
  featured?: boolean;
  addedBy?: string;
  updatedAt?: string;
};

export type QuizQuestion = {
  id: string;
  eventId: string;
  quizId: string;
  topic: string;
  difficulty: EventDifficulty;
  question: string;
  choices: string[];
  correctAnswerIndex: number;
  explanation: string;
  recommendedResourceIds?: string[];
};

export type Quiz = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  difficulty: EventDifficulty;
  questionIds: string[];
};

export type QuizAnswer = {
  questionId: string;
  selectedAnswerIndex: number | null;
};

export type QuizAttempt = {
  id: string;
  studentName: string;
  eventId: string;
  quizId: string;
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  percent: number;
  weakTopics: string[];
  completedAt: string;
  timeSpentSeconds?: number;
};

export type TestBankItem = {
  id: string;
  eventId: string;
  title: string;
  difficulty: EventDifficulty;
  format: "PDF" | "Link" | "Doc";
  url: string;
  description: string;
  estimatedTime: string;
  answerKeyAvailable: boolean;
  tags: ResourceTag[];
};

export type AdminResourceDraft = {
  title: string;
  eventId: string;
  type: ResourceType;
  url: string;
  description: string;
  tags: ResourceTag[];
  featured: boolean;
};
