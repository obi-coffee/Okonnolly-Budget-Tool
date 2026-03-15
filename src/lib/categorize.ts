const RULES: [RegExp, string][] = [
  // Groceries
  [/walmart|kroger|aldi|publix|safeway|trader.?joe|whole.?foods|costco|sam.?s club|heb|meijer|food.?lion|giant|wegmans|sprouts|piggly|winn.?dixie|grocery|supermarket/i, 'Groceries'],
  // Dining Out
  [/mcdonald|burger.?king|wendy|chick.?fil|starbucks|dunkin|chipotle|panera|subway|domino|pizza.?hut|taco.?bell|olive.?garden|applebee|chili|ihop|denny|waffle|grubhub|doordash|ubereats|postmates|restaurant|cafe|diner|grill|bistro|bar & grill/i, 'Dining Out'],
  // Subscriptions
  [/netflix|hulu|disney|spotify|apple.?(music|tv|one)|amazon.?prime|hbo|youtube.?premium|audible|patreon|substack|adobe|microsoft.?365|dropbox|icloud|google.?one|paramount|peacock|crunchyroll/i, 'Subscriptions'],
  // Utilities
  [/electric|gas.?co|water.?co|sewer|trash|waste|comcast|xfinity|at.?t|verizon|t.?mobile|spectrum|cox|frontier|internet|phone.?bill|utility/i, 'Utilities'],
  // Rent / Mortgage
  [/rent|mortgage|landlord|property.?mgmt|hoa|homeowner/i, 'Rent/Mortgage'],
  // Transportation
  [/uber(?!eats)|lyft|taxi|transit|metro|bus.?pass|parking|toll|ez.?pass/i, 'Transportation'],
  // Gas
  [/shell|exxon|chevron|bp\b|marathon|speedway|wawa|sheetz|quiktrip|racetrac|circle.?k|7.?eleven|fuel|gasoline|gas station/i, 'Gas'],
  // Insurance
  [/geico|state.?farm|allstate|progressive|liberty.?mutual|farmers|usaa|insurance|premium/i, 'Insurance'],
  // Healthcare
  [/doctor|hospital|clinic|pharmacy|cvs|walgreens|rite.?aid|urgent.?care|dentist|optometrist|therapy|copay|medical|health/i, 'Healthcare'],
  // Entertainment
  [/cinema|theater|theatre|movie|concert|ticket|amc|regal|bowling|arcade|museum|zoo|amusement|event/i, 'Entertainment'],
  // Shopping
  [/amazon(?!.*prime)|target|best.?buy|home.?depot|lowe|ikea|wayfair|etsy|ebay|nordstrom|macy|kohls|tj.?maxx|marshalls|ross|dollar/i, 'Shopping'],
  // Personal Care
  [/salon|barber|spa|nail|hair|beauty|sephora|ulta|gym|fitness|planet.?fitness|anytime|ymca/i, 'Personal Care'],
  // Pets
  [/petco|petsmart|vet|veterinar|chewy|pet.?supply|groomer/i, 'Pets'],
  // Education
  [/tuition|student|school|university|college|udemy|coursera|textbook|education/i, 'Education'],
  // Childcare
  [/daycare|childcare|nanny|babysit|kindercare/i, 'Childcare'],
];

export function categorizeTransaction(description: string): string {
  for (const [pattern, category] of RULES) {
    if (pattern.test(description)) return category;
  }
  return 'Other';
}
