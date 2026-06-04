import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: suggestions, error: sugError } = await supabase
    .from("suggestions")
    .select("id, domain_name, meaning, user_id");

  if (sugError) {
    return NextResponse.json({ error: sugError.message }, { status: 500 });
  }

  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("suggestion_id, points, user_id, vote_tags(tag)");

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  const results = suggestions.map((s) => {
    const suggestionVotes = votes.filter((v) => v.suggestion_id === s.id);
    const totalPoints = suggestionVotes.reduce((sum, v) => sum + v.points, 0);
    const voteCount = suggestionVotes.length;

    const tagCounts: Record<string, number> = {};
    for (const v of suggestionVotes) {
      const tags = v.vote_tags as { tag: string }[];
      for (const t of tags) {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      }
    }

    return {
      id: s.id,
      domain_name: s.domain_name,
      meaning: s.meaning,
      total_points: totalPoints,
      vote_count: voteCount,
      tag_counts: tagCounts,
    };
  });

  results.sort((a, b) => b.total_points - a.total_points);

  const uniqueSuggesters = new Set(suggestions.map((s) => s.user_id));
  const uniqueVoters = new Set(votes.map((v) => v.user_id));

  return NextResponse.json({
    results,
    stats: {
      total_suggestions: suggestions.length,
      total_participants: uniqueSuggesters.size,
      total_voters: uniqueVoters.size,
      total_votes: votes.length,
    },
  });
}
