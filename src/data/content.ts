import type { PortalContent } from "./schema";
import raw from "./content.json";

/** Konten portal (diedit lewat /admin saat `npm run dev`, tersimpan di content.json). */
export const content = raw as unknown as PortalContent;
