import type { WeddingTheme } from "./types";

/**
 * Elke theme levert HSL-waarden voor de CSS custom properties in globals.css.
 * Layout blijft identiek, alleen kleuren en lettertypes wisselen.
 *
 * "romantisch_blush" is de STANDAARD — dit zijn exact dezelfde waarden als in :root.
 * Niet wijzigen zonder expliciet verzoek van de gebruiker.
 */

export interface ThemeColors {
  background: string;         // hsl triplet
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemeDefinition {
  value: WeddingTheme;
  label: string;
  description: string;
  /** CSS font stack voor titles/headings */
  serifStack: string;
  /** CSS font stack voor body/sans */
  sansStack: string;
  light: ThemeColors;
  /** Klein paletje voor preview swatches (hex) */
  preview: { primary: string; accent: string; bg: string };
}

export const THEMES: ThemeDefinition[] = [
  // 1
  {
    value: "klassiek_elegant",
    label: "Klassiek & elegant",
    description: "Tijdloos, chique, kerkelijk of kasteel — ivoor, champagne en goud.",
    serifStack: `var(--font-cormorant), var(--font-playfair), Georgia, serif`,
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "40 45% 97%",
      foreground: "20 30% 12%",
      card: "0 0% 100%",
      cardForeground: "20 30% 12%",
      popover: "0 0% 100%",
      popoverForeground: "20 30% 12%",
      primary: "36 55% 44%",           // antique gold
      primaryForeground: "40 45% 97%",
      secondary: "40 50% 94%",
      secondaryForeground: "20 30% 12%",
      muted: "40 30% 93%",
      mutedForeground: "20 10% 40%",
      accent: "30 25% 82%",             // champagne
      accentForeground: "20 30% 15%",
      border: "36 20% 85%",
      input: "36 20% 85%",
      ring: "36 55% 44%",
    },
    preview: { primary: "#b48a43", accent: "#d7c9b1", bg: "#faf5ea" },
  },
  // 2 — STANDAARD
  {
    value: "romantisch_blush",
    label: "Romantisch blush",
    description: "Romantisch, zacht, bloemrijk — blush, ivoor en sage (standaard).",
    serifStack: `var(--font-playfair), Georgia, serif`,
    sansStack: `var(--font-inter), system-ui, sans-serif`,
    light: {
      background: "36 50% 98%",
      foreground: "20 14% 14%",
      card: "0 0% 100%",
      cardForeground: "20 14% 14%",
      popover: "0 0% 100%",
      popoverForeground: "20 14% 14%",
      primary: "12 56% 53%",
      primaryForeground: "36 100% 99%",
      secondary: "36 60% 95%",
      secondaryForeground: "20 14% 14%",
      muted: "36 30% 94%",
      mutedForeground: "20 8% 42%",
      accent: "110 18% 70%",
      accentForeground: "110 30% 18%",
      border: "30 25% 88%",
      input: "30 25% 88%",
      ring: "12 56% 53%",
    },
    preview: { primary: "#cc5d3f", accent: "#a7c39c", bg: "#fdf9f1" },
  },
  // 3
  {
    value: "boho_natuurlijk",
    label: "Boho & natuurlijk",
    description: "Vrij, buiten, pampasgras, boeren-festival — terracotta en olijf.",
    serifStack: `var(--font-cormorant), Georgia, serif`,
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "30 35% 96%",
      foreground: "20 25% 15%",
      card: "30 30% 99%",
      cardForeground: "20 25% 15%",
      popover: "30 30% 99%",
      popoverForeground: "20 25% 15%",
      primary: "18 55% 50%",            // terracotta
      primaryForeground: "30 35% 98%",
      secondary: "35 40% 92%",
      secondaryForeground: "20 25% 15%",
      muted: "35 25% 90%",
      mutedForeground: "20 10% 40%",
      accent: "75 25% 55%",             // olive
      accentForeground: "75 40% 18%",
      border: "30 20% 85%",
      input: "30 20% 85%",
      ring: "18 55% 50%",
    },
    preview: { primary: "#b85c38", accent: "#8a9a5b", bg: "#f5ece0" },
  },
  // 4
  {
    value: "rustiek_landelijk",
    label: "Rustiek landelijk",
    description: "Schuur, hout, lampjes, zonnebloemen — mosterd en bordeaux.",
    serifStack: `var(--font-playfair), Georgia, serif`,
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "40 35% 95%",
      foreground: "25 30% 14%",
      card: "40 30% 99%",
      cardForeground: "25 30% 14%",
      popover: "40 30% 99%",
      popoverForeground: "25 30% 14%",
      primary: "0 45% 38%",             // bordeaux
      primaryForeground: "40 35% 97%",
      secondary: "42 60% 92%",
      secondaryForeground: "25 30% 14%",
      muted: "42 40% 90%",
      mutedForeground: "25 10% 38%",
      accent: "38 75% 55%",             // mosterd
      accentForeground: "30 50% 15%",
      border: "35 20% 82%",
      input: "35 20% 82%",
      ring: "0 45% 38%",
    },
    preview: { primary: "#8c3a3a", accent: "#d4a129", bg: "#f4ebd8" },
  },
  // 5
  {
    value: "modern_minimalistisch",
    label: "Modern minimalistisch",
    description: "Strak, architecturaal, weinig decoratie — wit, zwart, beton.",
    serifStack: `"Inter", system-ui, sans-serif`,        // geen serif, alles sans
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "0 0% 99%",
      foreground: "220 15% 10%",
      card: "0 0% 100%",
      cardForeground: "220 15% 10%",
      popover: "0 0% 100%",
      popoverForeground: "220 15% 10%",
      primary: "220 15% 15%",           // bijna zwart
      primaryForeground: "0 0% 100%",
      secondary: "220 15% 96%",
      secondaryForeground: "220 15% 10%",
      muted: "220 10% 94%",
      mutedForeground: "220 10% 45%",
      accent: "220 10% 88%",
      accentForeground: "220 15% 15%",
      border: "220 10% 88%",
      input: "220 10% 88%",
      ring: "220 15% 15%",
    },
    preview: { primary: "#22262b", accent: "#d6d8dc", bg: "#fafafa" },
  },
  // 6
  {
    value: "vintage_retro",
    label: "Vintage retro",
    description: "Jaren '20-'50, oude platen, kant — mint, poederroze en brons.",
    serifStack: `var(--font-cormorant), var(--font-playfair), Georgia, serif`,
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "345 40% 97%",
      foreground: "350 20% 15%",
      card: "345 35% 99%",
      cardForeground: "350 20% 15%",
      popover: "345 35% 99%",
      popoverForeground: "350 20% 15%",
      primary: "345 50% 55%",           // poederroze accent
      primaryForeground: "345 40% 98%",
      secondary: "155 30% 92%",
      secondaryForeground: "350 20% 15%",
      muted: "345 20% 93%",
      mutedForeground: "350 10% 40%",
      accent: "155 35% 65%",            // mint
      accentForeground: "155 40% 15%",
      border: "345 20% 88%",
      input: "345 20% 88%",
      ring: "345 50% 55%",
    },
    preview: { primary: "#c06a86", accent: "#8fc4ab", bg: "#fbf0f2" },
  },
  // 7
  {
    value: "tuinfeest_botanical",
    label: "Tuinfeest & botanical",
    description: "Veel groen, kas, eucalyptus — diep groen, crème, goud.",
    serifStack: `var(--font-playfair), Georgia, serif`,
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "80 30% 97%",
      foreground: "140 25% 12%",
      card: "80 25% 99%",
      cardForeground: "140 25% 12%",
      popover: "80 25% 99%",
      popoverForeground: "140 25% 12%",
      primary: "140 40% 28%",           // deep green
      primaryForeground: "80 30% 98%",
      secondary: "80 30% 92%",
      secondaryForeground: "140 25% 12%",
      muted: "80 20% 91%",
      mutedForeground: "140 10% 35%",
      accent: "40 45% 65%",             // goud
      accentForeground: "40 50% 15%",
      border: "80 15% 84%",
      input: "80 15% 84%",
      ring: "140 40% 28%",
    },
    preview: { primary: "#2d5c3f", accent: "#d4b878", bg: "#f3f6ea" },
  },
  // 8
  {
    value: "mediterraan_italiaans",
    label: "Mediterraan Italiaans",
    description: "Citroenen, terras, wit-blauw — La Dolce Vita.",
    serifStack: `var(--font-playfair), Georgia, serif`,
    sansStack: `"Inter", system-ui, sans-serif`,
    light: {
      background: "200 50% 97%",
      foreground: "210 30% 14%",
      card: "0 0% 100%",
      cardForeground: "210 30% 14%",
      popover: "0 0% 100%",
      popoverForeground: "210 30% 14%",
      primary: "205 75% 42%",           // oceaanblauw
      primaryForeground: "200 50% 98%",
      secondary: "200 40% 94%",
      secondaryForeground: "210 30% 14%",
      muted: "200 30% 93%",
      mutedForeground: "210 10% 40%",
      accent: "50 85% 62%",             // citroen
      accentForeground: "50 50% 15%",
      border: "200 25% 86%",
      input: "200 25% 86%",
      ring: "205 75% 42%",
    },
    preview: { primary: "#1d6fb8", accent: "#f2d94e", bg: "#eaf4fa" },
  },
];

