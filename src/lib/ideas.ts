import type { WeddingTheme } from "./types";
import type { Idea, IdeaCategory } from "./ideas-types";
import { KLASSIEK_ELEGANT } from "@/data/ideas/klassiek-elegant";
import { ROMANTISCH_BLUSH } from "@/data/ideas/romantisch-blush";
import { BOHO_NATUURLIJK } from "@/data/ideas/boho-natuurlijk";
import { RUSTIEK_LANDELIJK } from "@/data/ideas/rustiek-landelijk";
import { MODERN_MINIMALISTISCH } from "@/data/ideas/modern-minimalistisch";
import { VINTAGE_RETRO } from "@/data/ideas/vintage-retro";
import { TUINFEEST_BOTANICAL } from "@/data/ideas/tuinfeest-botanical";
import { MEDITERRAAN_ITALIAANS } from "@/data/ideas/mediterraan-italiaans";

type ThemeIdeasMap = Record<IdeaCategory, { title: string; description: string }[]>;

const THEME_IDEAS: Record<WeddingTheme, ThemeIdeasMap> = {
  klassiek_elegant: KLASSIEK_ELEGANT,
  romantisch_blush: ROMANTISCH_BLUSH,
  boho_natuurlijk: BOHO_NATUURLIJK,
  rustiek_landelijk: RUSTIEK_LANDELIJK,
  modern_minimalistisch: MODERN_MINIMALISTISCH,
  vintage_retro: VINTAGE_RETRO,
  tuinfeest_botanical: TUINFEEST_BOTANICAL,
  mediterraan_italiaans: MEDITERRAAN_ITALIAANS,
};

function buildAll(): Idea[] {
  const out: Idea[] = [];
  (Object.keys(THEME_IDEAS) as WeddingTheme[]).forEach((theme) => {
    const categories = THEME_IDEAS[theme];
    (Object.keys(categories) as IdeaCategory[]).forEach((category) => {
      categories[category].forEach((entry, index) => {
        out.push({
          id: `${theme}-${category}-${index + 1}`,
          theme,
          category,
          title: entry.title,
          description: entry.description,
        });
      });
    });
  });
  return out;
}

export const ALL_IDEAS: Idea[] = buildAll();

export function getIdeasForTheme(theme: WeddingTheme): Idea[] {
  return ALL_IDEAS.filter((i) => i.theme === theme);
}

export function getIdea(id: string): Idea | undefined {
  return ALL_IDEAS.find((i) => i.id === id);
}
