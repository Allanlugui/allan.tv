const storageKey = "pregacao-atelier-data";
const outlineTemplate = document.getElementById("outline-item-template");

const state = {
  sermons: [],
  selectedId: null,
};

const elements = {
  sermonList: document.getElementById("sermon-list"),
  newSermon: document.getElementById("new-sermon"),
  duplicateSermon: document.getElementById("duplicate-sermon"),
  sermonTitle: document.getElementById("sermon-title"),
  sermonTheme: document.getElementById("sermon-theme"),
  sermonDate: document.getElementById("sermon-date"),
  sermonKeyVerse: document.getElementById("sermon-key-verse"),
  sermonNotes: document.getElementById("sermon-notes"),
  outlineList: document.getElementById("outline-list"),
  addOutline: document.getElementById("add-outline"),
  mindmapText: document.getElementById("mindmap-text"),
  mindmapParent: document.getElementById("mindmap-parent"),
  addMindmap: document.getElementById("add-mindmap"),
  mindmapTree: document.getElementById("mindmap-tree"),
};

const createId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const cloneData = (data) => {
  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data));
};

const emptySermon = () => ({
  id: createId(),
  title: "Nova pregação",
  theme: "",
  date: new Date().toISOString().split("T")[0],
  keyVerse: "",
  notes: "",
  outline: [
    { id: createId(), title: "Introdução", notes: "" },
    { id: createId(), title: "Desenvolvimento", notes: "" },
    { id: createId(), title: "Aplicação", notes: "" },
  ],
  mindmap: [
    { id: createId(), text: "Tema principal", parentId: null },
  ],
});

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    const parsed = JSON.parse(saved);
    state.sermons = parsed.sermons || [];
    state.selectedId = parsed.selectedId || null;
  }

  if (state.sermons.length === 0) {
    const initial = emptySermon();
    initial.title = "Pregação sobre altar";
    initial.theme = "Sacrifício e aliança";
    initial.keyVerse = "Gênesis 8:20";
    initial.notes = "Use este espaço para registrar insights durante a preparação e a ministração.";
    initial.mindmap.push({
      id: createId(),
      text: "Propósito do altar",
      parentId: initial.mindmap[0].id,
    });
    initial.mindmap.push({
      id: createId(),
      text: "Aplicações práticas",
      parentId: initial.mindmap[0].id,
    });
    state.sermons = [initial];
    state.selectedId = initial.id;
  }

  if (!state.selectedId && state.sermons.length > 0) {
    state.selectedId = state.sermons[0].id;
  }
};

const saveState = () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      sermons: state.sermons,
      selectedId: state.selectedId,
    })
  );
};

const getSelected = () => state.sermons.find((sermon) => sermon.id === state.selectedId);

const renderSermonList = () => {
  elements.sermonList.innerHTML = "";
  state.sermons.forEach((sermon) => {
    const item = document.createElement("li");
    item.classList.toggle("active", sermon.id === state.selectedId);
    item.innerHTML = `<strong>${sermon.title || "Sem título"}</strong><span>${sermon.theme || "Sem tema"}</span>`;
    item.addEventListener("click", () => {
      state.selectedId = sermon.id;
      renderAll();
    });
    elements.sermonList.appendChild(item);
  });
};

const renderHeader = (sermon) => {
  elements.sermonTitle.value = sermon.title;
  elements.sermonTheme.value = sermon.theme;
  elements.sermonDate.value = sermon.date;
  elements.sermonKeyVerse.value = sermon.keyVerse;
  elements.sermonNotes.value = sermon.notes;
};

const renderOutline = (sermon) => {
  elements.outlineList.innerHTML = "";
  sermon.outline.forEach((item, index) => {
    const fragment = outlineTemplate.content.cloneNode(true);
    const listItem = fragment.querySelector(".outline-item");
    const titleInput = fragment.querySelector(".outline-title");
    const notesInput = fragment.querySelector(".outline-notes");
    const moveUp = fragment.querySelector(".outline-up");
    const moveDown = fragment.querySelector(".outline-down");
    const remove = fragment.querySelector(".outline-remove");

    titleInput.value = item.title;
    notesInput.value = item.notes;

    titleInput.addEventListener("input", (event) => {
      item.title = event.target.value;
      renderSermonList();
      saveState();
    });

    notesInput.addEventListener("input", (event) => {
      item.notes = event.target.value;
      saveState();
    });

    moveUp.disabled = index === 0;
    moveDown.disabled = index === sermon.outline.length - 1;

    moveUp.addEventListener("click", () => moveOutline(item.id, -1));
    moveDown.addEventListener("click", () => moveOutline(item.id, 1));
    remove.addEventListener("click", () => removeOutline(item.id));

    listItem.dataset.id = item.id;
    elements.outlineList.appendChild(fragment);
  });
};

