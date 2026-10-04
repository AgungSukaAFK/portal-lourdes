import { LINK_TYPES } from "./constants";
import { content } from "./content";

export type { Category, Department, PortalLink } from "./schema";
export type { LinkType } from "./constants";
export type CategoryId = string;

export const links = content.links;
export const categories = content.categories;
export const departments = content.departments;
export const linkTypes = LINK_TYPES;
export const hero = content.hero;
