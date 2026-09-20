import { createClient } from "@/lib/supabase/server";

import SiteNavigation from "./site-navigation";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#070a0f]/88 backdrop-blur-xl">
      <SiteNavigation
        email={user?.email ?? null}
        isAuthenticated={Boolean(user)}
        isAdmin={isAdmin}
      />
    </header>
  );
}
