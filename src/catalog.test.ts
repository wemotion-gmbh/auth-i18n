import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { interpolate } from "./interpolate";

const readJson = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as T;

const de = readJson<Record<string, string>>("../locales/de.json");
const deSie = readJson<Record<string, string>>("../locales/de-sie.json");
const uiDe = readJson<Record<string, string>>("../locales/ui.de.json");
const uiDeSie = readJson<Record<string, string>>("../locales/ui.de-sie.json");
const kratosIds = readJson<{ kratosVersion: string; ids: Record<string, string> }>("../test/kratos-ids-v26.2.0.json");
const rendererKeys = readJson<{ keys: string[] }>("../test/renderer-ui-keys.json").keys;

/**
 * The purpose-code texts (0.3.0): the confirmation after a sign-up with an unconfirmed
 * address, the link page, the link way of the account step, the support hints and the
 * address change dialog. `neutral` texts address no one and are the same in both forms;
 * `sie` and `du` are pinned word for word.
 */
const PURPOSE_CODE_SPEC: { neutral: Record<string, string>; sie: Record<string, string>; du: Record<string, string> } = {
  neutral: {
    "confirm.method.password": "einem Passwort",
    "confirm.method.passkey": "einem Passkey",
    "confirm.method.webauthn": "einem Sicherheitsschlüssel",
    "confirm.method.unknown": "einer anderen Anmeldeart",
    "confirm.code.label": "Code von der Bestätigungsseite",
    "confirm.code.submit": "Bestätigen",
    "confirm.resend": "Neuen Link senden",
    "confirm.send-here": "Link für dieses Gerät senden",
    "confirm.use-code-login": "Stattdessen mit Code per E-Mail anmelden",
    "confirm.other-method": "Andere Anmeldeart wählen",
    "confirm.link.action.signup": "E-Mail-Adresse bestätigen",
    "confirm.link.action.email-change": "Adressänderung mit Code bestätigen",
    "confirm.link.action.email-change-old": "Adressänderung mit Code bestätigen",
    "confirm.link.action.account-link": "Konto verbinden",
    "confirm.link.reveal": "Code anzeigen",
    "confirm.link.copy": "Code kopieren",
    "confirm.link.copied": "Code kopiert",
    "confirm.link.invalid": "Dieser Link ist abgelaufen oder wurde durch einen neueren ersetzt.",
    "confirm.continue": "Weiter zu {portal}",
    "sso.account.link.code.send": "Link senden",
    "sso.account.link.use-password": "Stattdessen mit Passwort verbinden",
    "sso.account.link.use-code": "Stattdessen per Link verbinden",
    "sso.account.support.default": "den Support",
    "sso.account.verify.code-button": "Mit Code per E-Mail anmelden",
    "email-change.title": "E-Mail-Adresse ändern",
    "email-change.open": "E-Mail-Adresse ändern",
    "email-change.send": "Code senden",
    "email-change.code.label": "Code aus der E-Mail",
    "email-change.code.submit": "Bestätigen",
    "email-change.resend": "Neuen Code senden",
    "email-change.cancel": "Änderung abbrechen",
    "email-change.in-use": "Diese Adresse gehört schon zu einem anderen Konto.",
    "email-change.taken": "Diese Adresse ist inzwischen vergeben.",
  },
  sie: {
    "confirm.signup.title": "Bitte bestätigen Sie Ihre E-Mail-Adresse",
    "confirm.signup.signed-in-now": "Sie haben sich gerade in diesem Browser mit {method} angemeldet.",
    "confirm.signup.signed-in.one": "Sie haben sich vor einer Minute in diesem Browser mit {method} angemeldet.",
    "confirm.signup.signed-in.other": "Sie haben sich vor {minutes} Minuten in diesem Browser mit {method} angemeldet.",
    "confirm.sent": "Wir haben Ihnen einen Link an {email} geschickt. Er gilt bis {time} Uhr. Öffnen Sie ihn in diesem Browser, dann geht es hier von selbst weiter.",
    "confirm.sent-untimed": "Wir haben Ihnen einen Link an {email} geschickt. Öffnen Sie ihn in diesem Browser, dann geht es hier von selbst weiter.",
    "confirm.waiting": "Wir warten auf Ihre Bestätigung…",
    "confirm.pending": "Ihre Bestätigung ist angekommen. Wir schließen Ihre Anmeldung gerade ab, das kann einen Moment dauern.",
    "confirm.code.hint": "Hat sich der Link in einer anderen App oder auf einem anderen Gerät geöffnet? Dann zeigt er Ihnen einen Code. Geben Sie ihn hier ein.",
    "confirm.resent": "Wir haben Ihnen einen neuen Link geschickt. Der vorige gilt nicht mehr.",
    "confirm.open-elsewhere": "Wir haben den Link schon an {email} geschickt. Öffnen Sie ihn auf dem Gerät, auf dem Sie ihn angefordert haben, oder lassen Sie sich einen Link für dieses Gerät senden.",
    "confirm.resend-wait.one": "Einen neuen Link können Sie in einer Minute anfordern.",
    "confirm.resend-wait.other": "Einen neuen Link können Sie in {minutes} Minuten anfordern.",
    "confirm.too-many": "Sie haben schon mehrere Links angefordert. Bitte sehen Sie in Ihrem Postfach nach, auch im Spam-Ordner.",
    "confirm.refused-limit": "Für diese Adresse können wir gerade keinen Link senden. Melden Sie sich stattdessen mit einem Code per E-Mail an.",
    "confirm.expired": "Die Anmeldung wurde nicht rechtzeitig bestätigt und ist entfernt. Bitte melden Sie sich noch einmal an.",
    "confirm.expired-registration": "Ihre Registrierung wurde nicht rechtzeitig bestätigt und ist entfernt. Bitte registrieren Sie sich noch einmal.",
    "confirm.cleaned": "Eine nicht bestätigte Anmeldung mit {method} haben wir entfernt. Bitte melden Sie sich noch einmal an. Waren Sie das selbst, richten Sie diese Anmeldeart danach wieder ein.",
    "confirm.busy": "Wir räumen Ihr Konto gerade auf. Bitte versuchen Sie es in einer Minute noch einmal.",
    "confirm.locked": "Zu viele falsche Eingaben. Fordern Sie bitte einen neuen Link an.",
    "confirm.link-expired": "Der Link ist abgelaufen oder wurde durch einen neueren ersetzt. Fordern Sie bitte einen neuen an.",
    "confirm.mail-failed": "Wir konnten die E-Mail gerade nicht senden. Bitte versuchen Sie es in ein paar Minuten noch einmal.",
    "confirm.link.bound": "Bitte bestätigen Sie mit einem Klick.",
    "confirm.link.other-login": "Melden Sie sich mit dem Konto an, für das Sie das angefordert haben.",
    "confirm.link.unbound": "Geben Sie diesen Code in dem Browser ein, in dem Sie das angefordert haben. Waren Sie das nicht, ignorieren Sie diese Mail und geben Sie den Code an niemanden weiter.",
    "confirm.link.unbound-app": "Geben Sie diesen Code in der App ein, in der Sie das angefordert haben. Waren Sie das nicht, ignorieren Sie diese Mail und geben Sie den Code an niemanden weiter.",
    "confirm.link.code-label": "Ihr Code",
    "confirm.link.reveal-limit": "Dieser Code wurde schon zu oft angezeigt. Fordern Sie im angemeldeten Browser einen neuen Link an.",
    "confirm.link.incomplete": "Dieser Link ist unvollständig. Fordern Sie im angemeldeten Browser einen neuen an.",
    "confirm.link.expired-signup": "Die Anmeldung wurde nicht rechtzeitig bestätigt und ist entfernt. Melden Sie sich bei {portal} noch einmal an.",
    "confirm.done": "Bestätigt. Sie können zum ursprünglichen Fenster zurückkehren, es geht dort von selbst weiter.",
    "confirm.done-app": "Bestätigt. Gehen Sie zurück in die App.",
    "settings.frozen": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.",
    "login.code.too-many": "Der Code wurde zu oft falsch eingegeben. Bitte fordern Sie einen neuen Code an.",
    "login.passkey-unknown": "Diesen Passkey kennen wir nicht mehr. Bitte melden Sie sich mit einem Code per E-Mail an.",
    "session.relinked": "Ihr Konto wurde verbunden. Bitte melden Sie sich noch einmal an.",
    "sso.account.link.code.text": "Für {email} gibt es bereits ein Konto, zum Beispiel aus der canou-App oder der bisherigen Plattform. Wir schicken Ihnen einen Link an diese Adresse. Damit bestätigen Sie einmalig, dass das Konto Ihnen gehört. Danach ist es mit Ihrer Anmeldung verbunden.",
    "sso.account.link.note": "Zu Ihrer Sicherheit melden wir Sie dabei auf Ihren anderen Geräten ab.",
    "sso.account.link.pending": "Ihre Bestätigung ist angekommen. Wir verbinden Ihr Konto gerade, das kann einen Moment dauern.",
    "sso.account.link.support": "Dieses Konto können wir nicht automatisch verbinden. Bitte wenden Sie sich an {support}.",
    "sso.account.verify.code-text": "Bitte melden Sie sich einmal mit einem Code per E-Mail an. Damit bestätigen Sie, dass die Adresse Ihnen gehört.",
    "email-change.intro": "Ihre bisherige Adresse bleibt gültig, bis Sie die neue bestätigt haben.",
    "email-change.elsewhere": "Ihre Anmelde-Adresse ändern Sie in Ihrem canou-Konto. Die bisherige Adresse bleibt gültig, bis Sie die neue bestätigt haben.",
    "email-change.old.text": "Zuerst bestätigen Sie, dass Sie Ihre bisherige Adresse {email} noch nutzen. Wir schicken Ihnen dorthin einen Code.",
    "email-change.old.sent": "Wir haben Ihnen einen Code an Ihre bisherige Adresse {email} geschickt. Er gilt bis {time} Uhr. Geben Sie ihn hier ein. Der Code funktioniert nur in dieser Sitzung, also in dem Browserfenster, in dem Sie die Änderung begonnen haben.",
    "email-change.new.sent": "Wir haben Ihnen einen Code an die neue Adresse {email} geschickt. Er gilt bis {time} Uhr. Geben Sie ihn hier ein. Der Code funktioniert nur in dieser Sitzung, also in dem Browserfenster, in dem Sie die Änderung begonnen haben.",
    "email-change.pending": "Sie haben die Änderung auf {email} angefordert.",
    "email-change.cancelled": "Die Änderung ist abgebrochen. Ihre Anmelde-Adresse bleibt {email}.",
    "email-change.no-access": "Kein Zugriff mehr auf Ihre bisherige Adresse? Wenden Sie sich an {support}.",
    "email-change.same": "Das ist schon Ihre Anmelde-Adresse.",
    "email-change.done": "Ihre Anmelde-Adresse ist jetzt {email}.",
    "email-change.blocked": "Ihre Anmelde-Adresse lässt sich hier gerade nicht ändern. Bitte wenden Sie sich an {support}.",
    "email-change.code.hint": "Der Code funktioniert nur in dieser Sitzung, also in dem Browserfenster, in dem Sie die Änderung begonnen haben.",
    "email-change.resent": "Wir haben Ihnen einen neuen Code geschickt. Der vorige gilt nicht mehr.",
    "confirm.link.code-only": "Eine Adressänderung bestätigen Sie mit dem Code aus der E-Mail, in der Sitzung, in der Sie sie begonnen haben.",
  },
  du: {
    "confirm.signup.title": "Bitte bestätige deine E-Mail-Adresse",
    "confirm.signup.signed-in-now": "Du hast dich gerade in diesem Browser mit {method} angemeldet.",
    "confirm.signup.signed-in.one": "Du hast dich vor einer Minute in diesem Browser mit {method} angemeldet.",
    "confirm.signup.signed-in.other": "Du hast dich vor {minutes} Minuten in diesem Browser mit {method} angemeldet.",
    "confirm.sent": "Wir haben dir einen Link an {email} geschickt. Er gilt bis {time} Uhr. Öffne ihn in diesem Browser, dann geht es hier von selbst weiter.",
    "confirm.sent-untimed": "Wir haben dir einen Link an {email} geschickt. Öffne ihn in diesem Browser, dann geht es hier von selbst weiter.",
    "confirm.waiting": "Wir warten auf deine Bestätigung…",
    "confirm.pending": "Deine Bestätigung ist angekommen. Wir schließen deine Anmeldung gerade ab, das kann einen Moment dauern.",
    "confirm.code.hint": "Hat sich der Link in einer anderen App oder auf einem anderen Gerät geöffnet? Dann zeigt er dir einen Code. Gib ihn hier ein.",
    "confirm.resent": "Wir haben dir einen neuen Link geschickt. Der vorige gilt nicht mehr.",
    "confirm.open-elsewhere": "Wir haben den Link schon an {email} geschickt. Öffne ihn auf dem Gerät, auf dem du ihn angefordert hast, oder lass dir einen Link für dieses Gerät senden.",
    "confirm.resend-wait.one": "Einen neuen Link kannst du in einer Minute anfordern.",
    "confirm.resend-wait.other": "Einen neuen Link kannst du in {minutes} Minuten anfordern.",
    "confirm.too-many": "Du hast schon mehrere Links angefordert. Bitte sieh in deinem Postfach nach, auch im Spam-Ordner.",
    "confirm.refused-limit": "Für diese Adresse können wir gerade keinen Link senden. Melde dich stattdessen mit einem Code per E-Mail an.",
    "confirm.expired": "Die Anmeldung wurde nicht rechtzeitig bestätigt und ist entfernt. Bitte melde dich noch einmal an.",
    "confirm.expired-registration": "Deine Registrierung wurde nicht rechtzeitig bestätigt und ist entfernt. Bitte registriere dich noch einmal.",
    "confirm.cleaned": "Eine nicht bestätigte Anmeldung mit {method} haben wir entfernt. Bitte melde dich noch einmal an. Warst du das selbst, richte diese Anmeldeart danach wieder ein.",
    "confirm.busy": "Wir räumen dein Konto gerade auf. Bitte versuch es in einer Minute noch einmal.",
    "confirm.locked": "Zu viele falsche Eingaben. Fordere bitte einen neuen Link an.",
    "confirm.link-expired": "Der Link ist abgelaufen oder wurde durch einen neueren ersetzt. Fordere bitte einen neuen an.",
    "confirm.mail-failed": "Wir konnten die E-Mail gerade nicht senden. Bitte versuch es in ein paar Minuten noch einmal.",
    "confirm.link.bound": "Bitte bestätige mit einem Klick.",
    "confirm.link.other-login": "Melde dich mit dem Konto an, für das du das angefordert hast.",
    "confirm.link.unbound": "Gib diesen Code in dem Browser ein, in dem du das angefordert hast. Warst du das nicht, ignoriere diese Mail und gib den Code an niemanden weiter.",
    "confirm.link.unbound-app": "Gib diesen Code in der App ein, in der du das angefordert hast. Warst du das nicht, ignoriere diese Mail und gib den Code an niemanden weiter.",
    "confirm.link.code-label": "Dein Code",
    "confirm.link.reveal-limit": "Dieser Code wurde schon zu oft angezeigt. Fordere im angemeldeten Browser einen neuen Link an.",
    "confirm.link.incomplete": "Dieser Link ist unvollständig. Fordere im angemeldeten Browser einen neuen an.",
    "confirm.link.expired-signup": "Die Anmeldung wurde nicht rechtzeitig bestätigt und ist entfernt. Melde dich bei {portal} noch einmal an.",
    "confirm.done": "Bestätigt. Du kannst zum ursprünglichen Fenster zurückkehren, es geht dort von selbst weiter.",
    "confirm.done-app": "Bestätigt. Geh zurück in die App.",
    "settings.frozen": "Bitte bestätige zuerst deine E-Mail-Adresse.",
    "login.code.too-many": "Der Code wurde zu oft falsch eingegeben. Bitte fordere einen neuen Code an.",
    "login.passkey-unknown": "Diesen Passkey kennen wir nicht mehr. Bitte melde dich mit einem Code per E-Mail an.",
    "session.relinked": "Dein Konto wurde verbunden. Bitte melde dich noch einmal an.",
    "sso.account.link.code.text": "Für {email} gibt es bereits ein Konto, zum Beispiel aus der canou-App oder der bisherigen Plattform. Wir schicken dir einen Link an diese Adresse. Damit bestätigst du einmalig, dass das Konto dir gehört. Danach ist es mit deiner Anmeldung verbunden.",
    "sso.account.link.note": "Zu deiner Sicherheit melden wir dich dabei auf deinen anderen Geräten ab.",
    "sso.account.link.pending": "Deine Bestätigung ist angekommen. Wir verbinden dein Konto gerade, das kann einen Moment dauern.",
    "sso.account.link.support": "Dieses Konto können wir nicht automatisch verbinden. Bitte wende dich an {support}.",
    "sso.account.verify.code-text": "Bitte melde dich einmal mit einem Code per E-Mail an. Damit bestätigst du, dass die Adresse dir gehört.",
    "email-change.intro": "Deine bisherige Adresse bleibt gültig, bis du die neue bestätigt hast.",
    "email-change.elsewhere": "Deine Anmelde-Adresse änderst du in deinem canou-Konto. Die bisherige Adresse bleibt gültig, bis du die neue bestätigt hast.",
    "email-change.old.text": "Zuerst bestätigst du, dass du deine bisherige Adresse {email} noch nutzt. Wir schicken dir dorthin einen Code.",
    "email-change.old.sent": "Wir haben dir einen Code an deine bisherige Adresse {email} geschickt. Er gilt bis {time} Uhr. Gib ihn hier ein. Der Code funktioniert nur in dieser Sitzung, also in dem Browserfenster, in dem du die Änderung begonnen hast.",
    "email-change.new.sent": "Wir haben dir einen Code an die neue Adresse {email} geschickt. Er gilt bis {time} Uhr. Gib ihn hier ein. Der Code funktioniert nur in dieser Sitzung, also in dem Browserfenster, in dem du die Änderung begonnen hast.",
    "email-change.pending": "Du hast die Änderung auf {email} angefordert.",
    "email-change.cancelled": "Die Änderung ist abgebrochen. Deine Anmelde-Adresse bleibt {email}.",
    "email-change.no-access": "Kein Zugriff mehr auf deine bisherige Adresse? Wende dich an {support}.",
    "email-change.same": "Das ist schon deine Anmelde-Adresse.",
    "email-change.done": "Deine Anmelde-Adresse ist jetzt {email}.",
    "email-change.blocked": "Deine Anmelde-Adresse lässt sich hier gerade nicht ändern. Bitte wende dich an {support}.",
    "email-change.code.hint": "Der Code funktioniert nur in dieser Sitzung, also in dem Browserfenster, in dem du die Änderung begonnen hast.",
    "email-change.resent": "Wir haben dir einen neuen Code geschickt. Der vorige gilt nicht mehr.",
    "confirm.link.code-only": "Eine Adressänderung bestätigst du mit dem Code aus der E-Mail, in der Sitzung, in der du sie begonnen hast.",
  },
};

