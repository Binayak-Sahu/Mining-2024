// Fill research/cache/private/ (gitignored) with the text of copyrighted sources so verify-quotes can
// check their excerpts locally. Never commit these texts.
//   npm run fetch:sources        (needs curl + pdftotext, and network access to the hosts below)
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PRIVATE = {
  "hoek-pre-ch6": "https://static.rocscience.cloud/assets/resources/learning/hoek/6.-In-situ-and-induced-stresses_2023-06-30-120631_tybx.pdf",
  "zlochower-2009": "https://stacks.cdc.gov/view/cdc/227096/cdc_227096_DS1.pdf",
  "zipf-2013": "https://stacks.cdc.gov/view/cdc/227327/cdc_227327_DS1.pdf",
  "zipf-ch59": "https://stacks.cdc.gov/view/cdc/220503/cdc_220503_DS1.pdf",
  "esterhuizen-2008": "https://stacks.cdc.gov/view/cdc/226984/cdc_226984_DS1.pdf",
  "mark-pillar-sota": "https://stacks.cdc.gov/view/cdc/9421/cdc_9421_DS1.pdf",
};

const out = join(process.cwd(), "research/cache/private");
mkdirSync(out, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "strata-src-"));
for (const [id, url] of Object.entries(PRIVATE)) {
  const txt = join(out, `${id}.txt`);
  if (existsSync(txt)) {
    console.log(`have    ${id}`);
    continue;
  }
  try {
    const pdf = join(tmp, `${id}.pdf`);
    execFileSync("curl", ["-sSL", "-m", "120", "-o", pdf, url]);
    execFileSync("pdftotext", [pdf, txt]); // reading order (not -layout): two-column PDFs stay intact
    console.log(`fetched ${id}`);
  } catch (e) {
    console.log(`FAILED  ${id}: ${e.message.split("\n")[0]}`);
  }
}
