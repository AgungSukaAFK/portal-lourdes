import type { CompanyId } from "./constants";
import { content } from "./content";
import type { Company } from "./schema";

export type { Company } from "./schema";
export type { CompanyId } from "./constants";

export const companies = content.companies as Company[];
export const companyById = Object.fromEntries(companies.map((c) => [c.id, c])) as Record<CompanyId, Company>;
