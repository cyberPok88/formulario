import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, pin, mode } = body as {
    username: string;
    pin: string;
    mode: "register" | "login" | "verify";
  };

  if (!username || !pin) {
    return NextResponse.json({ error: "Username y PIN requeridos" }, { status: 400 });
  }

  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "El PIN debe ser de 4 a 6 dígitos" }, { status: 400 });
  }

  const trimmed = username.trim().toLowerCase();
  const pinHash = hashPin(pin);

  if (mode === "register") {
    const { data: existing } = await supabase
      .from("users")
      .select("id, pin_hash")
      .eq("username", trimmed)
      .maybeSingle();

    if (existing && existing.pin_hash) {
      return NextResponse.json({ error: "Este usuario ya tiene PIN registrado" }, { status: 409 });
    }

    if (existing) {
      const { error } = await supabase
        .from("users")
        .update({ pin_hash: pinHash })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: { id: existing.id, username: trimmed } });
    }

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ username: trimmed, pin_hash: pinHash })
      .select("id, username")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newUser });
  }

  if (mode === "login" || mode === "verify") {
    const { data: user } = await supabase
      .from("users")
      .select("id, username, pin_hash")
      .eq("username", trimmed)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (!user.pin_hash) {
      return NextResponse.json({ error: "Este usuario no tiene PIN registrado. Regístralo primero." }, { status: 400 });
    }

    if (user.pin_hash !== pinHash) {
      return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  }

  return NextResponse.json({ error: "Modo no válido" }, { status: 400 });
}
