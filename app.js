const useCasePills = document.getElementById("useCasePills");
const useCaseHint = document.getElementById("useCaseHint");
const resultsMeta = document.getElementById("resultsMeta");
const promptGrid = document.getElementById("promptGrid");
const cardTemplate = document.getElementById("promptCardTemplate");
const emptyState = document.getElementById("emptyState");
const industrySelect = document.getElementById("industrySelect");
const jobAreaSelect = document.getElementById("jobAreaSelect");
const industrySelectedControl = document.getElementById("industrySelectedControl");
const industrySelectedText = document.getElementById("industrySelectedText");
const industrySelectedClearBtn = document.getElementById("industrySelectedClearBtn");
const jobAreaSelectedControl = document.getElementById("jobAreaSelectedControl");
const jobAreaSelectedText = document.getElementById("jobAreaSelectedText");
const jobAreaSelectedClearBtn = document.getElementById("jobAreaSelectedClearBtn");

const ALL_JOB_AREAS = "All";
const ALL_USE_CASES = "All";
const ALL_INDUSTRIES_ID = "all";

let promptLibrary = { industries: [], jobAreas: [], prompts: [] };
let selectedIndustryId = ALL_INDUSTRIES_ID;
let selectedJobArea = ALL_JOB_AREAS;
let selectedUseCase = ALL_USE_CASES;

function mapPrompt(prompt) {
  const jobArea = promptLibrary.jobAreas.find((item) => item.id === prompt.jobAreaId);
  const useCase = jobArea?.useCases.find((item) => item.id === prompt.useCaseId);
  const industryNames = prompt.industryIds.map((id) => {
    const industry = promptLibrary.industries.find((item) => item.id === id);
    return industry ? industry.name : id;
  });

  return {
    id: prompt.id,
    title: prompt.title,
    template: prompt.template,
    jobAreaId: prompt.jobAreaId,
    jobArea: jobArea?.name || prompt.jobAreaId,
    useCaseId: prompt.useCaseId,
    useCase: useCase?.name || prompt.useCaseId,
    industryIds: prompt.industryIds,
    industryNames,
  };
}

function allMappedPrompts() {
  return promptLibrary.prompts.map(mapPrompt);
}

function filteredPrompts() {
  return allMappedPrompts().filter((prompt) => {
    const industryMatch =
      selectedIndustryId === ALL_INDUSTRIES_ID ||
      prompt.industryIds.includes(selectedIndustryId) ||
      prompt.industryIds.includes(ALL_INDUSTRIES_ID);

    const areaMatch = selectedJobArea === ALL_JOB_AREAS || prompt.jobArea === selectedJobArea;
    const useCaseMatch = selectedUseCase === ALL_USE_CASES || prompt.useCase === selectedUseCase;
    return industryMatch && areaMatch && useCaseMatch;
  });
}

function currentUseCases() {
  if (selectedJobArea === ALL_JOB_AREAS) {
    return [];
  }

  const area = promptLibrary.jobAreas.find((item) => item.name === selectedJobArea);
  if (!area) {
    return [];
  }

  const availableUseCaseIds = new Set(
    promptLibrary.prompts
      .filter((prompt) => {
        const industryMatch =
          selectedIndustryId === ALL_INDUSTRIES_ID ||
          prompt.industryIds.includes(selectedIndustryId) ||
          prompt.industryIds.includes(ALL_INDUSTRIES_ID);
        return prompt.jobAreaId === area.id && industryMatch;
      })
      .map((prompt) => prompt.useCaseId)
  );

  return area.useCases
    .filter((useCase) => availableUseCaseIds.has(useCase.id))
    .map((useCase) => useCase.name);
}

function makePill(label, active, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `pill${active ? " active" : ""}`;
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderSetupControls() {
  industrySelect.innerHTML = "";
  jobAreaSelect.innerHTML = "";

  promptLibrary.industries.forEach((industry) => {
    const option = document.createElement("option");
    option.value = industry.id;
    option.textContent = industry.name;
    option.selected = selectedIndustryId === industry.id;
    industrySelect.appendChild(option);
  });

  const areaNames = [ALL_JOB_AREAS, ...promptLibrary.jobAreas.map((area) => area.name)];
  areaNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    option.selected = selectedJobArea === name;
    jobAreaSelect.appendChild(option);
  });

  const selectedIndustryName =
    promptLibrary.industries.find((item) => item.id === selectedIndustryId)?.name || "All industries";
  const industrySelected = selectedIndustryId !== ALL_INDUSTRIES_ID;
  industrySelect.parentElement.classList.toggle("hidden", industrySelected);
  industrySelectedControl.classList.toggle("hidden", !industrySelected);
  industrySelectedText.textContent = selectedIndustryName;

  const jobAreaSelected = selectedJobArea !== ALL_JOB_AREAS;
  jobAreaSelect.parentElement.classList.toggle("hidden", jobAreaSelected);
  jobAreaSelectedControl.classList.toggle("hidden", !jobAreaSelected);
  jobAreaSelectedText.textContent = selectedJobArea;
}

