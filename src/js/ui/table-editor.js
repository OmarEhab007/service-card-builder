import Sortable from "sortablejs";
import { patchState, getState } from "../state/store.js";
import { esc } from "../utils/dom.js";

export class TableEditor {
  /**
   * @param {{ mountId: string, stateKey: string, columns: Array, defaultRow: object, emptyMessage?: string, addRowLabel?: string, structuralEdits?: boolean, pairedStateKey?: string, pairedDefaultRow?: object }} opts
   */
  constructor({
    mountId,
    stateKey,
    columns,
    defaultRow,
    emptyMessage,
    addRowLabel,
    structuralEdits = true,
    pairedStateKey = null,
    pairedDefaultRow = null
  }) {
    this.mountId = mountId;
    this.mount = document.getElementById(mountId);
    this.stateKey = stateKey;
    this.columns = columns;
    this.defaultRow = defaultRow;
    this.structuralEdits = structuralEdits;
    /** When set, row add/remove/duplicate/move/drag applies the same index operations to this array (e.g. workflow + raci). */
    this.pairedStateKey = pairedStateKey;
    this.pairedDefaultRow = pairedDefaultRow;
    this.emptyMessage =
      emptyMessage ||
      "No rows yet. Add a row to start filling this section, or load an example from the toolbar.";
    this.addRowLabel = addRowLabel || "Add row";
    this._sortable = null;
    this.render();
  }

  renderCell(col, rowIndex, value) {
    const safeValue = esc(value || "");
    if (col.readonly) {
      return `<span class="table-editor__readonly" title="Synced from elsewhere — edit in the source tab">${safeValue || "—"}</span>`;
    }
    if (col.type === "select") {
      return `<select data-row="${rowIndex}" data-key="${col.key}" aria-label="${esc(col.label)}">
        ${(col.options || [])
          .map((option) => `<option value="${esc(option)}"${option === value ? " selected" : ""}>${esc(option)}</option>`)
          .join("")}
      </select>`;
    }
    if (col.type === "textarea") {
      return `<textarea rows="2" data-row="${rowIndex}" data-key="${col.key}" aria-label="${esc(
        col.label
      )}">${safeValue}</textarea>`;
    }
    if (col.type === "datalist") {
      const listId = `${this.mountId}__dl_${col.key}`;
      const opts = this._datalistOptions(col);
      const listAttr = opts.length ? ` list="${esc(listId)}"` : "";
      return `<input type="text"${listAttr} data-row="${rowIndex}" data-key="${col.key}" value="${safeValue}" aria-label="${esc(
        col.label
      )}" placeholder="${esc(col.placeholder || "")}">`;
    }
    return `<input type="text" data-row="${rowIndex}" data-key="${col.key}" value="${safeValue}" aria-label="${esc(
      col.label
    )}">`;
  }

  _datalistOptions(col) {
    const s = getState();
    if (col.optionsFromActors) {
      const names = (s.actors || []).map((a) => (a.name || "").trim()).filter(Boolean);
      return [...new Set(names)];
    }
    return col.options || [];
  }

  _columnWeight(col) {
    if (col.readonly) return 1.3;
    if (col.type === "textarea") return 1.9;
    if (col.key === "step") return 2.2;
    if (col.key === "values" || col.key === "questionAr") return 1.8;
    if (col.key === "nameEn" || col.key === "nameAr") return 1.5;
    if (col.key === "type" || col.key === "mandatory") return 1.1;
    if (col.key === "duration" || col.key === "condition") return 1.2;
    if (col.key === "dependency") return 1.4;
    return 1.25;
  }

  updateCell(rowIndex, key, value) {
    patchState((state) => {
      state[this.stateKey][rowIndex][key] = value;
    });
  }

  addRow() {
    patchState((state) => {
      state[this.stateKey].push({ ...this.defaultRow });
      if (this.pairedStateKey && this.pairedDefaultRow) {
        state[this.pairedStateKey].push({ ...this.pairedDefaultRow });
      }
    });
    const newIndex = getState()[this.stateKey].length - 1;
    this.render();
    this._focusFirstCell(newIndex);
  }

  removeRow(rowIndex) {
    patchState((state) => {
      state[this.stateKey].splice(rowIndex, 1);
      if (this.pairedStateKey) {
        state[this.pairedStateKey].splice(rowIndex, 1);
      }
    });
    this.render();
  }

