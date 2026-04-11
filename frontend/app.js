/**
 * Nutritional Insights — protected Azure API + Chart.js + filter/search/pagination
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6LH-ncnwjQfmMBjHVqQTyGD1W0EypPsI",
  authDomain: "cloud-5df20.firebaseapp.com",
  projectId: "cloud-5df20",
  storageBucket: "cloud-5df20.firebasestorage.app",
  messagingSenderId: "378648735135",
  appId: "1:378648735135:web:9d501e230c7e3fa391e1aa"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const API_BASE = "https://diets-app.azurewebsites.net/api";
const URLS = {
  avg_macros: API_BASE + "/get_nutrition",
  recipes: API_BASE + "/get_recipes",
  clusters: API_BASE + "/get_clusters",
};

const PAGE_SIZE = 10;

let chartBar = null;
let chartScatter = null;
let chartPie = null;

let avgMacros = [];
let allRecipes = [];
let cuisines = [];
let clusters = [];
let currentPage = 1;
let currentUser = null;

const welcomeMsg = document.getElementById("welcomeMsg");
const logoutBtn = document.getElementById("logoutBtn");
const oauthStatus = document.getElementById("oauthStatus");
const dietFilter = document.getElementById("dietFilter");
const searchInput = document.getElementById("searchInput");
const recipeList = document.getElementById("recipeList");
const statusLine = document.getElementById("statusLine");
const recipeRange = document.getElementById("recipeRange");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumbers = document.getElementById("pageNumbers");
const clustersPanel = document.getElementById("clustersPanel");

async function fetchJson(url) {
  if (!currentUser) {
    window.location.href = "login.html";
    throw new Error("User is not authenticated");
  }

  const token = await currentUser.getIdToken();
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error(url + " → " + res.status);
  return res.json();
}

function filterByDiet(data, diet) {
  if (!diet || diet === "all") return data.slice();
  return data.filter((row) => row["Diet_type"] === diet);
}

function searchByKeyword(data, keyword) {
  const q = String(keyword).trim().toLowerCase();
  if (!q) return data.slice();
  return data.filter((d) =>
    String(d["Recipe_name"]).toLowerCase().includes(q)
  );
}

function getFilteredRecipes() {
  let rows = filterByDiet(allRecipes, dietFilter.value);
  rows = searchByKeyword(rows, searchInput.value);
  return rows;
}

function paginateSlice(data, page, limit) {
  const start = (page - 1) * limit;
  return data.slice(start, start + limit);
}

function totalPages(n, limit) {
  return Math.max(1, Math.ceil(n / limit));
}

function destroyChart(ch) {
  if (ch) {
    ch.destroy();
    return null;
  }
  return null;
}

function updateBarChart() {
  const ctx = document.getElementById("chartBar");
  chartBar = destroyChart(chartBar);
  const labels = avgMacros.map((r) => r.Diet_type);
  const protein = avgMacros.map((r) => r.Protein);
  chartBar = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Protein (avg)",
          data: protein,
          backgroundColor: "rgba(37, 99, 235, 0.75)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Protein" } },
        x: { title: { display: true, text: "Diet type" } },
      },
    },
  });
}

function updateScatterChart(rows) {
  const ctx = document.getElementById("chartScatter");
  chartScatter = destroyChart(chartScatter);
  const pts = rows.map((r) => ({ x: r.Carbs, y: r.Protein }));
  chartScatter = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Recipes (Carbs vs Protein)",
          data: pts,
          backgroundColor: "rgba(16, 185, 129, 0.45)",
          borderColor: "rgba(16, 185, 129, 0.9)",
          borderWidth: 1,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Carbs" },
          beginAtZero: true,
        },
        y: {
          type: "linear",
          title: { display: true, text: "Protein" },
          beginAtZero: true,
        },
      },
    },
  });
}

function updatePieChart() {
  const ctx = document.getElementById("chartPie");
  chartPie = destroyChart(chartPie);
  const labels = cuisines.map((r) => r.Cuisine);
  const values = cuisines.map((r) => r.Count);
  const palette = [
    "#2563eb",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];
  const bgColors = labels.map((_, i) => palette[i % palette.length]);
  chartPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: bgColors,
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            padding: 10,
            usePointStyle: false,
            generateLabels: function (chart) {
              const data = chart.data;
              const ds = data.datasets[0];
              if (!data.labels || !ds) return [];
              return data.labels.map(function (label, i) {
                return {
                  text: String(label),
                  fillStyle: Array.isArray(ds.backgroundColor)
                    ? ds.backgroundColor[i]
                    : ds.backgroundColor,
                  strokeStyle: "transparent",
                  lineWidth: 0,
                  hidden: false,
                  index: i,
                  datasetIndex: 0,
                };
              });
            },
          },
        },
      },
    },
  });
}

function renderHeatmap() {
  const el = document.getElementById("heatmapContainer");
  if (!avgMacros.length) {
    el.innerHTML = "<p class='muted'>Load nutritional data first.</p>";
    return;
  }
  const cols = ["Protein", "Carbs", "Fat"];
  const mins = {};
  const maxs = {};
  cols.forEach((c) => {
    mins[c] = Infinity;
    maxs[c] = -Infinity;
  });
  avgMacros.forEach((row) => {
    cols.forEach((c) => {
      const v = Number(row[c]);
      if (v < mins[c]) mins[c] = v;
      if (v > maxs[c]) maxs[c] = v;
    });
  });

  function cellColor(val, c) {
    const mn = mins[c];
    const mx = maxs[c];
    const t = mx === mn ? 0.5 : (val - mn) / (mx - mn);
    const L = 92 - t * 42;
    return "hsl(222 65% " + L + "%)";
  }

  let thead = "<thead><tr><th>Diet</th>";
  cols.forEach((c) => {
    thead += "<th>" + c + "</th>";
  });
  thead += "</tr></thead>";

  let tbody = "<tbody>";
  avgMacros.forEach((row) => {
    tbody += "<tr><td><strong>" + escapeHtml(row.Diet_type) + "</strong></td>";
    cols.forEach((c) => {
      const v = Number(row[c]);
      tbody +=
        "<td class='hm-cell' style='background:" +
        cellColor(v, c) +
        "'>" +
        formatNum(v) +
        "</td>";
    });
    tbody += "</tr>";
  });
  tbody += "</tbody>";

  el.innerHTML = "<table class='heatmap-table'>" + thead + tbody + "</table>";
}

function renderClustersPanel() {
  if (!clusters.length) {
    clustersPanel.innerHTML =
      "<p class='muted'>No cluster data loaded yet.</p>";
    return;
  }
  let html =
    "<table class='clusters-table'><thead><tr><th>Cuisine</th><th>Count</th></tr></thead><tbody>";
  clusters.forEach((row) => {
    html +=
      "<tr><td>" +
      escapeHtml(row.Cuisine) +
      "</td><td>" +
      escapeHtml(String(row.Count)) +
      "</td></tr>";
  });
  html += "</tbody></table>";
  clustersPanel.innerHTML = html;
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function formatNum(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function populateDietFilter() {
  const set = new Set();
  allRecipes.forEach((r) => {
    if (r.Diet_type) set.add(r.Diet_type);
  });
  const sorted = [...set].sort();
  const keep = dietFilter.value;
  dietFilter.innerHTML = '<option value="all">All Diet Types</option>';
  sorted.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    dietFilter.appendChild(o);
  });
  if ([...dietFilter.options].some((o) => o.value === keep)) {
    dietFilter.value = keep;
  }
}

function renderPageButtons(pages) {
  pageNumbers.innerHTML = "";
  for (let p = 1; p <= pages; p++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "page-num" + (p === currentPage ? " is-active" : "");
    b.textContent = String(p);
    b.addEventListener("click", function () {
      currentPage = p;
      renderRecipesAndScatter();
    });
    pageNumbers.appendChild(b);
  }
}

function renderRecipesAndScatter() {
  const filtered = getFilteredRecipes();
  const pages = totalPages(filtered.length, PAGE_SIZE);
  if (currentPage > pages) currentPage = pages;
  if (currentPage < 1) currentPage = 1;

  const slice = paginateSlice(filtered, currentPage, PAGE_SIZE);
  const total = filtered.length;
  const startIdx = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, total);

  if (recipeRange) {
    recipeRange.textContent =
      total === 0
        ? "No recipes to show."
        : "Showing " +
          startIdx +
          "–" +
          endIdx +
          " of " +
          total +
          " recipes (page " +
          currentPage +
          " of " +
          pages +
          ").";
  }

  recipeList.innerHTML = "";
  slice.forEach((row) => {
    const li = document.createElement("li");
    li.className = "recipe-li";
    li.innerHTML =
      "<span class='recipe-name'>" +
      escapeHtml(row.Recipe_name) +
      "</span>" +
      "<span class='recipe-meta'><span class='diet-badge'>" +
      escapeHtml(row.Diet_type) +
      "</span> Protein: " +
      formatNum(row.Protein) +
      "</span>";
    recipeList.appendChild(li);
  });

  if (!filtered.length) {
    const li = document.createElement("li");
    li.className = "recipe-empty";
    li.textContent = "No recipes match your filters.";
    recipeList.appendChild(li);
  }

  statusLine.textContent =
    filtered.length +
    " match(es) · Page " +
    currentPage +
    " of " +
    pages +
    " · " +
    PAGE_SIZE +
    " per page";

  renderPageButtons(pages);
  prevBtn.disabled = currentPage <= 1 || filtered.length === 0;
  nextBtn.disabled = currentPage >= pages || filtered.length === 0;

  /* Scatter reflects the current page only so changing pages visibly updates the chart */
  updateScatterChart(slice);
}

