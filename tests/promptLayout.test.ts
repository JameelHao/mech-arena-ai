import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROMPT_LAYOUT,
  buildContainerStyle,
  buildInstallBannerStyle,
  buildSaveButtonStyle,
  buildTextareaStyle,
} from "../src/utils/promptLayout";

describe("PROMPT_LAYOUT config", () => {
  it("container width is 280px (wider than old 220px)", () => {
    assert.equal(PROMPT_LAYOUT.container.width, "280px");
  });

  it("container gap is 8px (larger than old 4px)", () => {
    assert.equal(PROMPT_LAYOUT.container.gap, "8px");
  });

  it("container margins are 12px (larger than old 8px)", () => {
    assert.equal(PROMPT_LAYOUT.container.bottom, "12px");
    assert.equal(PROMPT_LAYOUT.container.left, "12px");
  });

  it("container has responsive maxWidth", () => {
    assert.equal(PROMPT_LAYOUT.container.maxWidth, "calc(100vw - 24px)");
  });

  it("textarea height is 80px (taller than old 60px)", () => {
    assert.equal(PROMPT_LAYOUT.textarea.height, "80px");
  });

  it("textarea padding is 8px (larger than old 6px)", () => {
    assert.equal(PROMPT_LAYOUT.textarea.padding, "8px");
  });

  it("save button padding is 6px 16px (larger than old 4px 12px)", () => {
    assert.equal(PROMPT_LAYOUT.saveButton.padding, "6px 16px");
  });

  it("install banner bottom accounts for taller prompt area", () => {
    assert.equal(PROMPT_LAYOUT.installBanner.bottom, "112px");
    assert.equal(PROMPT_LAYOUT.installBanner.left, "12px");
  });
});

describe("buildContainerStyle", () => {
  it("produces valid CSS with all layout properties", () => {
    const css = buildContainerStyle(PROMPT_LAYOUT.container);
    assert.ok(css.includes("position:fixed"));
    assert.ok(css.includes("bottom:12px"));
    assert.ok(css.includes("left:12px"));
    assert.ok(css.includes("width:280px"));
    assert.ok(css.includes("max-width:calc(100vw - 24px)"));
    assert.ok(css.includes("gap:8px"));
    assert.ok(css.includes("flex-direction:column"));
  });

  it("ends with semicolon", () => {
    const css = buildContainerStyle(PROMPT_LAYOUT.container);
    assert.ok(css.endsWith(";"));
  });
});

describe("buildTextareaStyle", () => {
  it("includes height and padding from config", () => {
    const css = buildTextareaStyle(PROMPT_LAYOUT.textarea);
    assert.ok(css.includes("height:80px"));
    assert.ok(css.includes("padding:8px"));
  });

  it("includes box-sizing for correct width calculation", () => {
    const css = buildTextareaStyle(PROMPT_LAYOUT.textarea);
    assert.ok(css.includes("box-sizing:border-box"));
  });

  it("has width 100% to fill container", () => {
    const css = buildTextareaStyle(PROMPT_LAYOUT.textarea);
    assert.ok(css.includes("width:100%"));
  });
});

describe("buildSaveButtonStyle", () => {
  it("includes padding from config", () => {
    const css = buildSaveButtonStyle(PROMPT_LAYOUT.saveButton);
    assert.ok(css.includes("padding:6px 16px"));
  });

  it("has cursor pointer for clickability", () => {
    const css = buildSaveButtonStyle(PROMPT_LAYOUT.saveButton);
    assert.ok(css.includes("cursor:pointer"));
  });
});

describe("buildInstallBannerStyle", () => {
  it("uses updated bottom position to avoid overlap", () => {
    const css = buildInstallBannerStyle(PROMPT_LAYOUT.installBanner);
    assert.ok(css.includes("bottom:112px"));
    assert.ok(css.includes("left:12px"));
  });

  it("has higher z-index than prompt container", () => {
    const css = buildInstallBannerStyle(PROMPT_LAYOUT.installBanner);
    assert.ok(css.includes("z-index:200"));
  });
});

describe("mobile responsiveness", () => {
  it("container maxWidth prevents overflow on narrow screens", () => {
    // The max-width uses calc(100vw - 24px) which equals 12px margin on each side
    const maxWidth = PROMPT_LAYOUT.container.maxWidth;
    assert.ok(maxWidth.includes("100vw"));
    assert.ok(maxWidth.includes("24px"));
  });
});
