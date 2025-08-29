const modeImg = document.querySelector(".mode");

modeImg.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
}); 

document.addEventListener("DOMContentLoaded", () => {
  let today = new Date();
  let formattedDate =
    today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
  document.getElementById("last-seen").innerText = formattedDate;


  let savedData = localStorage.getItem("attendanceData");
  if (savedData) {
    let parsed = JSON.parse(savedData);
    displayTable(parsed.employees, parsed.attendanceRecords);
    addBulkAction();
    addSubmitAction(parsed);
    applyFilters("");
  } else {
    fetch("../data.json")
      .then((response) => response.json())
      .then((data) => {
        displayTable(data.employees, data.attendanceRecords);
        addBulkAction();
        addSubmitAction(data);
        applyFilters("");
      })
      .catch((err) => console.error("Error loading JSON:", err));
  }
});

// ===== عرض الجدول =====
function displayTable(employees, attendanceRecords) {
  let tbody = document.querySelector(".mytable tbody");
  tbody.innerHTML = "";

  employees.forEach((emp) => {
    let record = attendanceRecords.find((r) => r.employeeId === emp.id);
    let row = document.createElement("tr");
    row.dataset.leave = record?.isLeave;
    row.dataset.wfh = record?.isWFH;

    row.innerHTML = `
      <td><input type="checkbox" class="row-select"/></td>
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.department}</td>
      <td><span class="status badge bg-secondary"></span></td>
      <td><input type="time" class="checkin text-center ps-4" value="${record?.checkIn || ""}" disabled></td>
      <td><input type="time" class="checkout text-center ps-4" value="${record?.checkOut || ""}" disabled></td>
      <td>${record?.notes || ""}</td>
    `;
    tbody.appendChild(row);

    
    row.updateStatus = function () {
      let statusCell = row.querySelector(".status");
      let checkInInput = row.querySelector(".checkin");
      let onLeave = row.dataset.leave === "true";
      let wfh = row.dataset.wfh === "true";
      let time = checkInInput.value;

      if (wfh) {
        statusCell.textContent = "Present (WFH)";
        statusCell.className = "status present";
      } else if (onLeave) {
        statusCell.textContent = "Leave";
        statusCell.className = "status leave";
      } else if (!time || time > "11:00") {
        statusCell.textContent = "Absent";
        statusCell.className = "status absent";
      } else if (time > "09:00" && time <= "11:00") {
        statusCell.textContent = "Late";
        statusCell.className = "status late";
      } else {
        statusCell.textContent = "Present";
        statusCell.className = "status present";
      }
    };
    row.updateStatus();

   
    let checkbox = row.querySelector(".row-select");
    checkbox.addEventListener("change", () => {
      let checkinInput = row.querySelector(".checkin");
      let checkoutInput = row.querySelector(".checkout");
      checkinInput.disabled = !checkbox.checked;
      checkoutInput.disabled = !checkbox.checked;
    });
  });
}


function addSubmitAction(dataObj) {
  const submitBtn = document.getElementById("submit-btn");
  const tbody = document.querySelector(".mytable tbody");

  submitBtn.addEventListener("click", () => {
    let selectedRows = tbody.querySelectorAll("tr");
    selectedRows.forEach((row) => {
      let checkbox = row.querySelector("input.row-select");
      if (checkbox.checked) {
        row.updateStatus();
        let empId = parseInt(row.children[1].textContent);
        let checkIn = row.querySelector(".checkin").value;
        let checkOut = row.querySelector(".checkout").value;
        let status = row.querySelector(".status").textContent;

        let record = dataObj.attendanceRecords.find((r) => r.employeeId === empId);
        if (record) {
          record.checkIn = checkIn;
          record.checkOut = checkOut;
          record.status = status;
        }
      }
    });

    localStorage.setItem("attendanceData", JSON.stringify(dataObj));
    alert("Saved in LocalStorage ✅");
  });
}


function addBulkAction() {
  const selectAll = document.getElementById("select-all");
  const tbody = document.querySelector(".mytable tbody");

  selectAll.addEventListener("change", () => {
    let allCheckboxes = tbody.querySelectorAll("input.row-select");
    allCheckboxes.forEach((cb) => {
      cb.checked = selectAll.checked;
      let row = cb.closest("tr");
      let checkinInput = row.querySelector(".checkin");
      let checkoutInput = row.querySelector(".checkout");
      checkinInput.disabled = !cb.checked;
      checkoutInput.disabled = !cb.checked;
    });
  });
}


const searchInput = document.getElementById("search");
const dropdownItems = document.querySelectorAll(".dropdown-menu .dropdown-item");
const dropdownLabel = document.querySelector(".filter-dropdown .fw-bold");
const activeCount = document.getElementById("activeCount");

function applyFilters(selected = "") {
  const term = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll(".mytable tbody tr");
  let visibleCount = 0;

  rows.forEach((row) => {
    const id = row.children[1].textContent.toLowerCase();
    const name = row.children[2].textContent.toLowerCase();
    const status = row.querySelector(".status").textContent.toLowerCase();

    const matchesSearch = id.includes(term) || name.includes(term);
    const matchesStatus = !selected || status.includes(selected.toLowerCase());

    if (matchesSearch && matchesStatus) {
      row.style.display = "";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  activeCount.textContent = visibleCount;
}

searchInput.addEventListener("input", () => applyFilters(dropdownLabel.textContent));


dropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const selected = item.textContent.trim();
    dropdownLabel.textContent = selected;
    applyFilters(selected === "All" ? "" : selected);
  });
});
