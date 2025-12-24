import React, { useState, useCallback, useRef, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { CloseIcon } from "@/icons/close";
import { NavButton } from "./BottomNavigation";
import { Magnetic } from "@/layout/Magnetic";
import { FillRow, HugColumn } from "@/layout";
import { useClickOutside } from "@/hooks/useClickOutside";
import { PhoneMenuIcon } from "@/icons/phoneMenu";
import { useGameStore, useViewStore } from "@/store";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { SpeakerIcon } from "@/icons/speaker";
import { ShopApp, ShopIcon } from "@/apps/shop";
import { ArrowLeftIcon } from "@/icons/arrow";

const SettingsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 1H56C68.7025 1 79 11.2975 79 24V56C79 68.7025 68.7025 79 56 79H24C11.2975 79 1 68.7025 1 56V24C1 11.2975 11.2975 1 24 1Z"
      fill="#6B6E75"
      stroke="#21212A"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2743)">
      <path
        d="M22.8633 53.6907C23.0079 56.4116 25.0932 58.9659 27.8179 58.9865C27.8428 58.9867 27.8677 58.9867 27.8926 58.9867C27.9176 58.9867 27.9425 58.9867 27.9674 58.9865C30.6921 58.9659 32.7774 56.4116 32.922 53.6907C32.9665 52.8536 32.9962 52.0045 32.9962 51.145C32.9962 49.4739 32.8839 47.8409 32.7689 46.2613C32.6699 44.9025 31.6366 43.7733 30.2784 43.6668C28.6537 43.5395 27.1316 43.5395 25.5069 43.6668C24.1487 43.7733 23.1154 44.9025 23.0164 46.2613C22.9014 47.8409 22.7891 49.4739 22.7891 51.145C22.7891 52.0045 22.8188 52.8536 22.8633 53.6907Z"
        fill="#D7D8DD"
      />
      <path
        d="M24.3395 28.0719C24.3851 30.0332 25.9289 31.6773 27.8908 31.6773C29.8527 31.6773 31.3965 30.0332 31.4421 28.0719C31.4702 26.8633 31.4594 25.6688 31.4098 24.4494C31.3538 23.0727 30.2741 21.9443 28.8982 21.8722C28.1985 21.8356 27.5831 21.8356 26.8834 21.8721C25.5074 21.944 24.4277 23.0724 24.3717 24.4491C24.3221 25.6686 24.3114 26.8632 24.3395 28.0719Z"
        fill="#D7D8DD"
      />
      <path
        d="M24.3395 28.0719C24.3851 30.0332 25.9289 31.6773 27.8908 31.6773C29.8527 31.6773 31.3965 30.0332 31.4421 28.0719C31.4702 26.8633 31.4594 25.6688 31.4098 24.4494C31.3538 23.0727 30.2741 21.9443 28.8982 21.8722C28.1985 21.8356 27.5831 21.8356 26.8834 21.8721C25.5074 21.944 24.4277 23.0724 24.3717 24.4491C24.3221 25.6686 24.3114 26.8632 24.3395 28.0719Z"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.8945 43.1928V31.7529"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43.1115 22.2439C43.1115 27.9576 44.6759 29.3706 47.4573 29.3706C50.2387 29.3706 51.8029 27.9576 51.8029 22.2439C51.8029 22.0187 52.0141 21.8514 52.2307 21.9134C56.2215 23.0579 58.3989 25.8925 58.3989 30.1182C58.3989 34.0846 56.4804 36.8254 52.9447 38.0933C52.8144 38.14 52.7315 38.269 52.7392 38.4072C52.8464 40.2848 52.9424 44.3602 52.9424 46.332C52.9424 48.3039 52.8464 52.4263 52.7395 54.304C52.6118 56.5414 50.9972 58.6089 48.7703 58.8586C47.908 58.9554 47.0065 58.9554 46.1441 58.8586C43.9171 58.6089 42.3026 56.5414 42.1751 54.304C42.0681 52.4263 41.9721 48.3039 41.9721 46.332C41.9721 44.3602 42.0682 40.2848 42.1752 38.4072C42.1831 38.269 42.1 38.14 41.9697 38.0933C38.434 36.8254 36.5156 34.0846 36.5156 30.1182C36.5156 25.8925 38.6931 23.0579 42.6838 21.9134C42.9003 21.8514 43.1115 22.0187 43.1115 22.2439Z"
        fill="#D7D8DD"
      />
      <path
        d="M22.8633 53.6907C23.0079 56.4116 25.0932 58.9659 27.8179 58.9865C27.8428 58.9867 27.8677 58.9867 27.8926 58.9867C27.9176 58.9867 27.9425 58.9867 27.9674 58.9865C30.6921 58.9659 32.7774 56.4116 32.922 53.6907C32.9665 52.8536 32.9962 52.0045 32.9962 51.145C32.9962 49.4739 32.8839 47.8409 32.7689 46.2613C32.6699 44.9025 31.6366 43.7733 30.2784 43.6668C28.6537 43.5395 27.1316 43.5395 25.5069 43.6668C24.1487 43.7733 23.1154 44.9025 23.0164 46.2613C22.9014 47.8409 22.7891 49.4739 22.7891 51.145C22.7891 52.0045 22.8188 52.8536 22.8633 53.6907Z"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43.1115 22.2439C43.1115 27.9576 44.6759 29.3706 47.4573 29.3706C50.2387 29.3706 51.8029 27.9576 51.8029 22.2439C51.8029 22.0187 52.0141 21.8514 52.2307 21.9134C56.2215 23.0579 58.3989 25.8925 58.3989 30.1182C58.3989 34.0846 56.4804 36.8254 52.9447 38.0933C52.8144 38.14 52.7315 38.269 52.7392 38.4072C52.8464 40.2848 52.9424 44.3602 52.9424 46.332C52.9424 48.3039 52.8464 52.4263 52.7395 54.304C52.6118 56.5414 50.9972 58.6089 48.7703 58.8586C47.908 58.9554 47.0065 58.9554 46.1441 58.8586C43.9171 58.6089 42.3026 56.5414 42.1751 54.304C42.0681 52.4263 41.9721 48.3039 41.9721 46.332C41.9721 44.3602 42.0682 40.2848 42.1752 38.4072C42.1831 38.269 42.1 38.14 41.9697 38.0933C38.434 36.8254 36.5156 34.0846 36.5156 30.1182C36.5156 25.8925 38.6931 23.0579 42.6838 21.9134C42.9003 21.8514 43.1115 22.0187 43.1115 22.2439Z"
        stroke="#21212A"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2743">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(20.332 20.416)"
        />
      </clipPath>
    </defs>
  </svg>
);

const ChatIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x={1}
      y={1}
      width={78}
      height={78}
      rx={23}
      fill="#4277F7"
      stroke="#4147D5"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2704)">
      <path
        d="M40.3758 56.9312C51.3472 56.9312 57.5187 50.7598 57.5187 39.7884C57.5187 28.8169 51.3472 22.6455 40.3758 22.6455C29.4044 22.6455 23.2329 28.8169 23.2329 39.7884C23.2329 43.1398 23.8072 46.0427 24.9187 48.4569L22.0987 56.2084C22.0063 56.4609 21.9871 56.7344 22.0432 56.9973C22.0993 57.2603 22.2285 57.5021 22.416 57.6949C22.6034 57.8877 22.8414 58.0237 23.1027 58.0872C23.364 58.1508 23.6379 58.1393 23.8929 58.0541L31.9644 55.3627C34.3301 56.3969 37.1444 56.9341 40.3758 56.9341V56.9312Z"
        fill="#D7E0FF"
      />
      <path
        d="M40.3758 56.9312C51.3472 56.9312 57.5187 50.7598 57.5187 39.7884C57.5187 28.8169 51.3472 22.6455 40.3758 22.6455C29.4044 22.6455 23.2329 28.8169 23.2329 39.7884C23.2329 43.1398 23.8072 46.0427 24.9187 48.4569L22.0987 56.2084C22.0063 56.4609 21.9871 56.7344 22.0432 56.9973C22.0993 57.2603 22.2285 57.5021 22.416 57.6949C22.6034 57.8877 22.8414 58.0237 23.1027 58.0872C23.364 58.1508 23.6379 58.1393 23.8929 58.0541L31.9644 55.3627C34.3301 56.3969 37.1444 56.9341 40.3758 56.9341V56.9312Z"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.1914 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.5312 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48.875 39.1797V40.4168"
        stroke="#4147D5"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2704">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(19.6641 20.416)"
        />
      </clipPath>
    </defs>
  </svg>
);

const QuestsIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x={1}
      y={1}
      width={78}
      height={78}
      rx={23}
      fill="#D6E46E"
      stroke="#B8BC4E"
      strokeWidth={2}
    />
    <g clipPath="url(#clip0_3439_2730)">
      <path
        d="M40.0017 57.7729C51.4302 57.7729 57.8588 51.3443 57.8588 39.9157C57.8588 28.4872 51.4302 22.0586 40.0017 22.0586C28.5731 22.0586 22.1445 28.4872 22.1445 39.9157C22.1445 51.3443 28.5731 57.7729 40.0017 57.7729Z"
        fill="#FCFFD7"
      />
      <path
        d="M30.9375 42.6641C32.3111 47.6091 37.8056 50.6311 42.7507 49.2574C45.7727 48.1585 48.2452 45.686 49.0694 42.6641"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32.7266 34.4893V36.4893"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M47.2773 34.4893V36.4893"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40.0017 57.7729C51.4302 57.7729 57.8588 51.3443 57.8588 39.9157C57.8588 28.4872 51.4302 22.0586 40.0017 22.0586C28.5731 22.0586 22.1445 28.4872 22.1445 39.9157C22.1445 51.3443 28.5731 57.7729 40.0017 57.7729Z"
        stroke="#B8BC4E"
        strokeWidth={2.85714}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_3439_2730">
        <rect
          width={40}
          height={40}
          fill="white"
          transform="translate(20 19.916)"
        />
      </clipPath>
    </defs>
  </svg>
);

