import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createLocalizer,
  localizeFlowMessages,
  localizeUiText,
  messages,
  uiStrings,
  type MissingTextEvent,
} from "./index.ts";

const collect = () => {
  const events: MissingTextEvent[] = [];
  return { events, onMissing: (e: MissingTextEvent) => events.push(e) };
};

describe("createLocalizer - messages", () => {
  it("translates a known ID from the locale's catalog", () => {
    const l = createLocalizer({ locale: "de-sie" });
    assert.deepEqual(l.message({ id: 4000006, text: "The provided credentials are invalid", type: "error" }), {
      text: messages["de-sie"]["4000006"],
      known: true,
    });
    const du = createLocalizer({ locale: "de" });
    assert.equal(du.message({ id: 4000006, text: "x" }).text, messages.de["4000006"]);
  });

  it("interpolates context", () => {
    const l = createLocalizer({ locale: "de-sie" });
    const text = l.message({ id: 4000032, text: "", context: { min_length: 8, actual_length: 3 } }).text;
    assert.equal(text, "Das Passwort muss mindestens 8 Zeichen lang sein (bisher 3).");
  });

  it("overrides win over the catalog, for message IDs and UI keys", () => {
    const l = createLocalizer({
      locale: "de-sie",
      overrides: { "4000006": "Eigener Text.", "login.step.identifier.title": "Hallo" },
    });
    assert.deepEqual(l.message({ id: 4000006, text: "" }), { text: "Eigener Text.", known: true });
    assert.equal(l.ui("login.step.identifier.title"), "Hallo");
  });

  it("unknown ID, mode 'generic': generic text per type plus onMissing with only the ID", () => {
    const { events, onMissing } = collect();
    const l = createLocalizer({ locale: "de-sie", unknown: "generic", onMissing });
    const error = l.message({ id: 4999999, text: "Secret english detail", type: "error", context: { a: 1 } });
    assert.deepEqual(error, { text: uiStrings["de-sie"]["forms.error.generic"], known: false });
    assert.equal(error.text, "Das hat nicht geklappt. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.");
    assert.deepEqual(events, [{ code: "message_id_missing", locale: "de-sie", id: 4999999 }]);

    const info = l.message({ id: 1999999, text: "Some info", type: "info" });
    assert.equal(info.known, false);
    assert.ok(info.text.length > 0);
    assert.notEqual(info.text, "Some info");
  });

  it("unknown ID, mode 'kratos' (default): Kratos' own text, like localizeUiText today", () => {
    const { events, onMissing } = collect();
    const l = createLocalizer({ locale: "de", onMissing });
    assert.deepEqual(l.message({ id: 4999999, text: "Kratos text", type: "error" }), {
      text: "Kratos text",
      known: false,
    });
    assert.equal(events.length, 1);
    // Same result as the existing API for an ID neither catalog knows.
    assert.equal(localizeUiText({ id: 4999999, text: "Kratos text" }), "Kratos text");
  });

  it("unknown ID, mode 'kratos' with empty text: generic, never empty", () => {
    const l = createLocalizer({ locale: "de-sie" });
    const r = l.message({ id: 4999999, text: "", type: "error" });
    assert.equal(r.text, uiStrings["de-sie"]["forms.error.generic"]);
  });

  it("does not fall back to another locale", () => {
    // 1010020 exists in de-sie but not in de.json: a Du portal must not get the Sie text.
    assert.equal(messages.de["1010020"], undefined);
    const du = createLocalizer({ locale: "de", unknown: "generic" });
    const r = du.message({ id: 1010020, text: "We will send a code", type: "info" });
    assert.equal(r.known, false);
    assert.notEqual(r.text, messages["de-sie"]["1010020"]);
  });

  it("property: node label first, then property.<last segment>, then the raw segment", () => {
    const l = createLocalizer({ locale: "de-sie" });
    const msg = { id: 4000002, text: "Property first is missing.", type: "error" as const, context: { property: "first" } };
    assert.equal(l.message(msg, { propertyLabel: "Vorname (Pflicht)" }).text, "Bitte füllen Sie das Feld „Vorname (Pflicht)“ aus.");
    assert.equal(l.message(msg).text, "Bitte füllen Sie das Feld „Vorname“ aus.");
    assert.equal(
      l.message({ ...msg, context: { property: "traits.name.last" } }).text,
      "Bitte füllen Sie das Feld „Nachname“ aus.",
    );
    assert.equal(
      l.message({ ...msg, context: { property: "nickname" } }).text,
      "Bitte füllen Sie das Feld „nickname“ aus.",
    );
  });

  it("reason IDs: no Kratos English in de-sie", () => {
    const l = createLocalizer({ locale: "de-sie" });
    for (const id of [4000001, 4000005, 5000001]) {
      const text = l.message({ id, text: "", context: { reason: "some english reason" } }).text;
      assert.ok(!text.includes("some english reason"), String(id));
    }
  });

  it("provider: display name from oidc.provider.<id>, fallback capitalized id", () => {
    const l = createLocalizer({ locale: "de-sie" });
    assert.equal(l.message({ id: 1010002, text: "", context: { provider: "google" } }).text, "Mit Google anmelden");
    assert.equal(
      l.message({ id: 1010002, text: "", context: { provider: "Microsoft Entra", provider_id: "microsoft" } }).text,
      "Mit Microsoft anmelden",
    );
    assert.equal(l.message({ id: 1050002, text: "", context: { provider: "github" } }).text, "Github verknüpfen");
    assert.equal(l.provider("APPLE"), "Apple");
  });

  it("an empty override for a message ID does not hide the catalog text", () => {
    const { events, onMissing } = collect();
    const l = createLocalizer({ locale: "de-sie", overrides: { "4000006": "" }, onMissing });
    assert.deepEqual(l.message({ id: 4000006, text: "x", type: "error" }), {
      text: messages["de-sie"]["4000006"],
      known: true,
    });
    assert.deepEqual(events, []);
  });

  it("mapContext: false interpolates Kratos' context unchanged, like localizeUiText", () => {
    const l = createLocalizer({ locale: "de", mapContext: false });
    const property = { id: 4000002, text: "x", context: { property: "email" } };
    assert.equal(l.message(property).text, localizeUiText(property));
    assert.match(l.message(property).text, /email/);
    const provider = { id: 1010002, text: "x", context: { provider: "google" } };
    assert.equal(l.message(provider).text, localizeUiText(provider));
    assert.equal(l.message(provider).text, "Mit google anmelden");
    // An explicit node label is still the caller's choice.
    assert.match(l.message(property, { propertyLabel: "E-Mail-Adresse" }).text, /E-Mail-Adresse/);
    // Default stays on: the portal path maps both.
    assert.equal(createLocalizer({ locale: "de" }).message(provider).text, "Mit Google anmelden");
  });
});

