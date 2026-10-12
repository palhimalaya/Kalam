import { duplicateFingerprint } from "@/domain/fingerprint";
import {
  DEFAULT_INTERVALS_DAYS,
  PROPOSED_TOPIC_WEIGHTS,
  type Difficulty,
  type ExamTemplate,
  type KnowledgePack,
  type OptionKey,
  type Question,
  type ReviewStatus,
  type RightsStatus,
  type Settings,
  type SyllabusNode,
} from "@/domain/types";

export const SEED_TIME = "2026-10-12T00:00:00.000Z";
export const PROPOSED_TEMPLATE_ID = "template-proposed-paper-i";
export const DEMO_TEMPLATE_ID = "template-demo-short";

const SOURCE_NOTE =
  "Proposed defaults from the product brief: 100 questions, 90 minutes, 1 mark for a correct answer, 0.2 deducted for a wrong answer, unanswered scores 0, pass mark 40. Confirm the current official PSC notice before relying on these rules.";

export function buildSyllabus(): SyllabusNode[] {
  const topics: Array<[string, string, string, "I" | "II", number]> = [
    ["topic-ga", "GA", "General Awareness and Contemporary Issues", "I", 25],
    ["topic-lr", "LR", "Logical Reasoning", "I", 9],
    ["topic-nr", "NR", "Numerical Reasoning", "I", 8],
    ["topic-sr", "SR", "Spatial Reasoning", "I", 8],
    ["topic-t1", "T1", "Structural Engineering", "II", 5],
    ["topic-t2", "T2", "Engineering Survey", "II", 7],
    ["topic-t3", "T3", "Construction Materials", "II", 6],
    ["topic-t4", "T4", "Concrete Technology", "II", 5],
    ["topic-t5", "T5", "Geotechnical Engineering", "II", 6],
    ["topic-t6", "T6", "Construction Management", "II", 6],
    ["topic-t7", "T7", "Estimating, Costing, Specification and Valuation", "II", 5],
    ["topic-t8", "T8", "Engineering Drawing", "II", 4],
    ["topic-t9", "T9", "Engineering Economics", "II", 3],
    ["topic-t10", "T10", "Professional Practices", "II", 3],
  ];
  return topics.map(([id, code, title, part, marks], index) => ({
    id,
    parentId: null,
    code,
    title,
    part,
    marks,
    clauseText: null,
    sortOrder: index + 1,
    sourceRef: SOURCE_NOTE,
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  }));
}

function options(a: string, b: string, c: string, d: string) {
  return [
    { key: "A" as const, text: a },
    { key: "B" as const, text: b },
    { key: "C" as const, text: c },
    { key: "D" as const, text: d },
  ];
}

function makeQuestion(args: {
  id: string;
  nodeId: string;
  stem: string;
  choices: [string, string, string, string];
  correct: OptionKey;
  difficulty: Difficulty;
  short: string;
  detailed?: string;
  status?: ReviewStatus;
  rights?: RightsStatus;
  language?: Question["language"];
  tags?: string[];
}): Question {
  const choiceList = options(...args.choices);
  const status = args.status ?? "live";
  return {
    id: args.id,
    stem: args.stem,
    options: choiceList,
    correctOption: args.correct,
    shortExplanation: args.short,
    detailedExplanation: args.detailed ?? null,
    optionExplanations: null,
    nodeId: args.nodeId,
    difficulty: args.difficulty,
    estimatedTimeSeconds: 75,
    language: args.language ?? "en",
    figureRef: null,
    tags: args.tags ?? ["demo"],
    sourceType: "original",
    sourceName: "Original demo item",
    sourceUrl: null,
    sourceFileRef: null,
    sourcePage: null,
    sourceYear: null,
    sourceSeries: null,
    rightsStatus: args.rights ?? "original",
    attribution: "Written as original demo content for this trainer. Not an official PSC question.",
    reviewStatus: status,
    reviewNotes:
      status === "live"
        ? "Demo content so the app can be tried. It is not an official PSC item and has not had an independent subject review."
        : "Held out of practice until the status is verified or live.",
    author: "demo-seed",
    reviewer: status === "live" || status === "verified" ? "demo-seed" : null,
    duplicateFingerprint: duplicateFingerprint(args.stem, choiceList.map((option) => option.text)),
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
    verifiedAt: status === "live" || status === "verified" ? SEED_TIME : null,
    demo: true,
  };
}

