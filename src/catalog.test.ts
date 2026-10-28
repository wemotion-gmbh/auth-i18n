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

  it("says what a change does: all connected services, code to the new address, old address dead at once, typo locks out code-only logins", () => {
    const parts = [
      // S16 and §6.9 "Wirkung auf die drei Mandanten": every tenant takes the new address at once.
      "allen verbundenen Diensten",
      "E-Mails zu Buchungen und Rechnungen",
      "Code an die neue Adresse",
      "alte Adresse gilt sofort nicht mehr",
      "Anmeldung",
      // Only code-by-e-mail logins are locked out; passkey and social logins do not depend on the address.
      "nur mit einem Code per E-Mail",
      "Tippfehler",
    ];
    for (const [name, catalog] of Object.entries(catalogs)) {
      const hint = catalog[HINT]!;
      for (const part of parts) {
        assert.ok(hint.includes(part), `${name}:${HINT} lacks „${part}“`);
      }
      // The locked-out accounts have no password, so the hint must not talk about one.
      assert.ok(!hint.includes("Passwort"), `${name}:${HINT} mentions a password`);
      assert.ok(catalog[DIALOG_TEXT]!.includes("alte Adresse gilt danach sofort nicht mehr"), `${name}:${DIALOG_TEXT}`);
    }
    assert.ok(uiDe[HINT]!.includes("Wiederherstellung deines Kontos"), "ui.de: recovery of the account");
    assert.ok(uiDeSie[HINT]!.includes("Wiederherstellung Ihres Kontos"), "ui.de-sie: recovery of the account");
  });
});

describe("portal login extras and error page (0.2.3, plan §3.3, §3.9)", () => {
  // Keys the portal PRs read directly (not via kratos-flow REQUIRED_UI_KEYS): PR7 login
  // extras and PR8 error page / verification end state.
  const PR7_KEYS = ["login.oidc.incomplete", "logout.done.message", "logout.error.failed"];
  // Kratos v26.2.0 error ids (text/message_error.go:21-24) that reach the error UI as a
  // stored self-service error; kratos-flow looks up `error.page.text.<error.id>`.
  const ERROR_IDS = ["security_csrf_violation", "security_identity_mismatch", "self_service_flow_return_to_forbidden"];
  const ERROR_PAGE_KEYS = ["error.page.text-expired", "error.page.text-network", ...ERROR_IDS.map((id) => `error.page.text.${id}`)];
  const PR8_KEYS = [...ERROR_PAGE_KEYS, "forms.label.back-to-settings"];
  const NEW_KEYS = [...PR7_KEYS, ...PR8_KEYS];
  // Same text in both forms, because they do not address the user.
  const NEUTRAL_KEYS = new Set(["login.oidc.incomplete", "forms.label.back-to-settings"]);
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };

  it("has every new key in ui.de.json and ui.de-sie.json, non-empty, without placeholders", () => {
    const missing = Object.entries(catalogs).flatMap(([name, catalog]) =>
      NEW_KEYS.filter((key) => typeof catalog[key] !== "string" || catalog[key]!.trim() === "").map((key) => `${name}:${key}`),
    );
    assert.deepEqual(missing, []);
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of NEW_KEYS) assert.deepEqual(placeholders(catalog[key]!), [], `${name}:${key}`);
    }
  });

  it("addresses the user in the catalog's form (real translation, not a copy)", () => {
    for (const key of NEW_KEYS.filter((k) => !NEUTRAL_KEYS.has(k))) {
      assert.ok(SIE_FORM.test(uiDeSie[key]!), `ui.de-sie:${key} should use the Sie form`);
      assert.ok(DU_PRONOUN.test(uiDe[key]!) || DU_IMPERATIVE.test(uiDe[key]!), `ui.de:${key} should use the Du form`);
      assert.notEqual(uiDe[key], uiDeSie[key], key);
    }
    for (const key of NEUTRAL_KEYS) assert.equal(uiDe[key], uiDeSie[key], key);
  });

  it("keeps the plan and portal wording (plan §3.9, sso-logout.ts LOGOUT_*_MESSAGE)", () => {
    for (const catalog of Object.values(catalogs)) {
      assert.equal(catalog["login.oidc.incomplete"], "Die Anmeldung mit Google/Microsoft wurde nicht abgeschlossen.");
    }
    assert.equal(uiDeSie["logout.done.message"], "Sie wurden erfolgreich abgemeldet.");
    assert.equal(
      uiDeSie["logout.error.failed"],
      "Die Abmeldung hat nicht geklappt. Sie sind noch angemeldet. Bitte versuchen Sie es noch einmal.",
    );
    assert.equal(uiDe["logout.error.failed"], "Die Abmeldung hat nicht geklappt. Du bist noch angemeldet. Bitte versuch es noch einmal.");
  });

  it("covers rate limiting in the network text (a 429 without CORS headers arrives as a network error)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.match(catalog["error.page.text-network"]!, /zu viele Versuche/, `${name}:error.page.text-network`);
      assert.doesNotMatch(catalog["error.page.text.security_csrf_violation"]!, /wenn sie /, `${name}: "sie" reads like "Sie"`);
    }
  });

  it("names a real Kratos error id in every error.page.text.<id> key, in the form kratos-flow looks up", () => {
    const kratosFlowId = /^[a-z0-9_]{1,64}$/;
    for (const catalog of Object.values(catalogs)) {
      const ids = Object.keys(catalog)
        .filter((key) => key.startsWith("error.page.text."))
        .map((key) => key.slice("error.page.text.".length));
      assert.deepEqual(ids.sort(), [...ERROR_IDS].sort());
      for (const id of ids) assert.ok(kratosFlowId.test(id), id);
    }
  });

  it("keeps the error page plain: no technical words, always ends with signing in again", () => {
    const technical = /\b(?:ID|CSRF|Kratos|HTTP|Token|Flow|return_to|Session|Code \d|\d{3,})\b/i;
    for (const key of ERROR_PAGE_KEYS) {
      assert.ok(!technical.test(uiDeSie[key]!), `ui.de-sie:${key}`);
      assert.ok(!technical.test(uiDe[key]!), `ui.de:${key}`);
      assert.ok(uiDeSie[key]!.endsWith("erneut an."), `ui.de-sie:${key} should end with „… erneut an.“`);
      assert.ok(uiDe[key]!.endsWith("erneut an."), `ui.de:${key} should end with „… erneut an.“`);
    }
    // The generic text the error page falls back to stays as it is.
    assert.equal(uiDeSie["error.page.text"], "Bei der Anmeldung ist ein Fehler aufgetreten. Bitte melden Sie sich erneut an.");
  });
});

