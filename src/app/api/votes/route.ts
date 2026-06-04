import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

interface VoteInput {
  suggestion_id: string;
  points: number;
  tags: string[];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, round_number, votes, pin } = body as {
    user_id: string;
    round_number: number;
    votes: VoteInput[];
    pin: string;
  };

  if (!user_id || !votes || !round_number || !pin) {
    return NextResponse.json({ error: "Datos incompletos (PIN requerido)" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("pin_hash")
    .eq("id", user_id)
    .maybeSingle();

  if (!user || !user.pin_hash) {
    return NextResponse.json({ error: "Usuario no encontrado o sin PIN" }, { status: 404 });
  }

  if (user.pin_hash !== hashPin(pin)) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const totalPoints = votes.reduce((sum, v) => sum + v.points, 0);
  if (totalPoints > 5) {
    return NextResponse.json(
      { error: "Maximo 5 puntos por ronda" },
      { status: 400 }
    );
  }

  if (votes.some((v) => v.points > 3)) {
    return NextResponse.json(
      { error: "Maximo 3 puntos por opcion" },
      { status: 400 }
    );
  }

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
