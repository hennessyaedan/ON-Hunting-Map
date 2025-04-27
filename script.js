// Initialize the map and center on Ontario
const map = L.map("map").setView([50.0, -85.0], 5);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Function to get parent WMU ID (e.g., "WMU15A" -> "15A", "15A" -> "15")
function getParentWMU(wmuId) {
  if (!wmuId) return "Unknown";
  let normalized = wmuId
    .replace(/^WMU/i, "")
    .replace(/-[A-Z]$/, "")
    .replace(/[A-Z]$/, "");
  return normalized || "Unknown";
}

// Define color scale: red (low) to green (high) with 50 stops
const colorScale = chroma
  .scale([
    "#FF0000", // Red (low)
    "#FF8C00", // Orange
    "#FFFF00", // Yellow
    "#008000", // Green (high)
  ])
  .mode("lab")
  .colors(50);



// Function to get color for harvest or per-hunter value
function getColor(harvestObj, minVal, maxVal, isPerHunter) {
  if (harvestObj.isNull || (isPerHunter && harvestObj.perHunterIsNull))
    return "#808080"; // Gray for no data
  const value = isPerHunter ? harvestObj.perHunterValue : harvestObj.value;
  if (value === 0 || isNaN(value)) return "#FFFFCC"; // Light yellow for zero
  const ratio = (value - minVal) / (maxVal - minVal);
  const colorIndex = Math.min(Math.floor(ratio * 50), 49); // Map to 0–49
  const color = colorScale[colorIndex];
  return color;
}

// Global variables
let deerHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let doeHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let buckHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let bearHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let turkeyHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let mooseHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let wolfHarvest = {
  data: {},
  min: Infinity,
  max: -Infinity,
  minPerHunter: Infinity,
  maxPerHunter: -Infinity,
};
let currentDataset = {
  dataset: deerHarvest,
  species: "deer",
  column: "Total Harvest",
  year: "2024",
  isPerHunter: false,
};
let availableYears = new Set();
let geojsonLayer = null;
let highlightedLayer = null;
let rawData = {};

// Function to process harvest data for a specific year
function processHarvestData(data, datasetType, selectedYear) {
  const harvestData = {};
  let minHarvest = Infinity,
    maxHarvest = -Infinity;
  let minPerHunter = Infinity,
    maxPerHunter = -Infinity;
  const valueBins = {
    "0-5": 0,
    "5-10": 0,
    "10-20": 0,
    "20-50": 0,
    "50-100": 0,
    "100-500": 0,
    "500+": 0,
  };
  const perHunterBins = {
    "0-0.01": 0,
    "0.01-0.1": 0,
    "0.1-0.5": 0,
    "0.5-1": 0,
    "1-2": 0,
    "2+": 0,
  };

  let harvestColumn,
    activeHuntersColumn = 3,
    isDeer;
  if (datasetType === "deer-total") {
    harvestColumn = 6; // Total Harvest
    isDeer = true;
  } else if (datasetType === "deer-doe") {
    harvestColumn = 4; // Antlerless
    isDeer = true;
  } else if (datasetType === "deer-buck") {
    harvestColumn = 5; // Antlered
    isDeer = true;
  } else if (datasetType === "bear") {
    harvestColumn = 4; // Harvest
    isDeer = false;
  } else if (datasetType === "turkey") {
    harvestColumn = 5; // Total Harvest
    isDeer = false;
  } else if (datasetType === "moose") {
    harvestColumn = 7; // Total Harvest
    isDeer = false;
  } else if (datasetType === "wolf") {
    harvestColumn = 4; // Harvest
    isDeer = false;
  }


  const filteredRecords = data.records.filter(
    (record) => String(record[2]) === selectedYear && record[1] !== "Total",
  );


  filteredRecords.forEach((record) => {
    const wmuId = record[1].trim();
    const isNull = isDeer ? record[harvestColumn] === "NULL" : false;
    const totalHarvest = isNull ? 0 : parseInt(record[harvestColumn], 10);
    const activeHunters = parseInt(record[activeHuntersColumn], 10);
    let perHunterValue = 0;
    let perHunterIsNull = isNull || activeHunters <= 0 || isNaN(activeHunters);

    if (!perHunterIsNull) {
      perHunterValue = totalHarvest / activeHunters;
    }

    harvestData[wmuId] = {
      wmuId,
      value: totalHarvest,
      perHunterValue,
      isNull,
      perHunterIsNull,
    };
    if (!isNull && totalHarvest > 0) {
      minHarvest = Math.min(minHarvest, totalHarvest);
      maxHarvest = Math.max(maxHarvest, totalHarvest);
      if (totalHarvest <= 5) valueBins["0-5"]++;
      else if (totalHarvest <= 10) valueBins["5-10"]++;
      else if (totalHarvest <= 20) valueBins["10-20"]++;
      else if (totalHarvest <= 50) valueBins["20-50"]++;
      else if (totalHarvest <= 100) valueBins["50-100"]++;
      else if (totalHarvest <= 500) valueBins["100-500"]++;
      else valueBins["500+"]++;
    }
    if (!perHunterIsNull && perHunterValue > 0) {
      minPerHunter = Math.min(minPerHunter, perHunterValue);
      maxPerHunter = Math.max(maxPerHunter, perHunterValue);
      if (perHunterValue <= 0.01) perHunterBins["0-0.01"]++;
      else if (perHunterValue <= 0.1) perHunterBins["0.01-0.1"]++;
      else if (perHunterValue <= 0.5) perHunterBins["0.1-0.5"]++;
      else if (perHunterValue <= 1) perHunterBins["0.5-1"]++;
      else if (perHunterValue <= 2) perHunterBins["1-2"]++;
      else perHunterBins["2+"]++;
    }
  });


  return {
    data: harvestData,
    min: minHarvest,
    max: maxHarvest,
    minPerHunter,
    maxPerHunter,
  };
}

