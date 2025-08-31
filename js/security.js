document.addEventListener("DOMContentLoaded", () => {
  // ===== Dark/Light Mode Toggle =====
  const modeToggle = document.querySelector("#themeToggle");
  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode"); 
    modeToggle.classList.toggle("fa-sun");       
    modeToggle.classList.toggle("fa-moon");      
  });

  // ===== DOM Elements =====
  const logoutBtn = document.getElementById("logout");
  const searchInput = document.getElementById("search");
  const dropdownItems = document.querySelectorAll(".dropdown-menu .dropdown-item");
  const dropdownLabel = document.querySelector(".filter-dropdown .fw-bold");
  const activeCount = document.getElementById("activeCount");

  // ===== Current Date =====
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  document.getElementById("last-seen").textContent = formattedDate;

  // ===== Load Attendance Data =====
  const loadData = (data) => {
    displayTableWithDate(data.employees, data.attendanceRecords, formattedDate);
    addBulkAction();
    addSubmitAction(data);
    applyFilters("");
  };

  const savedData = localStorage.getItem("attendanceData");
  if (savedData) {
    loadData(JSON.parse(savedData));
  } else {
    fetch("../data.json")
      .then(res => res.json())
      .then(loadData)
      .catch(err => console.error("Error loading JSON:", err));
  }

  // ===== Security Info =====
  const emp = JSON.parse(localStorage.getItem("employee") || "{}");
  document.querySelector("#security-name").textContent = emp.name || "Security";
  document.querySelector("#security-user").textContent = emp.username || "username";

  // ===== Search & Filter Events =====
  searchInput.addEventListener("input", () => applyFilters(dropdownLabel.textContent));
  dropdownItems.forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      const selected = item.textContent.trim();
      dropdownLabel.textContent = selected;
      applyFilters(selected === "All" ? "" : selected);
    });
  });

  // ===== Logout with SweetAlert =====
  logoutBtn.addEventListener("click", () => {
    const isLoggedIn = localStorage.getItem("employee");
    if (!isLoggedIn) {
      swal({title: "No active session!", text: "You're not logged in to logout.", icon: "error", buttons: false, timer: 2000});
      return;
    }
    swal({
      title: "Are you sure?",
      text: "Once you logout, you will need to login again.",
      icon: "warning",
      buttons: true,
      dangerMode: true
    }).then(willLogout => {
      if (willLogout) {
        localStorage.removeItem("employee");
        swal({title: "Logged out!", text: "You have successfully logged out.", icon: "success", buttons: false, timer: 1500})
        .then(() => window.location.replace("login.html"));
      } else {
        swal({title: "Cancelled", text: "You're still logged in!", icon: "info", buttons: false, timer: 2000});
      }
    });
  });

  // ===== Display Table =====
  function displayTableWithDate(employees, attendanceRecords, date) {
    const tbody = document.querySelector(".mytable tbody");
    tbody.innerHTML = "";
    const todayObj = new Date(date);

    employees.forEach(emp => {
      let record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === date);
      if (!record) record = { checkIn: "", checkOut: "", status: "Absent", isWFH: false, isLeave: false, notes: "" };

      const row = document.createElement("tr");
      row.dataset.leave = record.isLeave;
      row.dataset.wfh = record.isWFH;

      row.innerHTML = `
        <td><input type="checkbox" class="row-select"></td>
        <td>${emp.id}</td>
        <td>${emp.name}</td>
        <td>${emp.department}</td>
        <td><span class="status"></span></td>
        <td><input type="time" class="checkin ps-4" value="${record.checkIn}" disabled></td>
        <td><input type="time" class="checkout ps-4" value="${record.checkOut}" disabled></td>
        <td>${record.notes}</td>
      `;
      tbody.appendChild(row);

      row.updateStatus = () => {
        const statusCell = row.querySelector(".status");
        const time = row.querySelector(".checkin").value;

        if (record.isLeave) {
          statusCell.textContent = "Leave"; statusCell.className = "status leave";
        } else if (record.isWFH) {
          statusCell.textContent = "WFH"; statusCell.className = "status wfh";
        } else if (!time) {
          statusCell.textContent = "Absent"; statusCell.className = "status absent";
        } else if (time > "09:00") {
          statusCell.textContent = "Late"; statusCell.className = "status late";
        } else {
          statusCell.textContent = "Present"; statusCell.className = "status present";
        }
      };
      row.updateStatus();

      row.querySelector(".row-select").addEventListener("change", e => {
        row.querySelector(".checkin").disabled = !e.target.checked;
        row.querySelector(".checkout").disabled = !e.target.checked;
      });
    });
  }

  // ===== Submit Action =====
  function addSubmitAction(dataObj) {
    const submitBtn = document.getElementById("submit-btn");
    const tbody = document.querySelector(".mytable tbody");

    submitBtn.addEventListener("click", () => {
      tbody.querySelectorAll("tr").forEach(row => {
        const checkbox = row.querySelector(".row-select");
        if (checkbox.checked) {
          row.updateStatus();
          const empId = parseInt(row.children[1].textContent);
          const checkIn = row.querySelector(".checkin").value;
          const checkOut = row.querySelector(".checkout").value;
          const status = row.querySelector(".status").textContent;

          let record = dataObj.attendanceRecords.find(r => r.employeeId === empId && r.date === formattedDate);
          if (record) {
            record.checkIn = checkIn;
            record.checkOut = checkOut;
            record.status = status;
          } else {
            dataObj.attendanceRecords.push({ employeeId: empId, date: formattedDate, checkIn, checkOut, status, isWFH: false, isLeave: false, notes: "" });
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

  // ===== Select All Checkbox =====
  function addBulkAction() {
    const selectAll = document.getElementById("select-all");
    const tbody = document.querySelector(".mytable tbody");
    selectAll.addEventListener("change", () => {
      tbody.querySelectorAll(".row-select").forEach(cb => {
        cb.checked = selectAll.checked;
        const row = cb.closest("tr");
        row.querySelector(".checkin").disabled = !cb.checked;
        row.querySelector(".checkout").disabled = !cb.checked;
      });
    });
  }

  // ===== Filter Table =====
  function applyFilters(selected = "") {
    const term = searchInput.value.toLowerCase();
    let visibleCount = 0;
    document.querySelectorAll(".mytable tbody tr").forEach(row => {
      const id = row.children[1].textContent.toLowerCase();
      const name = row.children[2].textContent.toLowerCase();
      const status = row.querySelector(".status").textContent.toLowerCase();
      const matches = (id.includes(term) || name.includes(term)) && (!selected || status.includes(selected.toLowerCase()));
      row.style.display = matches ? "" : "none";
      if (matches) visibleCount++;
    });
    activeCount.textContent = visibleCount;
  }
});
