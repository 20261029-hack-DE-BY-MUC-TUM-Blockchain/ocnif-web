"use client";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import type { DeckCopy } from "@/lib/i18n/deck";
import styles from "./Deck.module.css";
import type { DeckMedia } from "./slides";

export function DeckVisual({
  media,
  copy,
}: {
  media: DeckMedia;
  copy: DeckCopy;
}) {
  const [playing, setPlaying] = useState(false);
  const source = playing && media.preview ? media.preview : media.src;
  return (
    <figure className={styles.figure}>
      <div className={styles.visualFrame}>
        <div className={styles.visualBar}>
          <span>
            <Icon name={media.diagram ? "layers" : "eye"} />
            {media.diagram
              ? copy.diagram
              : playing
                ? copy.capturedSteps
                : copy.capture}
          </span>
          <a href={source} target="_blank" rel="noopener noreferrer">
            {copy.openVisual}
            <Icon name="arrow" />
          </a>
        </div>
        {/* Native images retain the supplied screenshot/GIF pixels without re-encoding. */}
        {/* biome-ignore lint/performance/noImgElement: Real captures and animated GIFs must use their original same-origin assets. */}
        <img
          src={source}
          alt={media.caption}
          width={media.diagram ? 1600 : 1440}
          height={playing && media.preview ? 960 : 900}
          className={styles.visual}
          decoding="async"
        />
      </div>
      <figcaption className={styles.caption}>
        <div>
          <p>{media.caption}</p>
          <span>{copy.captureLanguage}</span>
        </div>
        {media.preview && (
          <Button
            variant="secondary"
            onClick={() => setPlaying(!playing)}
            aria-pressed={playing}
          >
            <Icon name={playing ? "stop" : "play"} />
            {playing ? copy.pausePreview : copy.playPreview}
          </Button>
        )}
      </figcaption>
      {media.preview && (
        <p className={styles.previewNote}>{copy.previewNote}</p>
      )}
    </figure>
  );
}
