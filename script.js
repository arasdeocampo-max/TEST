const buttons = document.querySelectorAll(".btn");
const statusBanner = document.createElement("div");

statusBanner.className = "status-banner";
statusBanner.textContent = "Action logged to audit trail.";

const header = document.querySelector(".app-header");
if (header) {
  header.appendChild(statusBanner);
}

const medicines = [
  {
    id: "ABX-4012",
    name: "Amoxicillin 500mg",
    category: "Antibiotic",
    expiry: "2025-03-18",
    location: "Shelves A1-A3",
    quantity: 1420,
    status: "okay",
  },
  {
    id: "ALG-1021",
    name: "Ibuprofen 200mg",
    category: "Analgesic",
    expiry: "2024-11-02",
    location: "Shelves B2-B4",
    quantity: 980,
    status: "warning",
  },
  {
    id: "CCR-8820",
    name: "Metformin 850mg",
    category: "Chronic Care",
    expiry: "2026-01-24",
    location: "Shelves C1-C5",
    quantity: 2230,
    status: "okay",
  },
  {
    id: "VAC-2201",
    name: "Influenza Vaccine",
    category: "Vaccine",
    expiry: "2024-09-12",
    location: "Cold Storage",
    quantity: 310,
    status: "danger",
  },
  {
    id: "SUP-4100",
    name: "Vitamin D3 1000IU",
    category: "Supplement",
    expiry: "2026-06-30",
    location: "Shelves D1-D2",
    quantity: 1650,
    status: "okay",
  },
  {
    id: "ABX-7734",
    name: "Ciprofloxacin 250mg",
    category: "Antibiotic",
    expiry: "2024-12-20",
    location: "Shelves A4-A6",
    quantity: 540,
    status: "warning",
  },
  {
    id: "CCR-4599",
    name: "Lisinopril 10mg",
    category: "Chronic Care",
    expiry: "2025-08-10",
    location: "Shelves C6-C8",
    quantity: 1280,
    status: "okay",
  },
  {
    id: "ALG-3088",
    name: "Paracetamol 500mg",
    category: "Analgesic",
    expiry: "2025-02-14",
    location: "Shelves B1-B3",
    quantity: 640,
    status: "warning",
  },
  {
    id: "VAC-3390",
    name: "Hepatitis B Vaccine",
    category: "Vaccine",
    expiry: "2024-07-05",
    location: "Cold Storage",
    quantity: 140,
    status: "danger",
  },
  {
    id: "SUP-5820",
    name: "Omega-3 Capsules",
    category: "Supplement",
    expiry: "2026-04-01",
    location: "Shelves D3-D5",
    quantity: 880,
    status: "okay",
  },
  {
    id: "CCR-7712",
    name: "Atorvastatin 20mg",
    category: "Chronic Care",
    expiry: "2025-10-19",
    location: "Shelves C2-C4",
    quantity: 720,
    status: "okay",
  },
  {
    id: "ABX-9401",
    name: "Azithromycin 250mg",
    category: "Antibiotic",
    expiry: "2024-08-22",
    location: "Shelves A2-A5",
    quantity: 410,
    status: "danger",
  },
];

const statusText = {
  okay: "Stable",
  warning: "Low Stock",
  danger: "Critical",
};

const rowsContainer = document.querySelector("#medicineRows");
const resultCount = document.querySelector("#resultCount");
const pageIndicator = document.querySelector("#pageIndicator");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const statusFilter = document.querySelector("#statusFilter");
const sortFilter = document.querySelector("#sortFilter");
const pageSizeSelect = document.querySelector("#pageSize");
const prevPageButton = document.querySelector("#prevPage");
const nextPageButton = document.querySelector("#nextPage");
const exportButton = document.querySelector("#exportButton");

let currentPage = 1;

const filterData = () => {
  const query = searchInput?.value.toLowerCase().trim() ?? "";
  const category = categoryFilter?.value ?? "all";
  const status = statusFilter?.value ?? "all";

  return medicines.filter((medicine) => {
    const matchesQuery =
      medicine.name.toLowerCase().includes(query) ||
      medicine.id.toLowerCase().includes(query) ||
      medicine.category.toLowerCase().includes(query) ||
      medicine.location.toLowerCase().includes(query);
    const matchesCategory = category === "all" || medicine.category === category;
    const matchesStatus = status === "all" || medicine.status === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });
};

const sortData = (data) => {
  const sortKey = sortFilter?.value ?? "name";
  const sorted = [...data];
  sorted.sort((a, b) => {
    if (sortKey === "quantity") {
      return b.quantity - a.quantity;
    }
    if (sortKey === "expiry") {
      return new Date(a.expiry) - new Date(b.expiry);
    }
    return a.name.localeCompare(b.name);
  });
  return sorted;
};

const renderRows = () => {
  if (!rowsContainer) return;
  const pageSize = Number(pageSizeSelect?.value ?? 10);
  const filtered = sortData(filterData());
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  rowsContainer.innerHTML = "";
  pageItems.forEach((medicine) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <strong>${medicine.name}</strong><br />
        <span class="muted">${medicine.id}</span>
      </td>
      <td>${medicine.category}</td>
      <td>${medicine.expiry}</td>
      <td>${medicine.location}</td>
      <td>${medicine.quantity}</td>
      <td><span class="status ${medicine.status}">${statusText[medicine.status]}</span></td>
    `;
    rowsContainer.appendChild(row);
  });

  if (resultCount) {
    resultCount.textContent = `Showing ${filtered.length} items`;
  }
  if (pageIndicator) {
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  }
  if (prevPageButton) {
    prevPageButton.disabled = currentPage === 1;
  }
  if (nextPageButton) {
    nextPageButton.disabled = currentPage === totalPages;
  }
};

const handleChange = () => {
  currentPage = 1;
  renderRows();
};

[searchInput, categoryFilter, statusFilter, sortFilter, pageSizeSelect].forEach((input) => {
  input?.addEventListener("input", handleChange);
  input?.addEventListener("change", handleChange);
});

prevPageButton?.addEventListener("click", () => {
  currentPage = Math.max(1, currentPage - 1);
  renderRows();
});

nextPageButton?.addEventListener("click", () => {
  currentPage += 1;
  renderRows();
});

exportButton?.addEventListener("click", () => {
  statusBanner.classList.add("show");
  statusBanner.textContent = "Export queued • CSV download will start";
  window.setTimeout(() => {
    statusBanner.classList.remove("show");
  }, 1800);
});

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.id === "exportButton") return;
    statusBanner.classList.add("show");
    statusBanner.textContent = `${button.textContent} queued • Audit log updated`;

    window.setTimeout(() => {
      statusBanner.classList.remove("show");
    }, 1800);
  });
});

renderRows();
