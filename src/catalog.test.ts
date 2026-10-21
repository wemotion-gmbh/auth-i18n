import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const readJson = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as T;

const de = readJson<Record<string, string>>("../locales/de.json");
const deSie = readJson<Record<string, string>>("../locales/de-sie.json");
const uiDe = readJson<Record<string, string>>("../locales/ui.de.json");
const uiDeSie = readJson<Record<string, string>>("../locales/ui.de-sie.json");
const kratosIds = readJson<{ kratosVersion: string; ids: Record<string, string> }>("../test/kratos-ids-v26.2.0.json");
const rendererKeys = readJson<{ keys: string[] }>("../test/renderer-ui-keys.json").keys;

/** Base IDs (1010000, 4000000, ...) only mark a range in text/id.go; Kratos never sends them. */
const isBaseId = (id: string) => id.endsWith("0000");

/**
 * IDs whose Kratos text is only `{reason}` (or embeds it). `reason` is free Kratos English,
 * so the Sie catalog has its own text without the placeholder (plan §3.4).
 */
const REASON_IDS = new Set(["4000001", "4000005", "5000001"]);

/** Placeholder names; `{used_at, date, long}` counts as `used_at`. */
const placeholders = (text: string) =>
  [...text.matchAll(/\{([a-zA-Z0-9_]+)(?:\s*,[^}]*)?\}/g)].map((m) => m[1]).sort();

// --- Sie-form checker ------------------------------------------------------------------
// `\b` is ASCII-only in JS even with the `u` flag and does not fire before "ä", so word
// boundaries are Unicode lookarounds.
const word = (alternatives: string) => new RegExp(`(?<!\\p{L})(?:${alternatives})(?!\\p{L})`, "iu");
const DU_PRONOUN = word("du|dich|dir|dein\\p{L}*");
const DU_IMPERATIVE = word(
  [
    "prüf", "gib", "versuch", "wähl", "mach", "stell", "klick", "melde", "richte", "ändere",
    "bestätige", "bewahre", "schließe", "löse", "starte", "aktualisiere", "lege", "wende",
    "nutze", "füge", "sende", "gehe",
    // -e forms of the stems above. "prüfe" only before a word, because "Prüfe…" is a
    // first-person progress label; "versuche" only before "es", because "Versuche" is
    // also the plural noun ("Zu viele Versuche").
    "prüfe(?=\\s)", "wähle", "mache", "stelle", "klicke", "versuche(?=\\s+es)",
  ].join("|"),
);
const MOIN = word("moin");

function duFormHits(catalog: Record<string, string>): string[] {
  return Object.entries(catalog)
    .filter(([, text]) => DU_PRONOUN.test(text) || DU_IMPERATIVE.test(text) || MOIN.test(text))
    .map(([key]) => key);
}

// --- Du-form checker (reverse) ---------------------------------------------------------
// Case-sensitive: lowercase "sie" (she/they) is fine in a Du text, the capitalised polite
// pronoun is not. Measured on de.json and ui.de.json at 0.2.1: no hit, so any hit is a
// Sie text copied into a Du catalog.
const SIE_FORM = /(?<!\p{L})(?:Sie|Ihr\p{L}*|Ihnen)(?!\p{L})/u;

function sieFormHits(catalog: Record<string, string>): string[] {
  return Object.entries(catalog)
    .filter(([, text]) => SIE_FORM.test(text))
    .map(([key]) => key);
}

