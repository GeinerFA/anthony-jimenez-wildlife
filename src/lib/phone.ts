import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/** "+50688887777" → "+506 8888 7777". Si no se puede interpretar, lo devuelve tal cual. */
export function formatPhone(e164: string) {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
