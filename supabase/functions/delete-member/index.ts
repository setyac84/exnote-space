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

    // Check caller role via user_companies
    const { data: callerRoles } = await adminClient
      .from("user_companies")
      .select("role, company_id")
      .eq("user_id", caller.id);

    const roleOrder: Record<string, number> = { owner: 0, super_admin: 1, admin: 2, member: 3 };
    const sorted = (callerRoles || []).sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));
    const highestRole = sorted[0]?.role;

    if (!highestRole || !["owner", "super_admin", "admin"].includes(highestRole)) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or above only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if target is an owner - owners cannot be deleted
    const { data: targetRoles } = await adminClient
      .from("user_companies")
      .select("role")
      .eq("user_id", user_id);

    if ((targetRoles || []).some(r => r.role === "owner")) {
      return new Response(JSON.stringify({ error: "Cannot delete an Owner" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller and target share at least one company
    const callerCompanyIds = (callerRoles || []).map(r => r.company_id);
    const { data: targetCompanies } = await adminClient
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user_id);

    const sharedCompany = (targetCompanies || []).some(tc => callerCompanyIds.includes(tc.company_id));
    if (!sharedCompany) {
      return new Response(JSON.stringify({ error: "Forbidden: member not in your company" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await adminClient.auth.admin.deleteUser(user_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