async function loadNutrition() {
  avgMacros = await fetchJson(URLS.avg_macros);
  updateBarChart();
  renderHeatmap();
  statusLine.textContent =
    "Loaded avg_macros.json — " + avgMacros.length + " diet row(s).";
}

async function loadRecipesData() {
  allRecipes = await fetchJson(URLS.recipes);
  if (!Array.isArray(allRecipes)) throw new Error("recipes must be array");
  populateDietFilter();
  currentPage = 1;
  renderRecipesAndScatter();
  statusLine.textContent = "Loaded recipes.json — " + allRecipes.length + " recipe(s).";
}

async function loadCuisinesData() {
  cuisines = await fetchJson(URLS.clusters);
  updatePieChart();
}

async function loadClustersData() {
  clusters = await fetchJson(URLS.clusters);
  renderClustersPanel();
  statusLine.textContent =
    "Loaded clusters.json — " + clusters.length + " row(s).";
}

async function loadAllInitial() {
  const [macros, rec, clusterRows] = await Promise.all([
    fetchJson(URLS.avg_macros),
    fetchJson(URLS.recipes),
    fetchJson(URLS.clusters),
  ]);
  avgMacros = macros;
  allRecipes = rec;
  cuisines = clusterRows;
  clusters = clusterRows;
  updateBarChart();
  renderHeatmap();
  updatePieChart();
  renderClustersPanel();
  populateDietFilter();
  currentPage = 1;
  renderRecipesAndScatter();
  statusLine.textContent =
    "Ready — " +
    allRecipes.length +
    " recipes, " +
    avgMacros.length +
    " macro rows, " +
    clusters.length +
    " cluster rows.";
}

