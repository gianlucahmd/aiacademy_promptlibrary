const useCasePills = document.getElementById("useCasePills");
const useCaseHint = document.getElementById("useCaseHint");
const useCaseRow = document.getElementById("useCaseRow");
const resultsMeta = document.getElementById("resultsMeta");
const promptGrid = document.getElementById("promptGrid");
const cardTemplate = document.getElementById("promptCardTemplate");
const emptyState = document.getElementById("emptyState");
const industryPills = document.getElementById("industryPills");
const jobAreaPills = document.getElementById("jobAreaPills");
const jobAreaRow = document.getElementById("jobAreaRow");
const searchInput = document.getElementById("searchInput");
const searchClearBtn = document.getElementById("searchClearBtn");
const adoptionInfoTrigger = document.getElementById("adoptionInfoTrigger");
const adoptionInfoDialog = document.getElementById("adoptionInfoDialog");
const adoptionInfoClose = document.getElementById("adoptionInfoClose");

const ALL_JOB_AREAS = "All";
const ALL_USE_CASES = "All";
const ALL_INDUSTRIES_ID = "all";

let promptLibrary = { industries: [], jobAreas: [], prompts: [] };
let mappedPrompts = [];
let selectedIndustryId = ALL_INDUSTRIES_ID;
let selectedJobArea = ALL_JOB_AREAS;
let selectedUseCase = ALL_USE_CASES;
let searchQuery = "";

function initInfoDialog() {
  if (!adoptionInfoDialog || !adoptionInfoTrigger || !adoptionInfoClose) {
    return;
  }

  const openDialog = () => {
    if (typeof adoptionInfoDialog.showModal === "function") {
      if (!adoptionInfoDialog.open) {
        adoptionInfoDialog.showModal();
      }
      return;
    }
    adoptionInfoDialog.setAttribute("open", "");
  };

  const closeDialog = () => {
    if (typeof adoptionInfoDialog.close === "function" && adoptionInfoDialog.open) {
      adoptionInfoDialog.close();
      return;
    }
    adoptionInfoDialog.removeAttribute("open");
  };

  adoptionInfoTrigger.addEventListener("click", (event) => {
    event.preventDefault();
    openDialog();
  });

  adoptionInfoClose.addEventListener("click", () => {
    closeDialog();
    adoptionInfoTrigger.focus();
  });

  adoptionInfoDialog.addEventListener("click", (event) => {
    const rect = adoptionInfoDialog.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (isOutside) {
      closeDialog();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && adoptionInfoDialog.open) {
      closeDialog();
    }
  });
}

function hasActiveSearch() {
  return searchQuery.trim() !== "";
}

