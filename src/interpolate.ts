/**
 * Interpolation der Kratos-`context`-Variablen in einen (uebersetzten) Template-String.
 *
 * Kratos liefert zu jeder Meldung ein `context`-Objekt mit den Werten fuer die
 * Platzhalter im Text (z.B. `{provider}`, `{property}`, `{min_length}`). Wir setzen
 * dieselben Platzhalter in unseren deutschen Text ein — der englische `text` wird
 * dabei nie angefasst, nur die `id` als Schluessel und `context` als Werte genutzt.
 *
 * Bewusst dependency-frei gehalten (kein intl-messageformat), damit das Paket
 * ueberall laeuft (Browser, Next-Server, Edge, Node). Kratos-Meldungen nutzen in
 * der Praxis einfache `{name}`-Platzhalter, keine ICU-Plural/Select-Syntax. Falls
 * doch noetig, kann ein Consumer `interpolate` durch einen vollen ICU-Formatter
 * ersetzen — die Catalog-Strings sind ICU-kompatibel formuliert.
 */

export type Context = Record<string, unknown>;

/**
 * Bildet aus dem rohen Kratos-`context` die finale Werte-Map. Spiegelt die
 * Konventionen aus Orys `uiTextToFormattedMessage`:
 *  - Array-Werte erhalten zusaetzlich `<key>_list` (kommasepariert).
 *  - `<key>_unix` (Unix-Sekunden) erzeugt zusaetzlich `<key>` als lesbares Datum.
 */
export function buildValues(context: Context = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (Array.isArray(value)) {
      out[key] = value.map(String).join(", ");
      out[`${key}_list`] = value.map(String).join(", ");
    } else if (key.endsWith("_unix") && typeof value === "number") {
      const base = key.slice(0, -"_unix".length);
      out[key] = String(value);
      out[base] = new Date(value * 1000).toLocaleString("de-DE");
    } else if (value === null || value === undefined) {
      out[key] = "";
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

const PLACEHOLDER = /\{([a-zA-Z0-9_]+)\}/g;

/** Ersetzt `{name}`-Platzhalter im Template durch die Werte aus `context`. */
export function interpolate(template: string, context: Context = {}): string {
  const values = buildValues(context);
  return template.replace(PLACEHOLDER, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name]! : match,
  );
}