export function buildQuestions(): Question[] {
  const live: Question[] = [
    makeQuestion({
      id: "demo-ga-1",
      nodeId: "topic-ga",
      stem: "Demo: Which city is the federal capital of Nepal?",
      choices: ["Kathmandu", "Pokhara", "Biratnagar", "Nepalgunj"],
      correct: "A",
      difficulty: "easy",
      short: "Kathmandu is the federal capital.",
    }),
    makeQuestion({
      id: "demo-ga-2",
      nodeId: "topic-ga",
      stem: "Demo: नेपालको राजधानी कुन हो?",
      choices: ["काठमाडौं", "पोखरा", "ललितपुर", "भरतपुर"],
      correct: "A",
      difficulty: "easy",
      language: "ne",
      short: "काठमाडौं नेपालको राजधानी हो।",
    }),
    makeQuestion({
      id: "demo-lr-1",
      nodeId: "topic-lr",
      stem: "Demo: What is the next number in 3, 6, 11, 18, 27, … ?",
      choices: ["34", "36", "38", "40"],
      correct: "C",
      difficulty: "medium",
      short: "The gaps are 3, 5, 7, and 9, so the next gap is 11. 27 + 11 = 38.",
      detailed: "Differences increase by 2 each time. The following difference is 11.",
    }),
    makeQuestion({
      id: "demo-lr-2",
      nodeId: "topic-lr",
      stem: "Demo: Which item does not belong with the others?",
      choices: ["Triangle", "Square", "Pentagon", "Sphere"],
      correct: "D",
      difficulty: "easy",
      short: "A sphere is a solid. The others are plane polygons.",
    }),
    makeQuestion({
      id: "demo-nr-1",
      nodeId: "topic-nr",
      stem: "Demo: What is $15\\%$ of $240$?",
      choices: ["30", "36", "40", "48"],
      correct: "B",
      difficulty: "easy",
      short: "0.15 × 240 = 36.",
    }),
    makeQuestion({
      id: "demo-nr-2",
      nodeId: "topic-nr",
      stem: "Demo: One pump fills a tank in 6 hours and another fills it in 3 hours. How long do they take together?",
      choices: ["1 hour", "2 hours", "4.5 hours", "9 hours"],
      correct: "B",
      difficulty: "medium",
      short: "Combined rate = 1/6 + 1/3 = 1/2 tank per hour, so 2 hours.",
    }),
    makeQuestion({
      id: "demo-sr-1",
      nodeId: "topic-sr",
      stem: "Demo: How many faces does a cube have?",
      choices: ["4", "6", "8", "12"],
      correct: "B",
      difficulty: "easy",
      short: "A cube has 6 square faces.",
    }),
    makeQuestion({
      id: "demo-sr-2",
      nodeId: "topic-sr",
      stem: "Demo: Which shape has exactly four lines of symmetry?",
      choices: ["Square", "Rectangle that is not a square", "Scalene triangle", "Parallelogram that is not a rhombus"],
      correct: "A",
      difficulty: "medium",
      short: "A square has four lines of symmetry. A non-square rectangle has two.",
    }),
    makeQuestion({
      id: "demo-t1-1",
      nodeId: "topic-t1",
      stem: "Demo: For an ideal simply supported beam, what is the bending moment at a simple end support?",
      choices: ["Zero", "Always the maximum moment", "Equal to the shear force", "Equal to the span in metres"],
      correct: "A",
      difficulty: "medium",
      short: "A simple support does not resist moment, so the end moment is zero.",
    }),
    makeQuestion({
      id: "demo-t1-2",
      nodeId: "topic-t1",
      stem: "Demo: If the effective length of a slender column decreases and the other terms stay the same, the Euler buckling load…",
      choices: ["Increases", "Decreases", "Becomes zero", "Changes sign"],
      correct: "A",
      difficulty: "medium",
      short: "Euler load is inversely proportional to the square of effective length, so a shorter effective length raises it.",
    }),
    makeQuestion({
      id: "demo-t2-1",
      nodeId: "topic-t2",
      stem: "Demo: On a map, contour lines that are close together show ground that is…",
      choices: ["Steeper", "Flatter", "Always a valley", "Below sea level"],
      correct: "A",
      difficulty: "easy",
      short: "The same change in height happens over a shorter plan distance, so the slope is steeper.",
    }),
    makeQuestion({
      id: "demo-t2-2",
      nodeId: "topic-t2",
      stem: "Demo: A whole-circle bearing of 90° points…",
      choices: ["East", "North", "South", "West"],
      correct: "A",
      difficulty: "easy",
      short: "Whole-circle bearings are measured clockwise from north, so 90° is east.",
    }),
    makeQuestion({
      id: "demo-t3-1",
      nodeId: "topic-t3",
      stem: "Demo: Seasoning of timber is done mainly to…",
      choices: ["Reduce moisture content before use", "Increase the amount of sap", "Turn the log into steel", "Remove all strength"],
      correct: "A",
      difficulty: "easy",
      short: "Seasoning dries timber towards a moisture content suited to its use.",
    }),
    makeQuestion({
      id: "demo-t3-2",
      nodeId: "topic-t3",
      stem: "Demo: Which material is a hydraulic binder that hardens by reacting with water?",
      choices: ["Portland cement", "Dry sand", "Mild steel", "Glass"],
      correct: "A",
      difficulty: "easy",
      short: "Portland cement hydrates when mixed with water and then hardens.",
    }),
    makeQuestion({
      id: "demo-t4-1",
      nodeId: "topic-t4",
      stem: "Demo: What does curing of concrete mainly provide?",
      choices: [
        "Moisture and a suitable temperature for hydration",
        "A higher water-cement ratio after hardening",
        "Immediate design strength at 1 hour",
        "A replacement for compaction",
      ],
      correct: "A",
      difficulty: "medium",
      short: "Curing keeps conditions suitable so cement hydration can continue.",
    }),
    makeQuestion({
      id: "demo-t4-2",
      nodeId: "topic-t4",
      stem: "Demo: If a concrete mix stays compactable, lowering the water-cement ratio generally…",
      choices: ["Raises compressive strength", "Removes the need for cement", "Stops hydration", "Makes the hardened concrete weaker"],
      correct: "A",
      difficulty: "medium",
      short: "For a mix that can still be compacted, a lower water-cement ratio generally gives higher strength.",
    }),
    makeQuestion({
      id: "demo-t5-1",
      nodeId: "topic-t5",
      stem: "Demo: The liquid limit of a soil is the water content at the change from…",
      choices: ["Plastic to liquid behaviour", "Solid rock to steel", "Dry sand to cement", "Ice to vapour only"],
      correct: "A",
      difficulty: "medium",
      short: "Above the liquid limit the soil behaves as a liquid; below it, as a plastic material.",
    }),
    makeQuestion({
      id: "demo-t5-2",
      nodeId: "topic-t5",
      stem: "Demo: A well-graded soil has…",
      choices: ["A wide range of particle sizes", "Only one particle size", "No solid particles", "Only clay-sized grains and nothing else"],
      correct: "A",
      difficulty: "easy",
      short: "Well graded means the particle sizes are spread over a wide range.",
    }),
    makeQuestion({
      id: "demo-t6-1",
      nodeId: "topic-t6",
      stem: "Demo: In an activity network, the critical path is…",
      choices: ["The longest path through the network", "The path with the most drawings", "Any path that can be delayed without effect", "The cheapest single activity"],
      correct: "A",
      difficulty: "medium",
      short: "The critical path is the longest duration path and has zero total float.",
    }),
    makeQuestion({
      id: "demo-t6-2",
      nodeId: "topic-t6",
      stem: "Demo: A Gantt chart mainly shows…",
      choices: ["Activities against time", "Soil particle sizes", "A contour map", "A steel stress-strain curve"],
      correct: "A",
      difficulty: "easy",
      short: "Bars on a Gantt chart place activities on a time scale.",
    }),
    makeQuestion({
      id: "demo-t7-1",
      nodeId: "topic-t7",
      stem: "Demo: A detailed cost estimate is built from…",
      choices: ["Quantities measured from drawings and specifications", "A guess with no drawings", "Only the project title", "The number of site photos"],
      correct: "A",
      difficulty: "easy",
      short: "A detailed estimate prices quantities taken off the drawings and specifications.",
    }),
    makeQuestion({
      id: "demo-t7-2",
      nodeId: "topic-t7",
      stem: "Demo: An asset costs 100, has a salvage value of 20, and a life of 4 years. Straight-line annual depreciation is…",
      choices: ["10", "20", "25", "80"],
      correct: "B",
      difficulty: "medium",
      short: "(100 − 20) / 4 = 20 per year.",
    }),
    makeQuestion({
      id: "demo-t8-1",
      nodeId: "topic-t8",
      stem: "Demo: A drawing scale of 1:100 means…",
      choices: [
        "1 unit on paper represents 100 units of the object",
        "100 units on paper represent 1 unit of the object",
        "The drawing has 100 views",
        "The object is 1 mm long",
      ],
      correct: "A",
      difficulty: "easy",
      short: "1:100 is a reducing scale. Paper length × 100 gives the object length.",
    }),
    makeQuestion({
      id: "demo-t8-2",
      nodeId: "topic-t8",
      stem: "Demo: The front view in orthographic projection shows the object's…",
      choices: ["Height and width", "Height and depth only", "Depth and width only", "Mass and cost"],
      correct: "A",
      difficulty: "medium",
      short: "The front view shows height and width. Depth appears in the side or top view.",
    }),
    makeQuestion({
      id: "demo-t9-1",
      nodeId: "topic-t9",
      stem: "Demo: Break-even is the output at which…",
      choices: ["Total revenue equals total cost", "Revenue is zero", "Tax is always 40%", "The project has no duration"],
      correct: "A",
      difficulty: "easy",
      short: "At break-even, total revenue equals total cost, so profit is zero.",
    }),
    makeQuestion({
      id: "demo-t9-2",
      nodeId: "topic-t9",
      stem: "Demo: Simple interest on 1,000 at 10% per year for 2 years is…",
      choices: ["20", "100", "200", "1,200"],
      correct: "C",
      difficulty: "easy",
      short: "Interest = 1000 × 0.10 × 2 = 200. The amount including principal would be 1,200.",
    }),
    makeQuestion({
      id: "demo-t10-1",
      nodeId: "topic-t10",
      stem: "Demo: In construction contracting, a tender is…",
      choices: ["An offer to do stated work on stated terms", "A soil sample", "A type of cement", "A contour interval"],
      correct: "A",
      difficulty: "easy",
      short: "A tender offers to carry out described work for a stated price and terms.",
    }),
    makeQuestion({
      id: "demo-t10-2",
      nodeId: "topic-t10",
      stem: "Demo: Which action fits responsible professional practice?",
      choices: [
        "Certify only work prepared under your responsible charge",
        "Seal a drawing you have not reviewed",
        "Hide a known safety defect",
        "Change the contract price after opening without authority",
      ],
      correct: "A",
      difficulty: "medium",
      short: "Certification means you take responsibility for work you have actually controlled and checked.",
    }),
  ];

  const held: Question[] = [
    makeQuestion({
      id: "demo-draft",
      nodeId: "topic-ga",
      stem: "Demo draft: this item stays out of practice.",
      choices: ["Draft", "Live", "Retired", "Flagged"],
      correct: "A",
      difficulty: "easy",
      short: "Draft questions are not eligible.",
      status: "draft",
      tags: ["demo", "workflow"],
    }),
    makeQuestion({
      id: "demo-review",
      nodeId: "topic-lr",
      stem: "Demo review queue: which status still needs a check?",
      choices: ["Needs verification", "A published statute", "A map scale", "A contour"],
      correct: "A",
      difficulty: "easy",
      short: "Needs verification is not practice eligible.",
      status: "needs_verification",
      tags: ["demo", "workflow"],
    }),
    makeQuestion({
      id: "demo-flagged",
      nodeId: "topic-nr",
      stem: "Demo flagged: a reported error should be…",
      choices: ["Kept out of live practice until reviewed", "Forced into the next mock", "Deleted with no record", "Marked mastered"],
      correct: "A",
      difficulty: "easy",
      short: "Flagged questions are withheld.",
      status: "flagged",
      tags: ["demo", "workflow"],
    }),
    makeQuestion({
      id: "demo-retired",
      nodeId: "topic-sr",
      stem: "Demo retired: retired items are…",
      choices: ["Kept for the record but not served", "Always the first mock question", "Exempt from rights metadata", "Used as the pass mark"],
      correct: "A",
      difficulty: "easy",
      short: "Retired questions are not served.",
      status: "retired",
      tags: ["demo", "workflow"],
    }),
    makeQuestion({
      id: "demo-restricted",
      nodeId: "topic-t1",
      stem: "Demo restricted: this live item is still blocked.",
      choices: ["Rights status restricted", "Rights status original", "No options", "No stem"],
      correct: "A",
      difficulty: "easy",
      short: "Restricted rights override a live status.",
      rights: "restricted",
      tags: ["demo", "workflow"],
    }),
  ];

  return [...live, ...held];
}