/** Base IDs (1010000, 4000000, ...) only mark a range in text/id.go; Kratos never sends them. */
const isBaseId = (id: string) => id.endsWith("0000");

/**
 * IDs whose Kratos text is only `{reason}` (or embeds it). `reason` is free Kratos English,
 * so the Sie catalog has its own text without the placeholder (plan §3.4), and since 0.9.3
 * the Du catalog too (auth-i18n#31).
 */
const REASON_IDS = new Set(["4000001", "4000005", "5000001"]);

/**
 * Validation messages whose Du text was literal Kratos (">=", "war aber", "const
 * fehlgeschlagen", lowercase fragments) or the English `{reason}` until 0.9.2. Since 0.9.3
 * (auth-i18n#31) they say the same as the Sie text, in Du form where the Sie text
 * addresses the reader and word for word where it does not.
 */
const VALIDATION_IDS = [
  "4000001", "4000002", "4000003", "4000004", "4000005", "4000007", "4000017", "4000018", "4000019",
  "4000020", "4000021", "4000022", "4000023", "4000024", "4000025", "4000026", "4000027",
  "4000028", "4000029", "4000030", "4000032", "4000033", "4000036", "4000040", "4000041",
  "5000001",
];

/** Literal Kratos notation that has no place in a German message text. */
const TECHNICAL_NOTATION = /[<>]=?|war aber|const\b|\bFlow\b|Social-/u;

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
    // "versuch" not after an article: "Noch ein Versuch." is the noun (SSO attempts text);
    // "klick" not after "einem": "mit einem Klick" is the noun (link page).
    "prüf", "gib", "(?<!(?:ein|einen)\\s)versuch", "wähl", "mach", "stell", "(?<!einem\\s)klick", "melde", "richte", "ändere",
    "bestätige", "bewahre", "schließe", "löse", "starte", "aktualisiere", "lege", "wende",
    "nutze", "füge", "sende", "gehe",
    // Imperatives of the purpose-code texts (0.3.0).
    "öffne", "fordere", "lass", "sieh", "geh", "registriere", "ignoriere",
    // 0.9.3: 4000002 in Du („Bitte füll das Feld … aus.“).
    "füll", "fülle",
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

  it("uses the same placeholders as de.json, the reason IDs included (0.9.3)", () => {
    const diff = Object.keys(de).filter((id) => placeholders(de[id]!).join(",") !== placeholders(deSie[id]!).join(","));
    assert.deepEqual(diff, []);
  });

  it("never shows Kratos' English reason, in de-sie and (0.9.3) in de", () => {
    for (const id of REASON_IDS) {
      // The list really names the reason IDs of the pinned Kratos version.
      assert.match(kratosIds.ids[id]!, /Generic$/, `${id} is no generic Kratos message`);
      assert.ok(!placeholders(deSie[id]!).includes("reason"), `de-sie ${id} must not carry {reason}`);
      assert.ok(!placeholders(de[id]!).includes("reason"), `de ${id} must not carry {reason}`);
    }
    // No other ID passes the reason through either.
    for (const [name, catalog] of [["de", de], ["de-sie", deSie]] as const) {
      assert.deepEqual(Object.keys(catalog).filter((id) => placeholders(catalog[id]!).includes("reason")), [], name);
    }
  });

  it("puts the field label into 4000002 without a case problem", () => {
    assert.equal(deSie["4000002"], "Bitte füllen Sie das Feld „{property}“ aus.");
  });
});