describe("matrix D1 texts (0.2.4, L4b, L11, R1)", () => {
  // R1: Kratos sends 4000007 only after the code step; its generic text names phone number
  // and username and offers no way out. The registration shows this key instead, next to
  // the existing link labels below (no duplicates).
  const EXISTING = "registration.error.existing-account";
  const LINK_KEYS = { "registration.login-button": "Anmelden", "forms.label.forgot-password": "Passwort vergessen?" };
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };

  it("names both cases in the passkey cancel text, same in both forms (L4b, decision of 22.10.)", () => {
    // A device without a passkey ends in the same NotAllowedError as a cancel.
    for (const catalog of Object.values(catalogs)) {
      assert.equal(
        catalog["login.passkey.cancelled"],
        "Die Anmeldung mit Passkey wurde abgebrochen oder auf diesem Gerät ist kein Passkey gespeichert.",
      );
    }
  });

  it("reuses the retry button text for a failed submit (L11)", () => {
    for (const catalog of Object.values(catalogs)) assert.equal(catalog["forms.button.retry"], "Erneut versuchen");
    assert.ok(rendererKeys.includes("forms.button.retry"));
  });

  it("has the existing-account text in both forms, non-empty, without placeholders (R1)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.ok(typeof catalog[EXISTING] === "string" && catalog[EXISTING]!.trim() !== "", `${name}:${EXISTING}`);
      assert.deepEqual(placeholders(catalog[EXISTING]!), [], `${name}:${EXISTING}`);
    }
    assert.ok(SIE_FORM.test(uiDeSie[EXISTING]!), `ui.de-sie:${EXISTING} should use the Sie form`);
    assert.ok(DU_PRONOUN.test(uiDe[EXISTING]!) || DU_IMPERATIVE.test(uiDe[EXISTING]!), `ui.de:${EXISTING} should use the Du form`);
    assert.notEqual(uiDe[EXISTING], uiDeSie[EXISTING]);
  });

  it("says the e-mail address has an account and points to both links, without the generic identifier list (R1)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const text = catalog[EXISTING]!;
      assert.ok(text.startsWith("Für diese E-Mail-Adresse gibt es bereits ein Konto."), `${name}:${EXISTING}`);
      assert.match(text, /sich an|dich an/, `${name}:${EXISTING} should point to signing in`);
      assert.match(text, /Passwort zurück/, `${name}:${EXISTING} should point to the password reset`);
      assert.doesNotMatch(text, /Telefon|Benutzername|Kennung/, `${name}:${EXISTING}`);
      for (const [key, label] of Object.entries(LINK_KEYS)) assert.equal(catalog[key], label, `${name}:${key}`);
    }
    // Reused, not duplicated: no second key for the same link labels.
    for (const catalog of Object.values(catalogs)) {
      assert.deepEqual(Object.keys(catalog).filter((key) => key.startsWith("registration.existing-account")), []);
    }
  });

  it("keeps the create-ceremony texts free of sign-in wording, so a registration can reuse them", () => {
    // The L4b text names a device without a stored passkey, which is wrong while a passkey is
    // being created. A registration create ceremony belongs on settings.<method>.<reason>.
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const method of ["passkey", "webauthn"]) {
        for (const reason of ["cancelled", "exists", "failed", "unavailable"]) {
          const key = `settings.${method}.${reason}`;
          assert.ok(typeof catalog[key] === "string" && catalog[key]!.trim() !== "", `${name}:${key}`);
          assert.doesNotMatch(catalog[key]!, /Anmeldung|anmelden|gespeichert|hinterlegt/, `${name}:${key}`);
          assert.ok(rendererKeys.includes(key), key);
        }
      }
      assert.match(catalog["login.passkey.cancelled"]!, /^Die Anmeldung/, `${name}: the L4b text is sign-in only`);
    }
  });
});