const renderMindmap = (sermon) => {
  elements.mindmapParent.innerHTML = "";
  sermon.mindmap.forEach((node) => {
    const option = document.createElement("option");
    option.value = node.id;
    option.textContent = node.text;
    elements.mindmapParent.appendChild(option);
  });

  const tree = buildMindmapTree(sermon, null);
  elements.mindmapTree.innerHTML = "";
  elements.mindmapTree.appendChild(tree);
};

const buildMindmapTree = (sermon, parentId) => {
  const nodes = sermon.mindmap.filter((node) => node.parentId === parentId);
  const container = document.createElement(parentId ? "ul" : "div");

  nodes.forEach((node) => {
    const item = document.createElement("li");
    const header = document.createElement("div");
    header.className = "mindmap-node";

    const text = document.createElement("span");
    text.textContent = node.text;

    const remove = document.createElement("button");
    remove.textContent = "Remover";
    remove.addEventListener("click", () => removeMindmapNode(node.id));

    header.appendChild(text);
    header.appendChild(remove);
    item.appendChild(header);

    const children = buildMindmapTree(sermon, node.id);
    if (children.childElementCount > 0) {
      item.appendChild(children);
    }

    container.appendChild(item);
  });

  return container;
};

const renderAll = () => {
  const sermon = getSelected();
  if (!sermon) return;
  renderSermonList();
  renderHeader(sermon);
  renderOutline(sermon);
  renderMindmap(sermon);
  saveState();
};

const updateField = (key, value) => {
  const sermon = getSelected();
  if (!sermon) return;
  sermon[key] = value;
  renderSermonList();
  saveState();
};

const addSermon = () => {
  const newSermon = emptySermon();
  state.sermons.unshift(newSermon);
  state.selectedId = newSermon.id;
  renderAll();
};

const duplicateSermon = () => {
  const sermon = getSelected();
  if (!sermon) return;
  const cloned = cloneData(sermon);
  cloned.id = createId();
  cloned.title = `${sermon.title} (cópia)`;
  cloned.outline = cloned.outline.map((item) => ({ ...item, id: createId() }));
  cloned.mindmap = cloned.mindmap.map((node) => ({ ...node, id: createId() }));
  state.sermons.unshift(cloned);
  state.selectedId = cloned.id;
  renderAll();
};

const addOutlineItem = () => {
  const sermon = getSelected();
  if (!sermon) return;
  sermon.outline.push({ id: createId(), title: "Novo ponto", notes: "" });
  renderOutline(sermon);
  saveState();
};

const moveOutline = (id, direction) => {
  const sermon = getSelected();
  if (!sermon) return;
  const index = sermon.outline.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sermon.outline.length) return;
  const [item] = sermon.outline.splice(index, 1);
  sermon.outline.splice(target, 0, item);
  renderOutline(sermon);
  saveState();
};

const removeOutline = (id) => {
  const sermon = getSelected();
  if (!sermon) return;
  sermon.outline = sermon.outline.filter((item) => item.id !== id);
  renderOutline(sermon);
  saveState();
};

const addMindmapNode = () => {
  const sermon = getSelected();
  const text = elements.mindmapText.value.trim();
  const parentId = elements.mindmapParent.value;
  if (!sermon || !text) return;

  sermon.mindmap.push({ id: createId(), text, parentId });
  elements.mindmapText.value = "";
  renderMindmap(sermon);
  saveState();
};

const removeMindmapNode = (id) => {
  const sermon = getSelected();
  if (!sermon) return;
  const nodesToRemove = new Set([id]);
  let changed = true;

  while (changed) {
    changed = false;
    sermon.mindmap.forEach((node) => {
      if (node.parentId && nodesToRemove.has(node.parentId) && !nodesToRemove.has(node.id)) {
        nodesToRemove.add(node.id);
        changed = true;
      }
    });
  }

  sermon.mindmap = sermon.mindmap.filter((node) => !nodesToRemove.has(node.id));
  renderMindmap(sermon);
  saveState();
};

const bindEvents = () => {
  elements.newSermon.addEventListener("click", addSermon);
  elements.duplicateSermon.addEventListener("click", duplicateSermon);
  elements.addOutline.addEventListener("click", addOutlineItem);
  elements.addMindmap.addEventListener("click", addMindmapNode);

  elements.sermonTitle.addEventListener("input", (event) => updateField("title", event.target.value));
  elements.sermonTheme.addEventListener("input", (event) => updateField("theme", event.target.value));
  elements.sermonDate.addEventListener("input", (event) => updateField("date", event.target.value));
  elements.sermonKeyVerse.addEventListener("input", (event) => updateField("keyVerse", event.target.value));
  elements.sermonNotes.addEventListener("input", (event) => updateField("notes", event.target.value));
};

loadState();
bindEvents();
renderAll();