describe("validation messages in Du and Sie (0.9.3, auth-i18n#31)", () => {
  const VALIDATION_RANGE = (id: string) => id.startsWith("4000") || REASON_IDS.has(id);

  it("checks the Du catalog for the same IDs as the Sie catalog", () => {
    for (const id of VALIDATION_IDS) {
      assert.ok(de[id] && deSie[id], id);
      assert.equal(placeholders(de[id]!).join(","), placeholders(deSie[id]!).join(","), id);
      if (SIE_FORM.test(deSie[id]!)) {
        // The Sie text addresses the reader: the Du text says the same in Du form.
        assert.ok(!SIE_FORM.test(de[id]!), `de ${id} uses the Sie form`);
        assert.ok(DU_PRONOUN.test(de[id]!) || DU_IMPERATIVE.test(de[id]!), `de ${id} is not in Du form: ${de[id]}`);
      } else {
        // The Sie text addresses no one: both forms are the same sentence.
        assert.equal(de[id], deSie[id], id);
      }
    }
  });

  it("has no literal Kratos notation in any validation message, Du or Sie", () => {
    for (const [name, catalog] of [["de", de], ["de-sie", deSie]] as const) {
      const hits = Object.keys(catalog).filter(VALIDATION_RANGE).filter((id) => TECHNICAL_NOTATION.test(catalog[id]!));
      assert.deepEqual(hits, [], name);
    }
    // Self-test against the 0.9.2 texts.
    for (const old of ["Die Länge muss <= {max_length} sein, war aber {actual_length}.", "const fehlgeschlagen", "muss >= {minimum} sein, war aber {actual}."]) {
      assert.ok(TECHNICAL_NOTATION.test(old), old);
    }
  });

  it("writes every validation message as a sentence, Du or Sie", () => {
    for (const [name, catalog] of [["de", de], ["de-sie", deSie]] as const) {
      const fragments = Object.keys(catalog)
        .filter(VALIDATION_RANGE)
        .filter((id) => !/^(?:\p{Lu}|\{)/u.test(catalog[id]!) || !/[.?!]$/u.test(catalog[id]!));
      assert.deepEqual(fragments, [], name);
    }
  });

  it("pins the Du texts of the issue (4000001, 4000003, 4000017, 4000005, 5000001)", () => {
    assert.equal(de["4000001"], "Die Eingabe ist ungültig. Bitte prüf deine Angaben und versuch es erneut.");
    assert.equal(de["4000003"], "Bitte gib mindestens {min_length} Zeichen ein (bisher {actual_length}).");
    assert.equal(de["4000017"], "Bitte gib höchstens {max_length} Zeichen ein (bisher {actual_length}).");
    assert.equal(de["4000005"], "Dieses Passwort kann nicht verwendet werden. Bitte wähl ein anderes Passwort.");
    assert.equal(de["5000001"], "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuch es später erneut.");
  });

  it("says 4000002 like the client-side check forms.validation.required, in both forms", () => {
    // Before 0.9.3 the Du text was „Bitte gib {property} ein und versuch es erneut.“, which
    // read oddly with some labels („Bitte gib Datenschutz ein …“, kratos-flow#31).
    assert.equal(de["4000002"], "Bitte füll das Feld „{property}“ aus.");
    assert.equal(de["4000002"], uiDe["forms.validation.required"]);
    assert.equal(deSie["4000002"], uiDeSie["forms.validation.required"]);
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
      "Bitte versuch es erneut.",
      "Versuch die Registrierung erneut.",
      "Bitte prüfe die Schreibweise.",
      "Wähle eine Methode.",
      "Mache ein Foto.",
      "Stelle sicher, dass alles stimmt.",
      "Klicke auf den Link.",
      "Klick auf den Link.",
      "Öffne ihn in diesem Browser.",
      "Fordere bitte einen neuen Link an.",
      "Oder lass dir einen Link senden.",
      "Bitte sieh in deinem Postfach nach.",
      "Bestätigt. Geh zurück in die App.",
      "Bitte registriere dich noch einmal.",
      "Ignoriere diese Mail.",
      "Bitte füll das Feld „Vorname“ aus.",
    ]) {
      assert.ok(DU_IMPERATIVE.test(du), `checker misses: ${du}`);
    }
    for (const neutral of [
      "Zu viele Versuche. Bitte warten Sie einen Moment.",
      "Prüfe…",
      "Bitte versuchen Sie es erneut.",
      "Noch ein Versuch.",
      "Sie haben noch einen Versuch.",
      "Bitte bestätigen Sie mit einem Klick.",
      "Öffnen Sie ihn in diesem Browser.",
      "Fordern Sie bitte einen neuen Link an.",
      "Oder lassen Sie sich einen Link senden.",
      "Bitte sehen Sie in Ihrem Postfach nach.",
      "Bestätigt. Gehen Sie zurück in die App.",
      "Bitte registrieren Sie sich noch einmal.",
      "Ignorieren Sie diese Mail.",
      "Bitte füllen Sie das Feld „Vorname“ aus.",
    ]) {
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

  it("says what a change does: code to the new address, new address applies only after the code, old address stays sign-in and recovery until then", () => {
    const parts = [
      "Code an die neue Adresse",
      "Erst wenn",
      "allen verbundenen Diensten",
      "E-Mails zu Buchungen und Rechnungen",
      "bleibt die alte Adresse für die Anmeldung und die Wiederherstellung",
      // A typo only means the code does not arrive; the old address keeps working.
      "Tippfehler",
      "kein Code an",
      "alte Adresse funktioniert dann weiter",
    ];
    for (const [name, catalog] of Object.entries(catalogs)) {
      const hint = catalog[HINT]!;
      for (const part of parts) {
        assert.ok(hint.includes(part), `${name}:${HINT} lacks „${part}“`);
      }
      assert.ok(!hint.includes("Passwort"), `${name}:${HINT} mentions a password`);
      const dialog = catalog[DIALOG_TEXT]!;
      assert.ok(dialog.includes("Erst wenn"), `${name}:${DIALOG_TEXT}`);
      assert.ok(dialog.includes("alte Adresse für Anmeldung und Wiederherstellung gültig"), `${name}:${DIALOG_TEXT}`);
    }
    assert.ok(uiDe[HINT]!.includes("Wiederherstellung deines Kontos"), "ui.de: recovery of the account");
    assert.ok(uiDeSie[HINT]!.includes("Wiederherstellung Ihres Kontos"), "ui.de-sie: recovery of the account");
  });

  it("no longer claims the old behaviour (immediate switch, lock-out, re-login)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of [...EMAIL_CHANGE_KEYS, "settings.profile.email.hint-short", "settings.profile.email.hint-more"]) {
        assert.doesNotMatch(catalog[key]!, /gilt sofort|sofort nicht mehr|sperrt|neu anmelden|danach sofort/, `${name}:${key}`);
      }
    }
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
      // One sentence: the code goes to the new address, it applies only with the code, the old one stays until then, check it.
      assert.equal(short.match(/[.!?](?=\s|$)/g)?.length, 1, `${name}: one sentence`);
      assert.match(short, /Code geht an die neue Adresse/, name);
      assert.match(short, /bis dahin bleibt die alte gültig/, name);
      assert.match(short, /genau/, name);
      // The rest: all connected services, booking and invoice e-mails, a code to the new address,
      // login and recovery stay with the old address until then, a typo only means no code arrives.
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

describe("SSO account step, canou button and password hint (0.2.7, SSO plan v2 §7.3, §7.4, §12, F1, F2, F3)", () => {
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };
  // Texts that do not address the user: the same in both forms (plan §12.1 wording).
  const NEUTRAL: Record<string, string> = {
    "sso.account.loading": "Anmeldung wird abgeschlossen…",
    "sso.account.link.title": "Bestehendes Konto verbinden",
    "sso.account.link.submit": "Konto verbinden",
    "sso.account.other-account": "Mit einem anderen Konto anmelden",
    "sso.account.error.invalid-credentials": "Das Passwort ist nicht korrekt.",
    "sso.account.error.attempts-left.one": "Noch ein Versuch.",
    "sso.account.error.attempts-left.other": "Noch {count} Versuche.",
    "sso.account.error.pause-after.one": "Danach wird das Verbinden für eine Minute pausiert.",
    "sso.account.error.pause-after.other": "Danach wird das Verbinden für {minutes} Minuten pausiert.",
    "sso.account.error.reset-required": "Für dieses Konto muss das Passwort neu gesetzt werden.",
    "sso.account.reset-password": "Passwort zurücksetzen",
    "sso.account.verify.button": "E-Mail-Adresse bestätigen",
    "sso.account.register.title": "Konto anlegen",
    "sso.account.register.submit": "Konto anlegen",
    "sso.account.register.consent.one": "Ich habe die {policy} gelesen und akzeptiere diese.",
    "sso.account.register.consent.other": "Ich habe die Datenschutzerklärungen von {policies} gelesen und akzeptiere diese.",
    "sso.account.register.consent.policy": "Datenschutzerklärung",
    "sso.account.register.consent.and": "und",
    "sso.button.label": "Mit canou anmelden",
    "sso.button.checking": "Wird geprüft…",
    "sso.powered-by.text": "Powered by canou",
    // F2: the passive sentence under the Google/Microsoft buttons and on the registration page.
    "sso.privacy.notice.one": "Es gilt die {policy}.",
    "sso.privacy.notice.other": "Es gelten die Datenschutzerklärungen von {policies}.",
  };
  // Texts that address the user: a real translation per form. Sie wording from the plan where it
  // has a text (§7.3, §7.4, §12.1, §12.4), the others new in the same style.
  const SIE: Record<string, string> = {
    "sso.account.link.text":
      "Für {email} gibt es bereits ein Konto, zum Beispiel aus der canou-App oder der bisherigen Plattform. Bitte bestätigen Sie einmalig mit dem Passwort dieses Kontos, dass es Ihnen gehört. Danach ist es mit Ihrer Anmeldung verbunden.",
    "sso.account.link.password": "Passwort Ihres bestehenden Kontos",
    "sso.account.link.reset-sent": "Wir haben Ihnen eine E-Mail geschickt.",
    "sso.account.error.locked.one":
      "Zu viele Versuche. Bitte versuchen Sie es in einer Minute noch einmal oder setzen Sie das Passwort zurück.",
    "sso.account.error.locked.other":
      "Zu viele Versuche. Bitte versuchen Sie es in {minutes} Minuten noch einmal oder setzen Sie das Passwort zurück.",
    "sso.account.error.inactive": "Dieses Konto ist gesperrt. Bitte wenden Sie sich an {displayName}.",
    "sso.account.error.conflict":
      "Dieses Konto ist bereits mit einer anderen Anmeldung verbunden. Bitte melden Sie sich mit dieser an oder wenden Sie sich an {displayName}.",
    "sso.account.error.session-invalid": "Ihre Anmeldung ist abgelaufen. Bitte melden Sie sich erneut an.",
    "sso.account.error.generic": "Das hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal.",
    "sso.account.error.temporarily-unavailable": "Die Anmeldung ist gerade nicht möglich. Bitte versuchen Sie es in ein paar Minuten noch einmal.",
    "sso.account.verify.text": "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.",
    // 0.2.8: the account is created at the site and at canou, so the text names both; without a
    // site of its own (or on canou itself) only canou.
    "sso.account.register.text": "Für {email} legen wir jetzt Ihr Konto bei {displayName} und canou an.",
    "sso.account.register.text-canou": "Für {email} legen wir jetzt Ihr canou-Konto an.",
    "sso.account.register.name-hint": "Wir haben Ihren Namen aus Ihrer Anmeldung übernommen. Sie können ihn hier ändern.",
    "sso.account.register.consent.required": "Bitte setzen Sie das Häkchen, um Ihr Konto anzulegen.",
    "sso.button.unavailable": "Ihre canou-Anmeldedaten gelten auch hier. Melden Sie sich einfach direkt hier an.",
    "sso.hint.password":
      "Diese Website nutzt canou. Sie können sich hier mit dem Passwort Ihres canou-Kontos anmelden oder sich einen Code per E-Mail senden lassen.",
    "sso.announce.signed-in": "Sie sind jetzt als {name} angemeldet.",
  };
  const NEW_KEYS = [...Object.keys(NEUTRAL), ...Object.keys(SIE)];
  /** Existing keys the account step reuses instead of adding a copy. */
  const REUSED: Record<string, string> = {
    "forms.label.forgot-password": "Passwort vergessen?",
    "property.first": "Vorname",
    "property.last": "Nachname",
  };
  const PLACEHOLDERS: Record<string, string[]> = {
    "sso.account.error.attempts-left.other": ["count"],
    "sso.account.error.pause-after.other": ["minutes"],
    "sso.account.error.locked.other": ["minutes"],
    "sso.account.error.inactive": ["displayName"],
    "sso.account.error.conflict": ["displayName"],
    "sso.account.link.text": ["email"],
    "sso.account.register.text": ["displayName", "email"],
    "sso.account.register.text-canou": ["email"],
    "sso.account.register.consent.one": ["policy"],
    "sso.account.register.consent.other": ["policies"],
    "sso.announce.signed-in": ["name"],
    "sso.privacy.notice.one": ["policy"],
    "sso.privacy.notice.other": ["policies"],
  };
  /** Builds a sentence with policy links the way a consumer does (links as plain names here). */
  const withPolicies = (catalog: Record<string, string>, base: string, names: string[]) => {
    const category = new Intl.PluralRules("de").select(names.length);
    const template = catalog[`${base}.${category}`]!;
    const and = ` ${catalog["sso.account.register.consent.and"]} `;
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")}${and}${names.at(-1)}` : names[0];
    return interpolate(template, { policy: catalog["sso.account.register.consent.policy"], policies: list });
  };

  it("has every new key in both forms, non-empty, and in the renderer key list", () => {
    const missing = Object.entries(catalogs).flatMap(([name, catalog]) =>
      NEW_KEYS.filter((key) => typeof catalog[key] !== "string" || catalog[key]!.trim() === "").map((key) => `${name}:${key}`),
    );
    assert.deepEqual(missing, []);
    assert.deepEqual(NEW_KEYS.filter((key) => !rendererKeys.includes(key)), []);
    // Every sso.* key of the catalogs is covered here or in the purpose-code block (0.3.0),
    // so no key goes untested.
    for (const catalog of Object.values(catalogs)) {
      assert.deepEqual(Object.keys(catalog).filter((k) => k.startsWith("sso.") && !(k in PURPOSE_CODE_SPEC.neutral) && !(k in PURPOSE_CODE_SPEC.sie)).sort(), [...NEW_KEYS].sort());
    }
  });

  it("keeps the plan wording: neutral texts the same in both forms, the Sie form word for word", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of Object.entries(NEUTRAL)) assert.equal(catalog[key], text, `${name}:${key}`);
    }
    for (const [key, text] of Object.entries(SIE)) assert.equal(uiDeSie[key], text, key);
  });

  it("uses Alex' wording for the Du password hint (plan §7.4)", () => {
    assert.equal(uiDe["sso.hint.password"], "Du kannst direkt das Passwort verwenden, das du bei canou nutzt, da diese Website canou verwendet.");
  });

  it("addresses the user in the catalog's form (real translation, not a copy)", () => {
    for (const key of Object.keys(SIE)) {
      assert.ok(SIE_FORM.test(uiDeSie[key]!), `ui.de-sie:${key} has no Sie form`);
      assert.ok(DU_PRONOUN.test(uiDe[key]!) || DU_IMPERATIVE.test(uiDe[key]!), `ui.de:${key} has no Du form`);
      assert.ok(!SIE_FORM.test(uiDe[key]!), `ui.de:${key} has a Sie form`);
    }
  });

  it("uses only the listed placeholders, the same in both forms", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of NEW_KEYS) assert.deepEqual(placeholders(catalog[key]!), PLACEHOLDERS[key] ?? [], `${name}:${key}`);
    }
  });

  it("has plural pairs: .one without a number placeholder, .other with it (ICU/CLDR categories one/other)", () => {
    const plural = NEW_KEYS.filter((key) => /\.(one|other)$/.test(key));
    assert.equal(plural.length, 10);
    for (const key of plural) {
      const base = key.replace(/\.(one|other)$/, "");
      assert.ok(NEW_KEYS.includes(`${base}.one`) && NEW_KEYS.includes(`${base}.other`), base);
    }
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of plural.filter((k) => k.endsWith(".one"))) {
        assert.doesNotMatch(catalog[key]!, /\{(count|minutes)\}|\d/, `${name}:${key}`);
      }
    }
  });

  it("builds the consent sentence of F1: one policy singular, two or more plural with every name", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.equal(withPolicies(catalog, "sso.account.register.consent", ["canou"]), "Ich habe die Datenschutzerklärung gelesen und akzeptiere diese.", name);
      assert.equal(
        withPolicies(catalog, "sso.account.register.consent", ["Leinerstift", "canou"]),
        "Ich habe die Datenschutzerklärungen von Leinerstift und canou gelesen und akzeptiere diese.",
        name,
      );
      assert.equal(
        withPolicies(catalog, "sso.account.register.consent", ["Leinerstift", "Diakonie", "canou"]),
        "Ich habe die Datenschutzerklärungen von Leinerstift, Diakonie und canou gelesen und akzeptiere diese.",
        name,
      );
    }
  });

  it("builds the passive privacy sentence of F2 with the same links: one policy singular, two or more plural", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.equal(withPolicies(catalog, "sso.privacy.notice", ["canou"]), "Es gilt die Datenschutzerklärung.", name);
      assert.equal(
        withPolicies(catalog, "sso.privacy.notice", ["Leinerstift", "canou"]),
        "Es gelten die Datenschutzerklärungen von Leinerstift und canou.",
        name,
      );
      assert.equal(
        withPolicies(catalog, "sso.privacy.notice", ["Leinerstift", "Diakonie", "canou"]),
        "Es gelten die Datenschutzerklärungen von Leinerstift, Diakonie und canou.",
        name,
      );
    }
  });

  it("joins the attempts and the pause into the plan text (F3: 5 failures, 15 minutes)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const text = (n: number, minutes: number) =>
        [
          interpolate(catalog[`sso.account.error.attempts-left.${new Intl.PluralRules("de").select(n)}`]!, { count: n }),
          interpolate(catalog[`sso.account.error.pause-after.${new Intl.PluralRules("de").select(minutes)}`]!, { minutes }),
        ].join(" ");
      assert.equal(text(3, 15), "Noch 3 Versuche. Danach wird das Verbinden für 15 Minuten pausiert.", name);
      assert.equal(text(1, 15), "Noch ein Versuch. Danach wird das Verbinden für 15 Minuten pausiert.", name);
      assert.equal(text(1, 1), "Noch ein Versuch. Danach wird das Verbinden für eine Minute pausiert.", name);
    }
  });

  it("names the site and canou as the place of the new account, canou alone without a site (0.2.8)", () => {
    assert.equal(uiDe["sso.account.register.text"], "Für {email} legen wir jetzt dein Konto bei {displayName} und canou an.");
    assert.equal(uiDe["sso.account.register.text-canou"], "Für {email} legen wir jetzt dein canou-Konto an.");
    const values = { email: "alex@example.org", displayName: "Leinerstift e. V." };
    assert.equal(
      interpolate(uiDeSie["sso.account.register.text"]!, values),
      "Für alex@example.org legen wir jetzt Ihr Konto bei Leinerstift e. V. und canou an.",
    );
    assert.equal(interpolate(uiDeSie["sso.account.register.text-canou"]!, values), "Für alex@example.org legen wir jetzt Ihr canou-Konto an.");
    // Where the site is the contact and not the place of the account, it stays alone.
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of ["sso.account.error.conflict", "sso.account.error.inactive"]) {
        assert.match(catalog[key]!, /\{displayName\}\.$/, `${name}:${key}`);
        assert.doesNotMatch(catalog[key]!, /canou/, `${name}:${key}`);
      }
      // Every text that names the site as the place of an account names canou too.
      const accountAtSite = NEW_KEYS.filter((k) => /Konto bei \{displayName\}/.test(catalog[k]!));
      assert.deepEqual(accountAtSite, ["sso.account.register.text"], name);
      for (const key of accountAtSite) assert.match(catalog[key]!, /\{displayName\} und canou\b/, `${name}:${key}`);
    }
  });

  it("reuses the existing keys for „Passwort vergessen?“ and the name labels", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of Object.entries(REUSED)) assert.equal(catalog[key], text, `${name}:${key}`);
    }
    for (const key of NEW_KEYS) assert.ok(!/forgot|first-name|last-name/.test(key), `copy of a reused key: ${key}`);
  });

  it("shows no technical words or raw status names", () => {
    const TECH = /\b(?:SSO|OIDC|OAuth|Kratos|Hydra|FedCM|Token|Session|Status|invalid_credentials|needs_\w+|reset_required|session_invalid|temporarily_unavailable)\b|_/;
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of NEW_KEYS) assert.doesNotMatch(catalog[key]!, TECH, `${name}:${key}`);
    }
  });
});