const DebugIcon = () => (
  <svg
    width={80}
    height={80}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 1H56C68.7025 1 79 11.2975 79 24V56C79 68.7025 68.7025 79 56 79H24C11.2975 79 1 68.7025 1 56V24C1 11.2975 11.2975 1 24 1Z"
      fill="#CEAE91"
      stroke="#91765D"
      strokeWidth={2}
    />
    <path
      d="M22.8164 46.2725H28.7719"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51.8789 46.2725H57.8346"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M46.4297 28.8549V22.8994"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M46.4297 57.9623V52.0068"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22.8164 34.5625H28.7719"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34.2461 28.8549V22.8994"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M51.8789 34.5625H57.8346"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34.2461 57.9623V52.0068"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M29.0746 49.0355C29.2269 50.407 30.3174 51.4967 31.6884 51.653C34.4684 51.9698 37.3646 52.3487 40.3404 52.3487C43.3161 52.3487 46.2123 51.9698 48.9924 51.653C50.3633 51.4967 51.4538 50.407 51.6061 49.0355C51.9138 46.2667 52.2707 43.3821 52.2707 40.4185C52.2707 37.4549 51.9138 34.5703 51.6061 31.8014C51.4538 30.43 50.3633 29.3404 48.9924 29.1841C46.2123 28.8672 43.3161 28.4883 40.3404 28.4883C37.3646 28.4883 34.4684 28.8672 31.6884 29.1841C30.3174 29.3404 29.2269 30.43 29.0746 31.8014C28.7669 34.5703 28.4102 37.4549 28.4102 40.4185C28.4102 43.3821 28.7669 46.2667 29.0746 49.0355Z"
      fill="#F0D5BD"
    />
    <path
      d="M29.0746 49.0355C29.2269 50.407 30.3174 51.4967 31.6884 51.653C34.4684 51.9698 37.3646 52.3487 40.3404 52.3487C43.3161 52.3487 46.2123 51.9698 48.9924 51.653C50.3633 51.4967 51.4538 50.407 51.6061 49.0355C51.9138 46.2667 52.2707 43.3821 52.2707 40.4185C52.2707 37.4549 51.9138 34.5703 51.6061 31.8014C51.4538 30.43 50.3633 29.3404 48.9924 29.1841C46.2123 28.8672 43.3161 28.4883 40.3404 28.4883C37.3646 28.4883 34.4684 28.8672 31.6884 29.1841C30.3174 29.3404 29.2269 30.43 29.0746 31.8014C28.7669 34.5703 28.4102 37.4549 28.4102 40.4185C28.4102 43.3821 28.7669 46.2667 29.0746 49.0355Z"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M40.3359 43.2979H44.4724"
      stroke="#91765D"
      strokeWidth={2.85714}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoreAppsSoonIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M52 0V1H56C57.5373 1 59.0389 1.15039 60.4902 1.4375L60.6826 0.458008C63.8315 1.08082 66.7588 2.31897 69.334 4.04297L68.7783 4.87305C71.2869 6.55252 73.4475 8.71307 75.127 11.2217L75.9561 10.665C77.6802 13.2402 78.918 16.1674 79.541 19.3164L78.5625 19.5098C78.8496 20.9611 79 22.4627 79 24V28H80V36H79V44H80V52H79V56C79 57.5373 78.8496 59.0389 78.5625 60.4902L79.541 60.6826C78.9182 63.8317 77.6802 66.7587 75.9561 69.334L75.127 68.7783C73.4475 71.2869 71.2869 73.4475 68.7783 75.127L69.334 75.9561C66.7587 77.6802 63.8317 78.9182 60.6826 79.541L60.4902 78.5625C59.0389 78.8496 57.5373 79 56 79H52V80H44V79H36V80H28V79H24C22.4627 79 20.9611 78.8496 19.5098 78.5625L19.3164 79.541C16.1674 78.918 13.2402 77.6802 10.665 75.9561L11.2217 75.127C8.71307 73.4475 6.55252 71.2869 4.87305 68.7783L4.04297 69.334C2.31897 66.7588 1.08082 63.8315 0.458008 60.6826L1.4375 60.4902C1.1863 59.2205 1.03962 57.9121 1.00684 56.5752L1 56V52H0V44H1V36H0V28H1V24C1 22.4627 1.15039 20.9611 1.4375 19.5098L0.458008 19.3164C1.08094 16.1676 2.31891 13.2401 4.04297 10.665L4.87305 11.2217C6.55252 8.71307 8.71307 6.55252 11.2217 4.87305L10.665 4.04297C13.2401 2.31891 16.1676 1.08094 19.3164 0.458008L19.5098 1.4375C20.9611 1.15039 22.4627 1 24 1H28V0H36V1H44V0H52Z"
      fill="#373737"
      stroke="white"
      stroke-width="2"
      stroke-dasharray="8 8"
    />
    <path
      d="M38.4981 42.28C38.4981 41.4 38.6181 40.68 38.8581 40.12C39.0981 39.544 39.3781 39.096 39.6981 38.776C40.0341 38.456 40.4661 38.112 40.9941 37.744C41.3941 37.456 41.6981 37.224 41.9061 37.048C42.1141 36.856 42.2901 36.616 42.4341 36.328C42.5941 36.04 42.6741 35.696 42.6741 35.296C42.6741 34.608 42.4501 34.096 42.0021 33.76C41.5701 33.408 41.0021 33.232 40.2981 33.232C39.4981 33.232 38.8501 33.496 38.3541 34.024C37.8581 34.536 37.5781 35.288 37.5141 36.28H34.2261C34.2901 35.032 34.5941 33.96 35.1381 33.064C35.6821 32.168 36.4021 31.488 37.2981 31.024C38.2101 30.56 39.2341 30.328 40.3701 30.328C42.0341 30.328 43.4021 30.768 44.4741 31.648C45.5621 32.528 46.1061 33.808 46.1061 35.488C46.1061 36.208 46.0021 36.816 45.7941 37.312C45.6021 37.808 45.3621 38.208 45.0741 38.512C44.7861 38.8 44.3941 39.12 43.8981 39.472C43.5141 39.776 43.1941 40.04 42.9381 40.264C42.6981 40.488 42.4821 40.768 42.2901 41.104C42.1141 41.424 41.9941 41.824 41.9301 42.304L41.7381 43.408H38.4981V42.28ZM40.0821 49.288C39.5061 49.288 39.0101 49.08 38.5941 48.664C38.1941 48.248 37.9941 47.752 37.9941 47.176C37.9941 46.616 38.1941 46.136 38.5941 45.736C39.0101 45.32 39.5061 45.112 40.0821 45.112C40.6581 45.112 41.1461 45.312 41.5461 45.712C41.9621 46.112 42.1701 46.6 42.1701 47.176C42.1701 47.752 41.9621 48.248 41.5461 48.664C41.1461 49.08 40.6581 49.288 40.0821 49.288Z"
      fill="white"
    />
  </svg>
);

