"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";

export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${siteConfig.name} - ${title}`;
  }, [title]);
  return null;
}
