// BarberOS Admin Clientes - Edge Function
// Lista, edita, bloqueia e deleta usuarios do Auth

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "";

  // === LIST: retorna todos usuarios ===
  if (req.method === "GET" && action === "list") {
    try {
      let allUsers: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=100`, {
          headers: { "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "apikey": SERVICE_ROLE_KEY }
        });
        const data = await r.json();
        const users = data?.users || [];
        allUsers = allUsers.concat(users);
        hasMore = users.length === 100;
        page++;
      }
      // Formatar resposta
      const formatted = allUsers.map((u: any) => ({
        id: u.id,
        email: u.email || "",
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || "",
        phone: u.phone || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned: u.banned_until ? true : false,
        plan: u.user_metadata?.plan || "",
        origem: u.user_metadata?.origem || "",
        product: u.user_metadata?.product || ""
      }));
      return new Response(JSON.stringify({ users: formatted }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  // === POST actions: delete, update, block ===
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); } catch {
      // Check if action is in URL params
      const postAction = url.searchParams.get("action") || "";
      if (postAction === "list") {
        // Redirect to GET list logic
        return new Response(JSON.stringify({ error: "Use GET for list" }), { status: 400, headers });
      }
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
    }

    const postAction = body.action || url.searchParams.get("action") || "";

    // === DELETE user from Auth ===
    if (postAction === "delete") {
      const userId = body.user_id;
      if (!userId) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers });

      try {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "apikey": SERVICE_ROLE_KEY }
        });
        if (!r.ok) {
          const err = await r.json();
          return new Response(JSON.stringify({ error: err.msg || err.message || "Erro ao deletar" }), { status: r.status, headers });
        }
        return new Response(JSON.stringify({ ok: true, msg: "Usuario deletado do Auth" }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // === BLOCK/UNBLOCK user ===
    if (postAction === "update") {
      const uid = body.uid;
      const block = body.block;
      if (!uid) return new Response(JSON.stringify({ error: "uid required" }), { status: 400, headers });

      try {
        const updateBody: any = {};
        if (block === true) {
          updateBody.ban_duration = "876000h"; // ~100 years
        } else {
          updateBody.ban_duration = "none";
        }
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "apikey": SERVICE_ROLE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify(updateBody)
        });
        if (!r.ok) {
          const err = await r.json();
          return new Response(JSON.stringify({ error: err.msg || err.message || "Erro" }), { status: r.status, headers });
        }
        return new Response(JSON.stringify({ ok: true, msg: block ? "Bloqueado" : "Desbloqueado" }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // === UPDATE user metadata ===
    if (postAction === "update_meta") {
      const uid = body.uid;
      const meta = body.meta || {};
      if (!uid) return new Response(JSON.stringify({ error: "uid required" }), { status: 400, headers });

      try {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "apikey": SERVICE_ROLE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ user_metadata: meta })
        });
        if (!r.ok) {
          const err = await r.json();
          return new Response(JSON.stringify({ error: err.msg || err.message || "Erro" }), { status: r.status, headers });
        }
        return new Response(JSON.stringify({ ok: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action: " + postAction }), { status: 400, headers });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
});
