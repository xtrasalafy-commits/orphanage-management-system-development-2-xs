/** Gabungkan kelas Tailwind; modul ini dipakai bersama server & client. */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
