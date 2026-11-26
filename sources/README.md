# sources/

Primary documents supplied by the owner. Text versions sit next to each PDF (`<name>.txt`, one `=== PAGE n ===` marker per page; pages produced by OCR start with `[OCR]`).

| File | Pages | Text extraction |
|---|---|---|
| `DGMScircularsfrom20182024_06122024.pdf` | 155 | **Scanned.** 135 of 155 pages have no text layer and were OCRed with Tesseract 5.3 (English, 200 dpi). Pages 1–4, 52 and 74–85 and 117–119 are native text. Pages 120 onwards are OCR. OCR errors are likely in numbers, tables and Hindi text: check against the PDF before quoting. |
| `CMR 2017.pdf` | 122 | native text layer (`pdftotext -layout`) |
| `AMENDMENTS IN EARLIER BYE-LAWS NOTIFIED UNDER CMR, 2017.pdf` | 16 | native text layer |
| `FinalNotificationCBT_02022025.pdf` | 2 | native text layer |
| `GAZETTE_NOTIFICATIONS_03072024.pdf` | 140 | native text layer |
| `OSH Code 2020.pdf` | 86 | native text layer |
| `Occupational_Safety_Rules, 2026.pdf` | 180 | native text layer |

Note: the owner brief said 137 of 156 pages were scanned. `pdfinfo` reports 155 pages and the per-page check found 135 without a text layer (a page counts as scanned when `pdftotext` returns under 40 characters).

## Scanned files
- `DGMScircularsfrom20182024_06122024.pdf` (the only scanned file).

## `nitr/`
NIT Rourkela B.Tech Mining (4 yr) curriculum, fetched 2026-11-26 from https://www.nitrkl.ac.in/Academic/Curriculum/?id=18 (`curriculum-id18.txt`) and each MN-coded subject's page `https://www.nitrkl.ac.in/Academic/Syllabus/?id=18&sid=<sid>` (`<code>_<sid>.txt`, first line is the URL).
- 93 distinct MN-coded subject links on the curriculum page; 64 have a published syllabus (saved).
- 29 pages answer "Course Syllabus Not Found!!" on the site, so there is no text to save:
  - MN2105 Underground Coal Mining (sid 8797)
  - MN2206 Mine Ventilation (sid 7358)
  - MN2271 Mining Geology Laboratory (sid 8795)
  - MN2701 Hazard and Rescue Laboratory (sid 8798)
  - MN2706 Mine ventilation Laboratory (sid 8893)
  - MN3003 Statistics for Engineers (sid 19311)
  - MN3010 Product Development (sid 8899)
  - MN3107 Underground Metal Mining (sid 8895)
  - MN3204 Surface Mine Environmental Engineering (sid 19685)
  - MN3206 Solid Fuels and Clean Coal Technology (sid 19686)
  - MN3208 Mine Economics (sid 19684)
  - MN3301 Mini Project (sid 19312)
  - MN3670 Product Development Laboratory (sid 8800)
  - MN3703 Coal and Mineral Processing Laboratory (sid 8896)
  - MN4001 Mining Technology (sid 8801)
  - MN4095 Capstone Project - I (sid 8392)
  - MN4101 Mine System Engineering (sid 19777)
  - MN4105 Computer Application in Mining (sid 19779)
  - MN4303 Summer Project/ Research Experience/ Community Service Project (sid 19775)
  - MN4555 Special Topics by Industry Experts (sid 8859)
  - MN4701 Mine System Laboratory (sid 19781)
  - MN4705 Computer Application in Mining Laboratory (sid 19783)
  - MN4901 Seminar and Technical Writing (sid 8416)
  - MN4908 Comprehensive Viva Voce (sid 6570)
  - MN5022 Computer Application in Mining Laboratory (sid 7921)
  - MN5244 Coal Bed Methane (sid 7967)
  - MN6043 Ground Control Instrumentation (sid 19650)
  - MN6103 Design of Underground Structures (sid 19780)
  - MN6701 Ground Control Instrumentation Laboratory (sid 19784)
- The page lists old and new codes of the same subject (e.g. MN3001/MN3103/MN3105 Mining Machinery). Identical text is mapped once in `coverage/`.

## Missing
- The First Class Manager syllabus in the bye-laws **G.S.R. 910(E), 14-09-2018** is not here. See `ROADMAP.md` ("syllabus source missing"). `AMENDMENTS…CMR, 2017.pdf` holds only the 2021 amendments to it (G.S.R. 555(E)–559(E)).
