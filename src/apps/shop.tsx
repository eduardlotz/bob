import { usePagination } from "@/hooks/usePagination";
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons/arrow";
import { FillRow, HugColumn, HugRow } from "@/layout";
import { MOTION_VARIANTS } from "@/molecules/HeadNavigation";
import { formatNumber } from "@/molecules/TapCounter";
import {
  CameraViewId,
  getShopItemType,
  ShopItem,
  useCoreStore,
  useViewStore,
} from "@/store";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { match } from "ts-pattern";
import {
  ItemStatusChip,
  FixedAnchor,
  ShopContainer,
  ContentControls,
  PaginationButton,
  ShopItemButton,
  PaginationDots,
  TabPanel,
  TabButton,
} from "./ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";

export const ShopIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_ii_3758_756)">
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="white"
      />
      <g
        clipPath="url(#paint0_diamond_3758_756_clip_path)"
        data-figma-skip-parse="true"
      >
        <g transform="matrix(0 0.05 -0.05 0 50 50)">
          <rect
            x={0}
            y={0}
            width={1050}
            height={1050}
            fill="url(#paint0_diamond_3758_756)"
            opacity={1}
            shapeRendering="crispEdges"
          />
          <rect
            x={0}
            y={0}
            width={1050}
            height={1050}
            transform="scale(1 -1)"
            fill="url(#paint0_diamond_3758_756)"
            opacity={1}
            shapeRendering="crispEdges"
          />
          <rect
            x={0}
            y={0}
            width={1050}
            height={1050}
            transform="scale(-1 1)"
            fill="url(#paint0_diamond_3758_756)"
            opacity={1}
            shapeRendering="crispEdges"
          />
          <rect
            x={0}
            y={0}
            width={1050}
            height={1050}
            transform="scale(-1)"
            fill="url(#paint0_diamond_3758_756)"
            opacity={1}
            shapeRendering="crispEdges"
          />
        </g>
      </g>
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        data-figma-gradient-fill="{&#34;type&#34;:&#34;GRADIENT_DIAMOND&#34;,&#34;stops&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&#34;g&#34;:1.0,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.95431119203567505,&#34;g&#34;:0.97335463762283325,&#34;b&#34;:0.68770307302474976,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;stopsVar&#34;:[{&#34;color&#34;:{&#34;r&#34;:1.0,&#34;g&#34;:1.0,&#34;b&#34;:1.0,&#34;a&#34;:1.0},&#34;position&#34;:0.0},{&#34;color&#34;:{&#34;r&#34;:0.95431119203567505,&#34;g&#34;:0.97335463762283325,&#34;b&#34;:0.68770307302474976,&#34;a&#34;:1.0},&#34;position&#34;:1.0}],&#34;transform&#34;:{&#34;m00&#34;:6.1232342099862801e-15,&#34;m01&#34;:-100.0,&#34;m02&#34;:100.0,&#34;m10&#34;:100.0,&#34;m11&#34;:6.1232342099862801e-15,&#34;m12&#34;:-6.1232342099862801e-15},&#34;opacity&#34;:1.0,&#34;blendMode&#34;:&#34;NORMAL&#34;,&#34;visible&#34;:true}"
      />
      <path
        d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z"
        fill="url(#paint1_radial_3758_756)"
      />
    </g>
    <g filter="url(#filter1_dii_3758_756)">
      <path
        d="M63.1501 47.5428C64.0041 47.5994 64.8008 47.9926 65.3662 48.6351C66.066 49.4303 67.1152 51.0001 67.7371 52.7617C67.9642 53.4052 68.0101 53.4893 68.0755 53.7447C68.1413 54.0019 68.2093 54.3854 68.3792 55.4586C68.6367 57.086 68.523 59.5322 68.4367 60.7605C68.3587 61.8766 69.187 62.8236 70.2635 62.944C73.971 63.3574 77.2035 64.8415 79.3488 66.9926C81.4694 69.1189 82.5529 71.9105 82.036 75.1344L82.0349 75.145L82.0335 75.1569C81.6719 77.6722 81.3335 79.4101 79.3445 81.5468C78.9665 81.9526 77.9817 82.6212 76.4625 83.2747C74.9862 83.9097 73.1338 84.475 71.1369 84.7547C67.1231 85.3169 62.7342 84.7064 59.482 81.4875C55.8378 77.8802 53.4559 75.3265 51.9909 73.6828C51.2586 72.861 50.7555 72.267 50.439 71.8828C50.2809 71.6908 50.1687 71.5517 50.0983 71.4623C50.0631 71.4177 50.0387 71.3849 50.0234 71.3651C50.0161 71.3556 50.0107 71.3491 50.0078 71.3452L50.0058 71.342L49.9529 71.2729L49.8917 71.2099L49.7477 71.0491C49.4279 70.6609 49.2273 70.1857 49.1738 69.6824C49.1127 69.1075 49.2475 68.5282 49.555 68.0386C49.8627 67.5489 50.3269 67.1764 50.8716 66.9819C51.4162 66.7875 52.011 66.7818 52.5592 66.9658L58.9449 69.1029C60.0338 69.4671 61.2416 68.8499 61.5323 67.6923C61.7737 66.7305 62.1955 64.8865 62.455 62.8202C62.7108 60.783 62.8267 58.3942 62.3747 56.4003C62.0562 54.9952 61.6146 53.8453 61.2185 52.865C60.8095 51.8526 60.4902 51.1104 60.3067 50.3558C60.0825 49.4338 60.3355 48.7451 60.8087 48.3326C61.4539 47.7703 62.2962 47.4863 63.1501 47.5428Z"
        fill="#212121"
      />
      <path
        d="M63.1501 47.5428C64.0041 47.5994 64.8008 47.9926 65.3662 48.6351C66.066 49.4303 67.1152 51.0001 67.7371 52.7617C67.9642 53.4052 68.0101 53.4893 68.0755 53.7447C68.1413 54.0019 68.2093 54.3854 68.3792 55.4586C68.6367 57.086 68.523 59.5322 68.4367 60.7605C68.3587 61.8766 69.187 62.8236 70.2635 62.944C73.971 63.3574 77.2035 64.8415 79.3488 66.9926C81.4694 69.1189 82.5529 71.9105 82.036 75.1344L82.0349 75.145L82.0335 75.1569C81.6719 77.6722 81.3335 79.4101 79.3445 81.5468C78.9665 81.9526 77.9817 82.6212 76.4625 83.2747C74.9862 83.9097 73.1338 84.475 71.1369 84.7547C67.1231 85.3169 62.7342 84.7064 59.482 81.4875C55.8378 77.8802 53.4559 75.3265 51.9909 73.6828C51.2586 72.861 50.7555 72.267 50.439 71.8828C50.2809 71.6908 50.1687 71.5517 50.0983 71.4623C50.0631 71.4177 50.0387 71.3849 50.0234 71.3651C50.0161 71.3556 50.0107 71.3491 50.0078 71.3452L50.0058 71.342L49.9529 71.2729L49.8917 71.2099L49.7477 71.0491C49.4279 70.6609 49.2273 70.1857 49.1738 69.6824C49.1127 69.1075 49.2475 68.5282 49.555 68.0386C49.8627 67.5489 50.3269 67.1764 50.8716 66.9819C51.4162 66.7875 52.011 66.7818 52.5592 66.9658L58.9449 69.1029C60.0338 69.4671 61.2416 68.8499 61.5323 67.6923C61.7737 66.7305 62.1955 64.8865 62.455 62.8202C62.7108 60.783 62.8267 58.3942 62.3747 56.4003C62.0562 54.9952 61.6146 53.8453 61.2185 52.865C60.8095 51.8526 60.4902 51.1104 60.3067 50.3558C60.0825 49.4338 60.3355 48.7451 60.8087 48.3326C61.4539 47.7703 62.2962 47.4863 63.1501 47.5428Z"
        fill="url(#paint2_radial_3758_756)"
      />
      <path
        d="M63.1501 47.5428C64.0041 47.5994 64.8008 47.9926 65.3662 48.6351C66.066 49.4303 67.1152 51.0001 67.7371 52.7617C67.9642 53.4052 68.0101 53.4893 68.0755 53.7447C68.1413 54.0019 68.2093 54.3854 68.3792 55.4586C68.6367 57.086 68.523 59.5322 68.4367 60.7605C68.3587 61.8766 69.187 62.8236 70.2635 62.944C73.971 63.3574 77.2035 64.8415 79.3488 66.9926C81.4694 69.1189 82.5529 71.9105 82.036 75.1344L82.0349 75.145L82.0335 75.1569C81.6719 77.6722 81.3335 79.4101 79.3445 81.5468C78.9665 81.9526 77.9817 82.6212 76.4625 83.2747C74.9862 83.9097 73.1338 84.475 71.1369 84.7547C67.1231 85.3169 62.7342 84.7064 59.482 81.4875C55.8378 77.8802 53.4559 75.3265 51.9909 73.6828C51.2586 72.861 50.7555 72.267 50.439 71.8828C50.2809 71.6908 50.1687 71.5517 50.0983 71.4623C50.0631 71.4177 50.0387 71.3849 50.0234 71.3651C50.0161 71.3556 50.0107 71.3491 50.0078 71.3452L50.0058 71.342L49.9529 71.2729L49.8917 71.2099L49.7477 71.0491C49.4279 70.6609 49.2273 70.1857 49.1738 69.6824C49.1127 69.1075 49.2475 68.5282 49.555 68.0386C49.8627 67.5489 50.3269 67.1764 50.8716 66.9819C51.4162 66.7875 52.011 66.7818 52.5592 66.9658L58.9449 69.1029C60.0338 69.4671 61.2416 68.8499 61.5323 67.6923C61.7737 66.7305 62.1955 64.8865 62.455 62.8202C62.7108 60.783 62.8267 58.3942 62.3747 56.4003C62.0562 54.9952 61.6146 53.8453 61.2185 52.865C60.8095 51.8526 60.4902 51.1104 60.3067 50.3558C60.0825 49.4338 60.3355 48.7451 60.8087 48.3326C61.4539 47.7703 62.2962 47.4863 63.1501 47.5428Z"
        fill="url(#paint3_radial_3758_756)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M43.1602 20.4072C50.1367 19.3206 56.1288 20.4025 60.684 23.7269C65.2363 27.0552 68.0903 32.4339 69.1769 39.4102C69.5561 41.8446 69.6695 44.1589 69.5163 46.3342C69.4428 47.3781 68.0792 47.6368 67.3879 46.8511C66.351 45.6729 64.8894 44.9525 63.3234 44.8485C62.4021 44.7874 61.4885 44.9428 60.6515 45.2909C60.2714 45.449 59.7996 45.1218 59.8455 44.7127C59.8764 44.4375 59.8524 44.1588 59.7756 43.8927C59.6988 43.6265 59.5701 43.3775 59.3973 43.161C59.2245 42.9447 59.0107 42.7648 58.7684 42.631C58.5259 42.4971 58.2592 42.4114 57.984 42.3805C57.7088 42.3497 57.43 42.3736 57.1639 42.4504C56.8979 42.5272 56.65 42.6561 56.4336 42.8288C56.2171 43.0016 56.0362 43.2151 55.9023 43.4576C55.7684 43.7001 55.684 43.9668 55.6531 44.2421C55.3283 47.1345 53.393 49.8855 50.6288 51.4364C46.151 53.4114 40.5048 51.3118 38.5064 46.9025C38.2755 46.3933 37.8523 45.9962 37.3291 45.7991C36.8059 45.602 36.2261 45.6214 35.7167 45.8518C35.4643 45.9661 35.2364 46.1282 35.047 46.3304C34.8575 46.5327 34.7095 46.771 34.6119 47.0304C34.5144 47.2897 34.4696 47.5657 34.4788 47.8425C34.488 48.1196 34.5513 48.393 34.666 48.6454C37.6599 55.2562 45.8879 58.2128 52.4442 55.2412C52.4935 55.2185 52.5418 55.1938 52.5892 55.1674C54.4712 54.132 56.126 52.672 57.3853 50.9328C57.4657 50.8218 57.6457 50.8602 57.6781 50.9934C57.9203 51.9896 58.3399 52.963 58.7091 53.8767C59.0911 54.8223 59.4669 55.8099 59.7361 56.9973C59.9878 58.1078 60.0189 59.4748 59.9232 60.8874C59.865 61.7456 59.3577 62.5093 58.5851 62.8874C57.3523 63.4907 56.0274 64.005 54.6152 64.4295C54.2222 64.5476 53.8025 64.535 53.4132 64.4052C52.2906 64.0282 51.073 64.0414 49.9577 64.4395C49.5217 64.5952 49.1119 64.8072 48.7364 65.0673C48.2152 65.4284 47.6392 65.7337 47.0064 65.7731C41.3762 66.123 36.4992 64.9172 32.6489 62.1073C28.0965 58.779 25.2439 53.3991 24.1572 46.4226C23.0706 39.4463 24.1525 33.4541 27.4769 28.8989C30.8052 24.3467 36.1841 21.4939 43.1602 20.4072ZM37.6767 35.2673C37.4523 33.7477 36.102 32.7074 34.6626 32.9439C33.2229 33.1806 32.2359 34.606 32.4602 36.1259L32.9155 39.2087C33.0233 39.9389 33.4012 40.5945 33.9664 41.0305C34.5317 41.4664 35.2379 41.6476 35.9296 41.5338C36.6213 41.4201 37.2423 41.0212 37.6552 40.4244C38.0681 39.8276 38.2397 39.0819 38.132 38.3518L37.6767 35.2673ZM57.891 29.9534C57.3258 29.5178 56.6193 29.3364 55.9278 29.4501C55.2367 29.5639 54.6167 29.9633 54.2039 30.5595C53.7911 31.1561 53.6196 31.9021 53.7271 32.6321L54.1824 35.7166C54.2902 36.4469 54.668 37.1025 55.2333 37.5384C55.7985 37.9741 56.505 38.1555 57.1965 38.0418C57.8877 37.928 58.5076 37.5285 58.9205 36.9323C59.3333 36.3357 59.5048 35.5898 59.3973 34.8597L58.9436 31.7752C58.8358 31.0449 58.4564 30.3894 57.891 29.9534Z"
        fill="#212121"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M43.1602 20.4072C50.1367 19.3206 56.1288 20.4025 60.684 23.7269C65.2363 27.0552 68.0903 32.4339 69.1769 39.4102C69.5561 41.8446 69.6695 44.1589 69.5163 46.3342C69.4428 47.3781 68.0792 47.6368 67.3879 46.8511C66.351 45.6729 64.8894 44.9525 63.3234 44.8485C62.4021 44.7874 61.4885 44.9428 60.6515 45.2909C60.2714 45.449 59.7996 45.1218 59.8455 44.7127C59.8764 44.4375 59.8524 44.1588 59.7756 43.8927C59.6988 43.6265 59.5701 43.3775 59.3973 43.161C59.2245 42.9447 59.0107 42.7648 58.7684 42.631C58.5259 42.4971 58.2592 42.4114 57.984 42.3805C57.7088 42.3497 57.43 42.3736 57.1639 42.4504C56.8979 42.5272 56.65 42.6561 56.4336 42.8288C56.2171 43.0016 56.0362 43.2151 55.9023 43.4576C55.7684 43.7001 55.684 43.9668 55.6531 44.2421C55.3283 47.1345 53.393 49.8855 50.6288 51.4364C46.151 53.4114 40.5048 51.3118 38.5064 46.9025C38.2755 46.3933 37.8523 45.9962 37.3291 45.7991C36.8059 45.602 36.2261 45.6214 35.7167 45.8518C35.4643 45.9661 35.2364 46.1282 35.047 46.3304C34.8575 46.5327 34.7095 46.771 34.6119 47.0304C34.5144 47.2897 34.4696 47.5657 34.4788 47.8425C34.488 48.1196 34.5513 48.393 34.666 48.6454C37.6599 55.2562 45.8879 58.2128 52.4442 55.2412C52.4935 55.2185 52.5418 55.1938 52.5892 55.1674C54.4712 54.132 56.126 52.672 57.3853 50.9328C57.4657 50.8218 57.6457 50.8602 57.6781 50.9934C57.9203 51.9896 58.3399 52.963 58.7091 53.8767C59.0911 54.8223 59.4669 55.8099 59.7361 56.9973C59.9878 58.1078 60.0189 59.4748 59.9232 60.8874C59.865 61.7456 59.3577 62.5093 58.5851 62.8874C57.3523 63.4907 56.0274 64.005 54.6152 64.4295C54.2222 64.5476 53.8025 64.535 53.4132 64.4052C52.2906 64.0282 51.073 64.0414 49.9577 64.4395C49.5217 64.5952 49.1119 64.8072 48.7364 65.0673C48.2152 65.4284 47.6392 65.7337 47.0064 65.7731C41.3762 66.123 36.4992 64.9172 32.6489 62.1073C28.0965 58.779 25.2439 53.3991 24.1572 46.4226C23.0706 39.4463 24.1525 33.4541 27.4769 28.8989C30.8052 24.3467 36.1841 21.4939 43.1602 20.4072ZM37.6767 35.2673C37.4523 33.7477 36.102 32.7074 34.6626 32.9439C33.2229 33.1806 32.2359 34.606 32.4602 36.1259L32.9155 39.2087C33.0233 39.9389 33.4012 40.5945 33.9664 41.0305C34.5317 41.4664 35.2379 41.6476 35.9296 41.5338C36.6213 41.4201 37.2423 41.0212 37.6552 40.4244C38.0681 39.8276 38.2397 39.0819 38.132 38.3518L37.6767 35.2673ZM57.891 29.9534C57.3258 29.5178 56.6193 29.3364 55.9278 29.4501C55.2367 29.5639 54.6167 29.9633 54.2039 30.5595C53.7911 31.1561 53.6196 31.9021 53.7271 32.6321L54.1824 35.7166C54.2902 36.4469 54.668 37.1025 55.2333 37.5384C55.7985 37.9741 56.505 38.1555 57.1965 38.0418C57.8877 37.928 58.5076 37.5285 58.9205 36.9323C59.3333 36.3357 59.5048 35.5898 59.3973 34.8597L58.9436 31.7752C58.8358 31.0449 58.4564 30.3894 57.891 29.9534Z"
        fill="url(#paint4_radial_3758_756)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M43.1602 20.4072C50.1367 19.3206 56.1288 20.4025 60.684 23.7269C65.2363 27.0552 68.0903 32.4339 69.1769 39.4102C69.5561 41.8446 69.6695 44.1589 69.5163 46.3342C69.4428 47.3781 68.0792 47.6368 67.3879 46.8511C66.351 45.6729 64.8894 44.9525 63.3234 44.8485C62.4021 44.7874 61.4885 44.9428 60.6515 45.2909C60.2714 45.449 59.7996 45.1218 59.8455 44.7127C59.8764 44.4375 59.8524 44.1588 59.7756 43.8927C59.6988 43.6265 59.5701 43.3775 59.3973 43.161C59.2245 42.9447 59.0107 42.7648 58.7684 42.631C58.5259 42.4971 58.2592 42.4114 57.984 42.3805C57.7088 42.3497 57.43 42.3736 57.1639 42.4504C56.8979 42.5272 56.65 42.6561 56.4336 42.8288C56.2171 43.0016 56.0362 43.2151 55.9023 43.4576C55.7684 43.7001 55.684 43.9668 55.6531 44.2421C55.3283 47.1345 53.393 49.8855 50.6288 51.4364C46.151 53.4114 40.5048 51.3118 38.5064 46.9025C38.2755 46.3933 37.8523 45.9962 37.3291 45.7991C36.8059 45.602 36.2261 45.6214 35.7167 45.8518C35.4643 45.9661 35.2364 46.1282 35.047 46.3304C34.8575 46.5327 34.7095 46.771 34.6119 47.0304C34.5144 47.2897 34.4696 47.5657 34.4788 47.8425C34.488 48.1196 34.5513 48.393 34.666 48.6454C37.6599 55.2562 45.8879 58.2128 52.4442 55.2412C52.4935 55.2185 52.5418 55.1938 52.5892 55.1674C54.4712 54.132 56.126 52.672 57.3853 50.9328C57.4657 50.8218 57.6457 50.8602 57.6781 50.9934C57.9203 51.9896 58.3399 52.963 58.7091 53.8767C59.0911 54.8223 59.4669 55.8099 59.7361 56.9973C59.9878 58.1078 60.0189 59.4748 59.9232 60.8874C59.865 61.7456 59.3577 62.5093 58.5851 62.8874C57.3523 63.4907 56.0274 64.005 54.6152 64.4295C54.2222 64.5476 53.8025 64.535 53.4132 64.4052C52.2906 64.0282 51.073 64.0414 49.9577 64.4395C49.5217 64.5952 49.1119 64.8072 48.7364 65.0673C48.2152 65.4284 47.6392 65.7337 47.0064 65.7731C41.3762 66.123 36.4992 64.9172 32.6489 62.1073C28.0965 58.779 25.2439 53.3991 24.1572 46.4226C23.0706 39.4463 24.1525 33.4541 27.4769 28.8989C30.8052 24.3467 36.1841 21.4939 43.1602 20.4072ZM37.6767 35.2673C37.4523 33.7477 36.102 32.7074 34.6626 32.9439C33.2229 33.1806 32.2359 34.606 32.4602 36.1259L32.9155 39.2087C33.0233 39.9389 33.4012 40.5945 33.9664 41.0305C34.5317 41.4664 35.2379 41.6476 35.9296 41.5338C36.6213 41.4201 37.2423 41.0212 37.6552 40.4244C38.0681 39.8276 38.2397 39.0819 38.132 38.3518L37.6767 35.2673ZM57.891 29.9534C57.3258 29.5178 56.6193 29.3364 55.9278 29.4501C55.2367 29.5639 54.6167 29.9633 54.2039 30.5595C53.7911 31.1561 53.6196 31.9021 53.7271 32.6321L54.1824 35.7166C54.2902 36.4469 54.668 37.1025 55.2333 37.5384C55.7985 37.9741 56.505 38.1555 57.1965 38.0418C57.8877 37.928 58.5076 37.5285 58.9205 36.9323C59.3333 36.3357 59.5048 35.5898 59.3973 34.8597L58.9436 31.7752C58.8358 31.0449 58.4564 30.3894 57.891 29.9534Z"
        fill="url(#paint5_radial_3758_756)"
      />
    </g>
    <defs>
      <filter
        id="filter0_ii_3758_756"
        x={0}
        y={-2.5}
        width={100}
        height={102.5}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.5} />
        <feGaussianBlur stdDeviation={3.75} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_3758_756"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.25} />
        <feGaussianBlur stdDeviation={1.25} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.107554 0 0 0 0 0.429743 0 0 0 0 0.118294 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_3758_756"
          result="effect2_innerShadow_3758_756"
        />
      </filter>
      <clipPath id="paint0_diamond_3758_756_clip_path">
        <path d="M0 30C0 13.4315 13.4315 0 30 0H70C86.5685 0 100 13.4315 100 30V70C100 86.5685 86.5685 100 70 100H30C13.4315 100 0 86.5685 0 70V30Z" />
      </clipPath>
      <filter
        id="filter1_dii_3758_756"
        x={22.4}
        y={17.5}
        width={61.1141}
        height={69.4654}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={0.675006} />
        <feGaussianBlur stdDeviation={0.675006} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_3758_756"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_3758_756"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2.5} />
        <feGaussianBlur stdDeviation={3.75} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_3758_756"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-1.25} />
        <feGaussianBlur stdDeviation={1.25} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.576471 0 0 0 0 0.768627 0 0 0 0 0.376471 0 0 0 0.5 0"
        />
        <feBlend
          mode="normal"
          in2="effect2_innerShadow_3758_756"
          result="effect3_innerShadow_3758_756"
        />
      </filter>
      <linearGradient
        id="paint0_diamond_3758_756"
        x1={0}
        y1={0}
        x2={500}
        y2={500}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" />
        <stop offset={1} stopColor="#F3F8AF" />
      </linearGradient>
      <radialGradient
        id="paint1_radial_3758_756"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(50 100) rotate(-90) scale(100 170.831)"
      >
        <stop stopColor="#A2D062" />
        <stop offset={1} stopColor="#518F57" />
      </radialGradient>
      <radialGradient
        id="paint2_radial_3758_756"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(52.9568 52.4702) rotate(90) scale(32.4702 29.2068)"
      >
        <stop stopColor="#D6E46E" />
        <stop offset={1} stopColor="#10963F" />
      </radialGradient>
      <radialGradient
        id="paint3_radial_3758_756"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(52.9568 52.4702) rotate(90) scale(32.4702 29.2068)"
      >
        <stop stopColor="#C5F2BE" />
        <stop offset={1} stopColor="#A3D79B" />
      </radialGradient>
      <radialGradient
        id="paint4_radial_3758_756"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(52.9568 52.4702) rotate(90) scale(32.4702 29.2068)"
      >
        <stop stopColor="#D6E46E" />
        <stop offset={1} stopColor="#10963F" />
      </radialGradient>
      <radialGradient
        id="paint5_radial_3758_756"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(52.9568 52.4702) rotate(90) scale(32.4702 29.2068)"
      >
        <stop stopColor="#C5F2BE" />
        <stop offset={1} stopColor="#A3D79B" />
      </radialGradient>
    </defs>
  </svg>
);

