// Flags: the 197 countries. The 193 UN members, the 2 UN observer states
// (Vatican City, Palestine), Kosovo and Taiwan. Hard mode adds TERRITORIES
// below. Images are flag-icons SVGs in public/flags/{code}.svg
// (scripts/flags/copy-svgs.mts).
//
// tier: 1 = most people know it, 2 = medium, 3 = hard. The daily sprint mixes
// them (lib/flags/daily.ts). Aliases are other names people really type;
// matching ignores case, accents, punctuation, spaces and a leading "the"
// (lib/flags/match.ts), so "Cote d'Ivoire" needs no alias.

export type Continent = "Africa" | "Asia" | "Europe" | "North America" | "South America" | "Oceania";
export type Tier = 1 | 2 | 3;
export type Country = { code: string; name: string; continent: Continent; tier: Tier; aliases: string[]; territory?: boolean };

export const CONTINENTS: Continent[] = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];

type Row = [code: string, name: string, tier: Tier, ...aliases: string[]];

const DATA: Record<Continent, Row[]> = {
  Africa: [
    ["dz", "Algeria", 2],
    ["ao", "Angola", 2],
    ["bj", "Benin", 3],
    ["bw", "Botswana", 2],
    ["bf", "Burkina Faso", 3],
    ["bi", "Burundi", 3],
    ["cv", "Cabo Verde", 3, "Cape Verde"],
    ["cm", "Cameroon", 2],
    ["cf", "Central African Republic", 3, "CAR"],
    ["td", "Chad", 3],
    ["km", "Comoros", 3],
    ["cg", "Republic of the Congo", 3, "Congo", "Congo-Brazzaville", "Congo Republic", "Republic of Congo"],
    ["cd", "DR Congo", 2, "Democratic Republic of the Congo", "Democratic Republic of Congo", "DRC", "Congo-Kinshasa", "Zaire"],
    ["ci", "Côte d'Ivoire", 2, "Ivory Coast"],
    ["dj", "Djibouti", 3],
    ["eg", "Egypt", 1],
    ["gq", "Equatorial Guinea", 3],
    ["er", "Eritrea", 3],
    ["sz", "Eswatini", 3, "Swaziland"],
    ["et", "Ethiopia", 2],
    ["ga", "Gabon", 3],
    ["gm", "Gambia", 3],
    ["gh", "Ghana", 2],
    ["gn", "Guinea", 3, "Guinea-Conakry"],
    ["gw", "Guinea-Bissau", 3],
    ["ke", "Kenya", 1],
    ["ls", "Lesotho", 3],
    ["lr", "Liberia", 3],
    ["ly", "Libya", 2],
    ["mg", "Madagascar", 2],
    ["mw", "Malawi", 3],
    ["ml", "Mali", 3],
    ["mr", "Mauritania", 3],
    ["mu", "Mauritius", 3],
    ["ma", "Morocco", 1],
    ["mz", "Mozambique", 2],
    ["na", "Namibia", 2],
    ["ne", "Niger", 3],
    ["ng", "Nigeria", 1],
    ["rw", "Rwanda", 2],
    ["st", "São Tomé and Príncipe", 3, "Sao Tome", "Sao Tome & Principe"],
    ["sn", "Senegal", 2],
    ["sc", "Seychelles", 3],
    ["sl", "Sierra Leone", 3],
    ["so", "Somalia", 2],
    ["za", "South Africa", 1, "RSA"],
    ["ss", "South Sudan", 3],
    ["sd", "Sudan", 3],
    ["tz", "Tanzania", 2],
    ["tg", "Togo", 3],
    ["tn", "Tunisia", 2],
    ["ug", "Uganda", 2],
    ["zm", "Zambia", 3],
    ["zw", "Zimbabwe", 2],
  ],
  Asia: [
    ["af", "Afghanistan", 2],
    ["am", "Armenia", 2],
    ["az", "Azerbaijan", 2],
    ["bh", "Bahrain", 3],
    ["bd", "Bangladesh", 2],
    ["bt", "Bhutan", 2],
    ["bn", "Brunei", 3, "Brunei Darussalam"],
    ["kh", "Cambodia", 2, "Kampuchea"],
    ["cn", "China", 1, "People's Republic of China", "PRC"],
    ["ge", "Georgia", 2],
    ["in", "India", 1],
    ["id", "Indonesia", 2],
    ["ir", "Iran", 2],
    ["iq", "Iraq", 2],
    ["il", "Israel", 1],
    ["jp", "Japan", 1],
    ["jo", "Jordan", 2],
    ["kz", "Kazakhstan", 2],
    ["kw", "Kuwait", 3],
    ["kg", "Kyrgyzstan", 3, "Kyrgyz Republic", "Kirghizia"],
    ["la", "Laos", 3, "Lao PDR", "Lao"],
    ["lb", "Lebanon", 2],
    ["my", "Malaysia", 2],
    ["mv", "Maldives", 3],
    ["mn", "Mongolia", 3],
    ["mm", "Myanmar", 3, "Burma"],
    ["np", "Nepal", 2],
    ["kp", "North Korea", 2, "DPRK", "Democratic People's Republic of Korea"],
    ["om", "Oman", 3],
    ["pk", "Pakistan", 2],
    ["ps", "Palestine", 2, "State of Palestine"],
    ["ph", "Philippines", 2],
    ["qa", "Qatar", 3],
    ["sa", "Saudi Arabia", 2, "KSA"],
    ["sg", "Singapore", 2],
    ["kr", "South Korea", 1, "Korea", "Republic of Korea"],
    ["lk", "Sri Lanka", 2],
    ["sy", "Syria", 3],
    ["tw", "Taiwan", 2, "Republic of China", "Chinese Taipei"],
    ["tj", "Tajikistan", 3],
    ["th", "Thailand", 2],
    ["tl", "Timor-Leste", 3, "East Timor"],
    ["tr", "Türkiye", 1, "Turkey"],
    ["tm", "Turkmenistan", 3],
    ["ae", "United Arab Emirates", 2, "UAE", "Emirates"],
    ["uz", "Uzbekistan", 3],
    ["vn", "Vietnam", 2, "Viet Nam"],
    ["ye", "Yemen", 3],
  ],
  Europe: [
    ["al", "Albania", 2],
    ["ad", "Andorra", 3],
    ["at", "Austria", 2],
    ["by", "Belarus", 3],
    ["be", "Belgium", 1],
    ["ba", "Bosnia and Herzegovina", 3, "Bosnia", "Bosnia-Herzegovina", "BiH"],
    ["bg", "Bulgaria", 2],
    ["hr", "Croatia", 2],
    ["cy", "Cyprus", 2],
    ["cz", "Czechia", 2, "Czech Republic"],
    ["dk", "Denmark", 1],
    ["ee", "Estonia", 3],
    ["fi", "Finland", 2],
    ["fr", "France", 1],
    ["de", "Germany", 1, "Deutschland"],
    ["gr", "Greece", 1],
    ["hu", "Hungary", 2],
    ["is", "Iceland", 2],
    ["ie", "Ireland", 1, "Republic of Ireland", "Eire"],
    ["it", "Italy", 1],
    ["xk", "Kosovo", 3],
    ["lv", "Latvia", 3],
    ["li", "Liechtenstein", 3],
    ["lt", "Lithuania", 3],
    ["lu", "Luxembourg", 3],
    ["mt", "Malta", 2],
    ["md", "Moldova", 3],
    ["mc", "Monaco", 3],
    ["me", "Montenegro", 3],
    ["nl", "Netherlands", 1, "Holland"],
    ["mk", "North Macedonia", 3, "Macedonia"],
    ["no", "Norway", 1],
    ["pl", "Poland", 1],
    ["pt", "Portugal", 1],
    ["ro", "Romania", 2],
    ["ru", "Russia", 1, "Russian Federation"],
    ["sm", "San Marino", 3],
    ["rs", "Serbia", 3],
    ["sk", "Slovakia", 3],
    ["si", "Slovenia", 3],
    ["es", "Spain", 1],
    ["se", "Sweden", 1],
    ["ch", "Switzerland", 1],
    ["ua", "Ukraine", 1],
    ["gb", "United Kingdom", 1, "UK", "Great Britain", "Britain"],
    ["va", "Vatican City", 3, "Vatican", "Holy See"],
  ],
  "North America": [
    ["ag", "Antigua and Barbuda", 3, "Antigua"],
    ["bs", "Bahamas", 3],
    ["bb", "Barbados", 3],
    ["bz", "Belize", 3],
    ["ca", "Canada", 1],
    ["cr", "Costa Rica", 2],
    ["cu", "Cuba", 2],
    ["dm", "Dominica", 3],
    ["do", "Dominican Republic", 2],
    ["sv", "El Salvador", 3, "Salvador"],
    ["gd", "Grenada", 3],
    ["gt", "Guatemala", 2],
    ["ht", "Haiti", 2],
    ["hn", "Honduras", 3],
    ["jm", "Jamaica", 1],
    ["mx", "Mexico", 1],
    ["ni", "Nicaragua", 3],
    ["pa", "Panama", 2],
    ["kn", "Saint Kitts and Nevis", 3, "Saint Kitts", "Saint Christopher and Nevis"],
    ["lc", "Saint Lucia", 3],
    ["vc", "Saint Vincent and the Grenadines", 3, "Saint Vincent"],
    ["tt", "Trinidad and Tobago", 3, "Trinidad"],
    ["us", "United States", 1, "USA", "US", "United States of America", "America"],
  ],
  "South America": [
    ["ar", "Argentina", 1],
    ["bo", "Bolivia", 2],
    ["br", "Brazil", 1, "Brasil"],
    ["cl", "Chile", 2],
    ["co", "Colombia", 2],
    ["ec", "Ecuador", 2],
    ["gy", "Guyana", 3],
    ["py", "Paraguay", 3],
    ["pe", "Peru", 2],
    ["sr", "Suriname", 3, "Surinam"],
    ["uy", "Uruguay", 2],
    ["ve", "Venezuela", 2],
  ],
  Oceania: [
    ["au", "Australia", 1],
    ["fj", "Fiji", 3],
    ["ki", "Kiribati", 3],
    ["mh", "Marshall Islands", 3],
    ["fm", "Micronesia", 3, "Federated States of Micronesia", "FSM"],
    ["nr", "Nauru", 3],
    ["nz", "New Zealand", 1, "Aotearoa"],
    ["pw", "Palau", 3],
    ["pg", "Papua New Guinea", 3, "PNG"],
    ["ws", "Samoa", 3],
    ["sb", "Solomon Islands", 3, "Solomons"],
    ["to", "Tonga", 3],
    ["tv", "Tuvalu", 3],
    ["vu", "Vanuatu", 3],
  ],
};

