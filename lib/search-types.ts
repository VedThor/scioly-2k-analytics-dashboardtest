import type { UserRole } from "@/lib/types";

export type SearchResultKind =
  | "page"
  | "action"
  | "student"
  | "team"
  | "event"
  | "resource"
  | "question"
  | "test"
  | "testoff";

export type SearchResultGroup = "Quick actions" | "Students" | "Teams" | "Events" | "Resources" | "Practice" | "Testoffs" | "Pages" | "Administration";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  group: SearchResultGroup;
  title: string;
  subtitle: string;
  href?: string;
  action?: "tour";
  score?: number;
}

export interface SearchCandidate extends SearchResult {
  keywords: string[];
  minimumRole?: UserRole;
  quickRank?: number;
}

export interface SearchResponse {
  ok: boolean;
  query: string;
  results: SearchResult[];
  error?: string;
}
