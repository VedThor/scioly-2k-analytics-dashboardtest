"use client";

import { useMemo, useState } from "react";

import type {
  EventPrep,
  Quiz,
  QuizAnswer,
  QuizAttempt,
  QuizQuestion,
  ResourceItem,
} from "@/lib/prep-types";
import {
  getQuestionsForQuiz,
  getRecommendedResources,
  gradeQuizAttempt,
} from "@/lib/practice-utils";

type PracticeQuizProps = {
  events: EventPrep[];
  quizzes: Quiz[];
  questions: QuizQuestion[];
  resources: ResourceItem[];
  onCompleteAttempt?: (attempt: QuizAttempt) => void;
};

export function PracticeQuiz({
  events,
  quizzes,
  questions,
  resources,
  onCompleteAttempt,
}: PracticeQuizProps) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const eventQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.eventId === selectedEventId),
    [quizzes, selectedEventId]
  );

  const activeQuiz = useMemo(() => {
    const fallbackQuiz = eventQuizzes[0];
    return (
      eventQuizzes.find((quiz) => quiz.id === selectedQuizId) ?? fallbackQuiz
    );
  }, [eventQuizzes, selectedQuizId]);

  const activeQuestions = useMemo(() => {
    if (!activeQuiz) return [];

    const byQuizId = getQuestionsForQuiz({
      quizId: activeQuiz.id,
      questions,
    });

    if (byQuizId.length > 0) return byQuizId;

    return questions.filter((question) =>
      activeQuiz.questionIds.includes(question.id)
    );
  }, [activeQuiz, questions]);

  const currentQuestion = activeQuestions[currentQuestionIndex];

  const selectedAnswerForCurrent = answers.find(
    (answer) => answer.questionId === currentQuestion?.id
  );

  const progressPercent =
    activeQuestions.length > 0
      ? Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)
      : 0;

  const recommendedResources = attempt
    ? getRecommendedResources({
        weakTopics: attempt.weakTopics,
        questions: activeQuestions,
        resources,
      })
    : [];

  function resetQuiz(nextEventId = selectedEventId) {
    const nextQuizzes = quizzes.filter((quiz) => quiz.eventId === nextEventId);

    setSelectedQuizId(nextQuizzes[0]?.id ?? "");
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAttempt(null);
    setStartedAt(null);
  }

  function handleEventChange(eventId: string) {
    setSelectedEventId(eventId);
    resetQuiz(eventId);
  }

  function handleQuizChange(quizId: string) {
    setSelectedQuizId(quizId);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAttempt(null);
    setStartedAt(null);
  }

  function startQuiz() {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAttempt(null);
    setStartedAt(Date.now());
  }

  function selectAnswer(answerIndex: number) {
    if (!currentQuestion) return;

    setAnswers((currentAnswers) => {
      const withoutCurrent = currentAnswers.filter(
        (answer) => answer.questionId !== currentQuestion.id
      );

      return [
        ...withoutCurrent,
        {
          questionId: currentQuestion.id,
          selectedAnswerIndex: answerIndex,
        },
      ];
    });
  }

  function goNext() {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((current) => current + 1);
      return;
    }

    submitQuiz();
  }

  function goBack() {
    setCurrentQuestionIndex((current) => Math.max(0, current - 1));
  }

  function submitQuiz() {
    if (!activeQuiz || activeQuestions.length === 0) return;

    const normalizedAnswers = activeQuestions.map((question) => {
      const answer = answers.find((item) => item.questionId === question.id);

      return {
        questionId: question.id,
        selectedAnswerIndex: answer?.selectedAnswerIndex ?? null,
      };
    });

    const completedAttempt = gradeQuizAttempt({
      studentName,
      eventId: selectedEventId,
      quizId: activeQuiz.id,
      answers: normalizedAnswers,
      questions: activeQuestions,
      timeSpentSeconds: startedAt
        ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
        : undefined,
    });

    setAnswers(normalizedAnswers);
    setAttempt(completedAttempt);
    onCompleteAttempt?.(completedAttempt);
  }

  const quizStarted = startedAt !== null && !attempt;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="min-w-0 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
          Practice Queue
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Self-quiz setup
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Pick an event and quiz. After completion, the attempt creates weak
          topics and recommended next resources.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
              Student Name
            </span>
            <input
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="ex: Steve"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-sm font-bold text-white outline-none ring-cyan-400/40 placeholder:text-zinc-600 focus:ring-4"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
              Event
            </span>
            <select
              value={selectedEventId}
              onChange={(event) => handleEventChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-sm font-bold text-white outline-none ring-cyan-400/40 focus:ring-4"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
              Quiz
            </span>
            <select
              value={activeQuiz?.id ?? ""}
              onChange={(event) => handleQuizChange(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-sm font-bold text-white outline-none ring-cyan-400/40 focus:ring-4"
            >
              {eventQuizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </label>

          {activeQuiz ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-300">
                  {activeQuiz.difficulty}
                </span>

                <span className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-400">
                  {activeQuestions.length} questions
                </span>
              </div>

              <h3 className="mt-3 font-black text-white">
                {activeQuiz.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {activeQuiz.description}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-sm text-zinc-400">
              No quiz exists for this event yet.
            </div>
          )}

          <button
            type="button"
            onClick={startQuiz}
            disabled={!activeQuiz || activeQuestions.length === 0}
            className="w-full rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {attempt ? "Retake Quiz" : quizStarted ? "Restart Quiz" : "Start Quiz"}
          </button>
        </div>
      </aside>

      <section className="min-w-0 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl shadow-black/20">
        {!quizStarted && !attempt ? (
          <EmptyPracticeState />
        ) : null}

        {quizStarted && currentQuestion ? (
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Question {currentQuestionIndex + 1} of{" "}
                  {activeQuestions.length}
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {activeQuiz?.title}
                </h2>
              </div>

              <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
                {progressPercent}%
              </span>
            </div>

            <div className="mb-5 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-400">
                  {currentQuestion.topic}
                </span>

                <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-300">
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h3 className="text-xl font-black leading-8 text-white">
                {currentQuestion.question}
              </h3>

              <div className="mt-5 grid gap-3">
                {currentQuestion.choices.map((choice, index) => {
                  const selected =
                    selectedAnswerForCurrent?.selectedAnswerIndex === index;

                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => selectAnswer(index)}
                      className={`min-w-0 rounded-2xl border p-4 text-left text-sm font-bold leading-6 transition ${
                        selected
                          ? "border-cyan-300 bg-cyan-300 text-black"
                          : "border-zinc-800 bg-black text-zinc-300 hover:border-cyan-400 hover:text-white"
                      }`}
                    >
                      <span className="mr-2 font-black">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentQuestionIndex === 0}
                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-zinc-300 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              <button
                type="button"
                onClick={goNext}
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-white"
              >
                {currentQuestionIndex === activeQuestions.length - 1
                  ? "Submit Quiz"
                  : "Next Question"}
              </button>
            </div>
          </div>
        ) : null}

        {attempt ? (
          <div>
            <div className="mb-5 rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Quiz Complete
              </p>

              <h2 className="mt-2 text-4xl font-black text-white">
                {attempt.score}/{attempt.totalQuestions}
              </h2>

              <p className="mt-2 text-lg font-black text-cyan-300">
                {attempt.percent}% score
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-300">
                This attempt can be reported to officers and used to update the
                scouting report for this event.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <h3 className="font-black text-white">Weak topics</h3>

                {attempt.weakTopics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attempt.weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-bold text-emerald-300">
                    No weak topics detected from this quiz.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <h3 className="font-black text-white">Officer report preview</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {attempt.studentName} completed {activeQuiz?.title}. Score:{" "}
                  {attempt.score}/{attempt.totalQuestions}. Weak topics:{" "}
                  {attempt.weakTopics.length
                    ? attempt.weakTopics.join(", ")
                    : "none"}.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <h3 className="font-black text-white">Recommended next resources</h3>

              {recommendedResources.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendedResources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      className="max-w-full truncate rounded-full border border-emerald-400/40 bg-black px-3 py-1 text-xs font-bold text-emerald-300 hover:border-white"
                    >
                      {resource.title}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  No specific resource recommendation yet. Retake the quiz or
                  review the event&apos;s starter path.
                </p>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <h3 className="font-black text-white">Answer review</h3>

              <div className="mt-4 grid gap-3">
                {activeQuestions.map((question, index) => {
                  const answer = attempt.answers.find(
                    (item) => item.questionId === question.id
                  );

                  const correct =
                    answer?.selectedAnswerIndex === question.correctAnswerIndex;

                  return (
                    <details
                      key={question.id}
                      className="rounded-2xl border border-zinc-800 bg-black p-4"
                    >
                      <summary className="cursor-pointer list-none font-black text-white">
                        {index + 1}. {question.topic}{" "}
                        <span
                          className={
                            correct ? "text-emerald-300" : "text-rose-300"
                          }
                        >
                          {correct ? "Correct" : "Missed"}
                        </span>
                      </summary>

                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {question.question}
                      </p>

                      <p className="mt-3 text-sm font-bold text-cyan-300">
                        Correct answer:{" "}
                        {question.choices[question.correctAnswerIndex]}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {question.explanation}
                      </p>
                    </details>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function EmptyPracticeState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-2xl">
        🧠
      </div>

      <h2 className="mt-5 text-2xl font-black text-white">
        Start a self-quiz
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
        Practice questions will behave like a mini quiz app. After you finish,
        the system shows your score, weak topics, answer explanations, and
        recommended resources.
      </p>
    </div>
  );
}
