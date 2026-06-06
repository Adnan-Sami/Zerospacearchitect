"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  logo_url: string;
  site_name: string;
  footer_text: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  logo_url: "",
  site_name: "ZeroSpace Architect",
  footer_text: "",
};

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("logo_url, site_name, footer_text")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as SiteSettings);
      });
  }, []);

  return settings;
}

export function useMenuItems() {
  const [items, setItems] = useState<{ id: string; label: string; url: string }[]>([]);

  useEffect(() => {
    supabase
      .from("menu_items")
      .select("id, label, url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setItems(data ?? []);
      });
  }, []);

  return items;
}