// --- Umlaut checker --------------------------------------------------------------------
// Typical ae/oe/ue/ss substitutes in German UI text. A word list, because "neue",
// "aktuell" or "Quelle" contain "ue" legitimately.
const UMLAUT_SUBSTITUTES = word(
  [
    "fuer", "ueber\\p{L}*", "\\p{L}*koenn\\p{L}*", "\\p{L}*moecht\\p{L}*", "\\p{L}*muess\\p{L}*",
    "\\p{L}*pruef\\p{L}*", "\\p{L}*bestaetig\\p{L}*", "\\p{L}*aender\\p{L}*", "\\p{L}*loesch\\p{L}*",
    "zurueck\\p{L}*", "\\p{L}*waehl\\p{L}*", "\\p{L}*gueltig\\p{L}*", "\\p{L}*schluessel\\p{L}*",
    "\\p{L}*fueg\\p{L}*", "passwoerter", "naechst\\p{L}*", "spaeter", "\\p{L}*fuell\\p{L}*",
    "\\p{L}*schliess\\p{L}*", "\\p{L}*moeglich\\p{L}*", "hoechst\\p{L}*", "\\p{L}*groess\\p{L}*",
    "\\p{L}*geraet\\p{L}*", "\\p{L}*schuetz\\p{L}*", "\\p{L}*knuepf\\p{L}*", "laeuft", "\\p{L}*oeffn\\p{L}*",
    "\\p{L}*erhoeh\\p{L}*", "\\p{L}*kuerz\\p{L}*", "\\p{L}*abschliess\\p{L}*", "heisst", "\\p{L}*strasse",
  ].join("|"),
);

function umlautHits(catalog: Record<string, string>): string[] {
  return Object.entries(catalog)
    .filter(([, text]) => UMLAUT_SUBSTITUTES.test(text))
    .map(([key]) => key);
}

describe("de-sie message catalog", () => {
  it("has every ID of de.json (parity)", () => {
    const missing = Object.keys(de).filter((id) => !(id in deSie));
    assert.deepEqual(missing, []);
  });

  it(`covers every Kratos ${kratosIds.kratosVersion} message ID (without base IDs)`, () => {
    const ids = Object.keys(kratosIds.ids).filter((id) => !isBaseId(id));
    assert.ok(ids.length >= 148, `id list looks truncated: ${ids.length}`);
    const missing = ids.filter((id) => !(id in deSie));
    assert.deepEqual(missing, []);
    // The three IDs de.json lacks today.
    for (const id of ["1010020", "4060003", "4070004"]) assert.ok(deSie[id], id);
  });

  it("has no empty texts", () => {
    assert.deepEqual(Object.entries(deSie).filter(([, t]) => t.trim() === "").map(([k]) => k), []);
  });

  it("uses the same placeholders as de.json, except the reason IDs", () => {
    const diff = Object.keys(de)
      .filter((id) => !REASON_IDS.has(id))
      .filter((id) => placeholders(de[id]!).join(",") !== placeholders(deSie[id]!).join(","));
    assert.deepEqual(diff, []);
  });

  it("never shows Kratos' English reason", () => {
    for (const id of REASON_IDS) {
      assert.ok(placeholders(de[id]!).includes("reason"), `de.json ${id} should carry {reason}`);
      assert.ok(!placeholders(deSie[id]!).includes("reason"), `de-sie ${id} must not carry {reason}`);
    }
  });

  it("puts the field label into 4000002 without a case problem", () => {
    assert.equal(deSie["4000002"], "Bitte füllen Sie das Feld „{property}“ aus.");
  });
});

describe("Sie-form checker", () => {
  // Baseline measured on de.json at a58b6f2: 59 of 158 IDs are in Du form; the other 99
  // are neutral (labels, "muss ... sein", "wurde bereits verwendet"). The plan's figure of
  // 76 came from a prefix-only match, which also flags "versucht", "senden" or "Melden Sie"
  // and therefore cannot run over a Sie catalog.
  it("self-test: finds the Du form in de.json at least as often as measured (59 of 158)", () => {
    const hits = duFormHits(de);
    assert.ok(hits.length >= 59, `checker too weak: ${hits.length} hits`);
    // Spot checks named in the plan (were missed by a case-sensitive checker).
    for (const id of ["1050001", "4000011", "4000013", "4000014", "4000042", "4000040", "4000041", "4050002"]) {
      assert.ok(hits.includes(id), `checker misses ${id}`);
    }
  });

  it("self-test: Unicode word boundaries work before umlauts", () => {
    assert.ok(DU_IMPERATIVE.test("Bitte wähl eine Methode"));
    assert.ok(DU_IMPERATIVE.test("Prüf dein Passwort"));
    assert.ok(!DU_IMPERATIVE.test("Bitte wählen Sie eine Methode"));
    assert.ok(!DU_PRONOUN.test("direkt durch"));
    assert.ok(DU_PRONOUN.test("Ändere deine Adresse"));
  });

  it("self-test: finds Du imperatives ending in -e, but not the noun or a progress label", () => {
    for (const du of [
      "Bitte versuche es erneut.",
      "Bitte prüfe die Schreibweise.",
      "Wähle eine Methode.",
      "Mache ein Foto.",
      "Stelle sicher, dass alles stimmt.",
      "Klicke auf den Link.",
    ]) {
      assert.ok(DU_IMPERATIVE.test(du), `checker misses: ${du}`);
    }
    for (const neutral of ["Zu viele Versuche. Bitte warten Sie einen Moment.", "Prüfe…", "Bitte versuchen Sie es erneut."]) {
      assert.ok(!DU_IMPERATIVE.test(neutral), `false positive: ${neutral}`);
    }
  });

  it("finds no Du form and no 'Moin' in de-sie.json", () => {
    assert.deepEqual(duFormHits(deSie), []);
  });

  it("finds no Du form and no 'Moin' in ui.de-sie.json", () => {
    assert.deepEqual(duFormHits(uiDeSie), []);
  });
});