  duplicateRow(rowIndex) {
    patchState((state) => {
      const copy = JSON.parse(JSON.stringify(state[this.stateKey][rowIndex]));
      state[this.stateKey].splice(rowIndex + 1, 0, copy);
      if (this.pairedStateKey) {
        const pCopy = JSON.parse(JSON.stringify(state[this.pairedStateKey][rowIndex]));
        state[this.pairedStateKey].splice(rowIndex + 1, 0, pCopy);
      }
    });
    this.render();
    this._focusFirstCell(rowIndex + 1);
  }

  moveRow(rowIndex, direction) {
    patchState((state) => {
      const arr = state[this.stateKey];
      const target = rowIndex + direction;
      if (target < 0 || target >= arr.length) return;
      [arr[rowIndex], arr[target]] = [arr[target], arr[rowIndex]];
      if (this.pairedStateKey) {
        const p = state[this.pairedStateKey];
        [p[rowIndex], p[target]] = [p[target], p[rowIndex]];
      }
    });
    this.render();
  }

  _destroySortable() {
    if (this._sortable) {
      this._sortable.destroy();
      this._sortable = null;
    }
  }

  _focusFirstCell(rowIndex) {
    requestAnimationFrame(() => {
      const row = this.mount.querySelector(`tbody tr[data-row-index="${rowIndex}"]`);
      const first = row && row.querySelector("input, textarea, select");
      if (first) first.focus();
    });
  }

  wireEvents() {
    const onValue = (el) => {
      this.updateCell(Number(el.dataset.row), el.dataset.key, el.value);
    };

    this.mount.querySelectorAll("input[data-row][data-key], textarea[data-row][data-key]").forEach((input) => {
      input.addEventListener("input", () => onValue(input));
    });

    this.mount.querySelectorAll("select[data-row][data-key]").forEach((select) => {
      select.addEventListener("change", () => onValue(select));
    });

    this.mount.querySelectorAll("[data-action='remove']").forEach((btn) => {
      btn.addEventListener("click", () => this.removeRow(Number(btn.dataset.row)));
    });

    this.mount.querySelectorAll("[data-action='duplicate']").forEach((btn) => {
      btn.addEventListener("click", () => this.duplicateRow(Number(btn.dataset.row)));
    });

    this.mount.querySelectorAll("[data-action='up']").forEach((btn) => {
      btn.addEventListener("click", () => this.moveRow(Number(btn.dataset.row), -1));
    });

    this.mount.querySelectorAll("[data-action='down']").forEach((btn) => {
      btn.addEventListener("click", () => this.moveRow(Number(btn.dataset.row), 1));
    });

    const addBtn = this.mount.querySelector("[data-action='add']");
    if (addBtn) addBtn.addEventListener("click", () => this.addRow());
  }

