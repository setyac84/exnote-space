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

    // Check caller role via user_companies - owner/super_admin can reset passwords
    const { data: callerRoles } = await adminClient
      .from("user_companies")
      .select("role, company_id")
      .eq("user_id", caller.id);

    const hasAdminAccess = (callerRoles || []).some(r => 
      ["owner", "super_admin", "admin"].includes(r.role)
    );

    if (!hasAdminAccess) {
      return new Response(JSON.stringify({ error: "Forbidden: admin or above only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, new_password } = await req.json();
    if (!user_id || !new_password) {
      return new Response(JSON.stringify({ error: "user_id and new_password are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new_password.length < 6) {
      return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const { error } = await adminClient.auth.admin.updateUserById(user_id, {
      password: new_password,
    });

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
