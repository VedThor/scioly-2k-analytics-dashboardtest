export type LibraryItemKind = "resource" | "guide" | "question" | "test";

export interface LibraryItem {
  id: number;
  eventSlug: string;
  eventName: string;
  kind: LibraryItemKind;
  title: string;
  description?: string;
  topic?: string;
  difficulty?: "Rookie" | "Pro" | "All-Star";
  resourceType?: string;
  url?: string;
  body?: string;
  answer?: string;
  explanation?: string;
  testFormat?: "Mini Test" | "Full Test" | "Testoff Set";
  isFeatured: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryEventOption {
  slug: string;
  name: string;
}

export interface LibraryMutationResponse {
  ok: boolean;
  item?: LibraryItem;
  message?: string;
  error?: string;
  persisted?: boolean;
}
