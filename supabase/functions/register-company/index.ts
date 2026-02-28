import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is holding super admin (company_id IS NULL)
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

    // Check caller is super_admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is holding (company_id IS NULL)
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.company_id !== null) {
      return new Response(JSON.stringify({ error: "Forbidden: only holding super admin can register companies" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_name, email, password, name, position } = await req.json();

    if (!company_name?.trim() || !email?.trim() || !password?.trim() || !name?.trim()) {
      return new Response(JSON.stringify({ error: "company_name, email, password, and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create company
    const { data: newCompany, error: companyError } = await adminClient
      .from("companies")
      .insert({ name: company_name.trim() })
      .select()
      .single();

    if (companyError) {
      return new Response(JSON.stringify({ error: companyError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create user via admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });

    if (createError) {
      // Rollback: delete the company
      await adminClient.from("companies").delete().eq("id", newCompany.id);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // 3. Update profile with company_id and position
    await adminClient.from("profiles").update({
      company_id: newCompany.id,
      position: position || null,
    }).eq("id", userId);

    // 4. Set role to super_admin
    await adminClient.from("user_roles").update({ role: "super_admin" }).eq("user_id", userId);

    return new Response(JSON.stringify({
      company: { id: newCompany.id, name: newCompany.name },
      user: { id: userId, email: email.trim(), name: name.trim() },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
