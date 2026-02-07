# AI Academy Prompt Library - Project Guide

## What this project is
- A static prompt-library web app.
- It loads prompt metadata/content from `data/prompt-library.json` and renders filterable prompt cards in the browser.
- There is no backend and no build step in this repository.

## Project structure
- `index.html`: Page structure, UI containers, and template for each prompt card.
- `styles.css`: Visual design, layout, responsive behavior, and component styles.
- `app.js`: Client-side state, filtering logic, rendering, and copy-to-clipboard behavior.
- `data/prompt-library.json`: Source data for industries, job areas/use cases, and prompts.

## Runtime flow
1. `init()` in `app.js` runs on load.
2. `loadPromptLibrary()` fetches `data/prompt-library.json`.
3. Event listeners are attached to Industry/Job Area controls and clear buttons.
4. `refreshUI()` re-renders:
   - setup controls (`renderSetupControls`)
   - use-case pills (`renderUseCasePills`)
   - prompt cards (`renderPrompts`)
5. Prompt cards allow inline editing of prompt text and copy via Clipboard API.

## Data contract (`data/prompt-library.json`)
- Root keys:
  - `industries`: array of `{ id, name }`
  - `jobAreas`: array of `{ id, name, useCases[] }`
  - `prompts`: array of prompt records
- Prompt records are expected to include:
  - `id`
  - `title`
  - `template`
  - `jobAreaId` (must match a `jobAreas[].id`)
  - `useCaseId` (must match a use case under the selected job area)
  - `industryIds` (array of `industries[].id`; may include `"all"`)

## CIDI prompt methodology
- All prompt templates in `data/prompt-library.json` must follow the CIDI logic:
  - Context: a first sentence specific to the prompt use case and user situation.
  - Instruction: the concrete task the AI must perform.
  - Details: output constraints (for example tone, length, structure, quality bar).
  - Input: guidance to use attached materials.
- Do not add explicit section labels like `Context:`, `Instructions:`, `Details:`, or `Input:` in the prompt body.
- Use this input ending order in templates:
  1. `Consider the documents attached.`
  2. `[Upload inspiration: background context, current drafts, examples to emulate, style or brand guidelines, data/metrics, constraints, relevant emails/notes, and any supporting files]`
- Keep context use-case-specific rather than generic. Prefer wording such as “I’m working on <task/use case> …” and make the challenge relevant to that task.

## Filtering behavior
- Industry filter matches prompts where:
  - selected industry is `"all"`, or
  - prompt `industryIds` contains the selected industry, or
  - prompt `industryIds` contains `"all"`.
- Job Area filter matches by job-area **name** in UI state.
- Use Case filter matches by use-case **name** in UI state.
- Use-case pills are only shown for the selected job area and only when prompts exist for the current industry scope.

## Cache-busting/versioning
- `index.html` appends query versions to assets:
  - `styles.css?v=...`
  - `app.js?v=...`
- `app.js` appends a version query when fetching JSON:
  - `data/prompt-library.json?v=...`
- When changing CSS/JS/data, bump corresponding query values to avoid stale browser caches.

## How to run locally
- Open `index.html` directly in a browser for quick checks, or serve the folder with any static file server.
- No dependency install is required.

## Change guidelines
- Keep IDs stable in `prompt-library.json`; UI mapping relies on cross-references.
- Prefer additive data changes (new prompts/use cases) over renaming IDs already in use.
- If a selected filter becomes invalid after a change, `app.js` falls back to `"All"` for that filter.
- Preserve accessibility hooks (`aria-live`, button labels, semantic headings).

## Quick validation checklist
- Page loads without fetch errors.
- Industry, Job Area, and Use Case filtering produce expected prompt counts.
- Clearing selected industry/job area resets filters correctly.
- Copy button copies the textarea content and shows status.
- Layout works on desktop and under the mobile breakpoint (`max-width: 880px`).
