import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data: suggestions, error } = await supabase
    .from("suggestions")
    .select("id, user_id, domain_name, meaning, initial_votes, created_at")
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

  const results: { inserted: string[]; merged: string[] } = { inserted: [], merged: [] };

  for (const s of suggestions) {
    const domainName = s.domain_name.trim().toLowerCase();
    const meaning = s.meaning.trim();

    const { data: existing } = await supabase
      .from("suggestions")
      .select("id, initial_votes")
      .eq("domain_name", domainName)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("suggestions")
        .update({ initial_votes: (existing[0].initial_votes || 1) + 1 })
        .eq("id", existing[0].id);
      results.merged.push(domainName);
    } else {
      const { error } = await supabase
        .from("suggestions")
        .insert({ user_id, domain_name: domainName, meaning, initial_votes: 1 });
      if (!error) results.inserted.push(domainName);
    }
  }

  return NextResponse.json({ inserted: results.inserted.length, merged: results.merged.length }, { status: 201 });
}
