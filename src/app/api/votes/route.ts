import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface VoteInput {
  suggestion_id: string;
  points: number;
  tags: string[];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, round_number, votes } = body as {
    user_id: string;
    round_number: number;
    votes: VoteInput[];
  };

  if (!user_id || !votes || !round_number) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Validate total points <= 5
  const totalPoints = votes.reduce((sum, v) => sum + v.points, 0);
  if (totalPoints > 5) {
    return NextResponse.json(
      { error: "Maximo 5 puntos por ronda" },
      { status: 400 }
    );
  }

  // Validate max 3 points per option
  if (votes.some((v) => v.points > 3)) {
    return NextResponse.json(
      { error: "Maximo 3 puntos por opcion" },
      { status: 400 }
    );
  }

  // Insert votes (only those with points > 0)
  const votesWithPoints = votes.filter((v) => v.points > 0);

  for (const vote of votesWithPoints) {
    const { data: voteData, error: voteError } = await supabase
      .from("votes")
      .insert({
        user_id,
        suggestion_id: vote.suggestion_id,
        points: vote.points,
        round_number,
      })
      .select("id")
      .single();

    if (voteError) {
      return NextResponse.json(
        { error: voteError.message },
        { status: 500 }
      );
    }

    // Insert tags for this vote
    if (vote.tags.length > 0) {
      const tagRows = vote.tags.map((tag) => ({
        vote_id: voteData.id,
        tag,
      }));

      const { error: tagError } = await supabase
        .from("vote_tags")
        .insert(tagRows);

      if (tagError) {
        return NextResponse.json(
          { error: tagError.message },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