// Function to populate year dropdown
function populateYearDropdown() {
  const yearSelect = document.getElementById("year-select");
  const years = Array.from(availableYears).sort((a, b) => b - a);
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    if (year === "2024") option.selected = true;
    yearSelect.appendChild(option);
  });
  }

// Function to update trend chart using Plotly.js
function updateTrendChart(wmuId, datasetType, speciesName, isPerHunter) {
  if (typeof Plotly === "undefined") {
    console.warn("Plotly.js not loaded, skipping chart update");
    return;
  }
  if (!rawData[datasetType.split("-")[0]]) {
    console.warn(`Raw data not available for ${datasetType}`);
    return;
  }
  const dataKey = datasetType.split("-")[0];
  const data = rawData[dataKey].records.filter((r) => r[1] === wmuId);
  const years = Array.from(availableYears).sort();
  const harvestColumn =
    datasetType === "deer-total"
      ? 6
      : datasetType === "deer-doe"
        ? 4
        : datasetType === "deer-buck"
          ? 5
          : datasetType === "moose"
            ? 7
            : datasetType === "turkey"
              ? 5
              : 4;
  const isDeer = datasetType.startsWith("deer");
  const values = years.map((year) => {
    const record = data.find((r) => String(r[2]) === year);
    if (!record) return 0;
    const harvest =
      isDeer && record[harvestColumn] === "NULL"
        ? 0
        : parseInt(record[harvestColumn], 10);
    const hunters = parseInt(record[3], 10);
    return isPerHunter && hunters > 0 ? harvest / hunters : harvest;
  });

  const trace = {
    x: years,
    y: values,
    type: "scatter",
    mode: "lines",
    line: { color: "#008000", width: 2 },
  };

  const layout = {
    title: {
      text: `WMU ${wmuId}: ${speciesName.charAt(0).toUpperCase() + speciesName.slice(1)} (${isPerHunter ? "Per Hunter" : "Harvest"})`,
      font: { size: 12 },
    },
    xaxis: { title: "Year" },
    yaxis: {
      title: isPerHunter ? "Per Hunter" : "Harvest",
      rangemode: "tozero",
    },
    margin: { l: 40, r: 20, t: 40, b: 40 },
    width: 200,
    height: 150,
    showlegend: false,
  };

  try {
    Plotly.newPlot("trend-chart", [trace], layout, { displayModeBar: false });
  } catch (error) {
    console.error("Error creating Plotly chart:", error);
  }
}