describe("passkey and security key texts after the settings tests (PR9a, 23.10.)", () => {
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };
  const UNNAMED = "settings.credential.remove-unnamed";
  const UNDATED = "settings.credential.remove-unnamed-undated";

  it("names the passkey and the security key in 4000015, which Kratos sends for both sign-ins", () => {
    // A passkey sign-in after the passkey was removed showed the security-key-only text.
    for (const [name, catalog] of Object.entries({ de, "de-sie": deSie })) {
      assert.match(catalog["4000015"]!, /Passkey/, `${name}:4000015`);
      assert.match(catalog["4000015"]!, /Sicherheitsschlüssel/, `${name}:4000015`);
    }
    assert.equal(de["4000015"], deSie["4000015"], "4000015 does not address the user");
  });

  it("has the remove texts for a credential without a name in both forms, with their placeholders, required by the renderer", () => {
    // Kratos names such a credential "unnamed" in its remove label (Remove passkey "unnamed").
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.equal(catalog[UNNAMED], "{name} vom {date} entfernen", `${name}:${UNNAMED}`);
      assert.equal(catalog[UNDATED], "{name} entfernen", `${name}:${UNDATED}`);
      assert.deepEqual(placeholders(catalog[UNNAMED]!), ["date", "name"]);
      assert.deepEqual(placeholders(catalog[UNDATED]!), ["name"]);
    }
    assert.ok(rendererKeys.includes(UNNAMED) && rendererKeys.includes(UNDATED));
  });
});

