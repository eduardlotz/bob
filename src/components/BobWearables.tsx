import { memo, useMemo } from "react";
import type { BobItem } from "@/store/core/store";
import type { BlobFormParameters, BlobFormType } from "@/types/blobForms";
import { fitBobWearable, getBobBodyFit, type BobBodyFit } from "./bob/wearableFit";
import { BOB_WEARABLES, type WearableDefinition } from "./bob/wearableRegistry";

interface Props {
  items: BobItem[];
  blobFormType: BlobFormType;
  parameters: BlobFormParameters;
  outlineColor?: string;
}

const Wearable = memo(function Wearable({ id, definition, body, preview, outlineColor }: {
  id: string;
  definition: WearableDefinition;
  body: BobBodyFit;
  preview: boolean;
  outlineColor?: string;
}) {
  const transform = useMemo(() => fitBobWearable(body, definition.mount), [body, definition]);
  const { Model, calibration } = definition;
  return (
    <group name={`bob-wearable:${id}`} {...transform}>
      <Model
        {...calibration}
        formType={body.formType}
        body={body}
        preview={preview}
        outlineColor={definition.useThemeOutline === false ? undefined : outlineColor}
      />
    </group>
  );
});

/** Shared decorative wearables; body fitting never creates colliders or geometry. */
export function BobWearables({ items, blobFormType, parameters, outlineColor }: Props) {
  const body = useMemo(() => getBobBodyFit(blobFormType, parameters), [blobFormType, parameters]);
  return items.map((item) => {
    const definition = Object.prototype.hasOwnProperty.call(BOB_WEARABLES, item.id)
      ? BOB_WEARABLES[item.id] : undefined;
    if (item.detached || !definition) return null;
    return (
      <Wearable
        key={item.id}
        id={item.id}
        definition={definition}
        body={body}
        preview={!item.enabled && !!item.preview}
        outlineColor={outlineColor}
      />
    );
  });
}
