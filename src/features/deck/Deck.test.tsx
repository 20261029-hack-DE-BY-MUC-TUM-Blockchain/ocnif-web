import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { deckDictionaries } from "@/lib/i18n/deck";
import { deckEnglish } from "@/lib/i18n/deck/en";
import { DeckSlideView } from "./DeckSlideView";
import { DeckVisual } from "./DeckVisual";
import { deckSlides, initialSlideIndex, keyboardSlide } from "./slides";

const slides = deckSlides(deckEnglish);
test("deck navigation reaches every network proof and keeps keyboard bounds", () => {
  assert.equal(new Set(slides.map((slide) => slide.id)).size, 13);
  for (const id of ["user-workflow", "architecture", "cardano", "api3", "bsv"])
    assert.equal(slides[initialSlideIndex(slides, id)].id, id);
  assert.equal(initialSlideIndex(slides, "unknown"), 0);
  assert.equal(keyboardSlide(0, "ArrowLeft", slides.length), 0);
  assert.equal(keyboardSlide(12, "ArrowRight", slides.length), 12);
  assert.equal(keyboardSlide(0, "End", slides.length), 12);
  assert.equal(keyboardSlide(12, "Home", slides.length), 0);
  assert.equal(keyboardSlide(0, "Enter", slides.length), undefined);
});

test("captured-step GIFs require playback consent and expose their recording limit", () => {
  for (const slide of slides.filter((item) => item.media?.preview)) {
    const media = slide.media;
    assert.ok(media);
    const html = renderToStaticMarkup(
      <DeckVisual media={media} copy={deckEnglish} />,
    );
    assert.ok(html.includes(`src="${media.src}"`));
    assert.ok(!html.includes(`src="${media.preview}"`));
    assert.match(html, /aria-pressed="false"/);
    assert.ok(html.includes(deckEnglish.previewNote));
    assert.ok(html.includes("alt="));
  }
});

test("each locale preserves the same slides and explicit network evidence boundaries", () => {
  for (const [locale, copy] of Object.entries(deckDictionaries)) {
    if (locale !== "en") assert.notEqual(copy.heroTitle, deckEnglish.heroTitle);
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(deckEnglish).sort());
    assert.ok(Object.values(copy).every((value) => value.trim().length > 0));
    const localized = deckSlides(copy);
    assert.deepEqual(
      localized.map((slide) => slide.id),
      slides.map((slide) => slide.id),
    );
    for (const id of ["cardano", "api3", "bsv"])
      assert.ok(localized.find((slide) => slide.id === id)?.status);
    const final = localized.at(-1);
    assert.ok(final);
    const html = renderToStaticMarkup(
      <DeckSlideView slide={final} copy={copy} number={13} count={13} />,
    );
    assert.ok(html.includes(copy.nextTitle));
    assert.ok(html.includes('href="/workspace"'));
  }
});

test("the shipped deck uses real supplied local visuals with no missing or active SVG assets", () => {
  const assets = new Set(
    slides.flatMap((slide) =>
      slide.media
        ? [
            slide.media.src,
            ...(slide.media.preview ? [slide.media.preview] : []),
          ]
        : [],
    ),
  );
  assert.equal(assets.size, 14);
  for (const asset of assets) {
    assert.match(asset, /^\/deck\/20261031\/[a-z0-9-]+\.(png|gif|svg)$/);
    const bytes = readFileSync(join(process.cwd(), "public", asset));
    assert.ok(bytes.byteLength > 1000, asset);
    if (asset.endsWith(".png"))
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    if (asset.endsWith(".gif"))
      assert.match(bytes.subarray(0, 6).toString(), /^GIF8[79]a$/);
    if (asset.endsWith(".svg")) {
      const svg = bytes.toString();
      assert.match(svg, /<svg\b/);
      assert.doesNotMatch(
        svg,
        /<script\b|<foreignObject\b|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|javascript:|data:)/i,
      );
    }
  }
});
