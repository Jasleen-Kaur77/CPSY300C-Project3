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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "https://diets-app.azurewebsites.net/api/diet-dashboard";

const refreshBtn = document.getElementById("refreshBtn");
const dietFilter = document.getElementById("dietFilter");
const logoutBtn = document.getElementById("logoutBtn");
const userNameEl = document.getElementById("userName");
const dashboardContent = document.getElementById("dashboardContent");
const metaEl = document.getElementById("meta");

let currentUser = null;
let barChart, pieChart, lineChart;
let globalData = null;

refreshBtn.addEventListener("click", loadData);
dietFilter.addEventListener("change", filterData);

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout failed:", error);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  userNameEl.textContent = user.displayName || user.email || "User";
  dashboardContent.style.display = "block";

  await loadData();
});

async function loadData() {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    const token = await currentUser.getIdToken();

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load data");
    }

    globalData = data;
    populateFilter(data);

    metaEl.textContent = `Execution time: ${data.execution_time_ms ?? "--"} ms`;

    renderCharts(data);
  } catch (error) {
    console.error("Error loading data:", error);
    metaEl.textContent = `Failed to load data: ${error.message}`;
  }
}

function renderCharts(data) {
  const avgMacros = data.avg_macros || [];
  const topProtein = data.top_protein || [];
  const cuisineCounts = data.cuisine_counts || [];

  const dietLabels = avgMacros.map(x => x.Diet_type);
  const proteinData = avgMacros.map(x => x.Protein);
  const carbsData = avgMacros.map(x => x.Carbs);
  const fatData = avgMacros.map(x => x.Fat);

  const cuisineLabels = cuisineCounts.map(x => x.Cuisine);
  const cuisineData = cuisineCounts.map(x => x.Count);

  const topProteinLabels = topProtein.map(x =>
    x.Recipe_name.length > 20
      ? x.Recipe_name.slice(0, 20) + "..."
      : x.Recipe_name
  );
  const topProteinValues = topProtein.map(x => x.Protein);

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();
  if (lineChart) lineChart.destroy();

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: dietLabels,
      datasets: [
        { label: "Protein", data: proteinData },
        { label: "Carbs", data: carbsData },
        { label: "Fat", data: fatData }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Average Macronutrients by Diet Type"
        }
      }
    }
  });

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: cuisineLabels,
      datasets: [
        {
          label: "Cuisine Distribution",
          data: cuisineData
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Cuisine Distribution"
        }
      }
    }
  });

  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: topProteinLabels,
      datasets: [
        {
          label: "Top Protein Recipes",
          data: topProteinValues,
          fill: false,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Top Protein-Rich Recipes"
        }
      }
    }
  });
}

function populateFilter(data) {
  const filter = document.getElementById("dietFilter");
  const selectedValue = filter.value;

  filter.innerHTML = '<option value="all">All Diet Types</option>';

  const avgMacros = data.avg_macros || [];

  avgMacros.forEach(diet => {
    const option = document.createElement("option");
    option.value = diet.Diet_type;
    option.textContent = diet.Diet_type;
    filter.appendChild(option);
  });

  if ([...filter.options].some(option => option.value === selectedValue)) {
    filter.value = selectedValue;
  }
}

function filterData() {
  const selectedDiet = dietFilter.value;

  if (!globalData) return;

  if (selectedDiet === "all") {
    renderCharts(globalData);
    return;
  }

  const filtered = {
    avg_macros: globalData.avg_macros.filter(
      x => x.Diet_type === selectedDiet
    ),
    top_protein: globalData.top_protein.filter(
      x => x.Diet_type === selectedDiet
    ),
    cuisine_counts: globalData.cuisine_counts,
    execution_time_ms: globalData.execution_time_ms
  };

  renderCharts(filtered);
}