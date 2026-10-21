# Changelog

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