describe("purpose codes: confirmation, link way, support hints, address change (0.3.0)", () => {
  const catalogs = { "ui.de": uiDe, "ui.de-sie": uiDeSie };
  const { neutral: NEUTRAL, sie: SIE, du: DU } = PURPOSE_CODE_SPEC;
  const NEW_KEYS = [...Object.keys(NEUTRAL), ...Object.keys(SIE)];
  const PLACEHOLDERS: Record<string, string[]> = {
    "confirm.signup.signed-in-now": ["method"],
    "confirm.signup.signed-in.one": ["method"],
    "confirm.signup.signed-in.other": ["method", "minutes"],
    "confirm.sent": ["email", "time"],
    "confirm.sent-untimed": ["email"],
    "confirm.open-elsewhere": ["email"],
    "confirm.resend-wait.other": ["minutes"],
    "confirm.cleaned": ["method"],
    "confirm.link.expired-signup": ["portal"],
    "confirm.continue": ["portal"],
    "sso.account.link.code.text": ["email"],
    "sso.account.link.support": ["support"],
    "email-change.old.text": ["email"],
    "email-change.old.sent": ["email", "time"],
    "email-change.new.sent": ["email", "time"],
    "email-change.pending": ["email"],
    "email-change.cancelled": ["email"],
    "email-change.no-access": ["support"],
    "email-change.done": ["email"],
    "email-change.blocked": ["support"],
  };
  /** Keys kratos-flow 0.6.0 requires (its `REQUIRED_UI_KEYS`); the others are for canou-auth, the Hub and the app. */
  const KRATOS_FLOW_KEYS = NEW_KEYS.filter(
    (key) =>
      !key.startsWith("confirm.link.") &&
      // confirm.cleaned: after the cleanup the login is signed out; the sign-in host shows it, not the account step.
      !["confirm.done", "confirm.done-app", "confirm.continue", "confirm.cleaned", "settings.frozen", "login.passkey-unknown", "session.relinked"].includes(key) &&
      !(key.startsWith("email-change.") && key !== "email-change.elsewhere" && key !== "email-change.open"),
  ).concat(["confirm.link.other-login"]);

  it("has every new key in both forms, non-empty, and the kratos-flow keys in the renderer key list", () => {
    const missing = Object.entries(catalogs).flatMap(([name, catalog]) =>
      NEW_KEYS.filter((key) => typeof catalog[key] !== "string" || catalog[key]!.trim() === "").map((key) => `${name}:${key}`),
    );
    assert.deepEqual(missing, []);
    assert.deepEqual(Object.keys(DU).sort(), Object.keys(SIE).sort());
    assert.deepEqual(KRATOS_FLOW_KEYS.filter((key) => !rendererKeys.includes(key)), []);
  });

  it("keeps the wording: neutral texts the same in both forms, Sie and Du word for word", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of Object.entries(NEUTRAL)) assert.equal(catalog[key], text, `${name}:${key}`);
    }
    for (const [key, text] of Object.entries(SIE)) assert.equal(uiDeSie[key], text, key);
    for (const [key, text] of Object.entries(DU)) assert.equal(uiDe[key], text, key);
  });

  it("addresses the user in the catalog's form (real translation, not a copy)", () => {
    for (const key of Object.keys(SIE)) {
      assert.ok(SIE_FORM.test(uiDeSie[key]!), `ui.de-sie:${key} has no Sie form`);
      assert.ok(!DU_PRONOUN.test(uiDeSie[key]!) && !DU_IMPERATIVE.test(uiDeSie[key]!), `ui.de-sie:${key} has a Du form`);
      assert.ok(DU_PRONOUN.test(uiDe[key]!) || DU_IMPERATIVE.test(uiDe[key]!), `ui.de:${key} has no Du form`);
      assert.ok(!SIE_FORM.test(uiDe[key]!), `ui.de:${key} has a Sie form`);
    }
    for (const key of Object.keys(NEUTRAL)) {
      assert.ok(!SIE_FORM.test(NEUTRAL[key]!) && !DU_PRONOUN.test(NEUTRAL[key]!), `neutral ${key} addresses the user`);
    }
  });

  it("uses only the listed placeholders, the same in both forms", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of NEW_KEYS) assert.deepEqual(placeholders(catalog[key]!), PLACEHOLDERS[key] ?? [], `${name}:${key}`);
    }
  });

  it("has plural pairs: .one spells the number, .other carries {minutes}", () => {
    const plural = NEW_KEYS.filter((key) => /\.(one|other)$/.test(key));
    assert.deepEqual(plural.sort(), ["confirm.resend-wait.one", "confirm.resend-wait.other", "confirm.signup.signed-in.one", "confirm.signup.signed-in.other"]);
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of plural.filter((k) => k.endsWith(".one"))) {
        assert.doesNotMatch(catalog[key]!, /\{minutes\}|\d/, `${name}:${key}`);
        assert.match(catalog[key]!, /einer Minute/, `${name}:${key}`);
      }
    }
  });

  it("shows the fixed warning sentence in a foreign browser or app, and never offers to go on there", () => {
    assert.equal(
      uiDeSie["confirm.link.unbound"],
      "Geben Sie diesen Code in dem Browser ein, in dem Sie das angefordert haben. Waren Sie das nicht, ignorieren Sie diese Mail und geben Sie den Code an niemanden weiter.",
    );
    assert.equal(
      uiDe["confirm.link.unbound"],
      "Gib diesen Code in dem Browser ein, in dem du das angefordert hast. Warst du das nicht, ignoriere diese Mail und gib den Code an niemanden weiter.",
    );
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of ["confirm.link.unbound", "confirm.link.unbound-app"]) {
        assert.match(catalog[key]!, /an niemanden weiter\.$/, `${name}:${key}`);
        assert.doesNotMatch(catalog[key]!, /fortfahren|hier weiter|\{code\}/i, `${name}:${key}`);
      }
      assert.match(catalog["confirm.link.unbound-app"]!, /in der App ein/, name);
    }
  });

  it("names a link, never a code, for what the e-mail brings, with the time it is valid", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.match(catalog["confirm.sent"]!, /einen Link an .*\{email\} geschickt\. Er gilt bis \{time\} Uhr\./, `${name}:confirm.sent`);
      assert.match(catalog["confirm.sent"]!, /in diesem Browser/, `${name}:confirm.sent`);
      for (const key of ["sso.account.link.code.text", "confirm.resent", "confirm.resend", "sso.account.link.code.send"]) {
        assert.match(catalog[key]!, /Link/, `${name}:${key}`);
        assert.doesNotMatch(catalog[key]!, /Code/, `${name}:${key}`);
      }
    }
  });

  it("confirms an address change by code only, in the session that started it (0.6.0)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      for (const key of ["email-change.old.sent", "email-change.new.sent"]) {
        assert.match(catalog[key]!, /einen Code an .*\{email\} geschickt\. Er gilt bis \{time\} Uhr\./, `${name}:${key}`);
        assert.match(catalog[key]!, /nur in dieser Sitzung/, `${name}:${key}`);
        assert.doesNotMatch(catalog[key]!, /Link/, `${name}:${key}`);
      }
      for (const key of ["email-change.send", "email-change.old.text", "email-change.resend", "email-change.resent", "email-change.code.hint", "confirm.link.code-only", "confirm.link.action.email-change", "confirm.link.action.email-change-old"]) {
        assert.doesNotMatch(catalog[key]!, /Link|Browser\b.*öffn/i, `${name}:${key}`);
      }
      assert.match(catalog["email-change.send"]!, /Code/, name);
      assert.match(catalog["email-change.resend"]!, /Neuen Code/, name);
      assert.match(catalog["email-change.code.hint"]!, /nur in dieser Sitzung/, name);
      assert.match(catalog["confirm.link.code-only"]!, /Code aus der E-Mail, in der Sitzung, in der \w+ sie begonnen \w+\./, name);
    }
    assert.equal(uiDe["confirm.link.code-only"], "Eine Adressänderung bestätigst du mit dem Code aus der E-Mail, in der Sitzung, in der du sie begonnen hast.");
    assert.equal(uiDeSie["confirm.link.code-only"], "Eine Adressänderung bestätigen Sie mit dem Code aus der E-Mail, in der Sitzung, in der Sie sie begonnen haben.");
  });

  it("offers the link way first and the password second in the account step", () => {
    for (const catalog of Object.values(catalogs)) {
      assert.equal(catalog["sso.account.link.use-password"], "Stattdessen mit Passwort verbinden");
      assert.equal(catalog["sso.account.link.use-code"], "Stattdessen per Link verbinden");
      assert.equal(catalog["sso.account.link.code.send"], "Link senden");
    }
    // The ways of the superseded code sign-in (session details) are not in the catalog.
    for (const catalog of Object.values(catalogs)) {
      const stale = Object.keys(catalog).filter(
        (k) => k.startsWith("sso.account.link.method.") || k.startsWith("sso.account.link.hint.sign-in-method") || k === "sso.account.link.hint.ambiguous" || k.startsWith("sso.account.link.code.resend"),
      );
      assert.deepEqual(stale, []);
    }
  });

  it("reads right with every sign-in name after „mit“ (dative)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      const methods = ["confirm.method.password", "confirm.method.passkey", "confirm.method.webauthn", "confirm.method.unknown"].map((k) => catalog[k]!);
      assert.deepEqual(methods, ["einem Passwort", "einem Passkey", "einem Sicherheitsschlüssel", "einer anderen Anmeldeart"], name);
      for (const method of [...methods, catalog["oidc.provider.microsoft"]!, catalog["oidc.provider.apple"]!]) {
        const text = interpolate(catalog["confirm.cleaned"]!, { method });
        assert.ok(text.includes(`Anmeldung mit ${method} haben wir entfernt.`), `${name}: ${text}`);
        assert.doesNotMatch(text, /\{|\}/);
      }
    }
  });

  it("names the support only through {support}, which the consumer fills (site, support contact or „den Support“)", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.equal(catalog["sso.account.support.default"], "den Support", name);
      for (const key of ["sso.account.link.support", "email-change.no-access", "email-change.blocked"]) {
        assert.match(catalog[key]!, /an \{support\}\.$/, `${name}:${key}`);
        assert.doesNotMatch(catalog[key]!, /\bSupport\b/, `${name}:${key}`);
      }
    }
  });

  it("keeps the old address until the new one is confirmed, and says so in the dialog", () => {
    for (const [name, catalog] of Object.entries(catalogs)) {
      assert.match(catalog["email-change.intro"]!, /bisherige Adresse bleibt gültig, bis .* die neue bestätigt/, name);
      assert.match(catalog["email-change.elsewhere"]!, /bisherige Adresse bleibt gültig, bis .* die neue bestätigt/, name);
      assert.match(catalog["email-change.old.text"]!, /bisherige Adresse \{email\}/, name);
    }
  });

  it("has fusion's Kratos guard messages (4100001-4100005) in every message catalog, in the catalog's form", () => {
    const catalogsById = { de, "de-sie": deSie, en: readJson<Record<string, string>>("../locales/en.json") };
    for (const [name, catalog] of Object.entries(catalogsById)) {
      for (const id of ["4100001", "4100002", "4100003", "4100004", "4100005", "4100008", "4100009", "4100010", "4100011"]) assert.ok(catalog[id]?.trim(), `${name}:${id}`);
    }
    // 4100004: the settings of a sign-up nobody confirmed yet are frozen; the same sentence as the UI key.
    assert.equal(deSie["4100004"], uiDeSie["settings.frozen"]);
    assert.equal(de["4100004"], uiDe["settings.frozen"]);
    // The button the message names is the label kratos-flow links to the address change with.
    assert.ok(deSie["4100001"]!.includes(`„${uiDeSie["email-change.open"]}“`));
    assert.ok(de["4100001"]!.includes(`„${uiDe["email-change.open"]}“`));
    assert.ok(SIE_FORM.test(deSie["4100001"]!) && DU_PRONOUN.test(de["4100001"]!));
    assert.match(deSie["4100002"]!, /Code, Google oder Microsoft/);
    assert.match(deSie["4100002"]!, /Passwort und Passkey richten Sie danach in den Einstellungen ein/);
    assert.match(de["4100002"]!, /Passwort und Passkey richtest du danach in den Einstellungen ein/);
    assert.doesNotMatch(catalogsById.en["4100002"]!, /not possible/);
    // 4100005: a clean login changes a first factor (a new sign-in method or the password) without a confirmed link.
    assert.ok(SIE_FORM.test(deSie["4100005"]!) && DU_PRONOUN.test(de["4100005"]!) && !SIE_FORM.test(de["4100005"]!));
    // 0.4.1: only "a fresh e-mail code is needed" (fusion KratosSettings TEXT_FRESH_CODE), never "sign in again".
    for (const catalog of [deSie, de]) {
      assert.match(catalog["4100005"]!, /frischen Code aus (deiner|Ihrer) E-Mail/);
      assert.match(catalog["4100005"]!, /höchstens 15 Minuten/);
      assert.match(catalog["4100005"]!, /zweiten Faktor/);
      assert.doesNotMatch(catalog["4100005"]!, /Link|anmelden|Anmeldung/);
    }
    const en5 = catalogsById.en["4100005"]!;
    assert.match(en5, /fresh code from your e-mail/);
    assert.doesNotMatch(en5, /sign in again|log in again/i);
  });

  it("has the account step texts (0.8.0): neutral 4100012, 4100013-4100015, account and refusal keys, Du and Sie", () => {
    const en = readJson<Record<string, string>>("../locales/en.json");
    for (const [name, catalog] of Object.entries({ de, "de-sie": deSie, en })) {
      for (const id of ["4100012", "4100013", "4100014", "4100015"]) assert.ok(catalog[id]?.trim(), `${name}:${id}`);
      assert.ok(catalog["4100012"]!.includes("{provider}"), `${name}:4100012 placeholder`);
      assert.doesNotMatch(catalog["4100012"]!, /canou-Konto|canou account/i, `${name}:4100012`);
    }
    // 4100015 is the sentence of the registration consent; 4100013/4100014 speak in the catalog's form.
    assert.equal(de["4100015"], uiDe["sso.account.register.consent.required"]);
    assert.equal(deSie["4100015"], uiDeSie["sso.account.register.consent.required"]);
    for (const id of ["4100012", "4100013", "4100014"]) {
      assert.ok(SIE_FORM.test(deSie[id]!), `de-sie:${id}`);
      assert.ok(!SIE_FORM.test(de[id]!), `de:${id}`);
    }
    const keys = Object.keys(uiDe).filter((key) => key.startsWith("settings.consent.account.") || key.startsWith("login.refused."));
    assert.ok(keys.length >= 13);
    assert.deepEqual(keys.filter((key) => !uiDeSie[key]?.trim() || !uiDe[key]?.trim()), []);
    for (const key of ["title", "hint", "declined", "pending"]) {
      for (const catalog of [uiDe, uiDeSie]) assert.ok(catalog[`settings.consent.account.${key}`]!.includes("{brand}"), key);
    }
    for (const key of ["not-linked", "inactive", "blocked", "unknown"]) {
      for (const catalog of [uiDe, uiDeSie]) assert.ok(catalog[`login.refused.${key}`]!.includes("{brand}"), key);
      assert.ok(SIE_FORM.test(uiDeSie[`login.refused.${key}`]!) || !DU_PRONOUN.test(uiDeSie[`login.refused.${key}`]!), key);
      assert.ok(!SIE_FORM.test(uiDe[`login.refused.${key}`]!), key);
    }
    for (const catalog of [uiDe, uiDeSie]) assert.ok(catalog["login.refused.support"]!.includes("{support}"));
    // The renderer reads the account step keys; the submit label is the registration's (reused, not duplicated).
    for (const key of keys.filter((k) => k.startsWith("settings.consent.account.") && k !== "settings.consent.account.registering")) assert.ok(rendererKeys.includes(key), key);
    assert.ok(rendererKeys.includes("sso.account.register.submit"));
  });

  it("has the request-new button for a spent verification link (0.9.0) in Du and Sie", () => {
    assert.equal(uiDe["verification.link.request-new"], "Neuen Code anfordern");
    assert.equal(uiDeSie["verification.link.request-new"], "Neuen Code anfordern");
    assert.match(uiDe["code-link.expired"]!, /abgelaufen oder wurde schon benutzt/);
    assert.match(uiDeSie["code-link.expired"]!, /abgelaufen oder wurde schon benutzt/);
  });

  it("has the spent-code text for a signed-in reader (0.9.3, kratos-flow#63) in Du and Sie", () => {
    const key = "code-link.expired-signed-in";
    assert.equal(uiDe[key], "Dieser Code ist abgelaufen oder wurde schon benutzt. Melde dich ab, um einen neuen Code anzufordern.");
    assert.equal(uiDeSie[key], "Dieser Code ist abgelaufen oder wurde schon benutzt. Melden Sie sich ab, um einen neuen Code anzufordern.");
    // Same reason sentence as code-link.expired; only the way out differs (no form follows).
    for (const catalog of [uiDe, uiDeSie]) {
      assert.equal(catalog[key]!.split(". ")[0], catalog["code-link.expired"]!.split(". ")[0]);
      assert.deepEqual(placeholders(catalog[key]!), []);
    }
    assert.ok(!DU_PRONOUN.test(uiDeSie[key]!) && !DU_IMPERATIVE.test(uiDeSie[key]!), "Sie text in Du form");
    assert.ok(!SIE_FORM.test(uiDe[key]!), "Du text in Sie form");
    assert.ok(rendererKeys.includes(key), "kratos-flow reads it");
  });

  it("has the leave-without-confirming label (0.9.4, kratos-flow#70) in Du and Sie, distinct from the Weiter button", () => {
    const key = "verification.link.later";
    assert.equal(uiDe[key], "Später bestätigen");
    assert.equal(uiDeSie[key], "Später bestätigen");
    for (const catalog of [uiDe, uiDeSie]) assert.notEqual(catalog[key], catalog["verification.link.continue"]);
    assert.ok(rendererKeys.includes(key), "kratos-flow reads it");
  });

  it("has the registration grace text (0.8.1) in Du and Sie, a host text outside the renderer keys", () => {
    const key = "settings.consent.account.registering";
    assert.equal(uiDe[key], "Deine Anmeldung wird gerade eingerichtet. Einen Moment bitte.");
    assert.equal(uiDeSie[key], "Ihre Anmeldung wird gerade eingerichtet. Einen Moment bitte.");
    assert.ok(!DU_PRONOUN.test(uiDeSie[key]!), "sie form has no Du pronoun");
    assert.ok(SIE_FORM.test(uiDeSie[key]!) && !SIE_FORM.test(uiDe[key]!));
    assert.ok(!rendererKeys.includes(key), "kratos-flow does not read it");
  });

  it("has the message ids of plan appendix A in the Sie and Du form (0.4.0)", () => {
    const en = readJson<Record<string, string>>("../locales/en.json");
    for (const id of ["4100008", "4100009", "4100010", "4100011"]) {
      assert.ok(SIE_FORM.test(deSie[id]!) || !DU_PRONOUN.test(deSie[id]!), `de-sie:${id}`);
      assert.ok(!SIE_FORM.test(de[id]!), `de:${id}`);
      assert.ok(en[id]!.trim(), `en:${id}`);
    }
    assert.ok(SIE_FORM.test(deSie["4100008"]!) && DU_PRONOUN.test(de["4100008"]!));
    assert.ok(SIE_FORM.test(deSie["4100011"]!) && DU_PRONOUN.test(de["4100011"]!));
    assert.match(deSie["4100008"]!, /Anmeldung, in der Sie die Änderung gestartet haben/);
    assert.match(deSie["4100009"]!, /abgelaufen oder .* ersetzt/);
    assert.match(deSie["4100010"]!, /gehört schon zu einem Konto/);
    assert.match(deSie["4100011"]!, /Google-Adresse/);
  });

  it("login.link.code-sent names the address in both forms (0.6.1)", () => {
    assert.equal(uiDe["login.link.code-sent"], "Wir haben dir einen Code an {email} geschickt.");
    assert.equal(uiDeSie["login.link.code-sent"], "Wir haben Ihnen einen Code an {email} geschickt.");
    assert.equal(uiDe["forms.label.resend-code"], "Code erneut senden");
  });

  it("1010016 asks for a code and connects the provider right after (0.6.1)", () => {
    const en = readJson<Record<string, string>>("../locales/en.json");
    for (const [name, catalog] of Object.entries({ de, "de-sie": deSie, en })) {
      assert.match(catalog["1010016"]!, /\{provider\}/, name);
      assert.match(catalog["1010016"]!, /Code|code/, name);
      assert.ok(!/Einstellungen|settings/.test(catalog["1010016"]!), name);
    }
  });

  it("the sign-in code button reads the same in Du and Sie form (0.6.2)", () => {
    assert.equal(de["1010015"], "Anmeldecode senden");
    assert.equal(deSie["1010015"], de["1010015"]);
  });

  it("labels the traits consent and email_pending in both forms (0.4.0)", () => {
    for (const ui of [uiDe, uiDeSie]) {
      assert.equal(ui["property.consent"], "Datenschutz");
      assert.equal(ui["property.email_pending"], "Neue E-Mail-Adresse");
    }
    assert.ok(rendererKeys.includes("property.consent") && rendererKeys.includes("property.email_pending"));
  });

  it("has a checkbox wording next to the required wording (0.5.0)", () => {
    assert.equal(uiDe["forms.validation.requiredCheckbox"], "Bitte setze den Haken bei „{property}“.");
    assert.equal(uiDeSie["forms.validation.requiredCheckbox"], "Bitte setzen Sie den Haken bei „{property}“.");
    assert.equal(uiDe["forms.validation.required"], "Bitte füll das Feld „{property}“ aus.");
    assert.equal(uiDeSie["forms.validation.required"], "Bitte füllen Sie das Feld „{property}“ aus.");
    assert.ok(rendererKeys.includes("forms.validation.requiredCheckbox"));
  });

  it("no locale lacks a message id of de or en (0.4.0)", () => {
    const en = readJson<Record<string, string>>("../locales/en.json");
    // de-sie may carry extra ids (4060003, 4070004, 1010020); no id may be missing from a locale.
    for (const id of Object.keys(de)) {
      assert.ok(deSie[id]?.trim(), `de-sie:${id}`);
      assert.ok(en[id]?.trim(), `en:${id}`);
    }
    for (const id of Object.keys(en)) assert.ok(de[id]?.trim(), `de:${id}`);
  });
});

