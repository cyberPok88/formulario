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
  initial_votes: number;
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

export const TAG_CONFIG: Record<VoteTag["tag"], { label: string; emoji: string; color: string; selectedColor: string; borderColor: string; selectedBorder: string }> = {
  suena_chido: {
    label: "Suena chido",
    emoji: "🔥",
    color: "text-orange-300",
    selectedColor: "text-orange-200",
    borderColor: "border-orange-500/30",
    selectedBorder: "border-orange-400/60",
  },
  sencillo: {
    label: "Sencillo",
    emoji: "✨",
    color: "text-emerald-300",
    selectedColor: "text-emerald-200",
    borderColor: "border-emerald-500/30",
    selectedBorder: "border-emerald-400/60",
  },
  practico: {
    label: "Práctico",
    emoji: "⚡",
    color: "text-blue-300",
    selectedColor: "text-blue-200",
    borderColor: "border-blue-500/30",
    selectedBorder: "border-blue-400/60",
  },
};

export const TAG_LABELS: Record<VoteTag["tag"], string> = {
  suena_chido: "Suena chido",
  sencillo: "Sencillo",
  practico: "Practico",
};
