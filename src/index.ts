/**
 * @wemotion/auth-i18n — zentraler deutscher i18n-Katalog fuer Ory Kratos.
 *
 * Warum dieses Paket existiert: Self-hosted (OSS) Kratos kann seine UI-/Fehlertexte
 * NICHT serverseitig uebersetzen — die Texte sind als englische Strings ins Binary
 * kompiliert, es gibt keinen Config-Key dafuer (das "Uebersetzungen-pro-Sprache"-
 * Feature ist Ory-Network-Cloud-only). Kratos liefert aber zu JEDER Meldung eine
 * stabile numerische ID + ein `context`-Objekt. Wir mappen die ID -> deutschen Text.
 * Das ist KEIN String-Sniffing: der englische `text` wird nie inspiziert, nur die
 * `id` als Schluessel und `context` als Werte genutzt. Die ID aendert sich laut Ory nie.
 *
 * Einbinden ueberall, wo Kratos-Flows gerendert werden (Hub, canou-app, admin, ...).
 */

import deMessages from "../locales/de.json";
import deSieMessages from "../locales/de-sie.json";
import enMessages from "../locales/en.json";
import uiDe from "../locales/ui.de.json";
import uiDeSie from "../locales/ui.de-sie.json";
import appCopyDe from "../locales/app-copy.de.json";
import { interpolate, type Context } from "./interpolate";

export type UiTextType = "info" | "error" | "success";
/** "de" = Du-Form (Hub, canou-app), "de-sie" = Sie-Form (Portale), "en" = Kratos-Referenz. */
export type Locale = "de" | "de-sie" | "en";

/** Eine Kratos-UI-Meldung, wie sie in flow.ui.messages[] / node.messages[] / node.meta.label steht. */
export interface UiText {
  id: number;
  text: string;
  type?: UiTextType;
  context?: Context;
}

const catalogs: Record<Locale, Record<string, string>> = {
  de: deMessages as Record<string, string>,
  "de-sie": deSieMessages as Record<string, string>,
  en: enMessages as Record<string, string>,
};

export interface LocalizeOptions {
  /** Zielsprache. Default: "de". */
  locale?: Locale;
  /** Fallback-Sprache, falls die ID in `locale` fehlt. Default: "en". */
  fallbackLocale?: Locale;
}

/**
 * Uebersetzt eine einzelne Kratos-Meldung: Katalog-Lookup per ID, dann ICU-Interpolation
 * der `context`-Werte. Letzter Fallback ist Kratos' eigener (englischer) `text`, damit eine
 * neue, noch nicht uebersetzte ID nie leer bleibt.
 */
export function localizeUiText(msg: UiText, opts: LocalizeOptions = {}): string {
  const locale = opts.locale ?? "de";
  const fallback = opts.fallbackLocale ?? "en";
  const key = String(msg.id);
  const template = catalogs[locale]?.[key] ?? catalogs[fallback]?.[key] ?? msg.text;
  return interpolate(template, msg.context ?? {});
}

export interface KratosUiNode {
  messages?: UiText[];
  meta?: { label?: UiText };
  attributes?: Record<string, unknown>;
}
export interface KratosUi {
  messages?: UiText[];
  nodes?: KratosUiNode[];
}
export interface KratosFlow {
  ui: KratosUi;
}

export interface LocalizedMessage {
  id: number;
  type: UiTextType;
  text: string;
}

/** Sammelt und uebersetzt alle Meldungen eines Flows (flow-weit + pro Feld). */
export function localizeFlowMessages(flow: KratosFlow, opts?: LocalizeOptions): LocalizedMessage[] {
  const out: LocalizedMessage[] = [];
  const push = (m?: UiText) => {
    if (m) out.push({ id: m.id, type: m.type ?? "info", text: localizeUiText(m, opts) });
  };
  flow.ui?.messages?.forEach(push);
  flow.ui?.nodes?.forEach((n) => n.messages?.forEach(push));
  return out;
}

/** Uebersetzt das Label/den Button-Text eines UI-Node (node.meta.label). */
export function localizeLabel(node: KratosUiNode, opts?: LocalizeOptions): string | undefined {
  return node.meta?.label ? localizeUiText(node.meta.label, opts) : undefined;
}

export { interpolate } from "./interpolate";
export type { Context } from "./interpolate";

/** Rohe Kataloge — fuer direktes Verdrahten in ein i18n-Framework (i18next-Resource o.ae.). */
export const messages = catalogs;
/** Nicht-numerische UI-Strings (Seitentitel, Buttons aus @ory/elements: login.title, consent.* ...). */
export const uiStrings: Record<UiLocale, Record<string, string>> = {
  de: uiDe as Record<string, string>,
  "de-sie": uiDeSie as Record<string, string>,
};
/** App-seitige Copy (Validierung, OAuth-Callback-Fehler, Headings) — dot-gekeyt, NICHT von Kratos. */
export const appCopy = { de: appCopyDe as Record<string, string> };

// ---------------------------------------------------------------------------
// createLocalizer: the single translator for Kratos messages and UI keys.
// ---------------------------------------------------------------------------

/** Locales with a complete UI catalog (`uiStrings`). "en" joins once it is complete. */
export type UiLocale = "de" | "de-sie";