export function getTheme(value: WeddingTheme | null | undefined): ThemeDefinition {
  return THEMES.find((t) => t.value === value) ?? THEMES[1]; // fallback blush
}

/**
 * Maak een CSS-regel met alle variabelen voor een thema.
 * Gebruik: <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
 */
export function themeToCss(value: WeddingTheme | null | undefined): string {
  const t = getTheme(value);
  const c = t.light;
  return `
:root {
  --background: ${c.background};
  --foreground: ${c.foreground};
  --card: ${c.card};
  --card-foreground: ${c.cardForeground};
  --popover: ${c.popover};
  --popover-foreground: ${c.popoverForeground};
  --primary: ${c.primary};
  --primary-foreground: ${c.primaryForeground};
  --secondary: ${c.secondary};
  --secondary-foreground: ${c.secondaryForeground};
  --muted: ${c.muted};
  --muted-foreground: ${c.mutedForeground};
  --accent: ${c.accent};
  --accent-foreground: ${c.accentForeground};
  --border: ${c.border};
  --input: ${c.input};
  --ring: ${c.ring};
  --font-theme-serif: ${t.serifStack};
  --font-theme-sans: ${t.sansStack};
}
html { font-family: var(--font-theme-sans); }
.font-serif, h1, h2, h3, h4 { font-family: var(--font-theme-serif); }
`.trim();
}
