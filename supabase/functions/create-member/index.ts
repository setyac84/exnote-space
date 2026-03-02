import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller's highest role via user_companies
    const { data: callerRoles } = await adminClient
      .from("user_companies")
      .select("role, company_id")
      .eq("user_id", caller.id);

    const roleOrder: Record<string, number> = { owner: 0, super_admin: 1, admin: 2, member: 3 };
    const sortedRoles = (callerRoles || []).sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));
    const highestRole = sortedRoles[0]?.role;

    if (!highestRole || (highestRole !== "owner" && highestRole !== "super_admin" && highestRole !== "admin")) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or above only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, name, position, division_id, company_ids, role } = await req.json();

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: "email, password, and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin can only create members
    if (highestRole === "admin" && role && role !== "member") {
      return new Response(JSON.stringify({ error: "Admin can only create members" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine target companies
    const callerCompanyIds = (callerRoles || []).map(r => r.company_id);
    const targetCompanyIds: string[] = company_ids?.length
      ? company_ids.filter((cid: string) => callerCompanyIds.includes(cid))
      : callerCompanyIds.slice(0, 1); // Default: first company of caller

    if (targetCompanyIds.length === 0) {
      return new Response(JSON.stringify({ error: "No valid company to assign" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;
    const memberRole = role || "member";

    // Assign to companies via user_companies
    for (const cid of targetCompanyIds) {
      await adminClient.from("user_companies").insert({
        user_id: userId,
        company_id: cid,
        role: memberRole,
      });
    }

    // Update profile
    await adminClient.from("profiles").update({
      position: position || null,
      division_id: division_id || null,
      company_id: targetCompanyIds[0], // Primary company
    }).eq("id", userId);

    return new Response(JSON.stringify({ id: userId, email, name }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
