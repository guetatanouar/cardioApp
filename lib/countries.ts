export interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
}

export const countries: Country[] = [
  { code: "CA", name: "Canada", flag: "🇨🇦", prefix: "+1" },
  { code: "US", name: "États-Unis", flag: "🇺🇸", prefix: "+1" },
  { code: "FR", name: "France", flag: "🇫🇷", prefix: "+33" },
  { code: "BE", name: "Belgique", flag: "🇧🇪", prefix: "+32" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", prefix: "+41" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", prefix: "+213" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", prefix: "+212" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", prefix: "+216" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", prefix: "+44" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", prefix: "+49" },
  { code: "IT", name: "Italie", flag: "🇮🇹", prefix: "+39" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", prefix: "+34" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", prefix: "+31" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351" },
  { code: "SE", name: "Suède", flag: "🇸🇪", prefix: "+46" },
  { code: "AT", name: "Autriche", flag: "🇦🇹", prefix: "+43" },
  { code: "DK", name: "Danemark", flag: "🇩🇰", prefix: "+45" },
  { code: "FI", name: "Finlande", flag: "🇫🇮", prefix: "+358" },
  { code: "IE", name: "Irlande", flag: "🇮🇪", prefix: "+353" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", prefix: "+352" },
  { code: "GR", name: "Grèce", flag: "🇬🇷", prefix: "+30" },
  { code: "PL", name: "Pologne", flag: "🇵🇱", prefix: "+48" },
  { code: "CZ", name: "République tchèque", flag: "🇨🇿", prefix: "+420" },
  { code: "HU", name: "Hongrie", flag: "🇭🇺", prefix: "+36" },
  { code: "RO", name: "Roumanie", flag: "🇷🇴", prefix: "+40" },
  { code: "BG", name: "Bulgarie", flag: "🇧🇬", prefix: "+359" },
  { code: "HR", name: "Croatie", flag: "🇭🇷", prefix: "+385" },
  { code: "SK", name: "Slovaquie", flag: "🇸🇰", prefix: "+421" },
  { code: "SI", name: "Slovénie", flag: "🇸🇮", prefix: "+386" },
  { code: "EE", name: "Estonie", flag: "🇪🇪", prefix: "+372" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻", prefix: "+371" },
  { code: "LT", name: "Lituanie", flag: "🇱🇹", prefix: "+370" },
  { code: "MT", name: "Malte", flag: "🇲🇹", prefix: "+356" },
  { code: "SA", name: "Arabie Saoudite", flag: "🇸🇦", prefix: "+966" },
  { code: "AE", name: "Émirats Arabes Unis", flag: "🇦🇪", prefix: "+971" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", prefix: "+974" },
  { code: "EG", name: "Égypte", flag: "🇪🇬", prefix: "+20" },
  { code: "LB", name: "Liban", flag: "🇱🇧", prefix: "+961" },
  { code: "SY", name: "Syrie", flag: "🇸🇾", prefix: "+963" },
  { code: "TR", name: "Turquie", flag: "🇹🇷", prefix: "+90" },
  { code: "AF", name: "Afghanistan", flag: "🇦🇫", prefix: "+93" },
  { code: "AL", name: "Albanie", flag: "🇦🇱", prefix: "+355" },
  { code: "AD", name: "Andorre", flag: "🇦🇩", prefix: "+376" },
  { code: "AO", name: "Angola", flag: "🇦🇴", prefix: "+244" },
  { code: "AG", name: "Antigua-et-Barbuda", flag: "🇦🇬", prefix: "+1268" },
  { code: "AR", name: "Argentine", flag: "🇦🇷", prefix: "+54" },
  { code: "AM", name: "Arménie", flag: "🇦🇲", prefix: "+374" },
  { code: "AU", name: "Australie", flag: "🇦🇺", prefix: "+61" },
  { code: "AZ", name: "Azerbaïdjan", flag: "🇦🇿", prefix: "+994" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", prefix: "+1242" },
  { code: "BH", name: "Bahreïn", flag: "🇧🇭", prefix: "+973" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", prefix: "+880" },
  { code: "BB", name: "Barbade", flag: "🇧🇧", prefix: "+1246" },
  { code: "BY", name: "Biélorussie", flag: "🇧🇾", prefix: "+375" },
  { code: "BZ", name: "Belize", flag: "🇧🇿", prefix: "+501" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", prefix: "+229" },
  { code: "BT", name: "Bhoutan", flag: "🇧🇹", prefix: "+975" },
  { code: "BO", name: "Bolivie", flag: "🇧🇴", prefix: "+591" },
  { code: "BA", name: "Bosnie-Herzégovine", flag: "🇧🇦", prefix: "+387" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", prefix: "+267" },
  { code: "BR", name: "Brésil", flag: "🇧🇷", prefix: "+55" },
  { code: "BN", name: "Brunéi", flag: "🇧🇳", prefix: "+673" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", prefix: "+226" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", prefix: "+257" },
  { code: "KH", name: "Cambodge", flag: "🇰🇭", prefix: "+855" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", prefix: "+237" },
  { code: "CV", name: "Cap-Vert", flag: "🇨🇻", prefix: "+238" },
  { code: "CF", name: "République centrafricaine", flag: "🇨🇫", prefix: "+236" },
  { code: "TD", name: "Tchad", flag: "🇹🇩", prefix: "+235" },
  { code: "CL", name: "Chili", flag: "🇨🇱", prefix: "+56" },
  { code: "CN", name: "Chine", flag: "🇨🇳", prefix: "+86" },
  { code: "CO", name: "Colombie", flag: "🇨🇴", prefix: "+57" },
  { code: "KM", name: "Comores", flag: "🇰🇲", prefix: "+269" },
  { code: "CG", name: "Congo", flag: "🇨🇬", prefix: "+242" },
  { code: "CD", name: "Congo (RDC)", flag: "🇨🇩", prefix: "+243" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", prefix: "+506" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", prefix: "+225" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", prefix: "+53" },
  { code: "CY", name: "Chypre", flag: "🇨🇾", prefix: "+357" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", prefix: "+253" },
  { code: "DM", name: "Dominique", flag: "🇩🇲", prefix: "+1767" },
  { code: "DO", name: "République dominicaine", flag: "🇩🇴", prefix: "+1849" },
  { code: "EC", name: "Équateur", flag: "🇪🇨", prefix: "+593" },
  { code: "SV", name: "Salvador", flag: "🇸🇻", prefix: "+503" },
  { code: "GQ", name: "Guinée équatoriale", flag: "🇬🇶", prefix: "+240" },
  { code: "ER", name: "Érythrée", flag: "🇪🇷", prefix: "+291" },
  { code: "ET", name: "Éthiopie", flag: "🇪🇹", prefix: "+251" },
  { code: "FJ", name: "Fidji", flag: "🇫🇯", prefix: "+679" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", prefix: "+241" },
  { code: "GM", name: "Gambie", flag: "🇬🇲", prefix: "+220" },
  { code: "GE", name: "Géorgie", flag: "🇬🇪", prefix: "+995" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", prefix: "+233" },
  { code: "GD", name: "Grenade", flag: "🇬🇩", prefix: "+1473" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", prefix: "+502" },
  { code: "GN", name: "Guinée", flag: "🇬🇳", prefix: "+224" },
  { code: "GW", name: "Guinée-Bissau", flag: "🇬🇼", prefix: "+245" },
  { code: "GY", name: "Guyana", flag: "🇬🇾", prefix: "+592" },
  { code: "HT", name: "Haïti", flag: "🇭🇹", prefix: "+509" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", prefix: "+504" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", prefix: "+852" },
  { code: "IS", name: "Islande", flag: "🇮🇸", prefix: "+354" },
  { code: "IN", name: "Inde", flag: "🇮🇳", prefix: "+91" },
  { code: "ID", name: "Indonésie", flag: "🇮🇩", prefix: "+62" },
  { code: "IR", name: "Iran", flag: "🇮🇷", prefix: "+98" },
  { code: "IQ", name: "Irak", flag: "🇮🇶", prefix: "+964" },
  { code: "IL", name: "Israël", flag: "🇮🇱", prefix: "+972" },
  { code: "JM", name: "Jamaïque", flag: "🇯🇲", prefix: "+1876" },
  { code: "JP", name: "Japon", flag: "🇯🇵", prefix: "+81" },
  { code: "JO", name: "Jordanie", flag: "🇯🇴", prefix: "+962" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", prefix: "+7" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", prefix: "+254" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮", prefix: "+686" },
  { code: "KW", name: "Koweït", flag: "🇰🇼", prefix: "+965" },
  { code: "KG", name: "Kirghizistan", flag: "🇰🇬", prefix: "+996" },
  { code: "LA", name: "Laos", flag: "🇱🇦", prefix: "+856" },
  { code: "LV", name: "Lettonie", flag: "🇱🇻", prefix: "+371" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", prefix: "+266" },
  { code: "LR", name: "Libéria", flag: "🇱🇷", prefix: "+231" },
  { code: "LY", name: "Libye", flag: "🇱🇾", prefix: "+218" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", prefix: "+423" },
  { code: "MO", name: "Macao", flag: "🇲🇴", prefix: "+853" },
  { code: "MK", name: "Macédoine du Nord", flag: "🇲🇰", prefix: "+389" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", prefix: "+261" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", prefix: "+265" },
  { code: "MY", name: "Malaisie", flag: "🇲🇾", prefix: "+60" },
  { code: "MV", name: "Maldives", flag: "🇲🇻", prefix: "+960" },
  { code: "ML", name: "Mali", flag: "🇲🇱", prefix: "+223" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷", prefix: "+222" },
  { code: "MU", name: "Maurice", flag: "🇲🇺", prefix: "+230" },
  { code: "MX", name: "Mexique", flag: "🇲🇽", prefix: "+52" },
  { code: "FM", name: "Micronésie", flag: "🇫🇲", prefix: "+691" },
  { code: "MD", name: "Moldavie", flag: "🇲🇩", prefix: "+373" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", prefix: "+377" },
  { code: "MN", name: "Mongolie", flag: "🇲🇳", prefix: "+976" },
  { code: "ME", name: "Monténégro", flag: "🇲🇪", prefix: "+382" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", prefix: "+258" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", prefix: "+95" },
  { code: "NA", name: "Namibie", flag: "🇳🇦", prefix: "+264" },
  { code: "NR", name: "Nauru", flag: "🇳🇷", prefix: "+674" },
  { code: "NP", name: "Népal", flag: "🇳🇵", prefix: "+977" },
  { code: "NZ", name: "Nouvelle-Zélande", flag: "🇳🇿", prefix: "+64" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", prefix: "+505" },
  { code: "NE", name: "Niger", flag: "🇳🇪", prefix: "+227" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", prefix: "+234" },
  { code: "KP", name: "Corée du Nord", flag: "🇰🇵", prefix: "+850" },
  { code: "NO", name: "Norvège", flag: "🇳🇴", prefix: "+47" },
  { code: "OM", name: "Oman", flag: "🇴🇲", prefix: "+968" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", prefix: "+92" },
  { code: "PW", name: "Palaos", flag: "🇵🇼", prefix: "+680" },
  { code: "PA", name: "Panama", flag: "🇵🇦", prefix: "+507" },
  { code: "PG", name: "Papouasie-Nouvelle-Guinée", flag: "🇵🇬", prefix: "+675" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", prefix: "+595" },
  { code: "PE", name: "Pérou", flag: "🇵🇪", prefix: "+51" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", prefix: "+63" },
  { code: "PR", name: "Porto Rico", flag: "🇵🇷", prefix: "+1939" },
  { code: "KR", name: "Corée du Sud", flag: "🇰🇷", prefix: "+82" },
  { code: "RU", name: "Russie", flag: "🇷🇺", prefix: "+7" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", prefix: "+250" },
  { code: "KN", name: "Saint-Christophe-et-Niévès", flag: "🇰🇳", prefix: "+1869" },
  { code: "LC", name: "Sainte-Lucie", flag: "🇱🇨", prefix: "+1758" },
  { code: "VC", name: "Saint-Vincent-et-les-Grenadines", flag: "🇻🇨", prefix: "+1784" },
  { code: "WS", name: "Samoa", flag: "🇼🇸", prefix: "+685" },
  { code: "SM", name: "Saint-Marin", flag: "🇸🇲", prefix: "+378" },
  { code: "ST", name: "Sao Tomé-et-Principe", flag: "🇸🇹", prefix: "+239" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", prefix: "+221" },
  { code: "RS", name: "Serbie", flag: "🇷🇸", prefix: "+381" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", prefix: "+248" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", prefix: "+232" },
  { code: "SG", name: "Singapour", flag: "🇸🇬", prefix: "+65" },
  { code: "SO", name: "Somalie", flag: "🇸🇴", prefix: "+252" },
  { code: "ZA", name: "Afrique du Sud", flag: "🇿🇦", prefix: "+27" },
  { code: "SS", name: "Soudan du Sud", flag: "🇸🇸", prefix: "+211" },
  { code: "SD", name: "Soudan", flag: "🇸🇩", prefix: "+249" },
  { code: "SR", name: "Suriname", flag: "🇸🇷", prefix: "+597" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", prefix: "+268" },
  { code: "TW", name: "Taïwan", flag: "🇹🇼", prefix: "+886" },
  { code: "TJ", name: "Tadjikistan", flag: "🇹🇯", prefix: "+992" },
  { code: "TZ", name: "Tanzanie", flag: "🇹🇿", prefix: "+255" },
  { code: "TH", name: "Thaïlande", flag: "🇹🇭", prefix: "+66" },
  { code: "TL", name: "Timor oriental", flag: "🇹🇱", prefix: "+670" },
  { code: "TG", name: "Togo", flag: "🇹🇬", prefix: "+228" },
  { code: "TO", name: "Tonga", flag: "🇹🇴", prefix: "+676" },
  { code: "TT", name: "Trinité-et-Tobago", flag: "🇹🇹", prefix: "+1868" },
  { code: "TM", name: "Turkménistan", flag: "🇹🇲", prefix: "+993" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻", prefix: "+688" },
  { code: "UG", name: "Ouganda", flag: "🇺🇬", prefix: "+256" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", prefix: "+380" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", prefix: "+598" },
  { code: "UZ", name: "Ouzbékistan", flag: "🇺🇿", prefix: "+998" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", prefix: "+678" },
  { code: "VA", name: "Vatican", flag: "🇻🇦", prefix: "+379" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", prefix: "+58" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", prefix: "+84" },
  { code: "YE", name: "Yémen", flag: "🇾🇪", prefix: "+967" },
  { code: "ZM", name: "Zambie", flag: "🇿🇲", prefix: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", prefix: "+263" },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryByPrefix(prefix: string): Country | undefined {
  return countries.find((c) => c.prefix === prefix);
}

export function getCountryFlag(code: string): string {
  return getCountryByCode(code)?.flag ?? "";
}

// Country-specific phone digit counts (after country code)
const PHONE_LENGTH_MAP: Record<string, { min: number; max: number }> = {
  CA: { min: 10, max: 10 }, // +1 Canada
  US: { min: 10, max: 10 }, // +1 US
  FR: { min: 9, max: 9 },   // +33 France
  BE: { min: 9, max: 9 },   // +32 Belgium
  CH: { min: 9, max: 9 },   // +41 Switzerland
  DZ: { min: 9, max: 9 },   // +213 Algeria
  MA: { min: 9, max: 9 },   // +212 Morocco
  TN: { min: 8, max: 8 },   // +216 Tunisia
  GB: { min: 10, max: 10 }, // +44 UK
  DE: { min: 10, max: 11 }, // +49 Germany
  IT: { min: 9, max: 10 },  // +39 Italy
  ES: { min: 9, max: 9 },   // +34 Spain
  NL: { min: 9, max: 9 },   // +31 Netherlands
  PT: { min: 9, max: 9 },   // +351 Portugal
  SE: { min: 9, max: 9 },   // +46 Sweden
  AT: { min: 10, max: 10 }, // +43 Austria
  DK: { min: 8, max: 8 },   // +45 Denmark
  FI: { min: 9, max: 10 },  // +358 Finland
  IE: { min: 9, max: 9 },   // +353 Ireland
  LU: { min: 9, max: 9 },   // +352 Luxembourg
  GR: { min: 10, max: 10 }, // +30 Greece
  PL: { min: 9, max: 9 },   // +48 Poland
  CZ: { min: 9, max: 9 },   // +420 Czech
  HU: { min: 9, max: 9 },   // +36 Hungary
  RO: { min: 9, max: 9 },   // +40 Romania
  BG: { min: 9, max: 9 },   // +359 Bulgaria
  HR: { min: 9, max: 9 },   // +385 Croatia
  SK: { min: 9, max: 9 },   // +421 Slovakia
  SI: { min: 8, max: 8 },   // +386 Slovenia
  EE: { min: 8, max: 8 },   // +372 Estonia
  LV: { min: 8, max: 8 },   // +371 Latvia
  LT: { min: 8, max: 8 },   // +370 Lithuania
  MT: { min: 8, max: 8 },   // +356 Malta
  SA: { min: 9, max: 9 },   // +966 Saudi Arabia
  AE: { min: 9, max: 9 },   // +971 UAE
  QA: { min: 8, max: 8 },   // +974 Qatar
  EG: { min: 10, max: 10 }, // +20 Egypt
  LB: { min: 7, max: 8 },   // +961 Lebanon
  SY: { min: 9, max: 9 },   // +963 Syria
  TR: { min: 10, max: 10 }, // +90 Turkey
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string, countryCode?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (countryCode && PHONE_LENGTH_MAP[countryCode]) {
    const { min, max } = PHONE_LENGTH_MAP[countryCode];
    return digits.length >= min && digits.length <= max;
  }
  return digits.length >= 6 && digits.length <= 15;
}

export function getPhoneMaxDigits(countryCode: string): number | null {
  const rules = PHONE_LENGTH_MAP[countryCode];
  return rules?.max ?? null;
}

export function getPhoneLengthError(countryCode: string): string | null {
  const rules = PHONE_LENGTH_MAP[countryCode];
  if (!rules) return null;
  if (rules.min === rules.max) {
    return `Le numéro doit contenir exactement ${rules.max} chiffres`;
  }
  return `Le numéro doit contenir entre ${rules.min} et ${rules.max} chiffres`;
}