/**
 * What to show for a message ID the catalog does not know:
 *  - "kratos":  Kratos' own (English) `text`, like `localizeUiText` does today.
 *  - "generic": a generic text per message type from the UI catalog, never English.
 */
export type UnknownMessageMode = "kratos" | "generic";

export interface MissingTextEvent {
  /** `message_id_missing`: Kratos message ID not in the catalog; `ui_key_missing`: UI key not in the catalog. */
  code: "message_id_missing" | "ui_key_missing";
  locale: UiLocale;
  /** Set for `message_id_missing`. Only the ID, never the message text or context (may hold user data). */
  id?: number;
  /** Set for `ui_key_missing`. */
  key?: string;
}

export interface LocalizerOptions {
  locale: UiLocale;
  /** Default: "kratos". */
  unknown?: UnknownMessageMode;
  /**
   * Portal-specific texts, keyed like the catalogs: numeric message IDs ("4000006") or
   * UI keys ("login.step.identifier.title"). They win over the catalogs.
   */
  overrides?: Readonly<Record<string, string>>;
  /** Called once per lookup that falls back to a generic text. */
  onMissing?: (event: MissingTextEvent) => void;
}

export interface MessageOptions {
  /**
   * Translated label of the node that carries the message. Kratos puts only the last
   * path segment into `context.property` ("first", "email"); the node label reads better.
   * Without it, `property.<segment>` from the UI catalog is used, then the raw segment.
   */
  propertyLabel?: string;
}

export interface LocalizedText {
  text: string;
  /** false when the ID is not in the catalog (and no override exists). */
  known: boolean;
}

export interface Localizer {
  readonly locale: UiLocale;
  /** Translates a Kratos message (flow/node message or node label). Never returns an empty text. */
  message(msg: UiText, opts?: MessageOptions): LocalizedText;
  /** Looks up a UI key and interpolates `{name}` placeholders. Never returns an empty text. */
  ui(key: string, values?: Context): string;
  /** True when the UI key exists (override or catalog). */
  hasUi(key: string): boolean;
  /** Display name of an OIDC provider id ("google" -> "Google"). */
  provider(id: string): string;
}

const GENERIC_BY_TYPE: Record<UiTextType, string> = {
  error: "forms.error.generic",
  info: "forms.info.generic",
  success: "forms.success.generic",
};
const TEXT_UNAVAILABLE = "forms.text-unavailable";

function nonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value !== "";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Creates the translator for one locale. Lookup order for messages: overrides -> catalog
 * of `locale` -> unknown mode. For UI keys: overrides -> `uiStrings[locale]` -> generic
 * text. It never falls back to another locale (no `fallbackLocale`), so a Sie portal never
 * shows a Du text and vice versa.
 */
export function createLocalizer(opts: LocalizerOptions): Localizer {
  const { locale } = opts;
  const unknown: UnknownMessageMode = opts.unknown ?? "kratos";
  const overrides = opts.overrides ?? {};
  const catalog = catalogs[locale];
  const ui = uiStrings[locale];

  const lookupUi = (key: string): string | undefined => {
    const override = overrides[key];
    if (nonEmpty(override)) return override;
    const value = ui[key];
    return nonEmpty(value) ? value : undefined;
  };

  const uiText = (key: string, values?: Context): string => {
    const template = lookupUi(key);
    if (template !== undefined) return interpolate(template, values ?? {});
    opts.onMissing?.({ code: "ui_key_missing", locale, key });
    return lookupUi(TEXT_UNAVAILABLE) ?? key;
  };

  const provider = (id: string): string => {
    const key = `oidc.provider.${id.toLowerCase()}`;
    return lookupUi(key) ?? capitalize(id);
  };

  const message = (msg: UiText, messageOpts: MessageOptions = {}): LocalizedText => {
    const key = String(msg.id);
    const template = overrides[key] ?? catalog[key];
    if (nonEmpty(template)) {
      return { text: interpolate(template, messageContext(msg.context, messageOpts)), known: true };
    }
    opts.onMissing?.({ code: "message_id_missing", locale, id: msg.id });
    if (unknown === "kratos" && nonEmpty(msg.text)) return { text: msg.text, known: false };
    return { text: uiText(GENERIC_BY_TYPE[msg.type ?? "info"] ?? GENERIC_BY_TYPE.info), known: false };
  };

  const messageContext = (context: Context | undefined, messageOpts: MessageOptions): Context => {
    const out: Context = { ...(context ?? {}) };
    const providerId = typeof out.provider_id === "string" && out.provider_id !== "" ? out.provider_id : out.provider;
    if (typeof providerId === "string" && providerId !== "") out.provider = provider(providerId);
    if (typeof out.property === "string" && out.property !== "") {
      const segment = out.property.split(".").pop() ?? out.property;
      out.property = nonEmpty(messageOpts.propertyLabel)
        ? messageOpts.propertyLabel
        : (lookupUi(`property.${segment}`) ?? segment);
    }
    return out;
  };

  return {
    locale,
    message,
    ui: uiText,
    hasUi: (key: string) => lookupUi(key) !== undefined,
    provider,
  };
}