export const COUNTRIES: Country[] = CONTINENTS.flatMap((continent) =>
  DATA[continent].map(([code, name, tier, ...aliases]) => ({ code, name, continent, tier, aliases })),
);

/**
 * Hard mode's extras: territories, dependencies, autonomous regions, the UK's
 * home nations and three breakaway states (Transnistria, South Ossetia,
 * Abkhazia), each with a flag of its own (official, or the local flag where
 * that's what people fly: Wallis and Futuna, Saint Pierre and Miquelon, Saint
 * Barthélemy, French Guiana). Left out on purpose: territories that only fly
 * their country's flag (Réunion, Guadeloupe, Mayotte, Saint Martin,
 * Svalbard, Bouvet, US Minor Outlying Islands, Heard Island), Diego Garcia
 * (same flag as BIOT), Antarctica and Northern Ireland (no official flag),
 * regions (Catalonia, the Canaries…) and organisations (EU, UN…).
 */
const TERRITORY_DATA: Record<Continent, Row[]> = {
  Africa: [
    ["eh", "Western Sahara", 3],
    ["io", "British Indian Ocean Territory", 3, "BIOT", "Chagos Islands", "Chagos"],
    ["sh-hl", "Saint Helena", 3],
    ["sh-ac", "Ascension Island", 3, "Ascension"],
    ["sh-ta", "Tristan da Cunha", 3, "Tristan"],
    ["ic", "Canary Islands", 3, "Canaries", "Canarias", "Islas Canarias"],
    ["pt-ma", "Madeira", 3],
    ["tf", "French Southern and Antarctic Lands", 3, "French Southern Territories", "TAAF"],
    ["aq-bat", "British Antarctic Territory", 3, "BAT"],
  ],
  Asia: [
    ["hk", "Hong Kong", 3],
    ["mo", "Macau", 3, "Macao"],
    ["cx", "Christmas Island", 3],
    ["cc", "Cocos (Keeling) Islands", 3, "Cocos Islands", "Keeling Islands", "Cocos"],
    ["ge-so", "South Ossetia", 3, "Ossetia"],
  ],
  Europe: [
    ["gb-eng", "England", 3],
    ["gb-sct", "Scotland", 3],
    ["gb-wls", "Wales", 3, "Cymru"],
    ["ax", "Åland Islands", 3, "Aland", "Åland"],
    ["pt-ac", "Azores", 3, "Açores", "Azores Islands"],
    ["md-tr", "Transnistria", 3, "Pridnestrovie", "Transdniestria", "Trans-Dniester"],
    ["ge-ab", "Abkhazia", 3],
    ["fo", "Faroe Islands", 3, "Faroes", "Faeroe Islands", "Faroe"],
    ["gi", "Gibraltar", 3],
    ["gg", "Guernsey", 3],
    ["je", "Jersey", 3],
    ["im", "Isle of Man", 3],
  ],
  "North America": [
    ["gl", "Greenland", 3],
    ["bm", "Bermuda", 3],
    ["pr", "Puerto Rico", 3],
    ["ai", "Anguilla", 3],
    ["aw", "Aruba", 3],
    ["cw", "Curaçao", 3],
    ["sx", "Sint Maarten", 3, "Saint Maarten"],
    ["ky", "Cayman Islands", 3, "Caymans", "Cayman"],
    ["ms", "Montserrat", 3],
    ["tc", "Turks and Caicos Islands", 3, "Turks and Caicos"],
    ["vg", "British Virgin Islands", 3, "BVI"],
    ["vi", "US Virgin Islands", 3, "USVI", "United States Virgin Islands", "American Virgin Islands"],
    ["mq", "Martinique", 3],
    ["bq-bo", "Bonaire", 3],
    ["bq-se", "Sint Eustatius", 3, "Saint Eustatius", "Statia"],
    ["bq-sa", "Saba", 3],
    ["pm", "Saint Pierre and Miquelon", 3, "Saint-Pierre and Miquelon", "Saint Pierre", "Miquelon"],
    ["bl", "Saint Barthélemy", 3, "Saint Barths", "Saint Barts", "Saint Barth"],
  ],
  "South America": [
    ["fk", "Falkland Islands", 3, "Falklands"],
    ["gs", "South Georgia and the South Sandwich Islands", 3, "South Georgia"],
    ["gf", "French Guiana", 3, "Guyane", "French Guyana"],
  ],
  Oceania: [
    ["as", "American Samoa", 3],
    ["gu", "Guam", 3],
    ["mp", "Northern Mariana Islands", 3, "Northern Marianas"],
    ["ck", "Cook Islands", 3],
    ["nu", "Niue", 3],
    ["tk", "Tokelau", 3],
    ["nf", "Norfolk Island", 3],
    ["pn", "Pitcairn Islands", 3, "Pitcairn"],
    ["pf", "French Polynesia", 3, "Tahiti"],
    ["nc", "New Caledonia", 3],
    ["wf", "Wallis and Futuna", 3, "Wallis & Futuna"],
  ],
};

