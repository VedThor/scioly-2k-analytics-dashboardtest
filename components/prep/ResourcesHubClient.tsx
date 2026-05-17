"use client";

import { useMemo, useState } from "react";

import { ResourceLocker } from "@/components/prep/ResourceLocker";
import { ScoutingReport } from "@/components/prep/ScoutingReport";
import { StarterPath } from "@/components/prep/StarterPath";
import { TestBank } from "@/components/prep/TestBank";
import {
  eventPrepData,
  quizQuestions,
  resources,
  testBankItems,
} from "@/lib/prep-data";
import type { QuizAttempt } from "@/lib/prep-types";
import {
  getEventById,
  getResourcesForEvent,
  getTestsForEvent,
} from "@/lib/practice-utils";

const mockAttempts: QuizAttempt[] = [
  {
    id: "mock-attempt-1",
    studentName: "Sample Student",
    eventId: "designer-genes",
    quizId: "dg-beginner-quiz",
    answers: [],
    score: 3,
    totalQuestions: 5,
    percent: 60,
    weakTopics: ["Pedigrees", "Probability"],
    completedAt: new Date().toISOString(),
    timeSpentSeconds: 520,
  },
];

export function ResourcesHubClient() {
  const [selectedEventId, setSelectedEventId] = useState(eventPrepData[0].id);

  const selectedEvent = useMemo(
    () => getEventById({ eventId: selectedEventId, events: eventPrepData }),
    [selectedEventId]
  );

  const eventResources = useMemo(
    () => getResourcesForEvent({ eventId: selectedEvent.id, resources }),
    [selectedEvent.id]
  );

  const eventTests = useMemo(
    () => getTestsForEvent({ eventId: selectedEvent.id, tests: testBankItems }),
    [selectedEvent.id]
  );

  const eventQuestions = useMemo(
    () =>
      quizQuestions.filter((question) => question.eventId === selectedEvent.id),
    [selectedEvent.id]
  );

  return (
    <div className="flex w-full flex-col gap-6 overflow-x-hidden">
      <section className="rounded-md border border-court-line bg-court-panel p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase text-cyan-300">
              Team Prep Platform
            </div>

            <h1 className="mt-2 break-words text-4xl font-black italic uppercase leading-none text-white md:text-6xl">
              Resources that guide practice
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
              Each event now has an onboarding path, scouting report, resource
              locker, practice connection, and test bank. This makes the site
              more useful for team preparation, not just analytics.
            </p>
          </div>

          <div className="min-w-0 rounded-md border border-court-line bg-court-elevated p-4">
            <label
              htmlFor="event-select"
              className="text-xs font-black uppercase tracking-wide text-zinc-500"
            >
              Select Event
            </label>

            <select
              id="event-select"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="mt-3 w-full rounded-md border border-court-line bg-court-black px-4 py-3 text-sm font-bold text-white outline-none ring-cyan-400/40 focus:ring-4"
            >
              {eventPrepData.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-court-line bg-court-black p-3">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Category
                </p>
                <p className="mt-1 font-black text-cyan-300">
                  {selectedEvent.category}
                </p>
              </div>

              <div className="rounded-md border border-court-line bg-court-black p-3">
                <p className="text-xs font-bold uppercase text-zinc-500">
                  Event Lead
                </p>
                <p className="mt-1 truncate font-black text-white">
                  {selectedEvent.eventLead}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
          Current Event
        </p>
        <h2 className="mt-2 break-words text-3xl font-black text-white">
          {selectedEvent.name}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-300">
          {selectedEvent.shortDescription}
        </p>
      </section>

      <StarterPath
        steps={selectedEvent.starterPath}
        resources={eventResources}
        tests={eventTests}
      />

      <ScoutingReport
        report={selectedEvent.scoutingReport}
        eventId={selectedEvent.id}
        attempts={mockAttempts}
        questions={eventQuestions}
        resources={eventResources}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ResourceLocker resources={eventResources} />
        <TestBank tests={eventTests} />
      </div>

      <section className="rounded-md border border-violet-400/30 bg-violet-400/10 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-violet-300">
              Practice Queue Preview
            </p>
            <h2 className="mt-2 break-words text-2xl font-black text-white">
              Self-quiz connection
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
              The practice page turns questions into a small quiz app. Scores,
              weak topics, and recommended resources connect back into this
              scouting report.
            </p>
          </div>

          <a
            href="/practice"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-violet-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-white"
          >
            Open Practice
          </a>
        </div>
      </section>
    </div>
  );
}
