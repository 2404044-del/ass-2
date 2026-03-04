const DB_KEY = "REG_TABLE_V1"; 

function loadTable() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTable(rows) {
  localStorage.setItem(DB_KEY, JSON.stringify(rows));
}


function apiGET() {
  return loadTable();
}

function apiPOST(record) {
  const rows = loadTable();
  rows.unshift(record); 
  saveTable(rows);
  return record;
}

function apiDELETE(id) {
  const rows = loadTable();
  const next = rows.filter(r => r.id !== id);
  saveTable(next);
  return { deleted: rows.length !== next.length };
}


const regForm = document.getElementById("regForm");
const rowsEl = document.getElementById("rows");

const filterType = document.getElementById("filterType");
const searchEl = document.getElementById("search");

const clearAllBtn = document.getElementById("clearAll");
const exportBtn = document.getElementById("exportBtn");

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function render() {
  const all = apiGET();

  const type = filterType.value;
  const q = (searchEl.value || "").trim().toLowerCase();

  const filtered = all.filter(r => {
    const matchType = (type === "ALL") || (r.systemType === type);

    const haystack = [
      r.systemType, r.fullName, r.email, r.phone, r.uniqueId, r.notes
    ].join(" ").toLowerCase();

    const matchSearch = !q || haystack.includes(q);

    return matchType && matchSearch;
  });

  rowsEl.innerHTML = "";

  if (filtered.length === 0) {
    rowsEl.innerHTML = `<tr><td colspan="8">No registrations found.</td></tr>`;
    return;
  }

  for (const r of filtered) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(r.createdAt)}</td>
      <td>${escapeHtml(r.systemType)}</td>
      <td>${escapeHtml(r.fullName)}</td>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.phone || "")}</td>
      <td>${escapeHtml(r.uniqueId || "")}</td>
      <td>${escapeHtml(r.notes || "")}</td>
      <td>
        <button data-del="${r.id}" class="danger" style="padding:8px 10px;border-radius:10px;">
          Delete
        </button>
      </td>
    `;
    rowsEl.appendChild(tr);
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

regForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    createdAt: new Date().toISOString(),

    systemType: document.getElementById("systemType").value,
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    uniqueId: document.getElementById("uniqueId").value.trim(),
    notes: document.getElementById("notes").value.trim()
  };

  apiPOST(record);

  regForm.reset();
  render();
});

rowsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-del]");
  if (!btn) return;

  const id = btn.getAttribute("data-del");
  apiDELETE(id);
  render();
});

filterType.addEventListener("change", render);
searchEl.addEventListener("input", render);

clearAllBtn.addEventListener("click", () => {
  const ok = confirm("This will delete ALL registrations in the table. Continue?");
  if (!ok) return;
  localStorage.removeItem(DB_KEY);
  render();
});

exportBtn.addEventListener("click", () => {
  const data = apiGET();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "registrations.json";
  a.click();

  URL.revokeObjectURL(url);
});

render();