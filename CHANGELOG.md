# Changelog

## 0.2.6

- New UI keys for the settings overview of kratos-flow 0.4.0 (one row per area with its status and one button; the form opens below the row, one row at a time), in `ui.de.json` (Du form) and `ui.de-sie.json` (Sie form), all in `test/renderer-ui-keys.json`:
  - Group titles `settings.group.profile` („Persönliche Angaben“), `settings.group.sign-in` („Anmeldung“), `settings.group.protection` („Zusätzlicher Schutz“).
  - The passkey row, which holds passkeys and security keys: `settings.passkeys.title` („Passkeys und Sicherheitsschlüssel“) and `settings.passkeys.description` (one sentence for both methods).
  - The row of the authenticator app: `settings.totp.app-title` („Authenticator-App“; `settings.totp.title` stays the section title of layouts that show every form at once).
  - Row status: `settings.summary.password` („Passwort festlegen oder ändern“: Kratos does not tell whether a password is set), `settings.summary.not-set` („Nicht angegeben“, an empty name), `settings.summary.passkey.{none,one,other}` and `settings.summary.webauthn.{none,one,other}` („kein Passkey“, „1 Passkey“, „{count} Passkeys“ …), `settings.summary.totp.{on,off}` („An“, „Aus“), `settings.summary.lookup_secret.{on,off}` („Eingerichtet“, „Keine erzeugt“), `settings.summary.oidc.{linked,not-linked}` („{provider}: verknüpft“, „{provider}: nicht verknüpft“).
  - Row buttons `settings.action.change` („Ändern“), `settings.action.manage` („Verwalten“), `settings.action.set-up` („Einrichten“), `settings.action.create` („Erzeugen“), `settings.action.close` („Schließen“).
  - The e-mail change hint in two parts: `settings.profile.email.hint-short` (one sentence: the new address counts at once, the old one stops at once, check it) and `settings.profile.email.hint-more` (connected services, booking and invoice e-mails, the code, login and recovery, the typo risk) behind the disclosure `settings.profile.email.hint-details` („Was passiert dabei?“). `settings.profile.email.hint` stays for layouts that show the whole text at once.
- Group titles, status and button texts do not address the user and are the same in both forms; the passkey description and the e-mail hint are real translations.
- Tests: every new key exists non-empty in both catalogs and in the renderer key list, the approved wording is pinned, `{count}` and `{provider}` are the only placeholders, the addressed texts use the catalog's form, and the two e-mail hint parts together keep every point of the long hint.

## 0.2.5

- Texts after the settings tests of W1-voll PR9a (23.10.), for kratos-flow 0.3.6:
  - Message 4000015 (`ErrorValidationSuchNoWebAuthnUser`) names the passkey too: „Dieses Konto existiert nicht oder hat weder einen Passkey noch einen Sicherheitsschlüssel eingerichtet.“ (`de.json`, `de-sie.json`; `en.json` likewise). Kratos sends it for a passkey sign-in as well, e.g. after the passkey was removed; the old text named only the security key.
  - New UI keys `settings.credential.remove-unnamed` („{name} vom {date} entfernen“) and `settings.credential.remove-unnamed-undated` („{name} entfernen“), same in both forms, in `test/renderer-ui-keys.json`: the remove button of a passkey or security key without a name. Kratos names such a credential "unnamed" in its remove label (1050018/1050020, `x/webauthnx/nodes.go:76,86`), and its passkey method stores no name at all, so the button read „Passkey „unnamed“ entfernen“. kratos-flow fills `{name}` with its fallback name (`settings.passkey.default-name` / `settings.webauthn.title`) and `{date}` with the date the credential was added.
- Tests: 4000015 names passkey and security key in both German catalogs, the two remove keys are pinned with their placeholders in both forms and are in the renderer key list.
- `test/renderer-ui-keys.json` lists `error.page.text-expired` and `error.page.text-network`, which kratos-flow 0.3.1 requires (`REQUIRED_UI_KEYS`). `error.page.id-label` stays listed, because consumers on kratos-flow 0.3.0 (canou-auth) still require it. Test data only; the catalogs do not change.

## 0.2.4

