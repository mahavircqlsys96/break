import {
  Baby,
  Car,
  Cctv,
  CookingPot,
  Cross,
  Flame,
  Home,
  KeyRound,
  Palmtree,
  Snowflake,
  Sparkles,
  Tent,
  Tractor,
  Trees,
  WashingMachine,
  Waves,
  Wifi,
} from "lucide-react";

// Icons that master data (categories, amenities) can reference by name.
export const ICONS = {
  Tractor,
  Home,
  Palmtree,
  Tent,
  Waves,
  Wifi,
  Car,
  Snowflake,
  CookingPot,
  WashingMachine,
  Flame,
  Baby,
  Trees,
  KeyRound,
  Cross,
  Cctv,
  Sparkles,
};

export function DynamicIcon({ name, ...props }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon {...props} />;
}
