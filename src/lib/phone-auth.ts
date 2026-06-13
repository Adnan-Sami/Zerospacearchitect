// Normalize a Bangladeshi phone number to the local 11-digit format
// (01XXXXXXXXX). The +88 country code is displayed/fixed in UI, but auth
// continues to use the local number so existing accounts remain compatible.
function toEnglishDigits(value: string): string {
  return value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizePhone(input: string): string {
  let digits = toEnglishDigits(input).replace(/\D/g, "");

  // Accept pasted +8801XXXXXXXXX / 8801XXXXXXXXX, then store/use 01XXXXXXXXX.
  if (digits.startsWith("88") && digits.length > 11) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 11);
}

export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone)}@phone.zerospace.app`;
}

export function isValidPhone(phone: string): boolean {
  return /^01\d{9}$/.test(normalizePhone(phone));
}