- Texts after the Beta matrix D1 of W1-voll (22.10.), in `ui.de.json` (Du form) and `ui.de-sie.json` (Sie form):
  - `login.passkey.cancelled` now also names the second cause (L4b, decision of 22.10.): „Die Anmeldung mit Passkey wurde abgebrochen oder auf diesem Gerät ist kein Passkey gespeichert.“, same in both forms. A device without a passkey ends in the same WebAuthn `NotAllowedError` as a cancel, so the renderer cannot tell them apart.
  - New key `registration.error.existing-account` (R1): Kratos reports an e-mail address that already has an account (4000007) only after the code step, and the generic catalog text names phone number and username and offers no way out. The registration shows „Für diese E-Mail-Adresse gibt es bereits ein Konto. Melden Sie sich an oder setzen Sie Ihr Passwort zurück, falls Sie es vergessen haben.“ (`ui.de-sie.json`) / „… Melde dich an oder setze dein Passwort zurück, falls du es vergessen hast.“ (`ui.de.json`) instead. The message 4000007 itself stays generic, because settings (e-mail change) and other identifiers use it too.
- Not added, because the keys exist: the link labels for R1 are `registration.login-button` („Anmelden“) and `forms.label.forgot-password` („Passwort vergessen?“); the retry button after a failed submit (L11) is `forms.button.retry` („Erneut versuchen“, since 0.2.1).
- Tests: the L4b wording is pinned in both forms, `forms.button.retry` stays the L11 text and in the renderer key list, the R1 text exists in both forms without placeholders and in the catalog's form (Du/Sie), names the e-mail address, signing in and the password reset, does not list phone number, username or „Kennung“, the reused link labels are pinned, and no duplicate `registration.existing-account*` key exists.
- `registration.error.existing-account` is in `test/renderer-ui-keys.json`, because kratos-flow 0.3.1 requires it (`REQUIRED_UI_KEYS`). No consumer changes visibly: Hub and canou-auth pin older SHAs, the portal pins v0.2.3 and gets the longer passkey text with its next bump.
- Known limit: the `login.<method>.*` ceremony texts are for signing in only, and the longer L4b text („… kein Passkey gespeichert.“) is wrong when a passkey is being created. kratos-flow up to 0.3.0 also uses them for a create ceremony in a registration (`webauthnErrorKey` maps every flow except settings to `login.*`). This shows only when a portal adds the passkey or webauthn group to its registration layout; the default registration layout has neither, so the portal is not affected today. No `registration.passkey.*` key is added: the create texts `settings.<method>.{cancelled,exists,failed,unavailable}` („Das Anlegen des Passkeys wurde abgebrochen.“ …) fit a registration too, and kratos-flow should map the registration create ceremony to them. A test keeps those texts free of sign-in wording in both forms.

## 0.2.3

- New UI keys for the portal login extras (W1-voll PR7, plan §3.9) in `ui.de.json` (Du form) and `ui.de-sie.json` (Sie form):
  - `login.oidc.incomplete` („Die Anmeldung mit Google/Microsoft wurde nicht abgeschlossen.“, plan wording, same in both forms): `?sso_return=1` without a session. The portal used `login.error.complete-failed` until now. A portal with other providers overrides it.
  - `logout.done.message` and `logout.error.failed`: the texts of „Mit anderem Konto anmelden“ / sign out this device. The Sie form is word for word the portal's `LOGOUT_SUCCESS_MESSAGE` and `LOGOUT_FAILED_MESSAGE` (`src/auth/sso-logout.ts`).
- New UI keys for the error page and the verification end state (W1-voll PR8, plan §3.3, §3.9), plain German without technical terms and without the error id, each ending with signing in again („Neu anmelden“ stays `error.page.restart`):
  - `error.page.text-expired`: Kratos no longer knows the error id of the page (unknown or expired; `GET /self-service/errors?id=` finds no record).
  - `error.page.text-network`: the error could not be loaded (network failure).
  - `error.page.text.<error.id>` for the Kratos v26.2.0 error ids that reach the error UI as a stored self-service error (`text/message_error.go:21-24`): `security_csrf_violation`, `security_identity_mismatch`, `self_service_flow_return_to_forbidden`. kratos-flow 0.3.0 `KratosErrorView` already reads `error.page.text.<error.id>` when present; every other id keeps the generic `error.page.text`.
  - `forms.label.back-to-settings` („Zurück zu den Einstellungen“): verification done after an e-mail change goes back to the settings.
- Not added, because the keys exist: session notice (`login.session.*`), link step after 1010016 (`account-linking.title`, `login.step.link.hint`, message 1010016), refresh login (`login.title-refresh`, `settings.refresh-required`), aal2, passkey and security key (`login.second-factor.*`, `login.passkey.*`, `login.webauthn.*`), recovery/verification end states (`recovery.step.done.*`, `verification.step.done.*`, `forms.label.to-login`, `forms.button.continue`).
- Tests: every new key exists non-empty in both catalogs without placeholders, uses the catalog's form (Du/Sie) unless it does not address the user, the plan and portal wording is pinned, every `error.page.text.<id>` names one of the listed Kratos error ids in the form kratos-flow looks up, and the error page texts contain no technical terms.
- The keys are not in `test/renderer-ui-keys.json`, because kratos-flow does not require them; the portal reads them directly. No consumer changes visibly: Hub and canou-auth pin older SHAs, the portal pins v0.2.2.

