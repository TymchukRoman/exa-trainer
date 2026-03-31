export type MuscleRegionId =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "legs"
  | "hips"
  | "neck";

const FALLBACK_REGION: MuscleRegionId = "core";

const REGION_ICONS: Record<MuscleRegionId, string> = {
  chest: new URL("../assets/muscleRegions/chest.png", import.meta.url).toString(),
  back: new URL("../assets/muscleRegions/back.png", import.meta.url).toString(),
  shoulders: new URL("../assets/muscleRegions/shoulders.png", import.meta.url).toString(),
  arms: new URL("../assets/muscleRegions/arms.png", import.meta.url).toString(),
  core: new URL("../assets/muscleRegions/core.png", import.meta.url).toString(),
  legs: new URL("../assets/muscleRegions/legs.png", import.meta.url).toString(),
  hips: new URL("../assets/muscleRegions/hips.png", import.meta.url).toString(),
  neck: new URL("../assets/muscleRegions/neck.png", import.meta.url).toString(),
};

export function normalizeMuscleRegionId(region: string): MuscleRegionId {
  const key = region?.trim().toLowerCase() as MuscleRegionId;
  return key in REGION_ICONS ? key : FALLBACK_REGION;
}

export function getMuscleRegionIconSrc(region: string): string {
  return REGION_ICONS[normalizeMuscleRegionId(region)];
}
