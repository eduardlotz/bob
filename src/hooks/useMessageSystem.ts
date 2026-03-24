import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { ROUTE_PATHS } from "@/store/config/routes";
import { useIsHydrated, useMessageStore } from "@/store/messageStore";
import { useCoreStore } from "@/store/core/store";
import { useLocaleStore } from "@/i18n";

type SceneVisitPolicy = "always" | "firstVisitInSession" | "returningVisit";

type ScheduledStep = {
  delayMs: number;
  visitPolicy?: SceneVisitPolicy;
  getMessageId: (visitCount: number) => string | null;
  requirement?: () => boolean;
  requirementTimeoutMs?: number;
  requirementCheckIntervalMs?: number;
  subscribeToRequirement?: (onChange: () => void) => () => void;
};

const HOME_ENTRY_DELAY_MS = 2400;
const HOME_WELCOME_MESSAGE_ID = "welcome_home_v3";
const ABOUT_WELCOME_MESSAGE_ID = "about_welcome_v3";
const PORTFOLIO_WELCOME_MESSAGE_ID = "portfolio_welcome_v3";
const MINIGAMES_WELCOME_MESSAGE_ID = "minigames_welcome_v3";
const RETURN_SHOP_AFFORDABLE_MESSAGE_ID = "return_shop_affordable";
const HOME_RETURN_GREETING_IDS = [
  "return_greeting_1",
  "return_greeting_2",
  "return_greeting_3",
  "return_greeting_4",
  "return_greeting_5",
  "return_greeting_6",
  "return_greeting_7",
  "return_greeting_8",
] as const;

const pickRandomHomeGreeting = () =>
  HOME_RETURN_GREETING_IDS[
    Math.floor(Math.random() * HOME_RETURN_GREETING_IDS.length)
  ];

const hasAffordablePurchaseOption = () => {
  const { taps, bobItems, tapEffects, worlds } = useCoreStore.getState();

  const purchasableItems = [
    ...bobItems.filter((item) => item.unlocked !== false),
    ...tapEffects,
    ...worlds,
  ];

  return purchasableItems.some((item) => !item.purchased && item.cost <= taps);
};

const shouldShowAffordableShopHint = () => {
  const state = useMessageStore.getState();
  const alreadySeenPersisted =
    state.repeatFlags[RETURN_SHOP_AFFORDABLE_MESSAGE_ID] === true;
  const alreadySeenThisSession =
    state.seenThisSession[RETURN_SHOP_AFFORDABLE_MESSAGE_ID] === true;
  const currentlyActive =
    state.activeMessage?.config.id === RETURN_SHOP_AFFORDABLE_MESSAGE_ID;
  const alreadyQueued = state.queue.some(
    (item) => item.id === RETURN_SHOP_AFFORDABLE_MESSAGE_ID,
  );
  const alreadyInHistory = state.messageHistory.includes(
    RETURN_SHOP_AFFORDABLE_MESSAGE_ID,
  );

  if (
    alreadySeenPersisted ||
    alreadySeenThisSession ||
    currentlyActive ||
    alreadyQueued ||
    alreadyInHistory
  ) {
    return false;
  }

  return hasAffordablePurchaseOption();
};

const shouldRunStep = (
  visitPolicy: SceneVisitPolicy | undefined,
  visitCount: number,
) => {
  if (visitPolicy === "returningVisit") return visitCount > 0;
  if (visitPolicy === "always") return true;
  return visitCount === 0;
};

const SCENE_MESSAGE_STEPS: Partial<Record<string, ScheduledStep[]>> = {
  [ROUTE_PATHS.HOME]: [
    {
      delayMs: HOME_ENTRY_DELAY_MS,
      visitPolicy: "always",
      getMessageId: (visitCount) => {
        const hasSeenWelcome =
          !!useMessageStore.getState().repeatFlags[HOME_WELCOME_MESSAGE_ID];

        if (visitCount === 0 && !hasSeenWelcome) {
          return HOME_WELCOME_MESSAGE_ID;
        }

        if (shouldShowAffordableShopHint()) {
          return RETURN_SHOP_AFFORDABLE_MESSAGE_ID;
        }

        return pickRandomHomeGreeting();
      },
    },
    {
      delayMs: 1000,
      visitPolicy: "firstVisitInSession",
      getMessageId: () => "first_tap_hint",
      requirement: () => useCoreStore.getState().manualTaps >= 5,
      requirementTimeoutMs: 1000 * 30,
      requirementCheckIntervalMs: 1200,
      subscribeToRequirement: (onChange) =>
        useCoreStore.subscribe(() => {
          onChange();
        }),
    },
  ],
  [ROUTE_PATHS.ABOUT]: [
    {
      delayMs: 1800,
      visitPolicy: "firstVisitInSession",
      getMessageId: () => ABOUT_WELCOME_MESSAGE_ID,
    },
  ],
  [ROUTE_PATHS.PORTFOLIO]: [
    {
      delayMs: 1800,
      visitPolicy: "firstVisitInSession",
      getMessageId: () => PORTFOLIO_WELCOME_MESSAGE_ID,
    },
  ],
  [ROUTE_PATHS.MINIGAMES]: [
    {
      delayMs: 1800,
      visitPolicy: "firstVisitInSession",
      getMessageId: () => MINIGAMES_WELCOME_MESSAGE_ID,
    },
  ],
};

