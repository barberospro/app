// BarberOS Hotmart Webhook - Edge Function
// Cria usuario automaticamente quando compra eh aprovada na Hotmart

const _U = Deno.env.get("SUPABASE_URL") || "";
const _K = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const _S = "wrvhDFedIx1NKWq9VAgqEHY7bpRrGO96d119cd-2281-4911-9275-e98843b69677";

Deno.serve(async (req) => {
  const h = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, hottok"
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return new Response(JSON.stringify({ ok: false }), { status: 405, headers: h });

  let body;
  try { body = await req.json(); } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Parse:" + e.message }), { status: 400, headers: h });
  }

  const hottok = req.headers.get("hottok") || body?.hottok || "";
  if (hottok !== _S) return new Response(JSON.stringify({ ok: false, error: "Token invalido" }), { status: 401, headers: h });

  const email = (body?.data?.buyer?.email || "").toLowerCase().trim();
  const name = body?.data?.buyer?.name || "";
  if (!email) return new Response(JSON.stringify({ ok: false, error: "Email nao fornecido" }), { status: 400, headers: h });

  const event = body?.event || "";
  const ve = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "PURCHASE_REACTIVATED"];
  if (!ve.includes(event)) return new Response(JSON.stringify({ ok: true, msg: "Evento ignorado" }), { status: 200, headers: h });

  try {
    // Verificar se usuario ja existe
    const lr = await fetch(_U + "/auth/v1/admin/users?page=1&per_page=100", {
      headers: { "Authorization": "Bearer " + _K, "apikey": _K }
    });
    const ld = await lr.json();
    if ((ld?.users || []).find(u => u.email?.toLowerCase() === email)) {
      return new Response(JSON.stringify({ ok: false, msg: "user already exists", email }), { status: 200, headers: h });
    }

    // Criar convite para o usuario
    const ir = await fetch(_U + "/auth/v1/admin/generate_link", {
      method: "POST",
      headers: { "Authorization": "Bearer " + _K, "apikey": _K, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "invite",
        email: email,
        data: { full_name: name, origem: "hotmart", product: body?.data?.product?.name || "BarberOS" },
        redirect_to: "https://barberospro.github.io/barberos-v2/"
      })
    });
    const d2 = await ir.json();
    if (!ir.ok) return new Response(JSON.stringify({ ok: false, error: d2?.msg || d2?.message || "Erro" }), { status: 500, headers: h });

    return new Response(JSON.stringify({ ok: true, email, msg: "Convite enviado com sucesso" }), { status: 200, headers: h });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: h });
  }
});