function renderUseCasePills() {
  useCasePills.innerHTML = "";
  const useCases = currentUseCases();
  if (selectedUseCase !== ALL_USE_CASES && !useCases.includes(selectedUseCase)) {
    selectedUseCase = ALL_USE_CASES;
  }
  const values = [ALL_USE_CASES, ...useCases];

  if (selectedJobArea === ALL_JOB_AREAS) {
    useCaseHint.textContent = "Select a specific job area to see its use cases.";
    useCaseHint.classList.remove("hidden");
  } else if (useCases.length === 0) {
    useCaseHint.textContent = "No use cases with prompts for this setup yet.";
    useCaseHint.classList.remove("hidden");
  } else {
    useCaseHint.classList.add("hidden");
  }

  values.forEach((name) => {
    useCasePills.appendChild(
      makePill(name, selectedUseCase === name, () => {
        selectedUseCase = name;
        refreshUI();
      })
    );
  });
}

async function copyText(button, statusNode, text) {
  try {
    await navigator.clipboard.writeText(text);
    statusNode.textContent = "Copied";
    button.textContent = "Copied";
    setTimeout(() => {
      statusNode.textContent = "";
      button.textContent = "Copy Prompt";
    }, 1200);
  } catch {
    statusNode.textContent = "Copy failed";
  }
}

function renderPrompts() {
  promptGrid.innerHTML = "";
  const current = filteredPrompts();
  emptyState.classList.toggle("hidden", current.length !== 0);
  resultsMeta.textContent = `Showing ${current.length} of ${allMappedPrompts().length} prompts`;

  current.forEach((prompt) => {
    const node = cardTemplate.content.cloneNode(true);
    const card = node.querySelector(".prompt-card");

    card.querySelector(".prompt-title").textContent = prompt.title;

    const tags = card.querySelector(".tags");
    tags.innerHTML = `<span class="tag">${prompt.jobArea}</span><span class="tag">${prompt.useCase}</span>`;

    const textarea = card.querySelector(".prompt-text");
    textarea.value = prompt.template;

    const copyBtn = card.querySelector(".copy-btn");
    const copyStatus = card.querySelector(".copy-status");
    copyBtn.addEventListener("click", () => copyText(copyBtn, copyStatus, textarea.value));

    promptGrid.appendChild(node);
  });
}

function refreshUI() {
  renderSetupControls();
  renderUseCasePills();
  renderPrompts();
}

async function loadPromptLibrary() {
  const response = await fetch("data/prompt-library.json?v=20260206f");
  if (!response.ok) {
    throw new Error("Could not load prompt library data");
  }
  promptLibrary = await response.json();
}

async function init() {
  try {
    await loadPromptLibrary();
    industrySelect.addEventListener("change", () => {
      selectedIndustryId = industrySelect.value;
      const useCases = currentUseCases();
      if (selectedUseCase !== ALL_USE_CASES && !useCases.includes(selectedUseCase)) {
        selectedUseCase = ALL_USE_CASES;
      }
      refreshUI();
    });
    jobAreaSelect.addEventListener("change", () => {
      selectedJobArea = jobAreaSelect.value;
      const useCases = currentUseCases();
      if (selectedUseCase !== ALL_USE_CASES && !useCases.includes(selectedUseCase)) {
        selectedUseCase = ALL_USE_CASES;
      }
      refreshUI();
    });
    industrySelectedClearBtn.addEventListener("click", () => {
      selectedIndustryId = ALL_INDUSTRIES_ID;
      const useCases = currentUseCases();
      if (selectedUseCase !== ALL_USE_CASES && !useCases.includes(selectedUseCase)) {
        selectedUseCase = ALL_USE_CASES;
      }
      refreshUI();
    });
    jobAreaSelectedClearBtn.addEventListener("click", () => {
      selectedJobArea = ALL_JOB_AREAS;
      selectedUseCase = ALL_USE_CASES;
      refreshUI();
    });
    refreshUI();
  } catch (error) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "Could not load prompts. Please refresh the page.";
    console.error(error);
  }
}

init();