describe("Du-form checker", () => {
  it("self-test: finds the Sie form, but not lowercase 'sie' or words starting with 'Sie'", () => {
    for (const sie of ["Bitte melden Sie sich an.", "Ihre Adresse ist bestätigt.", "Wir senden Ihnen einen Code."]) {
      assert.ok(SIE_FORM.test(sie), `checker misses: ${sie}`);
    }
    for (const du of ["Bitte melde dich an.", "Wir haben sie gelöscht.", "Sieben Tage gültig."]) {
      assert.ok(!SIE_FORM.test(du), `false positive: ${du}`);
    }
  });

  it("self-test: finds every Sie text of ui.de-sie.json that addresses the user", () => {
    for (const key of ["forms.error.retry", "login.webauthn.unavailable", "forms.error.network"]) {
      assert.ok(SIE_FORM.test(uiDeSie[key]!), `checker misses ui.de-sie:${key}`);
    }
  });

  it("finds no Sie form in de.json", () => {
    assert.deepEqual(sieFormHits(de), []);
  });

  it("finds no Sie form in ui.de.json", () => {
    assert.deepEqual(sieFormHits(uiDe), []);
  });
});

describe("umlauts", () => {
  it("self-test: detects substitutes but not legitimate 'ue'", () => {
    assert.ok(UMLAUT_SUBSTITUTES.test("Bitte gib eine gueltige Adresse ein"));
    assert.ok(UMLAUT_SUBSTITUTES.test("Zurueck"));
    assert.ok(!UMLAUT_SUBSTITUTES.test("Neue Backup-Codes erzeugen, aktuell"));
  });

  it("de-sie.json, ui.de-sie.json and ui.de.json use real umlauts", () => {
    assert.deepEqual(umlautHits(deSie), []);
    assert.deepEqual(umlautHits(uiDeSie), []);
    assert.deepEqual(umlautHits(uiDe), []);
  });
});