type ShopTab = "effects" | "decorations" | "bob";

const tabs = [
  {
    id: "bob" as ShopTab,
    name: "Bob",
  },
  {
    id: "effects" as ShopTab,
    name: "Effekte",
  },
  {
    id: "decorations" as ShopTab,
    name: "Deko",
  },
];

export const TapCounterChip = () => {
  const { taps } = useCoreStore();

  return <ItemStatusChip>{formatNumber(Math.floor(taps))} 🫵</ItemStatusChip>;
};

const APP_ID: CameraViewId = "phone:shop";

export function ShopApp() {
  const [activeTab, setActiveTab] = useState<ShopTab>("bob");

  const {
    tapEffects,
    decorations,
    bobItems,
    canAfford,
    purchaseTapEffect,
    selectTapEffect,
    unequipBobItem,
    equipBobItem,
    purchaseBobItem,
    toggleDecoration,
    purchaseDecoration,

    resetPreview,
    previewBobItem,
    previewDecoration,
    previewTapEffect,
  } = useCoreStore();

  const { currentView, transitionToView, setViewMode } = useViewStore();

  const shopViewsWithItems: Record<ShopTab, ShopItem[]> = {
    bob: bobItems.filter((b) => b.unlocked !== false),
    effects: tapEffects,
    decorations: decorations,
  };

  const { data, page, pageCount, prev, next, hasNext, hasPrev, goTo } =
    usePagination(shopViewsWithItems[activeTab], 1);

  const initialIndex = useMemo(
    () => shopViewsWithItems[activeTab].findIndex((t) => t.enabled),
    [],
  );
  const currentItem = data[0];

  useEffect(() => {
    transitionToView(APP_ID);
    setViewMode("object");

    goTo(initialIndex);
  }, []);

  useEffect(() => {
    handleItemPreview();

    if (currentView !== "phone:shop") {
      resetPreview();
      transitionToView(APP_ID);
    } else {
      transitionToView("phone:shop");
    }
  }, [page, activeTab, currentView]);

  const handleBobItemClick = () => {
    const bobItem = bobItems.find((b) => b.id === currentItem.id);
    if (!bobItem) return;

    if (bobItem.purchased) {
      // if already purchased, equip/unequip it
      if (bobItem.enabled) {
        unequipBobItem(bobItem.id);
      } else {
        equipBobItem(bobItem.id);
      }
    } else if (canAfford(bobItem.cost)) {
      // purchase and equip
      purchaseBobItem(bobItem.id);
    }
  };

  const handleEffectItemClick = () => {
    const effect = tapEffects.find((e) => e.id === currentItem.id);
    if (!effect) return;

    if (effect.purchased) {
      selectTapEffect(currentItem.id);
    } else if (canAfford(effect.cost)) {
      purchaseTapEffect(currentItem.id);
    }
  };

  const handleDecoItemClick = () => {
    const deco = decorations.find((e) => e.id === currentItem.id);
    if (!deco) return;

    if (deco.purchased) {
      toggleDecoration(currentItem.id);
    } else if (canAfford(deco.cost)) {
      purchaseDecoration(currentItem.id);
    }
  };

  const handleTabChange = (id: ShopTab) => {
    goTo(0);
    setActiveTab(id);
  };

  const handleButton = () => {
    switch (activeTab) {
      case "effects":
        handleEffectItemClick();
        break;
      case "bob":
        handleBobItemClick();
        break;
      case "decorations":
        handleDecoItemClick();
        break;
    }
  };

  const handleItemPreview = () => {
    if (currentItem.enabled) resetPreview();
    switch (activeTab) {
      case "effects":
        previewTapEffect(currentItem.id);
        break;
      case "bob":
        previewBobItem(currentItem.id);
        break;
      case "decorations":
        previewDecoration(currentItem.id);
        break;
    }
  };

  const buttonLabel = match(currentItem)
    .with({ enabled: true }, () => "Deaktiveren")
    .with({ purchased: true }, () => "Aktivieren")
    .otherwise(() => "Kaufen");

  const handleNext = () => {
    if (hasNext) next();
    else goTo(0);
  };

  const handlePrev = () => {
    if (hasPrev) prev();
    else goTo(pageCount - 1);
  };

  const ShopOverlays = (
    <FixedAnchor>
      <ShopContainer
        key="shop-app-container"
        initial={{ opacity: 0, scaleX: 0.9, y: 40, filter: "blur(6px)" }}
        animate={{ opacity: 1, scaleX: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scaleX: 0.9, y: 80, filter: "blur(6px)" }}
        transition={{
          type: "spring" as const,
          bounce: 0.5,
        }}
        layoutRoot
      >
        <ContentControls>
          {currentItem && (
            <HugColumn
              key={currentItem.id + "_meta"}
              variants={MOTION_VARIANTS.springScale}
              animate={MOTION_VARIANTS.springScale.animate()}
              exit={MOTION_VARIANTS.springScale.exit}
              initial={MOTION_VARIANTS.springScale.initial}
              $gap={"4px"}
              $align="center"
            >
              {match(currentItem)
                .with({ enabled: true }, () => (
                  <ItemStatusChip $variant="accent">Ausgewählt</ItemStatusChip>
                ))
                .with({ purchased: false }, () => (
                  <ItemStatusChip $variant="light">
                    {formatNumber(currentItem.cost)} 🫵
                  </ItemStatusChip>
                ))
                .otherwise(() => (
                  <></>
                ))}
            </HugColumn>
          )}

          <ItemStatusChip $variant="dark">
            <span>{currentItem.name}</span>
            <span>{getShopItemType(currentItem.type as any)}</span>
          </ItemStatusChip>

          <ShopItemButton
            key={buttonLabel + "_action_button"}
            $selected={currentItem.enabled}
            $purchased={currentItem.purchased}
            $canAfford={canAfford(currentItem.cost)}
            onClick={handleButton}
            role="button"
            disabled={!currentItem.purchased && !canAfford(currentItem.cost)}
            layout
          >
            <motion.span
              key={buttonLabel + "_action_label"}
              animate={{ filter: "blur(0px)", scale: 1 }}
              initial={{ filter: "blur(2px)", scale: 0.9 }}
              exit={{ filter: "blur(2px)", scale: 0.9 }}
              layout="preserve-aspect"
            >
              {buttonLabel}
            </motion.span>
          </ShopItemButton>

          <PaginationDots key={`shop-pagination-dots-${activeTab}`}>
            <PaginationButton onClick={handlePrev} disabled={pageCount === 1}>
              <ChevronLeftIcon />
            </PaginationButton>

            <HugRow $gap={"4px"}>
              {Array(pageCount)
                .fill(null)
                .map((_, i) => (
                  <motion.div
                    key={`shop_pagination_dot_${i}`}
                    animate={{
                      width: page === i ? "20px" : "8px",
                      opacity: page === i ? 1 : 0.3,
                    }}
                  />
                ))}
            </HugRow>

            <PaginationButton onClick={handleNext} disabled={pageCount === 1}>
              <ChevronRightIcon />
            </PaginationButton>
          </PaginationDots>
        </ContentControls>
      </ShopContainer>
    </FixedAnchor>
  );

  return (
    <>
      {createPortal(ShopOverlays, document.getElementById("motion-root")!)}

      <TabPanel>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id + "_shop_tab"}
            $active={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.name}
          </TabButton>
        ))}
      </TabPanel>
    </>
  );
}