type AppId = "shop" | "options" | "chat" | "quests" | "debug";

const AppNameMap: Record<AppId, string> = {
  shop: "Shop",
  options: "Optionen",
  chat: "Chat",
  quests: "Quests",
  debug: "debug",
};

interface BobAppData {
  id: AppId;
  icon: any; // fix type, jsx not working
  view: React.JSX.Element;
}

const BOB_APPS: Array<BobAppData> = [
  {
    id: "shop",
    icon: ShopIcon,
    view: <ShopApp />,
  },
  {
    id: "options",
    icon: SettingsIcon,
    view: <></>,
  },
  {
    id: "chat",
    icon: ChatIcon,
    view: <></>,
  },
  {
    id: "quests",
    icon: QuestsIcon,
    view: <></>,
  },
  {
    id: "debug",
    icon: DebugIcon,
    view: <></>,
  },
];

export const BobPhone = () => {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { transitionToView } = useViewStore();
  const [activeApp, setActiveApp] = useState<AppId | undefined>();

  const openApp = (appName: AppId) => {
    setActiveApp(appName);
  };

  const { toggle, isMuted, isEnabled } = useSoundSystem();
  const { setSoundEnabled } = useGameStore();

  const activeAppView = () => BOB_APPS.find((a) => a.id === activeApp)?.view;
  const activeAppName = activeApp ? AppNameMap[activeApp] : "";

  const handleAudioButtonClick = () => {
    toggle();
    setSoundEnabled(isEnabled);
  };

  const goToHomeScreen = () => {
    setActiveApp(undefined);
  };

  const onTriggerClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const currentHour = new Date()
    .toLocaleTimeString("de", {
      hour: "2-digit",
    })
    .slice(0, 2);

  const currentMinutes = new Date().toLocaleTimeString("de", {
    minute: "2-digit",
  });

  useClickOutside([containerRef, triggerRef], () => setIsOpen(false));

  return (
    <>
      <Magnetic key="bob-phone-trigger-magnet">
        <NavButton
          layout="position"
          key="bob-phone-trigger"
          onClick={onTriggerClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          $isActive={isOpen}
          initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          transition={{
            // duration: 0.25,
            type: "spring" as const,
            bounce: 0.5,
            delay: 0.1,
          }}
          ref={triggerRef}
        >
          <AnimatePresence mode="popLayout">
            {isOpen ? (
              <motion.span
                key="close-phone-icon"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 0.25,
                  type: "spring" as const,
                  bounce: 0.5,
                }}
              >
                <CloseIcon color="#ffffff" />
              </motion.span>
            ) : (
              <motion.span
                key="show-phone-icon"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 0.25,
                  type: "spring" as const,
                  bounce: 0.5,
                }}
              >
                <PhoneMenuIcon />
              </motion.span>
            )}
          </AnimatePresence>
          <span>Phone</span>
        </NavButton>
      </Magnetic>

      <AnimatePresence>
        {isOpen && (
          <BobPhoneBody
            key="bob-phone-body"
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            ref={containerRef}
          >
            <HugColumn $gap={0} layout="position">
              <AnimatePresence mode="popLayout">
                {!activeApp && (
                  <FillRow>
                    <StatusPill>
                      {currentHour}
                      <Blinking
                        style={{ paddingLeft: "0.1ch", paddingRight: "0.05ch" }}
                      >
                        :
                      </Blinking>
                      {currentMinutes}
                    </StatusPill>
                    <StatusPillButton
                      $active={!isMuted}
                      onClick={handleAudioButtonClick}
                    >
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={!isMuted ? "on" : "off"}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            duration: 0.2,
                            type: "spring",
                            bounce: 0.7,
                          }}
                        >
                          <SpeakerIcon muted={isMuted} />
                        </motion.div>
                      </AnimatePresence>
                    </StatusPillButton>
                  </FillRow>
                )}
                {activeApp ? (
                  activeAppView()
                ) : (
                  <AppGrid
                    key="app-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.2,
                      type: "spring",
                      bounce: 0.7,
                    }}
                  >
                    {BOB_APPS.map((app) => (
                      <AppContainer onClick={() => openApp(app.id)}>
                        {app.icon()}
                        <AppLabel>{AppNameMap[app.id]}</AppLabel>
                      </AppContainer>
                    ))}
                    <AppContainer disabled>
                      <MoreAppsSoonIcon />
                      <AppLabel>In Arbeit</AppLabel>
                    </AppContainer>
                  </AppGrid>
                )}

                {activeApp && (
                  <AppBottomActions>
                    <BackHomeButton onClick={goToHomeScreen}>
                      <ArrowLeftIcon />
                    </BackHomeButton>

                    <AppName>{activeAppName}</AppName>
                  </AppBottomActions>
                )}
              </AnimatePresence>
            </HugColumn>
          </BobPhoneBody>
        )}
      </AnimatePresence>
    </>
  );
};

