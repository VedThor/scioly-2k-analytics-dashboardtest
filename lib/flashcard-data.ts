import "server-only";

import { getEventKnowledge } from "@/lib/event-content";
import type { FlashcardCard, FlashcardDeck, FlashcardDeckSummary } from "@/lib/flashcard-types";
import { getSupabaseAdmin, isDemoMode } from "@/lib/supabase";
import type { Student } from "@/lib/types";
import { roleMeets } from "@/lib/utils";

interface DeckRow {
  id: string;
  title: string;
  description: string | null;
  event_name: string;
  author_id: string;
  created_at: string;
}

interface CardRow {
  id: number | string;
  deck_id: string;
  front: string;
  back: string;
  position: number;
}

interface VoteRow {
  deck_id: string;
  student_id: string;
  value: number;
}

function demoDeck(currentUser: Student): FlashcardDeck {
  const cards = getEventKnowledge("Anatomy and Physiology").slice(0, 8).map((item, position) => ({
    position,
    front: item.term,
    back: `${item.definition} ${item.mechanism}`,
  }));
  return {
    id: "demo-anatomy-respiratory",
    title: "Anatomy: systems content check",
    description: "A sample team deck showing the study and voting experience.",
    eventName: "Anatomy and Physiology",
    authorName: "Preview member",
    cardCount: cards.length,
    score: 4,
    upvotes: 5,
    downvotes: 1,
    userVote: 0,
    isOwner: false,
    canModerate: roleMeets(currentUser.role, "officer"),
    createdAt: "2026-09-30T00:00:00.000Z",
    cards,
  };
}

function summarize(
  row: DeckRow,
  currentUser: Student,
  authors: Map<string, string>,
  cards: CardRow[],
  votes: VoteRow[],
): FlashcardDeckSummary {
  const deckVotes = votes.filter((vote) => vote.deck_id === row.id);
  const upvotes = deckVotes.filter((vote) => vote.value === 1).length;
  const downvotes = deckVotes.filter((vote) => vote.value === -1).length;
  const ownVote = deckVotes.find((vote) => vote.student_id === currentUser.id)?.value ?? 0;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    eventName: row.event_name,
    authorName: authors.get(row.author_id) ?? "Team member",
    cardCount: cards.filter((card) => card.deck_id === row.id).length,
    score: upvotes - downvotes,
    upvotes,
    downvotes,
    userVote: ownVote === 1 ? 1 : ownVote === -1 ? -1 : 0,
    isOwner: row.author_id === currentUser.id,
    canModerate: row.author_id === currentUser.id || roleMeets(currentUser.role, "officer"),
    createdAt: row.created_at,
  };
}

async function supportingRows(deckRows: DeckRow[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase || deckRows.length === 0) {
    return { cards: [] as CardRow[], votes: [] as VoteRow[], authors: new Map<string, string>() };
  }
  const ids = deckRows.map((deck) => deck.id);
  const authorIds = Array.from(new Set(deckRows.map((deck) => deck.author_id)));
  const [cardResult, voteResult, authorResult] = await Promise.all([
    supabase.from("flashcards").select("id,deck_id,front,back,position").in("deck_id", ids).order("position"),
    supabase.from("flashcard_votes").select("deck_id,student_id,value").in("deck_id", ids),
    supabase.from("students").select("id,name").in("id", authorIds),
  ]);
  if (cardResult.error || voteResult.error || authorResult.error) {
    return { cards: [] as CardRow[], votes: [] as VoteRow[], authors: new Map<string, string>() };
  }
  return {
    cards: (cardResult.data ?? []) as CardRow[],
    votes: (voteResult.data ?? []) as VoteRow[],
    authors: new Map((authorResult.data ?? []).map((author) => [String(author.id), String(author.name)])),
  };
}

export async function loadFlashcardDecks(currentUser: Student): Promise<FlashcardDeckSummary[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return isDemoMode() ? [demoDeck(currentUser)] : [];

  const { data, error } = await supabase
    .from("flashcard_decks")
    .select("id,title,description,event_name,author_id,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  const rows = data as DeckRow[];
  const related = await supportingRows(rows);
  return rows.map((row) => summarize(row, currentUser, related.authors, related.cards, related.votes));
}

export async function loadFlashcardDeck(deckId: string, currentUser: Student): Promise<FlashcardDeck | null> {
  if (deckId === "demo-anatomy-respiratory" && isDemoMode()) return demoDeck(currentUser);
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("flashcard_decks")
    .select("id,title,description,event_name,author_id,created_at")
    .eq("id", deckId)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as DeckRow;
  const related = await supportingRows([row]);
  const summary = summarize(row, currentUser, related.authors, related.cards, related.votes);
  const cards: FlashcardCard[] = related.cards
    .filter((card) => card.deck_id === row.id)
    .sort((left, right) => left.position - right.position)
    .map((card) => ({ id: Number(card.id), front: card.front, back: card.back, position: card.position }));
  return { ...summary, cards };
}
