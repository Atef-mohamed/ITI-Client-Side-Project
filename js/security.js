// =====================
// Dark/Light Mode Toggle
// =====================
const modeIcon = document.getElementById("themeToggle");

modeIcon.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  modeIcon.classList.toggle("fa-sun");
  modeIcon.classList.toggle("fa-moon");
});

// =====================
// Page Initialization
// =====================
document.addEventListener("DOMContentLoaded", () => {
  let today = new Date();
  let formattedDate =
    today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
  document.getElementById("last-seen").innerText = formattedDate;

  let savedData = localStorage.getItem("attendanceData");
  if (savedData) {
    let parsed = JSON.parse(savedData);
    displayTable(
      parsed.employees,
      parsed.attendanceRecords,
      parsed.permissions
    );
    addBulkAction();
    addSubmitAction(parsed);
    applyFilters("");
  } else {
    fetch("../data.json")
      .then((response) => response.json())
      .then((data) => {
        displayTable(
          data.employees,
          data.attendanceRecords,
          data.permissionRequests
        );
        addBulkAction();
        addSubmitAction(data);
        applyFilters("");
      })
      .catch((err) => console.error("Error loading JSON:", err));
  }
});

// =====================
// Display Attendance Table
// =====================
function displayTable(employees, attendanceRecords, permissions = []) {
  let tbody = document.querySelector(".mytable tbody");
  tbody.innerHTML = "";

  let today = new Date().toISOString().split("T")[0];

  employees.forEach((emp) => {
    let record = attendanceRecords.find(
      (r) => r.employeeId === emp.id && r.date === today
    );

    let row = document.createElement("tr");
    row.dataset.leave = record?.isLeave;
    row.dataset.wfh = record?.isWFH;

    let checkoutValue = record?.checkOut || "";

    if (
      record?.isLeave &&
      !record?.notes?.toLowerCase().includes("absent") &&
      !record.checkOut
    ) {
      checkoutValue = "17:00";
    }

    row.innerHTML = `
      <td><input type="checkbox" class="row-select"/></td>
      <td>${emp.id}</td>
      <td>${emp.name}</td>
      <td>${emp.department}</td>
      <td><span class="status badge bg-secondary"></span></td>
      <td><input type="time" class="checkin text-center ps-4" value="${
        record?.checkIn || ""
      }" disabled></td>
      <td><input type="time" class="checkout text-center ps-4" value="${checkoutValue}" disabled></td>
      <td>${record?.notes || ""}</td>
    `;
    tbody.appendChild(row);

    // =====================
    // Update status logic
    // =====================
    row.updateStatus = function () {
      let statusCell = row.querySelector(".status");
      let checkInInput = row.querySelector(".checkin");
      let onLeave = row.dataset.leave === "true";
      let wfh = row.dataset.wfh === "true";
      let time = checkInInput.value;
      let notesCell = row.children[7];

      // 🔎 check if there's an approved permission
      let approvedPermission = (permissions || []).find(
        (p) =>
          p.employeeId === emp.id &&
          p.payload?.requestedDate === today &&
          p.status === "Approved"
      );

      if (approvedPermission) {
        let reason = approvedPermission.payload?.reason || "";
        notesCell.textContent = reason;

        switch (approvedPermission.type) {
          case "Leave":
            statusCell.textContent = "Leave";
            statusCell.className = "status leave";
            return;
          case "WFH":
            statusCell.textContent = "Present (WFH)";
            statusCell.className = "status present";
            return;
          case "Late":
            statusCell.textContent = "Present (Approved Late)";
            statusCell.className = "status present";
            return;
          case "Overtime":
            statusCell.textContent = "Present (Overtime)";
            statusCell.className = "status present";
            return;
          default:
            statusCell.textContent = "Approved Permission";
            statusCell.className = "status present";
        }
      } else {
        let notes = notesCell.textContent.trim().toLowerCase();

        if (wfh) {
          statusCell.textContent = "Present (WFH)";
          statusCell.className = "status present";
        } else if (onLeave && notes && !notes.includes("absent")) {
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
      }
    };

    row.updateStatus();

    // Enable/disable time inputs with checkbox
    let checkbox = row.querySelector(".row-select");
    checkbox.addEventListener("change", () => {
      let checkinInput = row.querySelector(".checkin");
      let checkoutInput = row.querySelector(".checkout");
      checkinInput.disabled = !checkbox.checked;
      checkoutInput.disabled = !checkbox.checked;
    });
  });
}

// =====================
// Submit Button Action
// =====================
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
        let notes = row.children[7].textContent;

        let record = dataObj.attendanceRecords.find(
          (r) => r.employeeId === empId
        );
        if (record) {
          record.checkIn = checkIn;
          record.checkOut = checkOut;
          record.status = status;
          record.notes = notes;
        }
        checkbox.checked = false;
        row.querySelector(".checkin").disabled = true;
        row.querySelector(".checkout").disabled = true;
      }
    });

    localStorage.setItem("attendanceData", JSON.stringify(dataObj));
    alert("Saved in LocalStorage ✅");
  });
}

// =====================
// Bulk Action (Select All)
// =====================
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

// =====================
// Filters & Search
// =====================
let searchInput = document.getElementById("search");
let dropdownItems = document.querySelectorAll(".dropdown-menu .dropdown-item");
let dropdownLabel = document.querySelector(".filter-dropdown .fw-bold");
let activeCount = document.getElementById("activeCount");

let nameOfSecurity = document.querySelector("#security-name");
let userOfSecurity = document.querySelector("#security-user");
nameOfSecurity.textContent = JSON.parse(localStorage.getItem("employee")).name;
userOfSecurity.textContent = JSON.parse(
  localStorage.getItem("employee")
).username;

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

searchInput.addEventListener("input", () =>
  applyFilters(dropdownLabel.textContent)
);

dropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const selected = item.textContent.trim();
    dropdownLabel.textContent = selected;
    applyFilters(selected === "All" ? "" : selected);
  });
});

// =====================
// Navbar Search
// =====================
const navbarSearch = document.getElementById("search");

if (navbarSearch) {
  navbarSearch.addEventListener("input", () => {
    const term = navbarSearch.value.toLowerCase();
    let visibleCount = 0;

    document.querySelectorAll(".mytable tbody tr").forEach((row) => {
      const id = row.children[1].textContent.toLowerCase();
      const name = row.children[2].textContent.toLowerCase();

      if (id.includes(term) || name.includes(term)) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    activeCount.textContent = visibleCount;
  });
}

// Logout Handler
let logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", () => {
  const isLoggedIn = localStorage.getItem("employee");

  if (!isLoggedIn) {
    swal({
      title: "No active session!",
      text: "You're not logged in to logout.",
      icon: "error",
      buttons: false,
      timer: 2000,
    });
    return;
  }

  swal({
    title: "Are you sure?",
    text: "Once you logout, you will need to login again to access this page.",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((willLogout) => {
    if (willLogout) {
      localStorage.removeItem("employee");

      swal({
        title: "Logged out!",
        text: "You have successfully logged out.",
        icon: "success",
        timer: 1500,
        buttons: false,
      }).then(() => {
        window.location.replace("login.html");
      });
    } else {
      swal({
        title: "Cancelled",
        text: "You're still logged in!",
        icon: "info",
        buttons: false,
        timer: 2000,
      });
    }
  });
});
