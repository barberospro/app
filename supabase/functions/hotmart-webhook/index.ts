import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, hottok",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const event = body?.event;
    const email = body?.data?.buyer?.email?.toLowerCase()?.trim();
    const name = body?.data?.buyer?.name || "";

    // Validar token de seguranca (hottok)
    const hottok = req.headers.get("hottok") || body?.hottok || "";
    const SECRET = Deno.env.get("HOTMART_HOTTOK") || "wrvhDFedIx1NKWq9VAgqEHY7bpRrGO96d119cd-2281-4911-9275-e98843b69677";

    if (hottok !== SECRET) {
      return new Response(
        JSON.stringify({ ok: false, error: "Token invalido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email nao fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Eventos aceitos
    const validEvents = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_REACTIVATED"];
    if (!validEvents.includes(event)) {
      return new Response(
        JSON.stringify({ ok: true, msg: "Evento ignorado: " + event }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se usuario ja existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email
    );

    if (userExists) {
      return new Response(
        JSON.stringify({ ok: false, msg: "user already exists", email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar usuario com link de convite (usuario recebe email para definir senha)
    const { data: newUser, error: createError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name, origem: "hotmart", product: body?.data?.product?.name || "BarberOS" },
      redirectTo: Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".github.io/barberos-v2/") || "https://barberospro.github.io/barberos-v2/"
    });

    if (createError) {
      return new Response(
        JSON.stringify({ ok: false, error: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, email, msg: "Convite enviado com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});