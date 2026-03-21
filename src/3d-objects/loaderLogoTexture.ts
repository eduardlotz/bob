import { useLoader } from "@react-three/fiber";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as THREE from "three";

import { Logo } from "@/layout/atoms";

const loaderLogoSvg = renderToStaticMarkup(React.createElement(Logo)).replace(
  'style="',
  'style="color:#ffffff;',
);

const loaderLogoDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(loaderLogoSvg)}`;

export const useLoaderLogoTexture = () => {
  const texture = useLoader(THREE.TextureLoader, loaderLogoDataUrl);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};
