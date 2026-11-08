# @wemotion/auth-i18n

Zentraler **deutscher** i18n-Katalog (du / „Moin", norddeutsch-freundlich) für die
**Ory-Kratos**-Authentifizierung. Eine Quelle der Wahrheit, einzubinden überall, wo
Kratos-Flows gerendert werden — Hub, canou-app, admin, work-app, tasty/digital-bash.

## Warum das so gebaut ist (wichtig)

Self-hosted (OSS) Kratos kann seine UI-/Fehlertexte **nicht** serverseitig übersetzen:
die Texte sind als englische Strings ins Kratos-Binary kompiliert, es gibt **keinen
Config-Key** dafür. (Das komfortable „Übersetzungen pro Sprache in der Console" ist ein
**Ory-Network-Cloud**-Feature, das wir self-hosted nicht haben.)

Kratos liefert aber zu **jeder** Meldung eine **stabile numerische ID** plus ein
`context`-Objekt:

```json
{ "id": 4000006, "text": "The provided credentials are invalid", "context": {} }
```

Wir mappen `4000006 → "Die eingegebenen Anmeldedaten sind ungültig."`. Das ist ein
sauberer i18n-Key wie überall — **kein String-Sniffing**: der englische `text` wird nie
inspiziert, nur die `id` als Schlüssel und `context` für die Platzhalter genutzt. Laut
Ory ändert sich eine ID **nie**.

> Die **einzige** serverseitige Lokalisierung, die OSS-Kratos kann, sind **E-Mails**
> (courier-Templates). Die liegen hier unter `courier-templates/` und werden in die
> Kratos-Config deployt — siehe unten.

## Inhalt

| Pfad | Was | Schlüssel |
|---|---|---|
| `locales/de.json` | Kratos-Flow-Meldungen (Login, Reg, Recovery, Verify, Settings, Fehler) | numerische Message-ID (`"4000006"`) |
| `locales/en.json` | Englische Referenz derselben IDs (Fallback) | numerische Message-ID |
| `locales/ui.de.json` | Nicht-numerische UI-Strings (Seitentitel, Buttons; `login.title`, `consent.*`) | dot-key |
| `locales/app-copy.de.json` | App-seitige Copy (Validierung, OAuth-Callback-Fehler, Headings) — **nicht** von Kratos | dot-key |
| `courier-templates/<type>/<variant>/email.*.gotmpl` | Deutsche Kratos-E-Mail-Templates | Dateien |

## Nutzung (Frontend / jeder Kratos-Consumer)

```ts
import { localizeUiText, localizeFlowMessages } from "@wemotion/auth-i18n";

// Eine einzelne Meldung:
const text = localizeUiText({ id: 4000006, text: "...", type: "error", context: {} });
// -> "Die eingegebenen Anmeldedaten sind ungültig."

// Alle Meldungen eines Kratos-Flows auf einmal (flow-weit + pro Feld):
const msgs = localizeFlowMessages(flow, { locale: "de" });
// msgs: [{ id, type: "error" | "info" | "success", text }]
```

Das Paket ist framework-agnostisch und dependency-frei (eigene `{name}`-Interpolation,
inkl. Orys `context`-Konventionen wie `<key>_list`, `<key>_unix` und den daraus abgeleiteten
`<key>_unix_until_minutes` / `<key>_unix_since_minutes`). Läuft im Browser,
im Next-Server/BFF und in Edge-Runtimes.

### Drop-in im Hub

Heute rendert der Hub `flow.ui.messages[].text` roh (englisch). Stattdessen:

```tsx
import { localizeUiText } from "@wemotion/auth-i18n";
// in KratosLoginBridge / KratosRegisterBridge / FlowErrors:
for (const m of [...(flow.ui.messages ?? []), ...flow.ui.nodes.flatMap(n => n.messages ?? [])]) {
  show(localizeUiText(m, { locale: "de" }));   // statt m.text
}
```

### Direkte Verdrahtung in i18next (optional)

```ts
import { messages, uiStrings, appCopy } from "@wemotion/auth-i18n";
i18n.addResourceBundle("de", "kratos", messages.de);     // t("kratos:4000006", context)
i18n.addResourceBundle("de", "auth-ui", uiStrings.de);
i18n.addResourceBundle("de", "auth-app", appCopy.de);
```

## Sie-Form and `createLocalizer` (0.2.0)

Portals address users formally. `0.2.0` adds a second German locale next to the Du form:

| Path | Content |
|---|---|
| `locales/de-sie.json` | Every Kratos message ID of `de.json` plus all IDs of Kratos v26.2.0 (`test/kratos-ids-v26.2.0.json`), in Sie form |
| `locales/ui.de-sie.json` | Every UI key of `ui.de.json` in Sie form, including the keys the Kratos UI-node renderer needs |

`ui.de.json` got the same new keys in Du form, so `uiStrings.de` and `uiStrings["de-sie"]` have identical keys.

```ts
import { createLocalizer } from "@wemotion/auth-i18n";

const t = createLocalizer({
  locale: "de-sie",            // "de" | "de-sie"
  unknown: "generic",          // unknown message ID: generic text per type ("kratos": Kratos' own text)
  overrides: { "login.step.identifier.title": "Willkommen bei Leinerstift" },
  onMissing: (e) => console.warn(e.code, e.id ?? e.key), // IDs/keys only, never texts
});

t.message({ id: 4000002, text: "", type: "error", context: { property: "first" } }, { propertyLabel: "Vorname" });
// -> { text: "Bitte füllen Sie das Feld „Vorname“ aus.", known: true }
t.ui("login.step.code.subtitle", { email: "user@example.org" });
t.provider("google"); // -> "Google"
```

- One locale only: `createLocalizer` never falls back to another locale (no `fallbackLocale`), so a Sie portal never shows a Du text.
- Never empty: an unknown UI key yields `forms.text-unavailable` plus `onMissing({ code: "ui_key_missing" })`.
- `context.provider` is replaced by `oidc.provider.<id>`; `context.property` (Kratos sends only the last path segment) by the node label or `property.<segment>`. `mapContext: false` turns this off and interpolates Kratos' context unchanged, like `localizeUiText` (for consumers that must not change visibly, e.g. canou-auth).
- Empty overrides are ignored, for message IDs and UI keys alike.
- `localizeUiText`, `localizeFlowMessages` and `fallbackLocale` behave as before; existing consumers are unaffected.
- Error page (0.2.3): `error.page.text.<error.id>` holds the text for a Kratos error id (e.g. `security_csrf_violation`), `error.page.text-expired` and `error.page.text-network` cover an unknown/expired error id and a network failure, `error.page.text` is the generic fallback. No text names the error id or Kratos' own message.
- Registration (0.2.4): `registration.error.existing-account` replaces the generic message 4000007 when a registration ends on an e-mail address that already has an account; the links next to it use `registration.login-button` and `forms.label.forgot-password`. Message 4000007 stays generic for settings and other identifiers.
- SSO account step (0.2.7): `sso.account.*` for the page after the first Google/Microsoft sign-in (link an existing account with its password, or create the account in one click), `sso.button.*` for „Mit canou anmelden“, `sso.hint.password`, `sso.powered-by.text` and `sso.announce.signed-in`. Two conventions, both without a new formatter:
  - **Plural:** one key per CLDR category, `<key>.one` and `<key>.other` (like `settings.summary.passkey.*`). The consumer picks the key with `new Intl.PluralRules("de").select(n)` and fills `{count}` or `{minutes}`; a `.one` text spells the number („ein Versuch“, „eine Minute“). `interpolate` only replaces `{name}`, so no ICU `{n, plural, …}` syntax is in the catalog.
  - **Links inside a sentence:** a `{name}` placeholder stands for the link, and the consumer splits the template at it and renders the link element itself (React text children, never HTML from the catalog). `sso.account.register.consent.one` has `{policy}` (link text `sso.account.register.consent.policy`, „Datenschutzerklärung“); `.other` has `{policies}`, one link per name, joined with „, “ and before the last name with `sso.account.register.consent.and` („und“). canou always counts, so one policy means only canou's. The passive privacy sentence `sso.privacy.notice.one`/`.other` (F2, under the Google/Microsoft buttons and on the registration page) uses the same placeholders, link text and list word.
- Purpose codes (0.3.0): `confirm.*` for the confirmation after a sign-up, the waiting window and the link page, `sso.account.link.code.*`, `sso.account.link.use-*`, `sso.account.link.support` for the account step (link first, password second), `email-change.*` for the address change dialog, `login.code.too-many`, `settings.frozen`, `login.passkey-unknown`, `session.relinked`, `credential-add.*` (the link before adding or changing a first factor in the settings), and the message ids 4100001–4100005 of fusion's Kratos guard hooks. canou-auth keeps the texts of its own pages (link page, confirmation step, address dialog) in its repo for now; the `confirm.link.*` and `email-change.*` keys here are the shared wording for the Hub, the app and a later move. Conventions: `{method}` is a name after „mit“ in the dative (`confirm.method.*`, `oidc.provider.<id>`); `{time}` is a clock time („11:57“, the text adds „Uhr“); `{support}` is filled by the consumer (support contact, else the site, else `sso.account.support.default`); the link page never offers to go on in a foreign browser and shows the code only with `confirm.link.unbound`.
- Kratos-native flows (0.4.0): message ids 4100008–4100011 (address change confirmed elsewhere, expired or replaced, address taken, Google address required), 4100005 asks for a fresh code (no link), 1010016 (0.6.1: confirm with a code, then the provider is connected), labels `property.consent` and `property.email_pending`. Fallback for an unknown id: `unknown: "generic"` shows the generic text per type (`forms.error.generic` etc.), `"kratos"` Kratos' own text; both call `onMissing`.
- Account text (0.2.8): the one-click step creates the account at the site and at canou, so `sso.account.register.text` names both („… Ihr Konto bei {displayName} und canou an.“). `sso.account.register.text-canou` („… Ihr canou-Konto an.“) is for a step without a site of its own or on canou itself. Texts that name the site as the contact (`sso.account.error.conflict`, `sso.account.error.inactive`: „wenden Sie sich an {displayName}“) keep the site alone.

### Tests

`npm test` (Node >= 22.15, no install needed) checks: parity `de.json` -> `de-sie.json`, coverage of the Kratos ID list, placeholders, Sie form (no Du pronouns/imperatives, no "Moin"; the checker has a self-test against `de.json`), real umlauts, identical keys in both UI catalogs and the renderer key list (`test/renderer-ui-keys.json`), and the localizer. `test/register.mjs` only lets Node load the bundler-style source (extensionless imports, JSON without import attributes).

Regenerate the Kratos ID list for a new Kratos version:

```sh
node scripts/kratos-ids.mjs path/to/kratos/text/id.go v26.2.0 > test/kratos-ids-v26.2.0.json
```

## E-Mail-Templates in Kratos deployen

Die `.gotmpl`-Dateien sind die Quelle der Wahrheit für die courier-Templates. In der
Kratos-Config pro Typ als Quelle referenzieren (self-hosted erlaubt `file://`, `https://`,
`base64://`):

```yaml
courier:
  templates:
    recovery_code:
      valid:
        email:
          subject: { source: base64://<...email.subject.gotmpl...> }
          body: { source: base64://<...email.body.gotmpl...> }
    # verification_code, recovery, verification, login_code, registration_code analog
```

Alternativ `courier.template_override_path` auf ein gemountetes Verzeichnis mit dieser
Ordnerstruktur zeigen lassen. **Sprache:** Kratos wählt kein Template per Locale aus —
für mehrsprachige Mails im Template selbst auf einen Identity-Trait verzweigen
(`{{ if eq .Identity.traits.locale "de" }}…`).

## Sprache hinzufügen / pflegen

- Neue Sprache: `locales/<lang>.json` mit denselben numerischen IDs anlegen; `localizeUiText`
  fällt für fehlende IDs auf `en` und dann auf `msg.text` zurück.
- **Versionierung:** Den Katalog an die laufende Kratos-Version pinnen. Der ID-Satz wächst
  mit neuen Kratos-Releases (neue Strategien = neue IDs); unbekannte IDs rendern dank
  `text`-Fallback weiter (englisch), bis sie ergänzt werden.

## Einbinden (git dependency)

Das Paket ist **source-first** (kein Build-Schritt beim Consumer): `main`/`exports`
zeigen auf `src/index.ts`, der Consumer transpiliert es mit.

```sh
pnpm add github:wemotion-gmbh/auth-i18n
```

In **Next.js** das Paket transpilieren lassen (`next.config`):

```ts
const nextConfig = { transpilePackages: ["@wemotion/auth-i18n"] };
```

`pnpm install --frozen-lockfile` (CI/Docker) zieht den im Lockfile gepinnten Commit.
Optionaler eigener Build/Typecheck im Paket-Repo: `pnpm run build` / `pnpm run typecheck`.