describe("credential_add: link before adding or changing a first factor (0.3.0)", () => {
  const SIE_TEXTS: Record<string, string> = {
    "confirm.link.action.credential-add": "Änderung bestätigen",
    "credential-add.hint": "Bevor Sie eine Anmeldeart hinzufügen oder ändern, bestätigen Sie bitte per Link, dass Sie das sind. Wir schicken ihn an Ihre E-Mail-Adresse.",
    "credential-add.send": "Link senden",
    "credential-add.sent": "Wir haben Ihnen einen Link an {email} geschickt. Er gilt bis {time} Uhr. Öffnen Sie ihn in diesem Browser, dann können Sie Ihre Änderung gleich abschließen.",
    "credential-add.sent-untimed": "Wir haben Ihnen einen Link an {email} geschickt. Öffnen Sie ihn in diesem Browser, dann können Sie Ihre Änderung gleich abschließen.",
    "credential-add.confirmed": "Bestätigt. Sie können Ihre Änderung jetzt abschließen.",
    "credential-add.expired": "Der Link ist abgelaufen oder wurde durch einen neueren ersetzt. Ihre Änderung wurde nicht gespeichert. Fordern Sie bitte einen neuen Link an.",
    "credential-add.failed": "Wir konnten die Bestätigung gerade nicht abschließen. Bitte versuchen Sie es noch einmal.",
  };
  const DU_TEXTS: Record<string, string> = {
    "confirm.link.action.credential-add": "Änderung bestätigen",
    "credential-add.hint": "Bevor du eine Anmeldeart hinzufügst oder änderst, bestätige bitte per Link, dass du das bist. Wir schicken ihn an deine E-Mail-Adresse.",
    "credential-add.send": "Link senden",
    "credential-add.sent": "Wir haben dir einen Link an {email} geschickt. Er gilt bis {time} Uhr. Öffne ihn in diesem Browser, dann kannst du deine Änderung gleich abschließen.",
    "credential-add.sent-untimed": "Wir haben dir einen Link an {email} geschickt. Öffne ihn in diesem Browser, dann kannst du deine Änderung gleich abschließen.",
    "credential-add.confirmed": "Bestätigt. Du kannst deine Änderung jetzt abschließen.",
    "credential-add.expired": "Der Link ist abgelaufen oder wurde durch einen neueren ersetzt. Deine Änderung wurde nicht gespeichert. Fordere bitte einen neuen Link an.",
    "credential-add.failed": "Wir konnten die Bestätigung gerade nicht abschließen. Bitte versuche es noch einmal.",
  };
  const PLACEHOLDERS: Record<string, string[]> = {
    "credential-add.sent": ["email", "time"],
    "credential-add.sent-untimed": ["email"],
  };

  it("has the keys in both forms, the wording pinned, and no other credential-add key", () => {
    for (const [key, text] of Object.entries(SIE_TEXTS)) assert.equal(uiDeSie[key], text, key);
    for (const [key, text] of Object.entries(DU_TEXTS)) assert.equal(uiDe[key], text, key);
    for (const catalog of [uiDeSie, uiDe]) {
      assert.deepEqual(Object.keys(catalog).filter((k) => k.startsWith("credential-add.")).sort(), Object.keys(SIE_TEXTS).filter((k) => k.startsWith("credential-add.")).sort());
    }
  });

  it("uses the placeholders per key and the catalog's form of address", () => {
    for (const key of Object.keys(SIE_TEXTS)) {
      assert.deepEqual(placeholders(uiDeSie[key]!), PLACEHOLDERS[key] ?? [], key);
      assert.deepEqual(placeholders(uiDe[key]!), PLACEHOLDERS[key] ?? [], key);
    }
    assert.deepEqual(duFormHits(Object.fromEntries(Object.keys(SIE_TEXTS).map((k) => [k, uiDeSie[k]!]))), []);
    assert.deepEqual(sieFormHits(Object.fromEntries(Object.keys(DU_TEXTS).map((k) => [k, uiDe[k]!]))), []);
  });

  it("names a link, never a code, and the sent texts say in which browser to open it", () => {
    for (const catalog of [uiDeSie, uiDe]) {
      for (const key of ["credential-add.hint", "credential-add.send", "credential-add.sent", "credential-add.sent-untimed", "credential-add.expired"]) {
        assert.match(catalog[key]!, /Link/, key);
        assert.doesNotMatch(catalog[key]!, /Code/, key);
      }
      for (const key of ["credential-add.sent", "credential-add.sent-untimed"]) assert.match(catalog[key]!, /einen Link an \{email\} geschickt\./, key);
      assert.match(catalog["credential-add.sent"]!, /Er gilt bis \{time\} Uhr\./);
      for (const key of ["credential-add.sent", "credential-add.sent-untimed"]) assert.match(catalog[key]!, /in diesem Browser/, key);
    }
  });
});