export const TERRITORIES: Country[] = CONTINENTS.flatMap((continent) =>
  TERRITORY_DATA[continent].map(([code, name, tier, ...aliases]) => ({ code, name, continent, tier, aliases, territory: true })),
);

/** Countries and territories: everything a name can match. */
export const EVERY_PLACE: Country[] = [...COUNTRIES, ...TERRITORIES];

export const BY_CODE: ReadonlyMap<string, Country> = new Map(EVERY_PLACE.map((c) => [c.code, c]));

/** Every country code, in grid order (continent, then A–Z as listed). */
export const ALL_CODES: string[] = COUNTRIES.map((c) => c.code);

/**
 * Flags from Wikimedia Commons, not flag-icons (public/flags/CREDITS-wikimedia.txt).
 * flag-icons draws wf, pm, bl and gf as the French flag, and sh-ta with a Saint Helena shield,
 * so copy-svgs must never overwrite these.
 */
export const COMMONS_FLAGS: ReadonlySet<string> = new Set(["aq-bat", "bq-bo", "bq-se", "bq-sa", "wf", "pm", "bl", "pt-ac", "pt-ma", "gf", "md-tr", "ge-so", "ge-ab", "sh-ta"]);

/** Hard mode: every country and territory. */
export const HARD_CODES: string[] = EVERY_PLACE.map((c) => c.code);

export const flagSrc = (code: string) => `/flags/${code}.svg`;
