import type { WeddingTheme } from "./types";

export type IdeaCategory =
  | "decoratie"
  | "bloemen"
  | "locatie"
  | "kleding"
  | "papierwerk"
  | "eten"
  | "taart"
  | "muziek"
  | "foto"
  | "details";

export interface Idea {
  id: string;            // slug: "<theme>-<cat>-<n>"
  theme: WeddingTheme;
  category: IdeaCategory;
  title: string;
  description: string;
}

export const IDEA_CATEGORIES: { value: IdeaCategory; label: string; emoji: string }[] = [
  { value: "decoratie",  label: "Decoratie",          emoji: "✨" },
  { value: "bloemen",    label: "Bloemen & boeketten", emoji: "💐" },
  { value: "locatie",    label: "Locatie & sfeer",     emoji: "🏛️" },
  { value: "kleding",    label: "Kleding & styling",   emoji: "👗" },
  { value: "papierwerk", label: "Uitnodigingen",       emoji: "💌" },
  { value: "eten",       label: "Menu & drinks",       emoji: "🍽️" },
  { value: "taart",      label: "Taart & desserts",    emoji: "🎂" },
  { value: "muziek",     label: "Muziek & entertainment", emoji: "🎶" },
  { value: "foto",       label: "Foto & video",        emoji: "📸" },
  { value: "details",    label: "Gastengeschenken",    emoji: "🎁" },
];

export function getIdeaCategoryMeta(value: IdeaCategory) {
  return IDEA_CATEGORIES.find((c) => c.value === value) ?? IDEA_CATEGORIES[0];
}
