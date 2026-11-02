// © 2026 Sagid Mustafa. All Rights Reserved.
// AO17: Supabase Edge Function «ao-content». Орнату: docs/PLATFORM.md.
// Орта айнымалылары (Supabase өзі береді): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
// Өзіңіз қосасыз: AO_ALLOWED_ORIGINS="https://mustafa7677.github.io" (үтірмен бірнешеу болуы мүмкін).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { handle } from "./handler.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "ao-content";
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

Deno.serve((req) =>
  handle(req, {
    allowedOrigins: (Deno.env.get("AO_ALLOWED_ORIGINS") ?? "https://mustafa7677.github.io").split(",").map((s) => s.trim()),
    async canView(jwt, path) {
      // Пайдаланушының өз JWT-сімен: auth.uid() дерекқорда осы адам болады, рұқсатты RLS-тегідей ao_can_view шешеді.
      const user = createClient(URL_, ANON, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${jwt}` } } });
      const { data, error } = await user.rpc("ao_can_view", { p_path: path });
      if (error) throw error;
      return data === true;
    },
    async download(path) {
      const { data, error } = await admin.storage.from(BUCKET).download(path);
      if (error || !data) return null;
      return await data.text();
    },
  })
);
