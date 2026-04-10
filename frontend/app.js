const API_URL = "https://diets-app.azurewebsites.net/api/diet-dashboard";

document.getElementById("refreshBtn").addEventListener("click", loadData);
document.getElementById("dietFilter").addEventListener("change", filterData);

let barChart, pieChart, lineChart;
let globalData = null;

async function loadData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    globalData = data;
    populateFilter(data);

    document.getElementById("meta").textContent =
      `Execution time: ${data.execution_time_ms ?? "--"} ms`;

    renderCharts(data);
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("meta").textContent = "Failed to load data";
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

  const topProteinLabels = topProtein.map(
    x => `${x.Recipe_name.length > 20 ? x.Recipe_name.slice(0, 20) + "..." : x.Recipe_name}`
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
  filter.innerHTML = '<option value="all">All Diet Types</option>';

  const avgMacros = data.avg_macros || [];

  avgMacros.forEach(diet => {
    const option = document.createElement("option");
    option.value = diet.Diet_type;
    option.textContent = diet.Diet_type;
    filter.appendChild(option);
  });
}

function filterData() {

  const selectedDiet = document.getElementById("dietFilter").value;

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

loadData();