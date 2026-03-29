import { defineMessages } from "@/i18n/defineMessages";

export const questsMessages = defineMessages({
  de: {
    fallbackReward: "+ 🎁",
    hiddenQuestTitle: "Versteckte Quest",
    hiddenQuestDescription: "Spiele weiter, um diese Quest aufzudecken.",
    nextMilestone: "Nächster Meilenstein",
    allMilestonesCompleted: "Alle Meilensteine abgeschlossen",
    rewardItemReceived: "Item erhalten",
    rewardTapsPattern: "{value} Taps erhalten",
  },
  en: {
    fallbackReward: "+ 🎁",
    hiddenQuestTitle: "Hidden quest",
    hiddenQuestDescription: "Keep playing to uncover this quest.",
    nextMilestone: "Next milestone",
    allMilestonesCompleted: "All milestones completed",
    rewardItemReceived: "Received item",
    rewardTapsPattern: "Got {value} taps",
  },
});

export type QuestsAppMessages = (typeof questsMessages)["de"];
