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
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { name, email, password, company_name } = await req.json();

    if (!name?.trim() || !email?.trim() || !password || !company_name?.trim()) {
      return new Response(JSON.stringify({ error: "name, email, password, and company_name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // 2. Create company
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({ name: company_name.trim() })
      .select("id")
      .single();

    if (companyError) {
      // Rollback: delete user
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: companyError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Assign owner role in user_companies
    const { error: ucError } = await adminClient
      .from("user_companies")
      .insert({ user_id: userId, company_id: company.id, role: "owner" });

    if (ucError) {
      await adminClient.auth.admin.deleteUser(userId);
      await adminClient.from("companies").delete().eq("id", company.id);
      return new Response(JSON.stringify({ error: ucError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Update profile with company_id
    await adminClient.from("profiles").update({
      company_id: company.id,
    }).eq("id", userId);

    // 5. Ensure default divisions exist (idempotent)
    const defaultDivisions = ["Creative", "Developer"];
    for (const divName of defaultDivisions) {
      await adminClient.from("divisions").upsert(
        { name: divName },
        { onConflict: "name" }
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user_id: userId, 
      company_id: company.id 
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
