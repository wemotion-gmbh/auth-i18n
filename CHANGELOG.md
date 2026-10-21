# Changelog

## 0.2.0

- New locale `de-sie` (Sie form): `locales/de-sie.json` with all message IDs of `de.json` plus the Kratos v26.2.0 IDs 1010020, 4060003 and 4070004; `locales/ui.de-sie.json` with every UI key.
- New UI keys for the Kratos UI-node renderer in `ui.de.json` (Du form) and `ui.de-sie.json`: steps, buttons, browser checks, network/429 texts, settings sections, `oidc.provider.<id>`, QR alt text, backup-code file header.
- `createLocalizer({ locale, unknown, overrides, onMissing, mapContext })`: single translator for message IDs and UI keys, no cross-locale fallback, never empty. `mapContext: false` keeps Kratos' `property`/`provider` context unchanged, like `localizeUiText`.
- CI: `.github/workflows/test.yml` runs typecheck and tests on `ubuntu-latest`.
- `Locale` includes `"de-sie"`; new type `UiLocale`. `localizeUiText`/`fallbackLocale` unchanged.
- Tests (`npm test`): catalog parity, Kratos ID coverage, placeholders, Sie form, umlauts, renderer keys, localizer.

## 0.1.0

- German (Du form) Kratos message catalog, UI strings, app copy and courier templates.