export function buildTemplates(now = SEED_TIME): ExamTemplate[] {
  const demoWeights = Object.fromEntries(Object.keys(PROPOSED_TOPIC_WEIGHTS).map((code) => [code, 1]));
  return [
    {
      id: PROPOSED_TEMPLATE_ID,
      name: "Proposed Paper I",
      version: 1,
      questionCount: 100,
      totalMarks: 100,
      durationSeconds: 90 * 60,
      marksPerCorrect: 1,
      penaltyPerWrong: 0.2,
      skippedMarks: 0,
      passMark: 40,
      topicWeights: { ...PROPOSED_TOPIC_WEIGHTS },
      difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
      calculatorAllowed: false,
      active: true,
      sourceNote: SOURCE_NOTE,
      lastVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_TEMPLATE_ID,
      name: "Demo short paper",
      version: 1,
      questionCount: 14,
      totalMarks: 14,
      durationSeconds: 15 * 60,
      marksPerCorrect: 1,
      penaltyPerWrong: 0.2,
      skippedMarks: 0,
      passMark: 6,
      topicWeights: demoWeights,
      difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
      calculatorAllowed: false,
      active: true,
      sourceNote:
        "Sized to the built-in demo bank: 1 question for each proposed topic. This is not an official paper. The pass mark of 6 is only for trying the app.",
      lastVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildSettings(now = SEED_TIME): Settings {
  return {
    id: "app",
    targetScore: 70,
    examTemplateId: PROPOSED_TEMPLATE_ID,
    languagePreference: "en",
    theme: "light",
    revisionIntervalsDays: [...DEFAULT_INTERVALS_DAYS],
    createdAt: now,
    updatedAt: now,
  };
}

export function buildKnowledgePacks(): KnowledgePack[] {
  return [
    {
      id: "pack-nr",
      nodeId: "topic-nr",
      syllabusText:
        "Clause wording has not been loaded from an authorized syllabus file. This pack is original study guidance for percentages and combined rates.",
      coreConcepts: [
        "Convert a percentage to a decimal before multiplying.",
        "Add work rates when people or machines work together, then invert the combined rate to get time.",
      ],
      formulaeAndTables: ["Part = percent / 100 × whole", "Combined rate = 1/t1 + 1/t2", "$I = Prt$ for simple interest"],
      workedExamples: ["15% of 240 = 0.15 × 240 = 36.", "Rates of 1/6 and 1/3 per hour add to 1/2, so the time is 2 hours."],
      commonTraps: [
        "Adding the hours instead of the rates.",
        "Treating 15% as 15 instead of 0.15.",
      ],
      nepalContext:
        "Use official notices for current exam rules and current-affairs figures. Do not treat this pack as an official syllabus extract.",
      sources: [
        {
          title: "Public Service Commission, Nepal",
          url: "https://psc.gov.np/",
          claimSupported: "Check the current official notice here. This pack does not quote an exam notice.",
          accessedDate: "2026-10-12",
        },
      ],
      status: "reviewed",
      verifiedAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: "pack-t4",
      nodeId: "topic-t4",
      syllabusText: "Clause wording has not been loaded. Draft notes only: curing and water-cement ratio.",
      coreConcepts: ["Curing maintains conditions for hydration.", "Water-cement ratio is tied to strength when the mix can be compacted."],
      formulaeAndTables: [],
      workedExamples: [],
      commonTraps: ["Assuming a lower water-cement ratio helps even when the concrete cannot be compacted."],
      nepalContext: "Check the current Nepal National Building Code and project specifications before treating a site rule as settled.",
      sources: [
        {
          title: "Department of Urban Development and Building Construction",
          url: "https://www.dudbc.gov.np/",
          claimSupported: "Official building publications are listed by the department. This draft does not quote a code clause.",
          accessedDate: "2026-10-12",
        },
      ],
      status: "draft",
      verifiedAt: null,
      updatedAt: SEED_TIME,
    },
  ];
}
