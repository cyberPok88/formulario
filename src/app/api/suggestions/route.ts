import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data: suggestions, error } = await supabase
    .from("suggestions")
    .select("id, user_id, domain_name, meaning, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uniqueUsers = new Set(suggestions.map((s) => s.user_id));

  return NextResponse.json({
    suggestions,
    stats: {
      total_suggestions: suggestions.length,
      total_participants: uniqueUsers.size,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, suggestions } = body as {
    user_id: string;
    suggestions: { domain_name: string; meaning: string }[];
  };

  if (!user_id || !suggestions || suggestions.length < 5) {
    return NextResponse.json(
      { error: "Se requieren al menos 5 sugerencias" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("suggestions")
    .select("id")
    .eq("user_id", user_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Ya enviaste tus sugerencias" },
      { status: 409 }
    );
  }

  const rows = suggestions.map((s) => ({
    user_id,
    domain_name: s.domain_name.trim().toLowerCase(),
    meaning: s.meaning.trim(),
  }));

  const { data, error } = await supabase
    .from("suggestions")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