// Function to update the map with the selected dataset and year
function updateMap() {
  const harvestData = currentDataset.dataset.data;
  const minVal = currentDataset.isPerHunter
    ? currentDataset.dataset.minPerHunter
    : currentDataset.dataset.min;
  const maxVal = currentDataset.isPerHunter
    ? currentDataset.dataset.maxPerHunter
    : currentDataset.dataset.max;
  const speciesName = currentDataset.species;
  const selectedYear = currentDataset.year;
  const isPerHunter = currentDataset.isPerHunter;

  // Reset highlight
  if (highlightedLayer) {
    geojsonLayer.resetStyle(highlightedLayer);
    highlightedLayer = null;
  }

  // Clear chart
  document.getElementById("trend-chart").innerHTML = "";

  if (geojsonLayer) {
    map.removeLayer(geojsonLayer);
  }

  fetch("./wmu-boundaries.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load wmu-boundaries.json: ${response.status} ${response.statusText}`,
        );
      }
      return response.json();
    })
    .then((geojson) => {
      if (geojson.features && geojson.features.length > 0) {
        console.log(
          "GeoJSON First Feature Properties:",
          geojson.features[0].properties,
        );
      } else {
        console.warn("No features found in GeoJSON");
      }
      geojsonLayer = L.geoJSON(geojson, {
        style: (feature) => {
          const wmuId = feature.properties.OFFICIAL_NAME || "Unknown";
          const parentWMU = getParentWMU(wmuId);
          const harvestObj = harvestData[wmuId] ||
            harvestData[parentWMU] || {
              wmuId,
              value: 0,
              perHunterValue: 0,
              isNull: true,
              perHunterIsNull: true,
            };

          return {
            fillColor: getColor(harvestObj, minVal, maxVal, isPerHunter),
            color: "#666",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          const wmuId = feature.properties.OFFICIAL_NAME || "Unknown WMU";
          const parentWMU = getParentWMU(wmuId);
          const harvestObj = harvestData[wmuId] ||
            harvestData[parentWMU] || {
              wmuId,
              value: 0,
              perHunterValue: 0,
              isNull: true,
              perHunterIsNull: true,
            };
          const displayWMU = harvestData[wmuId] ? wmuId : parentWMU;
          const tooltipText = isPerHunter
            ? harvestObj.perHunterIsNull
              ? `Harvest data not available for ${selectedYear}`
              : `WMU ${displayWMU}: ${harvestObj.perHunterValue.toFixed(2)} ${speciesName} harvested per hunter`
            : harvestObj.isNull
              ? `Harvest data not available for ${selectedYear}`
              : `WMU ${displayWMU}: ${harvestObj.value} ${speciesName} harvested`;
          layer.bindTooltip(tooltipText, {
            sticky: true,
            opacity: 0.9,
          });
          layer.on("mouseover", () => {
            updateTrendChart(
              displayWMU,
              document.getElementById("species-select").value,
              speciesName,
              isPerHunter,
            );
          });
        },
      }).addTo(map);

      // Handle WMU search
      document
        .getElementById("wmu-search")
        .addEventListener("input", (event) => {
          const searchValue = event.target.value.trim().toUpperCase();
          if (highlightedLayer) {
            geojsonLayer.resetStyle(highlightedLayer);
            highlightedLayer = null;
          }
          if (searchValue && geojsonLayer) {
            geojsonLayer.eachLayer((layer) => {
              const wmuId = layer.feature.properties.OFFICIAL_NAME || "";
              const normalizedWMU = wmuId.toUpperCase().replace(/^WMU/, "");
              if (
                normalizedWMU === searchValue ||
                wmuId.toUpperCase() === `WMU${searchValue}`
              ) {
                console.log(`Search matched WMU: ${wmuId}`);
                highlightedLayer = layer;
                layer.setStyle({ color: "#0000FF", weight: 3 });
                map.fitBounds(layer.getBounds());
                layer.openTooltip();
              }
            });
          }
        });
    })
    .catch((error) => {
      console.error("Error loading GeoJSON:", error);
      alert(
        "Failed to load WMU boundaries. Please ensure wmu-boundaries.json is uploaded to Replit.",
      );
    });
}