function wireEvents() {
  dietFilter.addEventListener("change", function () {
    currentPage = 1;
    renderRecipesAndScatter();
  });
  searchInput.addEventListener("input", function () {
    currentPage = 1;
    renderRecipesAndScatter();
  });
  prevBtn.addEventListener("click", function () {
    currentPage -= 1;
    renderRecipesAndScatter();
  });
  nextBtn.addEventListener("click", function () {
    currentPage += 1;
    renderRecipesAndScatter();
  });

  document.getElementById("btnNutrition").addEventListener("click", function () {
    loadNutrition().catch(function (e) {
      console.error(e);
      statusLine.textContent = "Failed to load nutrition data";
    });
  });
  document.getElementById("btnRecipes").addEventListener("click", function () {
    loadRecipesData().catch(function (e) {
      console.error(e);
      statusLine.textContent = "Failed to load recipes data";
    });
  });
  document.getElementById("btnClusters").addEventListener("click", function () {
    loadClustersData().catch(function (e) {
      console.error(e);
      statusLine.textContent = "Failed to load cluster data";
    });
  });

  document.getElementById("btnCleanup").addEventListener("click", function () {
    window.alert("Demo: connect this to your cloud cleanup workflow.");
  });

  logoutBtn.addEventListener("click", function () {
    signOut(auth).finally(function () {
      window.location.href = "login.html";
    });
  });
}

wireEvents();

onAuthStateChanged(auth, function (user) {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  welcomeMsg.textContent = "Welcome, " + (user.displayName || user.email || "User");
  oauthStatus.textContent =
    "Signed in with " + (user.providerData[0]?.providerId || "firebase") + ".";

  loadAllInitial().catch(function (err) {
    console.error(err);
    statusLine.textContent = "Could not load data from the protected Azure API.";
  });
});