describe("settings overview: groups, rows, status and buttons (kratos-flow 0.4.0)", () => {
  // The settings page shows one row per area with its status and one button; the form opens
  // below the row. Group titles, row status and button texts do not address the user, so both
  // forms say the same; the e-mail hint does and is a real translation.
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };
  const NEUTRAL: Record<string, string> = {
    "settings.group.profile": "Persönliche Angaben",
    "settings.group.sign-in": "Anmeldung",
    "settings.group.protection": "Zusätzlicher Schutz",
    "settings.passkeys.title": "Passkeys und Sicherheitsschlüssel",
    "settings.totp.app-title": "Authenticator-App",
    "settings.summary.not-set": "Nicht angegeben",
    "settings.summary.passkey.none": "Kein Passkey",
    "settings.summary.passkey.one": "1 Passkey",
    "settings.summary.passkey.other": "{count} Passkeys",
    "settings.summary.webauthn.none": "Kein Sicherheitsschlüssel",
    "settings.summary.webauthn.one": "1 Sicherheitsschlüssel",
    "settings.summary.webauthn.other": "{count} Sicherheitsschlüssel",
    "settings.summary.totp.on": "An",
    "settings.summary.totp.off": "Aus",
    "settings.summary.lookup_secret.on": "Eingerichtet",
    "settings.summary.lookup_secret.off": "Keine erzeugt",
    "settings.summary.lookup_secret.pending": "Nicht bestätigt",
    "settings.summary.oidc.linked": "{provider}: verknüpft",
    "settings.summary.oidc.not-linked": "{provider}: nicht verknüpft",
    "settings.action.change": "Ändern",
    "settings.action.manage": "Verwalten",
    "settings.action.set-up": "Einrichten",
    "settings.action.create": "Erzeugen",
    "settings.action.close": "Schließen",
    "settings.profile.email.hint-details": "Was passiert dabei?",
  };
  const ADDRESSED = ["settings.passkeys.description", "settings.profile.email.hint-short", "settings.profile.email.hint-more"];
  const NEW_KEYS = [...Object.keys(NEUTRAL), ...ADDRESSED];

  it("has every new key in both forms, non-empty, and in the renderer key list", () => {
    const missing = Object.entries(catalogs).flatMap(([name, catalog]) =>
      NEW_KEYS.filter((key) => typeof catalog[key] !== "string" || catalog[key]!.trim() === "").map((key) => `${name}:${key}`),
    );
    assert.deepEqual(missing, []);
    assert.deepEqual(NEW_KEYS.filter((key) => !rendererKeys.includes(key)), []);
  });

  it("keeps the approved wording of group titles, status and buttons, the same in both forms", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of Object.entries(NEUTRAL)) assert.equal(catalog[key], text, `${name}:${key}`);
    }
  });

  it("uses only {count} and {provider} as placeholders, none in the other new keys", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of NEW_KEYS) {
        const expected = key.endsWith(".other") ? ["count"] : key.startsWith("settings.summary.oidc.") ? ["provider"] : [];
        assert.deepEqual(placeholders(catalog[key]!), expected, `${name}:${key}`);
      }
    }
  });

  it("addresses the user in the catalog's form in the passkey description and the e-mail hint", () => {
    for (const key of ADDRESSED) {
      assert.ok(SIE_FORM.test(uiDeSie[key]!), `ui.de-sie:${key} should use the Sie form`);
      assert.ok(DU_PRONOUN.test(uiDe[key]!) || DU_IMPERATIVE.test(uiDe[key]!), `ui.de:${key} should use the Du form`);
      assert.notEqual(uiDe[key], uiDeSie[key], key);
    }
  });

  it("says the e-mail essentials in one sentence and keeps every point of the long hint behind the disclosure (S16)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const short = catalog["settings.profile.email.hint-short"]!;
      const more = catalog["settings.profile.email.hint-more"]!;
      // One sentence: the new address counts at once, the old one stops at once, check it.
      assert.equal(short.match(/[.!?](?=\s|$)/g)?.length, 1, `${name}: one sentence`);
      assert.match(short, /neue Adresse gilt sofort/, name);
      assert.match(short, /alte/, name);
      assert.match(short, /genau/, name);
      // The rest: all connected services, booking and invoice e-mails, a code to the new address,
      // login and recovery with the old address end, a typo locks out code-only sign-ins.
      for (const part of [/allen verbundenen Diensten/, /Buchungen und Rechnungen/, /Code an die neue Adresse/, /Anmeldung/, /Wiederherstellung/, /Tippfehler/]) {
        assert.match(more, part, `${name}: ${part}`);
      }
      assert.doesNotMatch(`${short} ${more}`, /Passwort/, name);
    }
  });
});

