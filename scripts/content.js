const MODULE_ID = "pf2e-affliction-forge-occult-horrors";
const CONTENT_VERSION = "0.1.0";
const I18N_PREFIX = "PF2E_AFFLICTION_OH.Content";

const token = (slug, key) => `@i18n:${I18N_PREFIX}.${slug}.${key}`;
const restrictions = ({ locks = [], healing = "none", damageTypes = [], blocked = [] } = {}) => ({ conditionLocks: locks.map(([slug, minimum]) => ({ slug, minimum })), healing, unhealableDamageTypes: [...damageTypes], blockedCapabilities: [...blocked] });
const duration = ([value, unit]) => ({ value, unit });
const condition = (slug, value = null) => value == null ? { type: "condition", slug } : { type: "condition", slug, value };
const damage = (formula, damageType, persistent = false) => ({ type: "damage", formula, damageType, ...(persistent ? { persistent: true } : {}) });
const death = (category = "death-effect") => ({ type: "death", category });

function effect(slug, stageNumber, components, nameKey = null) {
  if (!components.length) return null;
  return { schemaVersion: 2, id: `${MODULE_ID}.${slug}.stage-${stageNumber}`, name: token(slug, nameKey ?? `Stage${stageNumber}.Name`), duration: { value: -1, unit: "unlimited", expiry: null }, components, application: {}, metadata: { originModule: MODULE_ID, originFeature: "occult-horrors-stage" } };
}

function componentFromSpec(entry) {
  if (entry[0] === "condition") return condition(entry[1], entry[2]);
  if (entry[0] === "damage") return damage(entry[1], entry[2], false);
  if (entry[0] === "damagePersistent") return damage(entry[1], entry[2], true);
  if (entry[0] === "death") return death(entry[1]);
  throw new Error(`Unsupported Occult Horrors component type: ${entry[0]}`);
}

function makeStage(slug, stageNumber, stageSpec) {
  const [durationSpec, componentSpecs, options = {}] = stageSpec;
  const components = componentSpecs.map(componentFromSpec);
  const stageRestrictions = restrictions({ locks: options.locks ?? [], healing: options.healing ?? "none", blocked: options.blockSpeak ? ["speak"] : [] });
  const preActionGates = options.gate ? [{
    id: `${slug}.stage-${stageNumber}.gate`,
    label: token(slug, `Stage${stageNumber}.Gate`),
    trigger: { actionKinds: ["spell-cast", "item-activation"], requiredTraits: ["concentrate"] },
    check: { kind: "flat", dc: options.gate },
    blockOnFailure: true
  }] : [];
  return {
    id: `stage-${stageNumber}`, number: stageNumber, name: token(slug, `Stage${stageNumber}.Name`), description: token(slug, `Stage${stageNumber}.Description`),
    duration: duration(durationSpec), expiryAction: options.expiry ?? "check", check: null, restrictions: stageRestrictions, effectPersistence: "stage", effectPersistenceDuration: null,
    effectComponentPersistence: [], effectComponentPersistenceDurations: [], effect: effect(slug, stageNumber, components), numericModifiers: [], periodicEffects: [], preActionGates, reactions: []
  };
}

function makeDefinition(spec) {
  const themes = Object.entries(spec.tags).flatMap(([namespace, values]) => values.map((value) => `${namespace}:${value}`));
  const normalProgression = { criticalSuccess: { action: "stage-delta", delta: -2 }, success: { action: "stage-delta", delta: -1 }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } };
  const stubbornProgression = { criticalSuccess: { action: "stage-delta", delta: -1 }, success: { action: "stay" }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } };
  return {
    schemaVersion: 2, id: `${MODULE_ID}.${spec.slug}`, name: token(spec.slug, "Name"), description: token(spec.slug, "Description"), img: "icons/svg/eye.svg",
    afflictionType: spec.type, level: spec.level, rarity: spec.rarity, traits: [spec.type, ...(spec.virulent === true ? ["virulent"] : [])], themes,
    saveDefaults: { execution: "player", visibility: "public" }, identification: { initialState: spec.identification ?? "identified" }, delivery: { injuryPoison: false }, multipleExposure: "default",
    restrictions: restrictions({ locks: spec.locks ?? [], healing: spec.rootHealing ?? "none" }),
    checks: [{ id: "primary", label: token(spec.slug, "SaveLabel"), kind: "save", statistic: spec.stat, dcMode: "fixed", dc: spec.dc, policy: null }],
    initialCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "reject" }, success: { action: "reject" }, failure: { action: "set-stage", stage: 1 }, criticalFailure: { action: "set-stage", stage: Math.min(2, spec.stages.length) } } },
    onset: spec.onset ? duration(spec.onset) : null, maximumDuration: spec.maxDuration ? duration(spec.maxDuration) : null,
    defaultStageCheck: { checkIds: ["primary"], combine: "single", outcomes: spec.stubborn ? stubbornProgression : normalProgression },
    progression: { belowStageOne: "recover", aboveMaximumStage: "clamp", virulent: spec.virulent === true },
    stages: spec.stages.map((stage, index) => makeStage(spec.slug, index + 1, stage)),
    metadata: { originModule: MODULE_ID, originFeature: "occult-horrors-library", contentVersion: CONTENT_VERSION, contentLicense: "original-homebrew", creatureForgeReady: true }
  };
}