## 0.2.2

- New UI keys for the e-mail change in settings (plan §6.9, S16, decision of 21.10.: confirmation dialog before submit) in `ui.de.json` (Du form) and `ui.de-sie.json` (Sie form), all in `test/renderer-ui-keys.json`:
  - `settings.profile.email.hint`: default hint at the e-mail form. The new address applies at once to the account in all connected services, including booking and invoice e-mails (S16, all three tenants); a code goes to the new address; the old address stops working at once for login and account recovery, even before the new one is confirmed; accounts that sign in only with a code by e-mail are locked out by a typo, so check carefully. A portal slot only overrides it.
  - `settings.profile.email.dialog.title` („Stimmt die neue E-Mail-Adresse?“), `settings.profile.email.dialog.text` (new address as `{email}`, like `settings.profile.email.confirm`), `settings.profile.email.dialog.confirm` („Ja, Adresse ändern“), `settings.profile.email.dialog.cancel` („Nein, korrigieren“): confirmation dialog before the settings submit.
- Tests: the five keys exist non-empty in both catalogs and in the renderer key list, `{email}` is in the dialog text of both forms and no other placeholder in the five keys, hint and dialog text use the catalog's form (Du/Sie), and the hint names all connected services, booking and invoice e-mails, code, old address, login, code-only sign-in and typo, and does not mention a password.
- No consumer changes visibly: `@wemotion/kratos-flow` reads the keys only after its follow-up PR; Hub and canou-auth pin older SHAs.

## 0.2.1

- New UI keys in `ui.de-sie.json` (Sie form) and `ui.de.json` (Du form), all in `test/renderer-ui-keys.json`:
  - `forms.error.retry`: text after the one automatic retry on a CSRF violation („Bitte versuchen Sie es noch einmal.“); `@wemotion/kratos-flow` used `forms.error.generic` until now.
  - `login.webauthn.unavailable`: security-key login is not possible on this device/browser; kratos-flow mapped it to `login.webauthn.failed` until now.
  - `forms.button.retry` („Erneut versuchen“): retry button next to the network/429 text (plan §3.7, test L11).
- `forms.error.network` now covers network failures and a CORS-less 429 in both forms: „Verbindungsproblem oder zu viele Versuche – bitte warten Sie einen Moment und versuchen Sie es erneut.“ (`ui.de-sie.json`) and „… – bitte warte einen Moment und versuch es erneut.“ (`ui.de.json`). In the browser a Kratos 429 has no CORS headers, so `fetch` throws a `TypeError` that cannot be told apart from a network failure. The key is new in 0.2.0; Hub and canou-auth pin older SHAs and do not read it, so neither changes visibly.
- Tests pin the plan wording of `forms.error.network`, `forms.error.retry` and `forms.button.retry`, and a reverse checker finds no Sie form in the Du catalogs `de.json` and `ui.de.json`.

## 0.2.0

- New locale `de-sie` (Sie form): `locales/de-sie.json` with all message IDs of `de.json` plus the Kratos v26.2.0 IDs 1010020, 4060003 and 4070004; `locales/ui.de-sie.json` with every UI key.
- New UI keys for the Kratos UI-node renderer in `ui.de.json` (Du form) and `ui.de-sie.json`: steps, buttons, browser checks, network/429 texts, settings sections, `oidc.provider.<id>`, QR alt text, backup-code file header.
- `createLocalizer({ locale, unknown, overrides, onMissing, mapContext })`: single translator for message IDs and UI keys, no cross-locale fallback, never empty. `mapContext: false` keeps Kratos' `property`/`provider` context unchanged, like `localizeUiText`.
- CI: `.github/workflows/test.yml` runs typecheck and tests on `ubuntu-latest`.
- `Locale` includes `"de-sie"`; new type `UiLocale`. `localizeUiText`/`fallbackLocale` unchanged.
- Tests (`npm test`): catalog parity, Kratos ID coverage, placeholders, Sie form, umlauts, renderer keys, localizer.

## 0.1.0

- German (Du form) Kratos message catalog, UI strings, app copy and courier templates.
