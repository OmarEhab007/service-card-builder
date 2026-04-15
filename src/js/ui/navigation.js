import { $$ } from "../utils/dom.js";

function activateTab(tabs, panels, activeTab) {
  const panelId = activeTab.dataset.panel;
  tabs.forEach((tab) => {
    const isActive = tab === activeTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
    tab.setAttribute("tabindex", isActive ? "0" : "-1");
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === panelId);
  });
}

export function initNavigation() {
  const tabs = $$(".section-tab");
  const panels = $$(".panel");
  const tablist = document.getElementById("sectionTabs");

  if (tablist) {
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "Service card sections");
  }

  tabs.forEach((tab, index) => {
    const panelId = tab.dataset.panel;
    tab.setAttribute("role", "tab");
    tab.setAttribute("id", `tab-${panelId}`);
    tab.setAttribute("aria-controls", `panel-${panelId}`);

    const panel = panels.find((p) => p.dataset.panel === panelId);
    if (panel) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("id", `panel-${panelId}`);
      panel.setAttribute("aria-labelledby", `tab-${panelId}`);
    }

    tab.addEventListener("click", () => activateTab(tabs, panels, tab));

    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      let next = index;
      if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      tabs[next].focus();
      activateTab(tabs, panels, tabs[next]);
    });
  });

  const initial = tabs.find((t) => t.classList.contains("active"));
  if (initial) activateTab(tabs, panels, initial);
}
