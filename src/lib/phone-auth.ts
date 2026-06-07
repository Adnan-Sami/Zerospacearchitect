// Normalize a Bangladeshi phone number to digits only and map it to a
// synthetic email so Supabase email-auth can be used as phone+password auth
// without configuring an SMS provider.
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone)}@phone.zerospace.app`;
}

export function isValidPhone(phone: string): boolean {
  const d = normalizePhone(phone);
  return d.length >= 10 && d.length <= 15;
}
