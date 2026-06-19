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
import enMessages from "../locales/en.json";
import uiDe from "../locales/ui.de.json";
import appCopyDe from "../locales/app-copy.de.json";
import { interpolate, type Context } from "./interpolate";

export type UiTextType = "info" | "error" | "success";
export type Locale = "de" | "en";

/** Eine Kratos-UI-Meldung, wie sie in flow.ui.messages[] / node.messages[] / node.meta.label steht. */
export interface UiText {
  id: number;
  text: string;
  type?: UiTextType;
  context?: Context;
}

const catalogs: Record<Locale, Record<string, string>> = {
  de: deMessages as Record<string, string>,
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
export const uiStrings = { de: uiDe as Record<string, string> };
/** App-seitige Copy (Validierung, OAuth-Callback-Fehler, Headings) — dot-gekeyt, NICHT von Kratos. */
export const appCopy = { de: appCopyDe as Record<string, string> };
