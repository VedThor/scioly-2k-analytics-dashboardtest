import type {
  EventPrep,
  QuizAnswer,
  QuizAttempt,
  QuizQuestion,
  ResourceItem,
} from "./prep-types";

export function gradeQuizAttempt({
  studentName,
  eventId,
  quizId,
  answers,
  questions,
  timeSpentSeconds,
}: {
  studentName: string;
  eventId: string;
  quizId: string;
  answers: QuizAnswer[];
  questions: QuizQuestion[];
  timeSpentSeconds?: number;
}): QuizAttempt {
  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedAnswerIndex])
  );

  let score = 0;

  for (const question of questions) {
    const selectedAnswerIndex = answerMap.get(question.id);

    if (selectedAnswerIndex === question.correctAnswerIndex) {
      score += 1;
    }
  }

  const totalQuestions = questions.length;
  const percent =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return {
    id: `attempt-${Date.now()}`,
    studentName: studentName.trim() || "Anonymous Student",
    eventId,
    quizId,
    answers,
    score,
    totalQuestions,
    percent,
    weakTopics: getWeakTopics(answers, questions),
    completedAt: new Date().toISOString(),
    timeSpentSeconds,
  };
}

export function getWeakTopics(
  answers: QuizAnswer[],
  questions: QuizQuestion[]
): string[] {
  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedAnswerIndex])
  );

  const topicStats = new Map<string, { missed: number; total: number }>();

  for (const question of questions) {
    const selectedAnswerIndex = answerMap.get(question.id);
    const current = topicStats.get(question.topic) ?? { missed: 0, total: 0 };

    current.total += 1;

    if (selectedAnswerIndex !== question.correctAnswerIndex) {
      current.missed += 1;
    }

    topicStats.set(question.topic, current);
  }

  return Array.from(topicStats.entries())
    .filter(([, stats]) => stats.missed > 0)
    .sort((a, b) => {
      const aMissRate = a[1].missed / a[1].total;
      const bMissRate = b[1].missed / b[1].total;

      return bMissRate - aMissRate;
    })
    .map(([topic]) => topic);
}

export function getRecommendedResources({
  weakTopics,
  questions,
  resources,
}: {
  weakTopics: string[];
  questions: QuizQuestion[];
  resources: ResourceItem[];
}): ResourceItem[] {
  const recommendedIds = new Set<string>();

  for (const question of questions) {
    if (!weakTopics.includes(question.topic)) continue;

    for (const resourceId of question.recommendedResourceIds ?? []) {
      recommendedIds.add(resourceId);
    }
  }

  return resources.filter((resource) => recommendedIds.has(resource.id));
}

export function getQuestionsForQuiz({
  quizId,
  questions,
}: {
  quizId: string;
  questions: QuizQuestion[];
}) {
  return questions.filter((question) => question.quizId === quizId);
}

export function getResourcesForEvent({
  eventId,
  resources,
}: {
  eventId: string;
  resources: ResourceItem[];
}) {
  return resources.filter((resource) => resource.eventId === eventId);
}

export function getTestsForEvent<T extends { eventId: string }>({
  eventId,
  tests,
}: {
  eventId: string;
  tests: T[];
}) {
  return tests.filter((test) => test.eventId === eventId);
}

export function getEventById({
  eventId,
  events,
}: {
  eventId: string;
  events: EventPrep[];
}) {
  return events.find((event) => event.id === eventId) ?? events[0];
}

export function summarizeAttemptsByEvent(attempts: QuizAttempt[]) {
  const grouped = new Map<
    string,
    {
      attempts: number;
      totalPercent: number;
      weakTopics: string[];
    }
  >();

  for (const attempt of attempts) {
    const current = grouped.get(attempt.eventId) ?? {
      attempts: 0,
      totalPercent: 0,
      weakTopics: [],
    };

    current.attempts += 1;
    current.totalPercent += attempt.percent;
    current.weakTopics.push(...attempt.weakTopics);

    grouped.set(attempt.eventId, current);
  }

  return Array.from(grouped.entries()).map(([eventId, summary]) => {
    const weakTopicCounts = new Map<string, number>();

    for (const topic of summary.weakTopics) {
      weakTopicCounts.set(topic, (weakTopicCounts.get(topic) ?? 0) + 1);
    }

    const mostCommonWeakTopics = Array.from(weakTopicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    return {
      eventId,
      attempts: summary.attempts,
      averagePercent:
        summary.attempts > 0
          ? Math.round(summary.totalPercent / summary.attempts)
          : 0,
      mostCommonWeakTopics,
    };
  });
}