function mapPrompt(prompt) {
  const jobArea = promptLibrary.jobAreas.find((item) => item.id === prompt.jobAreaId);
  const useCase = jobArea?.useCases.find((item) => item.id === prompt.useCaseId);
  const industryNames = prompt.industryIds.map((id) => {
    const industry = promptLibrary.industries.find((item) => item.id === id);
    return industry ? industry.name : id;
  });

  const mappedPrompt = {
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

  mappedPrompt.searchText = [
    mappedPrompt.title,
    mappedPrompt.template,
    mappedPrompt.jobArea,
    mappedPrompt.useCase,
    mappedPrompt.industryNames.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return mappedPrompt;
}

function allMappedPrompts() {
  return mappedPrompts;
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

function searchedPrompts() {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return filteredPrompts();
  }

  return filteredPrompts()
    .filter((prompt) => prompt.searchText.includes(normalizedQuery))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

function currentJobAreas() {
  const availableAreaIds = new Set(
    promptLibrary.prompts
      .filter((prompt) => {
        return (
          selectedIndustryId === ALL_INDUSTRIES_ID ||
          prompt.industryIds.includes(selectedIndustryId) ||
          prompt.industryIds.includes(ALL_INDUSTRIES_ID)
        );
      })
      .map((prompt) => prompt.jobAreaId)
  );

  return promptLibrary.jobAreas.filter((area) => availableAreaIds.has(area.id)).map((area) => area.name);
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
  industryPills.innerHTML = "";
  jobAreaPills.innerHTML = "";

  const reservedIndustryNames = new Set(["all", "all industries"]);
  const industries = [
    { id: ALL_INDUSTRIES_ID, name: ALL_JOB_AREAS },
    ...promptLibrary.industries.filter((industry) => {
      const normalizedName = String(industry.name || "")
        .trim()
        .toLowerCase();
      return industry.id !== ALL_INDUSTRIES_ID && !reservedIndustryNames.has(normalizedName);
    }),
  ];
  industries.forEach((industry) => {
    industryPills.appendChild(
      makePill(industry.name, selectedIndustryId === industry.id, () => {
        selectedIndustryId = industry.id;

        if (selectedIndustryId === ALL_INDUSTRIES_ID) {
          selectedJobArea = ALL_JOB_AREAS;
          selectedUseCase = ALL_USE_CASES;
        } else {
          const areas = currentJobAreas();
          if (selectedJobArea !== ALL_JOB_AREAS && !areas.includes(selectedJobArea)) {
            selectedJobArea = ALL_JOB_AREAS;
            selectedUseCase = ALL_USE_CASES;
          }
          const useCases = currentUseCases();
          if (selectedUseCase !== ALL_USE_CASES && !useCases.includes(selectedUseCase)) {
            selectedUseCase = ALL_USE_CASES;
          }
        }

        refreshUI();
      })
    );
  });

  const showDetailTabs = selectedIndustryId !== ALL_INDUSTRIES_ID;
  jobAreaRow.classList.toggle("hidden", !showDetailTabs);
  useCaseRow.classList.toggle("hidden", !showDetailTabs);

  if (showDetailTabs) {
    const areaNames = [ALL_JOB_AREAS, ...currentJobAreas()];
    if (selectedJobArea !== ALL_JOB_AREAS && !areaNames.includes(selectedJobArea)) {
      selectedJobArea = ALL_JOB_AREAS;
      selectedUseCase = ALL_USE_CASES;
    }

    areaNames.forEach((name) => {
      jobAreaPills.appendChild(
        makePill(name, selectedJobArea === name, () => {
          selectedJobArea = name;
          const useCases = currentUseCases();
          if (selectedUseCase !== ALL_USE_CASES && !useCases.includes(selectedUseCase)) {
            selectedUseCase = ALL_USE_CASES;
          }
          refreshUI();
        })
      );
    });
  }

  searchClearBtn.disabled = !hasActiveSearch();
}

function renderUseCasePills() {
  useCasePills.innerHTML = "";

  if (selectedIndustryId === ALL_INDUSTRIES_ID) {
    useCaseHint.classList.add("hidden");
    return;
  }

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
  const current = searchedPrompts();
  const searchActive = hasActiveSearch();

  emptyState.classList.toggle("hidden", current.length !== 0);
  if (current.length === 0) {
    emptyState.textContent = searchActive
      ? `No prompts matched "${searchQuery.trim()}". Try a different keyword.`
      : "No prompts match your filters yet.";
  }

  resultsMeta.textContent = searchActive
    ? `Showing ${current.length} matching prompts (A-Z)`
    : `Showing ${current.length} of ${allMappedPrompts().length} prompts`;

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
  searchInput.value = searchQuery;
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
  mappedPrompts = promptLibrary.prompts.map(mapPrompt);
}

async function init() {
  try {
    initInfoDialog();
    await loadPromptLibrary();
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      refreshUI();
    });
    searchClearBtn.addEventListener("click", () => {
      searchQuery = "";
      refreshUI();
      searchInput.focus();
    });
    refreshUI();
  } catch (error) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = "Could not load prompts. Please refresh the page.";
    console.error(error);
  }
}

init();
