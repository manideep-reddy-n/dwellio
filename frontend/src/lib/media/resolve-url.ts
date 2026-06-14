import { apiConfig } from "@/config/api";

/** Resolve organization media URLs (Cloudinary or legacy API paths). */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const origin = apiConfig.baseUrl.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url}`;
}
