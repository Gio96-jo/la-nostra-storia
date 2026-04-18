// Dagelijkse bruiloftsquote — gekozen op basis van de dag-van-het-jaar
// zodat het stel elke dag een andere, opbeurende tekst ziet.

export interface WeddingQuote {
  text: string;
  author?: string;
}

export const WEDDING_QUOTES: WeddingQuote[] = [
  { text: "Liefde bestaat niet uit elkaar aankijken, maar samen dezelfde richting uitkijken.", author: "Antoine de Saint-Exupéry" },
  { text: "De beste dag van je leven is de dag waarop je besluit dat je leven van jou is." },
  { text: "Waar liefde is, daar is leven.", author: "Mahatma Gandhi" },
  { text: "Twee zielen, één gedachte — twee harten, één ritme." },
  { text: "Een geslaagde bruiloft is geen perfecte dag, het is een dag vol liefde." },
  { text: "Samen een huis bouwen begint met een ja." },
  { text: "Geen moment is te klein als je het met de juiste persoon deelt." },
  { text: "Jullie verhaal wordt geschreven door de momenten die jullie samen kiezen." },
  { text: "De mooiste dingen in het leven zijn geen dingen — het zijn mensen." },
  { text: "Liefde is niet wat je zegt, het is wat je doet." },
  { text: "Een trouwring is een cirkel, omdat liefde geen einde kent." },
  { text: "Gelukkig worden is een keuze die jullie elke dag opnieuw samen maken." },
  { text: "Samen planning maken is de eerste oefening in een leven samen." },
  { text: "De kleine dingen zijn de grote dingen in de liefde." },
  { text: "Elke bruiloft is uniek omdat elk stel een eigen verhaal vertelt." },
  { text: "Wanneer twee mensen van elkaar houden, lijkt de wereld even vanzelfsprekend." },
  { text: "Vraag niet of het perfect wordt — zorg dat het van jullie is." },
  { text: "De liefde begint bij twee mensen die moed hebben om ja te zeggen." },
  { text: "De mooiste dag begint met een blik, en eindigt met een dans." },
  { text: "In elke bruiloft zit een belofte: niet dat het altijd makkelijk wordt, maar dat het altijd samen gaat." },
  { text: "Samen lachen is samen thuiskomen." },
  { text: "Een bruiloft is geen eindstreep — het is een startschot." },
  { text: "Laat de mensen om jullie heen zien hoeveel jullie van elkaar houden." },
  { text: "Liefde maakt tijd traag en leven licht." },
  { text: "Geniet van de voorbereiding — het is al een deel van het feest." },
  { text: "Jullie bruiloft hoeft niet groot te zijn, ze moet gewoon waar zijn." },
  { text: "Er is geen betere tijd om gelukkig te zijn dan nu." },
  { text: "Trouwen is kiezen, elke dag opnieuw." },
  { text: "Twee families worden één — en de tafel wordt langer." },
  { text: "Beloof elkaar niet de hemel, maar een paraplu als het regent." },
  { text: "Een lange verloving is een mooie oefening in geduld én in dromen." },
];

export function quoteOfTheDay(date = new Date()): WeddingQuote {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return WEDDING_QUOTES[dayOfYear % WEDDING_QUOTES.length];
}
