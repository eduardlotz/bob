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
import { FillRow, HugRow } from "..";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { useCoreStore } from "@/store";
import { useI18n } from "@/i18n";

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
  position?: [number, number, number];
  rotation?: [number, number, number];
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { cookiesAccepted, acceptCookies } = useCoreStore();
  const { messages } = useI18n();

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
        transition={{ type: "spring" as const, bounce: 0.5, delay: 0.5 }}
      >
        <OverlayBody key="music-ui-body">
          {!cookiesAccepted ? (
            <div
              style={{
                height: 250,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 16,
                padding: 20,
                textAlign: "center",
                background: "#212121",
                borderRadius: "2rem",
              }}
            >
              <p>{messages.music.cookieNotice}</p>

              <SoundcloudButton
                onClick={acceptCookies}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                }}
              >
                {messages.music.loadPlayer}
              </SoundcloudButton>
            </div>
          ) : (
            <iframe
              key={currentIndex}
              width="100%"
              height="350"
              allow="autoplay"
              src={embedUrl}
              style={{ border: "none", display: "block" }}
            />
          )}
        </OverlayBody>

        {cookiesAccepted && (
          <PaginationDots $contrastMode>
            <PaginationButton onClick={prevTrack}>
              <ChevronLeftIcon />
            </PaginationButton>

            <HugRow $gap={"4px"}>
              {Array(total)
                .fill(null)
                .map((_, i) => (
                  <motion.div
                    key={`music_pagination_dot_${i}`}
                    animate={{
                      width: currentIndex === i ? "20px" : "8px",
                      opacity: currentIndex === i ? 1 : 0.5,
                    }}
                  />
                ))}
            </HugRow>

            <PaginationButton onClick={nextTrack}>
              <ChevronRightIcon />
            </PaginationButton>
          </PaginationDots>
        )}
      </ShopContainer>
    </FixedAnchor>
  );

  return (
    <group>
      <Html>
        {createPortal(
          NavigationOverlays,
          document.getElementById("motion-root")!,
        )}
      </Html>
    </group>
  );
};
const OverlayBody = styled(motion.div)`
  padding: 0px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0px;
  width: 350px;
  max-width: 600px;
  border-radius: 8px;
  overflow: clip;

  * {
    margin: 0;
    padding: 0;
  }
`;

export const SoundcloudButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;

  padding: 12px 32px;
  min-width: 200px;

  border-radius: 9999px;

  font-weight: 600;
  font-family: "Open Sauce Two";
  font-size: 1rem;
  color: #ffffff;
  text-decoration: none;
  text-align: center;

  background: linear-gradient(180deg, #f87903 0%, #c56308 100%);

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 -1px 1px rgba(0, 0, 0, 0.15);

  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background: linear-gradient(180deg, #ff9f38 0%, #e66610 100%);

    color: white;
  }
`;
