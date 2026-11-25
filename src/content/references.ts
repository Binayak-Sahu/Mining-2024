import type { Reference } from "@/lib/types";

/**
 * Source registry for concept flows. Every flow screen cites ids from here. Each entry was fetched
 * during authoring (accessed date below); claims are paraphrased, never copied.
 */
export const REFS: Record<string, Reference> = {
  "niosh-ic9486-ch1": {
    title: "Handbook for Methane Control in Mining (IC 9486), ch. 1: Methane control fundamentals",
    author: "F.N. Kissell (ed.), NIOSH",
    publisher: "NIOSH / CDC, US Dept. of Health and Human Services, 2006",
    url: "https://stacks.cdc.gov/view/cdc/6882/cdc_6882_DS1.pdf",
    accessed: "2026-11-25",
    tier: 2,
    licence: "public-domain",
    where: "Ch. 1, pp. 3–6",
  },
  "niosh-ic9486-ch10": {
    title: "Handbook for Methane Control in Mining (IC 9486), ch. 10: Methane control in highwall mining (inert gas)",
    author: "F.N. Kissell (ed.), NIOSH",
    publisher: "NIOSH / CDC, US Dept. of Health and Human Services, 2006",
    url: "https://stacks.cdc.gov/view/cdc/6882/cdc_6882_DS1.pdf",
    accessed: "2026-11-25",
    tier: 2,
    licence: "public-domain",
    where: "Ch. 10, pp. 135–137",
  },
};