export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const isHydrated = useIsHydrated();
  const showMessage = useMessageStore((state) => state.showMessage);
  const locale = useLocaleStore((state) => state.locale);
  const previousLocaleRef = useRef(locale);
  const hasInitializedHydrationRef = useRef(false);
  const lastRouteRef = useRef<string | null>(null);
  const scheduledTimeoutsRef = useRef<number[]>([]);
  const scheduledCleanupRef = useRef<Array<() => void>>([]);
  const routeVisitCountRef = useRef<Record<string, number>>({});

  const clearScheduledTimeouts = useCallback(() => {
    scheduledTimeoutsRef.current.forEach((timeout) =>
      window.clearTimeout(timeout),
    );
    scheduledTimeoutsRef.current = [];

    scheduledCleanupRef.current.forEach((cleanup) => cleanup());
    scheduledCleanupRef.current = [];
  }, []);

  const scheduleSteps = useCallback(
    (route: string, steps: ScheduledStep[]) => {
      clearScheduledTimeouts();

      const visitCount = routeVisitCountRef.current[route] ?? 0;
      routeVisitCountRef.current[route] = visitCount + 1;

      steps.forEach(
        ({
          delayMs,
          visitPolicy,
          getMessageId,
          requirement,
          requirementTimeoutMs,
          requirementCheckIntervalMs,
          subscribeToRequirement,
        }) => {
          if (!shouldRunStep(visitPolicy, visitCount)) return;

          const messageId = getMessageId(visitCount);
          if (!messageId) return;

          const canRun = () => {
            if (!useMessageStore.getState().isHydrated) return;
            if (useAppStore.getState().currentRoute !== route) return;
            if (useMessageStore.getState().systemPaused) return;
            return true;
          };

          let stopped = false;
          let unsubscribeRequirement: (() => void) | null = null;

          const stopRequirementCheck = () => {
            if (stopped) return;
            stopped = true;
            if (unsubscribeRequirement) unsubscribeRequirement();
          };

          const queueWithRequirement = (
            deadlineAt: number,
            checkEveryMs: number,
          ) => {
            if (stopped) return;
            if (!canRun()) {
              stopRequirementCheck();
              return;
            }
            if (!requirement || requirement()) {
              stopRequirementCheck();
              void showMessage(messageId);
              return;
            }
            if (Date.now() >= deadlineAt) {
              stopRequirementCheck();
              return;
            }

            const retryTimeout = window.setTimeout(() => {
              queueWithRequirement(deadlineAt, checkEveryMs);
            }, checkEveryMs);
            scheduledTimeoutsRef.current.push(retryTimeout);
          };

          const timeout = window.setTimeout(() => {
            if (!canRun()) return;

            if (!requirement) {
              void showMessage(messageId);
              return;
            }

            const checkEveryMs = requirementCheckIntervalMs ?? 1500;
            const maxWaitMs = requirementTimeoutMs ?? 60000;
            const deadlineAt = Date.now() + maxWaitMs;

            if (subscribeToRequirement) {
              unsubscribeRequirement = subscribeToRequirement(() => {
                queueWithRequirement(deadlineAt, checkEveryMs);
              });
              scheduledCleanupRef.current.push(stopRequirementCheck);
            }

            queueWithRequirement(deadlineAt, checkEveryMs);
          }, delayMs);

          scheduledTimeoutsRef.current.push(timeout);
        },
      );
    },
    [clearScheduledTimeouts, showMessage],
  );

  const handleRouteChange = useCallback(
    (route: string) => {
      const steps = SCENE_MESSAGE_STEPS[route] ?? [];
      scheduleSteps(route, steps);
    },
    [scheduleSteps],
  );

  useEffect(() => {
    if (!currentRoute || !isHydrated) return;
    if (currentRoute === lastRouteRef.current) return;
    lastRouteRef.current = currentRoute;
    handleRouteChange(currentRoute);
  }, [currentRoute, handleRouteChange, isHydrated]);

  useEffect(() => {
    return () => {
      clearScheduledTimeouts();
    };
  }, [clearScheduledTimeouts]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!hasInitializedHydrationRef.current) {
      hasInitializedHydrationRef.current = true;
      previousLocaleRef.current = locale;
      return;
    }

    if (previousLocaleRef.current === locale) {
      return;
    }

    previousLocaleRef.current = locale;
    lastRouteRef.current = null;
    routeVisitCountRef.current = {};
    clearScheduledTimeouts();
    useMessageStore.setState({ activeMessage: null, queue: [] });

    if (!currentRoute) return;

    lastRouteRef.current = currentRoute;
    handleRouteChange(currentRoute);
  }, [
    clearScheduledTimeouts,
    currentRoute,
    handleRouteChange,
    isHydrated,
    locale,
  ]);
}