const AppBottomActions = styled(FillRow)`
  position: relative;

  align-items: center;
  justify-content: center;

  padding: 4px;
  height: 2.5rem;
  margin-top: 4px;
`;

const BackHomeButton = styled.button`
  display: flex;
  align-items: center;

  padding: 8px 12px;
  height: 2.5rem;
  border-radius: 50px;
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  margin: auto 0;
`;

const AppName = styled.h5`
  font-size: 1rem;
  font-weight: 600;
`;

const BobPhoneBody = styled(motion.div)`
  position: fixed;
  bottom: 90px;
  left: 0;
  right: 0;
  margin: 0 auto;

  width: 320px;
  max-width: calc(100vw - 40px);
  background: var(--primary-color);
  padding: 4px;
  border-radius: 24px;
  z-index: 999;
  pointer-events: auto;
`;

const AppGrid = styled(motion.div)`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 1rem;
  padding: 8px;
  place-items: center;
`;

const AppContainer = styled.button`
  position: relative;
  align-items: center;
  width: fit-content;
  background: none;
  border-radius: 24px;
  padding: 0px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &:after {
    content: "";
    position: absolute;
    margin: auto;
    top: 0px;
    bottom: 0px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    background: rgba(255, 255, 255, 0.15);
    opacity: 0;
    z-index: -1;
    border-radius: 24px;
    scale: 0.95;
    transition: 0.25s cubic-bezier(0.4, 0.9, 0.4, 1);
    transition-property: scale, opacity;
  }

  @media (hover: hover) {
    &:not(:disabled):hover {
      cursor: pointer;

      &:after {
        opacity: 1;
        scale: 1;
      }
    }
  }
`;

const AppLabel = styled.span`
  font-size: 0.75rem;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
`;

const StatusPill = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: rgba(255, 255, 255, 0.15);
  padding: 8px 12px;
  border-radius: 100px;
  opacity: 0.75;

  display: flex;
  align-items: center;
  height: 2.25rem;
`;

const StatusPillButton = styled.button<{ $active: boolean }>`
  font-size: 1rem;
  color: ${(p) => (p.$active ? "#212121" : "#ffffff9a")};
  background: ${(p) => (p.$active ? "#ffffff" : "rgba(0, 0, 0, 0.25)")};
  padding: 8px 12px;
  border-radius: 100px;

  display: flex;
  align-items: center;

  > * {
    height: 1.25rem;
  }
`;

const Blinking = styled.span`
  animation: blinking linear 3s infinite;

  @keyframes blinking {
    0% {
      opacity: 0;
    }

    50% {
      opacity: 0;
    }

    51% {
      opacity: 1;
    }

    100% {
      opacity: 1;
    }
  }
`;
