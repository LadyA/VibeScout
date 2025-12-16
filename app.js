// Grab DOM elements
const searchInput = document.getElementById("searchInput");
const typeSelect = document.getElementById("typeSelect");
const openNowSelect = document.getElementById("openNowSelect");
const familyFilter = document.getElementById("familyFilter");
const petFilter = document.getElementById("petFilter");
const patioFilter = document.getElementById("patioFilter");
const playgroundFilter = document.getElementById("playgroundFilter");
const fencedFilter = document.getElementById("fencedFilter");
const featureCheckboxes = document.querySelectorAll(".featureCheckbox");

const resultCountEl = document.getElementById("resultCount");
const resultsDiv = document.getElementById("results");

const detailModal = document.getElementById("detailModal");
const modalBody = document.getElementById("modalBody");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Utility: check "time of day" roughly
function getCurrentHour() {
  const now = new Date();
  return now.getHours();
}

function isPlaceOpenNow(place) {
  // SUPER simple: just check if today's hours aren't "Closed"
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = days[new Date().getDay()];
  const hoursToday = place.hours?.[todayKey];
  if (!hoursToday || hoursToday.toLowerCase().includes("closed")) return false;
  return true; // you could parse times later if you want precision
}

// For "morning / afternoon / evening" we’ll just guess using current hour
function matchesTimeFilter(place, value) {
  if (!value) return true;
  const hour = getCurrentHour();

  if (value === "now") {
    return isPlaceOpenNow(place);
  }
  if (value === "morning") {
    return hour >= 6 && hour < 12;
  }
  if (value === "afternoon") {
    return hour >= 12 && hour < 17;
  }
  if (value === "evening") {
    return hour >= 17 || hour < 2;
  }
  return true;
}

// Render list of places
function renderPlaces(list) {
  resultsDiv.innerHTML = "";

  resultCountEl.textContent = `${list.length} place${list.length === 1 ? "" : "s"} found`;

  if (!list.length) {
    resultsDiv.innerHTML = `<p>No places match those filters yet. Try relaxing a filter.</p>`;
    return;
  }

  list.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.addEventListener("click", () => openPlaceModal(place));

    card.innerHTML = `
      <div class="place-header">
        <div>
          <h2 class="place-name">${place.name}</h2>
          <div class="place-type">${place.type.toUpperCase()} • ${place.priceLevel || ""}</div>
        </div>
        <div class="place-type">${place.city}</div>
      </div>
      <p class="place-meta">${place.address}</p>
      <p class="place-meta">${place.cuisine.join(", ")}</p>
      <div class="chips">
        ${place.familyFriendly ? `<span class="chip chip--accent">Family-friendly</span>` : ""}
        ${place.petFriendly ? `<span class="chip">Pet-friendly</span>` : ""}
        ${place.hasPatio ? `<span class="chip">Patio</span>` : ""}
        ${place.hasPlayground ? `<span class="chip">Playground</span>` : ""}
        ${place.fenced ? `<span class="chip">Fenced</span>` : ""}
        ${place.features
          .map((f) => `<span class="chip">${formatFeature(f)}</span>`)
          .join("")}
      </div>
    `;

    resultsDiv.appendChild(card);
  });
}

// Format feature labels
function formatFeature(featureKey) {
  return featureKey
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

// Apply all filters
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const typeValue = typeSelect.value;
  const timeValue = openNowSelect.value;

  const selectedFeatures = Array.from(featureCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  const filtered = places.filter((place) => {
    // text search
    const fullText =
      `${place.name} ${place.cuisine.join(" ")} ${place.vibes?.join(" ") || ""} ${place.features.join(
        " "
      )}`.toLowerCase();

    if (query && !fullText.includes(query)) return false;

    // type filter
    if (typeValue && place.type !== typeValue) return false;

    // boolean filters
    if (familyFilter.checked && !place.familyFriendly) return false;
    if (petFilter.checked && !place.petFriendly) return false;
    if (patioFilter.checked && !place.hasPatio) return false;
    if (playgroundFilter.checked && !place.hasPlayground) return false;
    if (fencedFilter.checked && !place.fenced) return false;

    // time filter
    if (!matchesTimeFilter(place, timeValue)) return false;

    // feature filters: place must include all selected features
    if (selectedFeatures.length) {
      const hasAllFeatures = selectedFeatures.every((feat) =>
        place.features.includes(feat)
      );
      if (!hasAllFeatures) return false;
    }

    return true;
  });

  renderPlaces(filtered);
}

// Modal logic
function openPlaceModal(place) {
  detailModal.classList.remove("hidden");

  const daysOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const dayLabels = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun"
  };

  const hoursHtml = daysOrder
    .map((dayKey) => {
      const label = dayLabels[dayKey];
      const value = place.hours?.[dayKey] || "Closed";
      return `<div><strong>${label}:</strong> ${value}</div>`;
    })
    .join("");

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name}, ${place.address}, ${place.city}`
  )}`;

  modalBody.innerHTML = `
    <h2>${place.name}</h2>
    <p style="color: #6b7280; font-size: 0.9rem;">
      ${place.type.toUpperCase()} • ${place.priceLevel || ""} • ${place.city}
    </p>
    <p>${place.address}</p>

    <div class="chips" style="margin-top: 8px;">
      ${place.familyFriendly ? `<span class="chip chip--accent">Family-friendly</span>` : ""}
      ${place.petFriendly ? `<span class="chip">Pet-friendly</span>` : ""}
      ${place.hasPatio ? `<span class="chip">Patio</span>` : ""}
      ${place.hasPlayground ? `<span class="chip">Playground</span>` : ""}
      ${place.fenced ? `<span class="chip">Fenced</span>` : ""}
      ${place.features
        .map((f) => `<span class="chip">${formatFeature(f)}</span>`)
        .join("")}
    </div>

    <h3 style="margin-top: 14px; margin-bottom: 4px; font-size: 0.95rem;">Hours</h3>
    <div style="font-size: 0.85rem; color: #4b5563; margin-bottom: 10px;">
      ${hoursHtml}
    </div>

    <button class="button button-primary" onclick="window.open('${googleMapsUrl}', '_blank')">
      Open in Maps
    </button>
  `;
}

function closeModal() {
  detailModal.classList.add("hidden");
}

// Event listeners
searchInput.addEventListener("input", applyFilters);
typeSelect.addEventListener("change", applyFilters);
openNowSelect.addEventListener("change", applyFilters);
familyFilter.addEventListener("change", applyFilters);
petFilter.addEventListener("change", applyFilters);
patioFilter.addEventListener("change", applyFilters);
playgroundFilter.addEventListener("change", applyFilters);
fencedFilter.addEventListener("change", applyFilters);
featureCheckboxes.forEach((cb) => cb.addEventListener("change", applyFilters));

modalCloseBtn.addEventListener("click", closeModal);
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal || e.target.classList.contains("modal-backdrop")) {
    closeModal();
  }
});

// Initial render
applyFilters();