describe("UI catalogs", () => {
  it("ui.de.json and ui.de-sie.json have the same keys", () => {
    assert.deepEqual(Object.keys(uiDeSie).filter((k) => !(k in uiDe)), []);
    assert.deepEqual(Object.keys(uiDe).filter((k) => !(k in uiDeSie)), []);
  });

  it("has every renderer key in ui.de.json and ui.de-sie.json, non-empty", () => {
    // Direction from the renderer's key list, otherwise the test is green for any catalog.
    assert.ok(rendererKeys.length > 0, "renderer key list is empty");
    const missing = rendererKeys.flatMap((key) => [
      ...(typeof uiDe[key] === "string" && uiDe[key] !== "" ? [] : [`ui.de:${key}`]),
      ...(typeof uiDeSie[key] === "string" && uiDeSie[key] !== "" ? [] : [`ui.de-sie:${key}`]),
    ]);
    assert.deepEqual(missing, []);
  });

  it("uses the same placeholders in both forms", () => {
    const diff = Object.keys(uiDe).filter((k) => placeholders(uiDe[k]!).join(",") !== placeholders(uiDeSie[k]!).join(","));
    assert.deepEqual(diff, []);
  });

  it("keeps the plan wording for the network/429 and CSRF retry texts (plan §3.6, §3.7, L11)", () => {
    // One text for network failures and a CORS-less 429: the browser cannot tell them apart.
    assert.equal(
      uiDeSie["forms.error.network"],
      "Verbindungsproblem oder zu viele Versuche – bitte warten Sie einen Moment und versuchen Sie es erneut.",
    );
    assert.equal(uiDe["forms.error.network"], "Verbindungsproblem oder zu viele Versuche – bitte warte einen Moment und versuch es erneut.");
    assert.equal(uiDeSie["forms.error.retry"], "Bitte versuchen Sie es noch einmal.");
    assert.equal(uiDe["forms.error.retry"], "Bitte versuch es noch einmal.");
    assert.equal(uiDeSie["forms.button.retry"], "Erneut versuchen");
    assert.equal(uiDe["forms.button.retry"], "Erneut versuchen");
  });

  it("has a display name for Google, Microsoft and Apple", () => {
    for (const id of ["google", "microsoft", "apple"]) {
      assert.ok(uiDeSie[`oidc.provider.${id}`], id);
      assert.ok(uiDe[`oidc.provider.${id}`], id);
    }
  });
});

describe("settings e-mail change (plan §6.9, S16)", () => {
  // Default hint above the e-mail form plus the confirmation dialog before submit. A
  // portal slot may override the hint; the catalog text is the default.
  const HINT = "settings.profile.email.hint";
  const DIALOG_TEXT = "settings.profile.email.dialog.text";
  const EMAIL_CHANGE_KEYS = [
    HINT,
    "settings.profile.email.dialog.title",
    DIALOG_TEXT,
    "settings.profile.email.dialog.confirm",
    "settings.profile.email.dialog.cancel",
  ];
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };

  it("has every key in ui.de.json and ui.de-sie.json, non-empty, and in the renderer key list", () => {
    const missing = Object.entries(catalogs).flatMap(([name, catalog]) =>
      EMAIL_CHANGE_KEYS.filter((key) => typeof catalog[key] !== "string" || catalog[key]!.trim() === "").map(
        (key) => `${name}:${key}`,
      ),
    );
    assert.deepEqual(missing, []);
    assert.deepEqual(EMAIL_CHANGE_KEYS.filter((key) => !rendererKeys.includes(key)), []);
  });

  it("puts the new address as {email} into the dialog text of both forms, and nowhere else", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.deepEqual(placeholders(catalog[DIALOG_TEXT]!), ["email"], `${name}:${DIALOG_TEXT}`);
      for (const key of EMAIL_CHANGE_KEYS.filter((k) => k !== DIALOG_TEXT)) {
        assert.deepEqual(placeholders(catalog[key]!), [], `${name}:${key}`);
      }
    }
  });

  it("addresses the user in the catalog's form (real translation, not a copy)", () => {
    for (const key of [HINT, DIALOG_TEXT]) {
      assert.ok(SIE_FORM.test(uiDeSie[key]!), `ui.de-sie:${key} should use the Sie form`);
      assert.ok(DU_PRONOUN.test(uiDe[key]!) || DU_IMPERATIVE.test(uiDe[key]!), `ui.de:${key} should use the Du form`);
      assert.notEqual(uiDe[key], uiDeSie[key], key);
    }
  });

  it("says what a change does: code to the new address, old address dead at once, typo locks out", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const hint = catalog[HINT]!;
      for (const part of ["Code an die neue Adresse", "alte Adresse gilt sofort nicht mehr", "Anmeldung", "ohne Passwort", "Tippfehler"]) {
        assert.ok(hint.includes(part), `${name}:${HINT} lacks „${part}“`);
      }
      assert.ok(catalog[DIALOG_TEXT]!.includes("alte Adresse gilt danach sofort nicht mehr"), `${name}:${DIALOG_TEXT}`);
    }
    assert.ok(uiDe[HINT]!.includes("Wiederherstellen deines Kontos"), "ui.de: recovery as in recovery.title");
    assert.ok(uiDeSie[HINT]!.includes("Zurücksetzen des Passworts"), "ui.de-sie: recovery as in recovery.title");
  });
});
