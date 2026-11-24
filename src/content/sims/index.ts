import type { SimDef } from "@/lib/types";
import { U0_SIMS } from "./u0";
import { U1_SIMS } from "./u1";
import { U2_SIMS } from "./u2";
import { U3_SIMS } from "./u3";
import { U4_SIMS } from "./u4";

export const ALL_SIMS: SimDef[] = [...U0_SIMS, ...U1_SIMS, ...U2_SIMS, ...U3_SIMS, ...U4_SIMS];
