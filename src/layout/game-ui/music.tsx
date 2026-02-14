import {
  ContentControls,
  FixedAnchor,
  PaginationButton,
  PaginationDots,
  ShopContainer,
} from "@/apps/ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { Html } from "@react-three/drei";
import { motion } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { FillRow } from "..";

const SOUNDCLOUD_URLS = [
  "https://soundcloud.com/captainlowie/ist-das-leben-nicht-schoen",
  "https://soundcloud.com/captainlowie/hassliebe-fast-version",
  "https://soundcloud.com/captainlowie/warum-edit",
  "https://soundcloud.com/captainlowie/du-fehlst-fast-version",
  "https://soundcloud.com/captainlowie/soundcheck-1",
  "https://soundcloud.com/captainlowie/milch",
  "https://soundcloud.com/captainlowie/frechdachs",
];

const toEmbedUrl = (shareUrl: string) => {
  const cleanUrl = shareUrl.split("?")[0];
  return (
    `https://w.soundcloud.com/player/` +
    `?url=${encodeURIComponent(cleanUrl)}` +
    `&color=%23ff5500` +
    `&auto_play=false` +
    `&hide_related=true` +
    `&show_comments=false` +
    `&show_user=true` +
    `&show_reposts=false` +
    `&show_teaser=false` +
    `&visual=true`
  );
};

export const MusicOverlay = (props: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = SOUNDCLOUD_URLS.length;

  const nextTrack = () => setCurrentIndex((i) => (i + 1) % total);
  const prevTrack = () => setCurrentIndex((i) => (i - 1 + total) % total);

  const embedUrl = toEmbedUrl(SOUNDCLOUD_URLS[currentIndex]);

  const NavigationOverlays = (
    <FixedAnchor>
      <ShopContainer
        key="music-navigations-container"
        initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(6px)" }}
        animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scaleX: 0.9, y: 80, filter: "blur(6px)" }}
        transition={{
          type: "spring" as const,
          bounce: 0.5,
        }}
      >
        <ContentControls>
          <FillRow $justify="space-between">
            <PaginationButton onClick={prevTrack}>
              <ArrowLeftIcon />
            </PaginationButton>

            <PaginationButton onClick={nextTrack}>
              <ArrowRightIcon />
            </PaginationButton>
          </FillRow>

          <PaginationDots>
            {Array(total)
              .fill(null)
              .map((_, i) => (
                <motion.span
                  key={`music_pagination_dot_${i}`}
                  animate={{
                    width: currentIndex === i ? "20px" : "8px",
                    opacity: currentIndex === i ? 1 : 0.5,
                  }}
                />
              ))}
          </PaginationDots>
        </ContentControls>
      </ShopContainer>
    </FixedAnchor>
  );

  return (
    <>
      <group>
        <Html
          position={props.position}
          transform
          scale={[0.08, 0.08, 0.08]}
          rotation={props.rotation}
        >
          <OverlayBody key="music-ui-body">
            <iframe
              key={currentIndex}
              width="100%"
              height="250"
              allow="autoplay"
              src={embedUrl}
              style={{ border: "none", display: "block" }}
            />
          </OverlayBody>

          {createPortal(
            NavigationOverlays,
            document.getElementById("motion-root")!,
          )}
        </Html>
      </group>
    </>
  );
};

const OverlayBody = styled(motion.div)`
  padding: 0px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0px;
  max-width: 600px;

  * {
    margin: 0;
    padding: 0;
  }
`;

const NavRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 6px 12px;
`;

const NavButton = styled.button`
  background: none;
  border: 1px solid black;
  border-radius: 4px;
  color: black;
  cursor: pointer;

  padding: 2px 12px 4px;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: black;
    color: #fff;
  }

  &:active {
    background: black;
  }
`;

const TrackCounter = styled.span`
  font-size: 0.75rem;
  color: black;
`;