describe("0.7.0 catalog hygiene and new keys", () => {
  const rawKeys = (file: string): string[] =>
    [...readFileSync(new URL(file, import.meta.url), "utf8").matchAll(/^ {2}"((?:[^"\\]|\\.)*)":/gm)].map((m) => m[1]!);
  const files = ["../locales/de.json", "../locales/de-sie.json", "../locales/en.json", "../locales/ui.de.json", "../locales/ui.de-sie.json"];

  it("has no duplicate key in any catalog file (JSON.parse would hide it)", () => {
    for (const file of files) {
      const keys = rawKeys(file);
      const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
      assert.deepEqual(dupes, [], file);
    }
  });

  it("keeps every message id of de.json in de-sie.json and en.json", () => {
    assert.deepEqual(Object.keys(de).filter((k) => !(k in deSie)), []);
    assert.deepEqual(Object.keys(de).filter((k) => !(k in kratosIdsEn())), []);
  });

  it("1070012 (registration code field) is just „Code“ in every catalog", () => {
    assert.equal(de["1070012"], "Code");
    assert.equal(deSie["1070012"], "Code");
    assert.equal(kratosIdsEn()["1070012"], "Code");
  });

  const NEW_PREFIXES = ["code-link.", "verification.link.", "devices.", "settings.consent.", "settings.step-up.", "flow.", "oidc-return.", "signin.end.", "passkey-prompt.", "callback.", "logout.confirm."];
  const isNew = (k: string) => NEW_PREFIXES.some((p) => k.startsWith(p));

  it("has the new keys in Du and Sie, non-empty, and the Sie form really differs where the text addresses the reader", () => {
    const keys = Object.keys(uiDe).filter(isNew);
    assert.ok(keys.length >= 70, `only ${keys.length} new keys`);
    for (const k of keys) {
      assert.ok(uiDe[k] && uiDeSie[k], k);
      if (SIE_FORM.test(uiDeSie[k]!)) assert.ok(!DU_PRONOUN.test(uiDeSie[k]!), `Sie text of ${k} uses du`);
      assert.ok(!SIE_FORM.test(uiDe[k]!) || !DU_PRONOUN.test(uiDeSie[k]!), k);
      assert.ok(!DU_PRONOUN.test(uiDeSie[k]!), `${k} Sie text has a Du pronoun`);
    }
  });

  it("covers the 24 kratos-flow fallback texts, the mail link keys and the device keys", () => {
    const required = [
      "registration.step.traits.new-account", "registration.step.code.subtitle-new-account", "login.step.link.code-hint",
      "verification.link.title", "verification.link.confirm-hint", "verification.link.confirm-button", "verification.link.code-hint",
      "verification.link.code-label", "verification.link.invalid",
      "settings.consent.title", "settings.consent.hint", "settings.consent.submit", "settings.consent.status-open", "settings.consent.action",
      "settings.step-up.title", "settings.step-up.code-sent", "settings.step-up.code-sent-oidc", "settings.step-up.code-sent-aal2",
      "settings.step-up.submit", "settings.step-up.cancel", "settings.step-up.send-failed", "settings.step-up.no-address",
      "settings.step-up.still-refused", "settings.step-up.tap-again", "settings.step-up.totp-again", "settings.step-up.second-factor",
      "code-link.other-place.hint", "code-link.app.hint", "code-link.expired", "code-link.done-elsewhere", "code-link.restart.login",
      "code-link.restart.registration", "code-link.restart.recovery", "code-link.step-up-done", "code-link.legacy-mail",
      "devices.title", "devices.this-device", "devices.sign-out", "devices.sign-out-others", "devices.confirm.title", "devices.confirm.text",
    ];
    assert.deepEqual(required.filter((k) => !uiDe[k] || !uiDeSie[k] || !rendererKeys.includes(k)), []);
    assert.equal(uiDe["devices.this-device"], "Dieses Gerät");
    assert.equal(uiDe["devices.sign-out-others"], "Überall sonst abmelden");
  });

  it("labels the name fields and uses the salutation set Frau, Herr, Divers, keine Angabe", () => {
    const labels = { "property.salutation": "Anrede", "property.title": "Titel", "property.nickname": "Spitzname", "property.middle": "2. Vorname", "property.first": "Vorname", "property.last": "Nachname" };
    for (const [k, v] of Object.entries(labels)) {
      assert.equal(uiDe[k], v, k);
      assert.equal(uiDeSie[k], v, k);
    }
    const values = ["frau", "herr", "divers", "keine-angabe"].map((s) => uiDe[`property.salutation.${s}`]);
    assert.deepEqual(values, ["Frau", "Herr", "Divers", "keine Angabe"]);
    assert.deepEqual(values, ["frau", "herr", "divers", "keine-angabe"].map((s) => uiDeSie[`property.salutation.${s}`]));
    assert.equal(uiDe["settings.profile.name.required"], "Bitte trag Vor- und Nachnamen ein.");
    assert.equal(uiDeSie["settings.profile.name.required"], "Bitte tragen Sie Vor- und Nachnamen ein.");
  });
});

function kratosIdsEn(): Record<string, string> {
  return readJson<Record<string, string>>("../locales/en.json");
}