const SPECS = [
  {
    "slug": "whisper-itch",
    "level": 0,
    "dc": 14,
    "type": "curse",
    "rarity": "common",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "fey"
      ],
      "habitat": [
        "urban",
        "forest"
      ],
      "theme": [
        "curse",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "candle-moth-dust",
    "level": 0,
    "dc": 14,
    "type": "poison",
    "rarity": "common",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "beast",
        "fey"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "poison",
        "dream",
        "mental"
      ],
      "origin": [
        "natural",
        "occult"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "mental"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "mental"
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "hollow-sleep-fever",
    "level": 1,
    "dc": 15,
    "type": "disease",
    "rarity": "common",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "dream",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ],
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      2,
      "hours"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "mirror-leech-mark",
    "level": 1,
    "dc": 15,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "aberration"
      ],
      "family": [
        "parasite"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "curse",
        "parasite",
        "shadow"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "mental"
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      1,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "nightglass-spores",
    "level": 2,
    "dc": 16,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "fungus",
        "aberration"
      ],
      "habitat": [
        "underground"
      ],
      "theme": [
        "disease",
        "fungal",
        "spores",
        "shadow"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "void"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "void"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "pale-whisper-venom",
    "level": 2,
    "dc": 16,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "beast"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "underground",
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "mental"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "mental"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "echo-worm-infestation",
    "level": 3,
    "dc": 18,
    "type": "disease",
    "rarity": "uncommon",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "worm",
        "parasite"
      ],
      "habitat": [
        "underground",
        "planar"
      ],
      "theme": [
        "disease",
        "parasite",
        "mental"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "ingested",
        "contact"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": [
      1,
      "hours"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "black-candle-curse",
    "level": 3,
    "dc": 18,
    "type": "curse",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "undead"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "curse",
        "shadow",
        "necrotic"
      ],
      "origin": [
        "occult",
        "undead"
      ],
      "delivery": [
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "1d6",
            "void"
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "dream-eater-pollen",
    "level": 4,
    "dc": 19,
    "type": "poison",
    "rarity": "uncommon",
    "stat": "will",
    "tags": {
      "creature": [
        "plant",
        "fey"
      ],
      "habitat": [
        "forest",
        "jungle"
      ],
      "theme": [
        "poison",
        "dream",
        "mental"
      ],
      "origin": [
        "occult",
        "primal"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "mental"
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "shadow-lace",
    "level": 4,
    "dc": 19,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fey",
        "spirit"
      ],
      "habitat": [
        "forest",
        "urban"
      ],
      "theme": [
        "curse",
        "shadow",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "glass-eye-fever",
    "level": 5,
    "dc": 20,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration",
        "humanoid"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "disease",
        "mutation",
        "mental"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "ability"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": [
      1,
      "hours"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "sable-spider-venom",
    "level": 5,
    "dc": 20,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "beast",
        "aberration"
      ],
      "family": [
        "spider",
        "arachnid"
      ],
      "habitat": [
        "underground",
        "forest"
      ],
      "theme": [
        "poison",
        "venom",
        "shadow"
      ],
      "origin": [
        "natural",
        "occult"
      ],
      "delivery": [
        "bite"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "false-memory-blight",
    "level": 6,
    "dc": 22,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "spirit"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "curse",
        "mental",
        "corruption"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "gate": 5
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "gate": 6
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "moon-mouth-parasite",
    "level": 6,
    "dc": 22,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "parasite",
        "worm"
      ],
      "habitat": [
        "swamp",
        "underground"
      ],
      "theme": [
        "disease",
        "parasite",
        "mutation"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "bite",
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "name-thief-mark",
    "level": 7,
    "dc": 23,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fey",
        "spirit"
      ],
      "habitat": [
        "forest",
        "urban",
        "planar"
      ],
      "theme": [
        "curse",
        "mental",
        "shadow"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "ability"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "blockSpeak": true,
          "locks": [
            [
              "stupefied",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "whispering-mycelium",
    "level": 7,
    "dc": 23,
    "type": "disease",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fungus",
        "aberration"
      ],
      "habitat": [
        "underground",
        "forest"
      ],
      "theme": [
        "disease",
        "fungal",
        "spores",
        "mental"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "astral-leech-fever",
    "level": 8,
    "dc": 24,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration",
        "spirit"
      ],
      "family": [
        "parasite"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "disease",
        "parasite",
        "dream",
        "necrotic"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "2d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "veil-wasp-venom",
    "level": 8,
    "dc": 24,
    "type": "poison",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "beast",
        "fey"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "forest",
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "dream"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "sting"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "mental"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "doppelshade-curse",
    "level": 9,
    "dc": 26,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "undead"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "curse",
        "shadow",
        "corruption"
      ],
      "origin": [
        "occult",
        "undead"
      ],
      "delivery": [
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "condition",
            "frightened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "frightened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "sleepwalker-rot",
    "level": 9,
    "dc": 26,
    "type": "disease",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "undead"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "disease",
        "dream",
        "necrotic"
      ],
      "origin": [
        "occult",
        "undead"
      ],
      "delivery": [
        "bite"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "fatigued"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "fatigued"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ]
    ],
    "onset": [
      1,
      "hours"
    ],
    "maxDuration": [
      4,
      "days"
    ],
    "stubborn": false,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "thoughtmold-bloom",
    "level": 10,
    "dc": 27,
    "type": "disease",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "fungus",
        "aberration"
      ],
      "habitat": [
        "underground",
        "planar"
      ],
      "theme": [
        "disease",
        "fungal",
        "mental",
        "corruption"
      ],
      "origin": [
        "occult"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {
          "gate": 5
        }
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {
          "gate": 7
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "red-dream-venom",
    "level": 10,
    "dc": 27,
    "type": "poison",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "beast"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "planar",
        "desert"
      ],
      "theme": [
        "poison",
        "venom",
        "dream",
        "mental"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "mental"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "faceless-oath",
    "level": 11,
    "dc": 28,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "fey",
        "fiend"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "curse",
        "mental",
        "corruption"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "ability"
      ]
    },
    "stages": [
      [
        [
          8,
          "hours"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true
        }
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {
          "blockSpeak": true,
          "healing": "affliction-damage"
        }
      ],
      [
        [
          8,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {
          "blockSpeak": true,
          "healing": "all"
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "eclipse-scorpion-venom",
    "level": 12,
    "dc": 30,
    "type": "poison",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "beast",
        "aberration"
      ],
      "family": [
        "scorpion"
      ],
      "habitat": [
        "desert",
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "shadow"
      ],
      "origin": [
        "occult",
        "natural"
      ],
      "delivery": [
        "sting"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "memory-maw-infestation",
    "level": 13,
    "dc": 31,
    "type": "disease",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "parasite",
        "worm"
      ],
      "habitat": [
        "planar",
        "underground"
      ],
      "theme": [
        "disease",
        "parasite",
        "mental",
        "corruption"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "ability",
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {
          "gate": 6
        }
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {
          "gate": 8,
          "locks": [
            [
              "stupefied",
              2
            ]
          ]
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "crimson-reflection",
    "level": 14,
    "dc": 32,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "spirit",
        "fiend"
      ],
      "habitat": [
        "urban",
        "planar"
      ],
      "theme": [
        "curse",
        "blood",
        "shadow",
        "corruption"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "spirit"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "doomed",
            1
          ]
        ],
        {
          "healing": "all",
          "locks": [
            [
              "doomed",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": true,
    "virulent": false,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "void-moth-dust",
    "level": 15,
    "dc": 34,
    "type": "poison",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "beast"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "planar",
        "underground"
      ],
      "theme": [
        "poison",
        "dream",
        "shadow",
        "mental"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "damage",
            "3d6",
            "void"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "7d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "dream-prison",
    "level": 16,
    "dc": 35,
    "type": "curse",
    "rarity": "rare",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "fey",
        "spirit"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "dream",
        "mental"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 7
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "7d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "slowed",
            2
          ]
        ],
        {
          "gate": 9,
          "locks": [
            [
              "slowed",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "skin-writer-parasite",
    "level": 17,
    "dc": 36,
    "type": "disease",
    "rarity": "rare",
    "stat": "fortitude",
    "tags": {
      "creature": [
        "aberration"
      ],
      "family": [
        "parasite",
        "worm"
      ],
      "habitat": [
        "planar",
        "underground"
      ],
      "theme": [
        "disease",
        "parasite",
        "mutation",
        "corruption"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "injury",
        "contact"
      ]
    },
    "stages": [
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "5d6",
            "void"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          6,
          "hours"
        ],
        [
          [
            "damage",
            "7d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "doomed",
            1
          ]
        ],
        {
          "locks": [
            [
              "drained",
              1
            ]
          ]
        }
      ]
    ],
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      3,
      "days"
    ],
    "stubborn": false,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "unmaking-whisper",
    "level": 18,
    "dc": 38,
    "type": "curse",
    "rarity": "unique",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "spirit"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "mental",
        "corruption",
        "shadow"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "aura"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "6d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "8d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {
          "gate": 8
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "10d6",
            "spirit"
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "doomed",
            1
          ]
        ],
        {
          "gate": 10,
          "locks": [
            [
              "stupefied",
              2
            ],
            [
              "doomed",
              1
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "night-between-stars",
    "level": 19,
    "dc": 39,
    "type": "curse",
    "rarity": "unique",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "monitor"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "dream",
        "shadow",
        "corruption"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "7d6",
            "void"
          ],
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "frightened",
            1
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "9d6",
            "void"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "healing": "affliction-damage"
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "11d6",
            "void"
          ],
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "slowed",
            2
          ],
          [
            "condition",
            "doomed",
            2
          ]
        ],
        {
          "healing": "all",
          "locks": [
            [
              "drained",
              2
            ],
            [
              "doomed",
              2
            ]
          ]
        }
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  },
  {
    "slug": "devouring-dream",
    "level": 20,
    "dc": 40,
    "type": "curse",
    "rarity": "unique",
    "stat": "will",
    "tags": {
      "creature": [
        "aberration",
        "spirit"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "curse",
        "dream",
        "mental",
        "corruption"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "aura",
        "ability"
      ]
    },
    "stages": [
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "8d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "10d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {
          "gate": 9,
          "locks": [
            [
              "stupefied",
              2
            ]
          ]
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "12d6",
            "mental"
          ],
          [
            "damage",
            "6d6",
            "void"
          ],
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "doomed",
            2
          ]
        ],
        {
          "gate": 11,
          "locks": [
            [
              "drained",
              2
            ],
            [
              "doomed",
              2
            ]
          ]
        }
      ],
      [
        [
          4,
          "hours"
        ],
        [
          [
            "damage",
            "14d6",
            "mental"
          ],
          [
            "damage",
            "8d6",
            "void"
          ],
          [
            "death",
            "death-effect"
          ]
        ],
        {}
      ]
    ],
    "onset": null,
    "maxDuration": [
      2,
      "days"
    ],
    "stubborn": true,
    "virulent": true,
    "identification": "identified",
    "locks": [],
    "rootHealing": "none"
  }
];

export const OCCULT_HORRORS_MODULE_ID = MODULE_ID;
export const OCCULT_HORRORS_CONTENT_VERSION = CONTENT_VERSION;
export const OCCULT_HORRORS_DEFINITIONS = Object.freeze(SPECS.map(makeDefinition));
export function createOccultHorrorsDefinitions() {
  return OCCULT_HORRORS_DEFINITIONS.map((definition) => structuredClone(definition));
}