// Load all harvest datasets and extract years
Promise.all([
  fetch("./deerHarvest2024.json").then((response) => {
    if (!response.ok)
      throw new Error(
        `Failed to load deerHarvest2024.json: ${response.status}`,
      );
    return response.json().then((data) => {
      data.records.forEach((record) => availableYears.add(String(record[2])));
      return data;
    });
  }),
  fetch("./bearHarvest2024.json").then((response) => {
    if (!response.ok)
      throw new Error(
        `Failed to load bearHarvest2024.json: ${response.status}`,
      );
    return response.json().then((data) => {
      data.records.forEach((record) => availableYears.add(String(record[2])));
      return data;
    });
  }),
  fetch("./turkeyHarvest2024.json").then((response) => {
    if (!response.ok)
      throw new Error(
        `Failed to load turkeyHarvest2024.json: ${response.status}`,
      );
    return response.json().then((data) => {
      data.records.forEach((record) => availableYears.add(String(record[2])));
      return data;
    });
  }),
  fetch("./mooseHarvest2024.json").then((response) => {
    if (!response.ok)
      throw new Error(
        `Failed to load mooseHarvest2024.json: ${response.status}`,
      );
    return response.json().then((data) => {
      data.records.forEach((record) => availableYears.add(String(record[2])));
      return data;
    });
  }),
  fetch("./wolfHarvest2024.json").then((response) => {
    if (!response.ok)
      throw new Error(
        `Failed to load wolfHarvest2024.json: ${response.status}`,
      );
    return response.json().then((data) => {
      data.records.forEach((record) => availableYears.add(String(record[2])));
      return data;
    });
  }),
])
  .then(([deerData, bearData, turkeyData, mooseData, wolfData]) => {
    // Populate year dropdown
    populateYearDropdown();

    // Store raw data for reprocessing
    rawData = {
      deer: deerData,
      bear: bearData,
      turkey: turkeyData,
      moose: mooseData,
      wolf: wolfData,
    };
    
    // Process initial data for 2024
    deerHarvest = processHarvestData(deerData, "deer-total", "2024");
    doeHarvest = processHarvestData(deerData, "deer-doe", "2024");
    buckHarvest = processHarvestData(deerData, "deer-buck", "2024");
    bearHarvest = processHarvestData(bearData, "bear", "2024");
    turkeyHarvest = processHarvestData(turkeyData, "turkey", "2024");
    mooseHarvest = processHarvestData(mooseData, "moose", "2024");
    wolfHarvest = processHarvestData(wolfData, "wolf", "2024");


    // Initial map load
    currentDataset = {
      dataset: deerHarvest,
      species: "deer",
      column: "Total Harvest",
      year: "2024",
      isPerHunter: false,
    };
    updateMap();

    // Handle species toggle
    document
      .getElementById("species-select")
      .addEventListener("change", (event) => {
        const value = event.target.value;
        const year = currentDataset.year;
        const isPerHunter = currentDataset.isPerHunter;
        if (value === "deer-total") {
          currentDataset = {
            dataset: processHarvestData(rawData.deer, "deer-total", year),
            species: "deer",
            column: "Total Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "deer-doe") {
          currentDataset = {
            dataset: processHarvestData(rawData.deer, "deer-doe", year),
            species: "does",
            column: "Antlerless",
            year,
            isPerHunter,
          };
        } else if (value === "deer-buck") {
          currentDataset = {
            dataset: processHarvestData(rawData.deer, "deer-buck", year),
            species: "bucks",
            column: "Antlered",
            year,
            isPerHunter,
          };
        } else if (value === "bear") {
          currentDataset = {
            dataset: processHarvestData(rawData.bear, "bear", year),
            species: "bears",
            column: "Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "turkey") {
          currentDataset = {
            dataset: processHarvestData(rawData.turkey, "turkey", year),
            species: "turkeys",
            column: "Total Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "moose") {
          currentDataset = {
            dataset: processHarvestData(rawData.moose, "moose", year),
            species: "moose",
            column: "Total Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "wolf") {
          currentDataset = {
            dataset: processHarvestData(rawData.wolf, "wolf", year),
            species: "wolves/coyotes",
            column: "Harvest",
            year,
            isPerHunter,
          };
        }
        updateMap();
      });

    // Handle year toggle
    document
      .getElementById("year-select")
      .addEventListener("change", (event) => {
        const year = event.target.value;
        const value = document.getElementById("species-select").value;
        const isPerHunter = currentDataset.isPerHunter;
        if (value === "deer-total") {
          currentDataset = {
            dataset: processHarvestData(rawData.deer, "deer-total", year),
            species: "deer",
            column: "Total Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "deer-doe") {
          currentDataset = {
            dataset: processHarvestData(rawData.deer, "deer-doe", year),
            species: "does",
            column: "Antlerless",
            year,
            isPerHunter,
          };
        } else if (value === "deer-buck") {
          currentDataset = {
            dataset: processHarvestData(rawData.deer, "deer-buck", year),
            species: "bucks",
            column: "Antlered",
            year,
            isPerHunter,
          };
        } else if (value === "bear") {
          currentDataset = {
            dataset: processHarvestData(rawData.bear, "bear", year),
            species: "bears",
            column: "Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "turkey") {
          currentDataset = {
            dataset: processHarvestData(rawData.turkey, "turkey", year),
            species: "turkeys",
            column: "Total Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "moose") {
          currentDataset = {
            dataset: processHarvestData(rawData.moose, "moose", year),
            species: "moose",
            column: "Total Harvest",
            year,
            isPerHunter,
          };
        } else if (value === "wolf") {
          currentDataset = {
            dataset: processHarvestData(rawData.wolf, "wolf", year),
            species: "wolves/coyotes",
            column: "Harvest",
            year,
            isPerHunter,
          };
        }
        updateMap();
      });

    // Handle per-hunter toggle
    document
      .getElementById("per-hunter-checkbox")
      .addEventListener("change", (event) => {
        currentDataset.isPerHunter = event.target.checked;
        updateMap();
      });
  })
  .catch((error) => {
    console.error("Error loading harvest data:", error);
    alert(
      "Failed to load harvest data. Please ensure all JSON files are uploaded to Replit.",
    );
  });
