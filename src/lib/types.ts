export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  domain_name: string;
  meaning: string;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  suggestion_id: string;
  points: number;
  round_number: number;
  created_at: string;
}

export interface VoteTag {
  id: string;
  vote_id: string;
  tag: "suena_chido" | "sencillo" | "practico";
}

export type Phase = "suggestions" | "voting" | "closed";

export interface AppConfig {
  id: number;
  phase: Phase;
  points_per_round: number;
  options_per_page: number;
  updated_at: string;
}

export const TAG_LABELS: Record<VoteTag["tag"], string> = {
  suena_chido: "Suena chido",
  sencillo: "Sencillo",
  practico: "Practico",
};
