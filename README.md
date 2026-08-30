# PF2E Affliction Forge: Occult Horrors

A bilingual DE/EN library add-on for **PF2E Affliction Forge 0.1.63+** containing 32 original occult-horror afflictions designed for authored creatures and Creature Forge matching.


## Part of the Forge Suite

**Affliction Forge: Occult Horrors** is part of the **Forge Suite**, a growing collection of Foundry VTT modules and add-ons built for the busy Game Master. The suite is designed to reduce preparation and bookkeeping, make common GM tasks easier, and add useful tools that help make running and playing campaigns smoother and more enjoyable.

An overview of the Forge Suite, its modules, add-ons, and shared documentation is available here:

**Forge Suite:** https://github.com/crypto-vbrthr/pf2e-forge-suite


## Feedback, Bug Reports & Feature Requests

Found a bug, have an idea for an improvement, or would like to suggest a new feature?

Feedback is always welcome. Please feel free to open a new **GitHub Issue** at any time, whether you want to report a problem, suggest a quality-of-life improvement, propose a new feature, or share an idea for how the module could be made more useful.

When reporting a bug, please include as much relevant information as possible, such as the Foundry VTT version, PF2e system version, module version, steps to reproduce the issue, and any console errors or screenshots that may help identify the problem.

Suggestions and feature requests are equally welcome. Even small ideas can lead to useful improvements.

**Open an issue here:** https://github.com/crypto-vbrthr/pf2e-affliction-forge-occult-horrors/issues


## Highlights

- 32 original afflictions from level 0 to 20
- Mixed curses, diseases, and strange natural/occult poisons
- Strong dream, mental, shadow, parasite, mutation, corruption, and necrotic themes
- Creature, family, habitat, theme, origin, and delivery semantic tags
- Advanced stage mechanics including stubborn progression, virulent afflictions, healing restrictions, speech blocking, condition locks, and concentration gates
- Natural bite/sting poisons do **not** use weapon injury-poison charges
- Foundry 14-safe managed world-compendium synchronization
- Read-only provider registration through the public Affliction Forge library API

## Creature Forge contract

Each definition uses canonical `themes[]` semantic tags from Affliction Forge contract 1.0.0, for example:

```text
creature:aberration
family:parasite
habitat:planar
theme:dream
origin:occult
delivery:ability
```

Creature Forge can therefore filter or score entries without depending on this module directly.

## Installation

Install this module next to `pf2e-affliction-forge`, enable both modules, and start the world as a GM once. The add-on creates or synchronizes its managed world compendium and registers it as a read-only Affliction Forge library.

## Development tests

```bash
npm test
```

The tests locate Affliction Forge by its `module.json` id in a sibling folder. For a non-standard development layout, set `PF2E_AFFLICTION_FORGE_PATH` to the core module directory.
