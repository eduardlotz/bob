import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { SOCIAL_LINKS } from "../socials/contentData";
import { getSocialLogoDataUrl } from "../socials/helper";
import type { SocialLink } from "../socials/types";
import { useSocialCorner } from "./useSocialCorner";
import { useViewStore } from "@/store";
import { useFloatingBar } from "@/layout/FloatingBar";
import { useCursorStore } from "@/store/core/cursor";
import { useI18n } from "@/i18n";
import { viewControlsMessages } from "@/molecules/ViewControls.messages";
import { BlenderRoomPart } from "./BlenderRoomPart";
import { useAboutWeather } from "./AboutWeather";

function Poster({ link, index }: { link: SocialLink; index: number }) {
  const enterCorner = useSocialCorner("computer");
  const weather = useAboutWeather();
  const { setHoveredObject } = useFloatingBar();
  const { locale } = useI18n();
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 384;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = link.id === "x" ? "#171717" : link.id === "linkedin" ? "#0a66c2" : link.color;
    ctx.beginPath(); ctx.roundRect(0, 0, 384, 384, 34); ctx.fill();
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace; return map;
  }, [link]);
  useEffect(() => {
    let active = true; const icon = new Image();
    icon.onload = () => {
      if (!active) return;
      (texture.image as HTMLCanvasElement).getContext("2d")!.drawImage(icon, 92, 92, 200, 200); texture.needsUpdate = true;
    };
    icon.src = getSocialLogoDataUrl(link);
    return () => { active = false; texture.dispose(); };
  }, [link, texture]);
  const leave = () => { setHoveredObject(null); useCursorStore.getState().setHoveringClickable(false); };
  return <group position={[(index % 3 - 1) * 0.73, 3.88 - Math.floor(index / 3) * 0.75, 0.025]}
   
    onPointerEnter={event => {
      event.stopPropagation(); useCursorStore.getState().setHoveringClickable(true);
      setHoveredObject({ title: useViewStore.getState().currentView === "computer" ? link.label : viewControlsMessages[locale].viewTitles.computer });
    }} onPointerLeave={leave}
    onClick={event => {
      event.stopPropagation(); leave(); if (event.delta > 5 || !enterCorner()) return;
      window.open(link.href, "_blank", "noopener,noreferrer");
    }}>
    <BlenderRoomPart name={`Social_${index}`} local />
    <mesh position={[0, 0, 0.047]}><planeGeometry args={[0.62, 0.62]} />
      <meshBasicMaterial map={texture} color="#b5becd" transparent toneMapped={false}
        customProgramCacheKey={() => "about-social-lit-v3"}
        onBeforeCompile={shader => {
          shader.uniforms.uAboutFlash = weather.flash;
          shader.fragmentShader = "uniform float uAboutFlash;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb*=mix(.92,1.04,vMapUv.y)*(1.+uAboutFlash*.4);");
        }} />
    </mesh>
  </group>;
}
export function SocialPosters() {
  return <>{SOCIAL_LINKS.map((link, index) => <Poster key={link.id} link={link} index={index} />)}</>;
}
