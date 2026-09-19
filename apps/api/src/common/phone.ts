/** Turkmenistan mobile/city prefixes that follow the +993 country code. */
const TM_PREFIXES = ['60', '61', '62', '63', '64', '65', '71'];

const SUBSCRIBER_PATTERN = new RegExp(`^(?:${TM_PREFIXES.join('|')})\\d{6}$`);

/**
 * Normalises the ways people write Turkmen numbers (8 61 123456, +993 61-12-34-56,
 * 00993…, bare 61123456) into a single +993XXXXXXXX form. Anything that is not a
 * recognisable Turkmen number is returned trimmed but otherwise untouched, so
 * foreign or partial numbers are never mangled.
 */
export function formatTurkmenPhoneNumber(phone: string): string {
  const trimmed = phone.trim();

  if (!trimmed) {
    return trimmed;
  }

  // Users type separators freely; strip them before matching.
  const compact = trimmed.replace(/[\s()\-.]/g, '');

  const subscriber = extractSubscriber(compact);

  return subscriber ? `+993${subscriber}` : trimmed;
}

function extractSubscriber(compact: string): string | null {
  const candidates = [
    compact.startsWith('+993') ? compact.slice(4) : null,
    compact.startsWith('00993') ? compact.slice(5) : null,
    compact.startsWith('993') ? compact.slice(3) : null,
    // Domestic trunk prefix: 8 61 123456
    compact.startsWith('8') ? compact.slice(1) : null,
    compact,
  ];

  return (
    candidates.find((candidate) => candidate !== null && SUBSCRIBER_PATTERN.test(candidate)) ?? null
  );
}