  render() {
    this._destroySortable();

    const rows = getState()[this.stateKey] || [];
    const header = this.columns.map((col) => `<th scope="col">${esc(col.label)}</th>`).join("");
    const rowCount = rows.length;

    if (rowCount === 0) {
      const addBtnHtml = this.structuralEdits
        ? `<button type="button" class="btn btn-primary btn-sm" data-action="add">${esc(this.addRowLabel)}</button>`
        : "";
      this.mount.innerHTML = `
        <div class="table-editor-empty">
          <p class="table-editor-empty__text">${esc(this.emptyMessage)}</p>
          ${addBtnHtml}
        </div>
      `;
      const addBtn = this.mount.querySelector("[data-action='add']");
      if (addBtn) addBtn.addEventListener("click", () => this.addRow());
      return;
    }

    const sharedDatalists = this.columns
      .filter((c) => c.type === "datalist")
      .map((c) => {
        const listId = `${this.mountId}__dl_${c.key}`;
        const opts = this._datalistOptions(c);
        if (!opts.length) return "";
        return `<datalist id="${listId}">${opts.map((o) => `<option value="${esc(o)}"></option>`).join("")}</datalist>`;
      })
      .join("");

    const leadHead = this.structuralEdits
      ? `<th scope="col" class="table-editor__lead">
                <span class="table-editor__lead-label">#</span>
              </th>`
      : `<th scope="col" class="table-editor__lead table-editor__lead--static">
                <span class="table-editor__lead-label">#</span>
              </th>`;
    const actionsHead = this.structuralEdits ? `<th scope="col" class="table-editor__actions-head">Actions</th>` : "";
    const leadCell = (rowIndex) =>
      this.structuralEdits
        ? `<td class="table-editor__lead">
                    <span class="row-drag-handle" role="button" tabindex="-1" aria-label="Drag to reorder row ${
                      rowIndex + 1
                    }" title="Drag to reorder row"></span>
                    <span class="row-index" aria-hidden="true">${rowIndex + 1}</span>
                  </td>`
        : `<td class="table-editor__lead table-editor__lead--static"><span class="row-index" aria-hidden="true">${rowIndex + 1}</span></td>`;
    const actionsCell = (rowIndex) =>
      this.structuralEdits
        ? `<td class="table-editor__actions">
                    <div class="table-actions" role="group" aria-label="Row ${rowIndex + 1} actions">
                      <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="up" data-row="${rowIndex}" title="Move up" aria-label="Move row ${rowIndex + 1} up">↑</button>
                      <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="down" data-row="${rowIndex}" title="Move down" aria-label="Move row ${rowIndex + 1} down">↓</button>
                      <button type="button" class="btn btn-dup btn-secondary btn-sm" data-action="duplicate" data-row="${rowIndex}" title="Duplicate this row" aria-label="Duplicate row ${rowIndex + 1}">Dup</button>
                      <button type="button" class="btn btn-icon btn-secondary btn-sm" data-action="remove" data-row="${rowIndex}" title="Remove row" aria-label="Remove row ${rowIndex + 1}">✕</button>
                    </div>
                  </td>`
        : "";

    const toolbarAdd = this.structuralEdits
      ? `<button type="button" class="btn btn-primary btn-sm" data-action="add">${esc(this.addRowLabel)}</button>`
      : "";

    const baseWeight = this.columns.reduce((sum, col) => sum + this._columnWeight(col), 0);
    const leadWeight = 0.58;
    const actionsWeight = this.structuralEdits ? 0.95 : 0;
    const totalWeight = baseWeight + leadWeight + actionsWeight;
    const colgroup = `
      <colgroup>
        <col style="width:${((leadWeight / totalWeight) * 100).toFixed(2)}%">
        ${this.columns
          .map((col) => `<col style="width:${((this._columnWeight(col) / totalWeight) * 100).toFixed(2)}%">`)
          .join("")}
        ${this.structuralEdits ? `<col style="width:${((actionsWeight / totalWeight) * 100).toFixed(2)}%">` : ""}
      </colgroup>
    `;

    this.mount.innerHTML = `
      <div class="table-editor-scroll">
        <table>
          ${colgroup}
          <thead>
            <tr>
              ${leadHead}
              ${header}
              ${actionsHead}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((row, rowIndex) => {
                const cells = this.columns
                  .map((col) => {
                    return `<td>${this.renderCell(col, rowIndex, row[col.key])}</td>`;
                  })
                  .join("");
                return `<tr data-row-index="${rowIndex}">
                  ${leadCell(rowIndex)}
                  ${cells}
                  ${actionsCell(rowIndex)}
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
        ${sharedDatalists}
      </div>
      <div class="toolbar">
        <span class="table-editor-meta" aria-live="polite">${rowCount} row${rowCount === 1 ? "" : "s"}</span>
        ${toolbarAdd}
      </div>
    `;

    this.wireEvents();

    const tbody = this.mount.querySelector("tbody");
    if (tbody && this.structuralEdits) {
      // Only the grip starts a drag. Do NOT use filter+preventOnFilter on form fields:
      // Sortable calls preventDefault() on filtered mousedown, which blocks inputs from focusing.
      this._sortable = Sortable.create(tbody, {
        animation: 150,
        handle: ".row-drag-handle",
        draggable: "tr",
        onEnd: ({ oldIndex, newIndex }) => {
          if (oldIndex === newIndex) return;
          patchState((state) => {
            const list = state[this.stateKey];
            const [moved] = list.splice(oldIndex, 1);
            list.splice(newIndex, 0, moved);
            if (this.pairedStateKey) {
              const pl = state[this.pairedStateKey];
              const [pm] = pl.splice(oldIndex, 1);
              pl.splice(newIndex, 0, pm);
            }
          });
          this.render();
        }
      });
    }
  }
}
