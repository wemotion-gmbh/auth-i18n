import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildValues, interpolate } from "./interpolate.ts";

const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);
const inMinutes = (minutes: number) => NOW / 1000 + minutes * 60;

describe("buildValues - relative minutes from <key>_unix", () => {
  it("fills <key>_until_minutes for a time ahead (message 1060001)", () => {
    const text = interpolate(
      "innerhalb der nächsten {privileged_session_expires_at_unix_until_minutes} Minuten",
      { privileged_session_expires_at_unix: inMinutes(15) },
      NOW,
    );
    assert.equal(text, "innerhalb der nächsten 15 Minuten");
  });

  it("rounds instead of flooring and never goes below zero", () => {
    const values = buildValues({ a_unix: inMinutes(14.6), b_unix: inMinutes(-3) }, NOW);
    assert.equal(values.a_unix_until_minutes, "15");
    assert.equal(values.a_unix_since_minutes, "0");
    assert.equal(values.b_unix_until_minutes, "0");
    assert.equal(values.b_unix_since_minutes, "3");
  });

  it("keeps values Kratos sends itself", () => {
    const values = buildValues({ x_unix: inMinutes(30), x_unix_until_minutes: 7 }, NOW);
    assert.equal(values.x_unix_until_minutes, "7");
    assert.equal(values.x_unix_since_minutes, "0");
  });

  it("keeps the existing conventions (_list, readable date) and leaves unknown placeholders", () => {
    const values = buildValues({ ids: ["a", "b"], t_unix: inMinutes(0) }, NOW);
    assert.equal(values.ids_list, "a, b");
    assert.ok(values.t && values.t.length > 0);
    assert.equal(interpolate("{missing}", {}, NOW), "{missing}");
  });

  it("derives nothing from a non-numeric or non-finite _unix value", () => {
    const values = buildValues({ s_unix: "soon", n_unix: Number.NaN }, NOW);
    assert.equal("s_unix_until_minutes" in values, false);
    assert.equal("n_unix_until_minutes" in values, false);
  });
});