describe("settings overview: row titles and status texts", () => {
  // A row reads „<button> <title>“ (e.g. „Ändern Passwort“) and its status is a state, not
  // an action: titles are nouns, the same in both forms, and every status starts with a
  // capital letter. Kratos does not tell whether a password is set, so the password row has
  // no status at all.
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };
  const TITLES: Record<string, string> = {
    "settings.profile.title": "Name und E-Mail-Adresse",
    "settings.profile.name.title": "Name",
    "settings.profile.email.title": "E-Mail-Adresse",
    "settings.password.title": "Passwort",
    "settings.passkeys.title": "Passkeys und Sicherheitsschlüssel",
    "settings.passkey.title": "Passkeys",
    "settings.webauthn.title": "Sicherheitsschlüssel",
    "settings.oidc.title": "Verknüpfte Konten",
    "settings.totp.app-title": "Authenticator-App",
    "settings.lookup_secret.title": "Backup-Codes",
  };
  const ACTIONS = ["settings.action.change", "settings.action.manage", "settings.action.set-up", "settings.action.create", "settings.action.close"];

  it("uses the same noun titles in both forms", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of Object.entries(TITLES)) assert.equal(catalog[key], text, `${name}:${key}`);
    }
  });

  it("has no row title that repeats a button verb", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const verbs = ACTIONS.map((key) => catalog[key]!.toLowerCase());
      for (const key of Object.keys(TITLES)) {
        const words = catalog[key]!.toLowerCase().split(/\s+/);
        assert.deepEqual(words.filter((w) => verbs.includes(w)), [], `${name}:${key}`);
      }
    }
  });

  it("starts every status with a capital letter, a digit or a placeholder", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const statuses = Object.keys(catalog).filter((key) => key.startsWith("settings.summary."));
      assert.equal(statuses.length, 14, name);
      for (const key of statuses) assert.match(catalog[key]!, /^(?:\p{Lu}|\d|\{)/u, `${name}:${key}`);
    }
  });

  it("has no password status: neither in the catalogs nor in the renderer key list", () => {
    for (const [name, catalog] of Object.entries(catalogs)) assert.equal(catalog["settings.summary.password"], undefined, name);
    assert.ok(!rendererKeys.includes("settings.summary.password"));
  });
});

describe("settings overview: texts inside the rows and the page heading", () => {
  // An open row shows its description and the hints of its forms; the Du form says the same
  // as the Sie form there, with the terms of the row titles (Backup-Codes, Sicherheitsschlüssel,
  // verknüpft) and without the old ones.
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };
  const PANEL_KEYS = [
    "settings.passkeys.description",
    "settings.passkey.description",
    "settings.passkey.info",
    "settings.webauthn.description",
    "settings.webauthn.info",
    "settings.oidc.description",
    "settings.oidc.info",
    "settings.totp.description",
    "settings.lookup_secret.description",
  ];
  const OLD_TERMS = /Hardware-Token|Wiederherstellungscode|Verbunden|Verbinde|Social-Login|TOTP|2FA/;
  const DU: Record<string, string> = {
    "settings.title": "Anmeldung und Sicherheit",
    "settings.subtitle": "Verwalte, wie du dich anmeldest und dein Konto schützt.",
    "settings.passkey.description": "Melde dich mit Fingerabdruck, Gesichtserkennung oder der Geräte-PIN an, ganz ohne Passwort.",
    "settings.passkey.info": "Ein Passkey ist an dein Gerät gebunden. Du kannst mehrere Passkeys anlegen und einzeln entfernen.",
    "settings.webauthn.description": "Melde dich mit einem Sicherheitsschlüssel (z. B. einem USB-Schlüssel) an.",
    "settings.webauthn.info": "Ein Sicherheitsschlüssel ersetzt das Passwort, nicht den zweiten Faktor.",
    "settings.oidc.description": "Verknüpfe dein Konto mit einem externen Anbieter.",
    "settings.oidc.info": "Mit verknüpften Konten dieser Anbieter kannst du dich bei deinem Konto anmelden.",
    "settings.totp.description": "Schütze dein Konto zusätzlich mit einer Authenticator-App (z. B. Google Authenticator oder Microsoft Authenticator).",
    "settings.lookup_secret.description":
      "Backup-Codes sind eine sichere Reserve für die Zwei-Faktor-Authentifizierung. Damit kommst du wieder in dein Konto, wenn du dein Gerät für den zweiten Faktor verlierst.",
    "settings.messages.toast-title.success": "Einstellungen gespeichert",
  };

  it("uses none of the old terms in a row's description or hints", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of PANEL_KEYS) assert.doesNotMatch(catalog[key] ?? "", OLD_TERMS, `${name}:${key}`);
    }
  });

  it("pins the Du texts that match the Sie form", () => {
    for (const [key, text] of Object.entries(DU)) assert.equal(uiDe[key], text, key);
  });

  it("writes each description and hint as a sentence, and a hint does not repeat its description", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of PANEL_KEYS) assert.match(catalog[key] ?? "", /\.$/, `${name}:${key}`);
      assert.notEqual(catalog["settings.passkey.info"], catalog["settings.passkey.description"], name);
      assert.notEqual(catalog["settings.webauthn.info"], catalog["settings.webauthn.description"], name);
    }
  });

  it("names the page and the saved state the same in both forms", () => {
    for (const key of ["settings.title", "settings.messages.toast-title.success"]) assert.equal(uiDe[key], uiDeSie[key], key);
  });
});