describe("createLocalizer - UI keys", () => {
  it("looks up and interpolates", () => {
    const l = createLocalizer({ locale: "de-sie" });
    assert.equal(l.ui("login.step.code.subtitle", { email: "user@example.org" }), "Wir haben Ihnen einen Code an user@example.org geschickt.");
    const du = createLocalizer({ locale: "de" });
    assert.equal(du.ui("login.step.code.subtitle", { email: "user@example.org" }), "Wir haben dir einen Code an user@example.org geschickt.");
  });

  it("missing key: onMissing with the key and a generic text, never empty", () => {
    const { events, onMissing } = collect();
    const l = createLocalizer({ locale: "de-sie", onMissing });
    const text = l.ui("does.not.exist");
    assert.equal(text, "Text nicht verfügbar");
    assert.deepEqual(events, [{ code: "ui_key_missing", locale: "de-sie", key: "does.not.exist" }]);
    assert.equal(l.hasUi("does.not.exist"), false);
    assert.equal(l.hasUi("login.title"), true);
  });

  it("an empty override does not blank a text", () => {
    const l = createLocalizer({ locale: "de-sie", overrides: { "login.title": "" } });
    assert.equal(l.ui("login.title"), "Anmelden");
  });
});

describe("existing API stays unchanged for current consumers", () => {
  it("localizeUiText: default de, fallback en, then Kratos text", () => {
    assert.equal(localizeUiText({ id: 4000006, text: "x" }), messages.de["4000006"]);
    // 4060003 is in neither de.json nor en.json: Kratos' text, as before.
    assert.equal(localizeUiText({ id: 4060003, text: "Kratos text" }), "Kratos text");
    // Explicit fallbackLocale keeps working.
    assert.equal(localizeUiText({ id: 4000006, text: "x" }, { locale: "en" }), messages.en["4000006"]);
  });

  it("localizeUiText accepts the new locale", () => {
    assert.equal(localizeUiText({ id: 4000006, text: "x" }, { locale: "de-sie" }), messages["de-sie"]["4000006"]);
  });

  it("localizeFlowMessages works as before", () => {
    const out = localizeFlowMessages({
      ui: { messages: [{ id: 4000006, text: "x", type: "error" }], nodes: [{ messages: [{ id: 4000002, text: "y", context: { property: "email" } }] }] },
    });
    assert.deepEqual(out.map((m) => [m.id, m.type]), [
      [4000006, "error"],
      [4000002, "info"],
    ]);
    assert.equal(out[0]!.text, messages.de["4000006"]);
  });

  it("uiStrings.de keeps all keys it had", () => {
    for (const key of ["login.title", "consent.title", "settings.totp.title", "verification.title"]) {
      assert.ok(uiStrings.de[key], key);
    }
  });
});
