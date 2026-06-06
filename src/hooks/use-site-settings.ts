import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  logo_url: string;
  site_name: string;
  footer_text: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({ logo_url: "", site_name: "শিক্ষা", footer_text: "" });

  useEffect(() => {
    supabase.from("site_settings").select("logo_url, site_name, footer_text").limit(1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as SiteSettings);
    });
  }, []);

  return settings;
}

export function useMenuItems() {
  const [items, setItems] = useState<{ id: string; label: string; url: string }[]>([]);
  useEffect(() => {
    supabase.from("menu_items").select("id, label, url").eq("is_active", true).order("sort_order").then(({ data }) => {
      setItems(data ?? []);
    });
  }, []);
  return items;
}
