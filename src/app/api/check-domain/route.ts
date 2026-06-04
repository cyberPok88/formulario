import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Domain requerido" }, { status: 400 });
  }

  const trimmed = domain.trim().toLowerCase();

  const { data, error } = await supabase
    .from("suggestions")
    .select("id, domain_name, meaning")
    .eq("domain_name", trimmed)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    exists: data && data.length > 0,
    suggestion: data && data.length > 0 ? data[0] : null,
  });
}
