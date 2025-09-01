//************************************************************************************************************ */

// get data from json file

let employeesData = [];
let attendanceData = [];
let tasksData = [];
let payrollsData = [];
let permissionRequestsData = [];
//fetch data
fetch("../data.json")
  .then((response) => response.json())
  .then((data) => {
    employeesData = data.employees;
    attendanceData = data.attendanceRecords;
    tasksData = data.tasks;
    payrollsData = data.monthlyPayrollImpacts;
    permissionRequestsData = data.permissionRequests;

    //render tables
    renderTable(employeesData, attendanceData, tasksData, payrollsData);
    const idealEmps = findIdealEmployees(
      employeesData,
      attendanceData,
      tasksData,
      payrollsData,
      permissionRequestsData,
      "2025-08"
    );
    renderIdealEmployeeCard(idealEmps);

    updateKPIs(employeesData, attendanceData, payrollsData);
    renderTaskOversight(tasksData, employeesData);
    renderPermissionsOversight(permissionRequestsData, employeesData);
    renderPayrollDeductionsSummary(employeesData, payrollsData, "2025-08");
  })
  .catch((error) => console.error("Error loading JSON:", error));

// render employee table
function renderTable(employees, attendance, tasks, payrolls) {
  const tabledata = document.getElementById("tabledata");
  tabledata.innerHTML = "";

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];

    const empAttendance = attendance.find((a) => a.employeeId === emp.id);
    const status = empAttendance ? empAttendance.status.toLowerCase() : "N/A";

    const empTasks = tasks.filter((t) => t.assignees.includes(emp.id));
    const Tasks = empTasks.length;
    const completedTasks = empTasks.filter(
      (t) => t.status === "Completed"
    ).length;

    const payroll = payrolls.find(
      (p) => p.employeeId === emp.id && p.month === "2025-08"
    );
    const payrollImpact = payroll
      ? payroll.latePenalty + payroll.absencePenalty + payroll.taskPenalty
      : 0;

    const netSalary = payroll
      ? emp.monthlySalary -
        (payroll.latePenalty + payroll.absencePenalty + payroll.taskPenalty) +
        (payroll.overtimePay + payroll.bonus)
      : emp.monthlySalary;

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>${emp.id}</td>
    <td>${emp.name}</td>
    <td class="text-center">${emp.department}</td>
    <td class="text-center"><span class="status ${status}">${status}</span></td>
    <td class="text-center">${Tasks}</td>
    <td class="text-center">${completedTasks}</td>
    <td class="text-center">$${emp.monthlySalary}</td>
    <td class="text-center">$${payrollImpact}</td>
    <td class="text-center">$${netSalary}</td>
  `;
    tabledata.appendChild(tr);
  }
}

// cards kpis
function updateKPIs(employees, attendance, payrolls) {
  let presentCount = 0,
    absentCount = 0,
    lateCount = 0,
    totalPayrollImpact = 0;

  employees.forEach((emp) => {
    const empAttendance = attendance.find((a) => a.employeeId === emp.id);
    const status = empAttendance ? empAttendance.status.toLowerCase() : "N/A";

    if (status === "present") presentCount++;
    else if (status === "absent") absentCount++;
    else if (status === "late") lateCount++;

    const payroll = payrolls.find(
      (p) => p.employeeId === emp.id && p.month === "2025-08"
    );
    const payrollImpact = payroll
      ? payroll.latePenalty + payroll.absencePenalty + payroll.taskPenalty
      : 0;

    totalPayrollImpact += payrollImpact;
  });

  //attendence kpi
  document.getElementById("attcard").innerHTML += `
    <p class="card-text">Present: ${presentCount}</p>
    <p class="card-text">Absent: ${absentCount}</p>
    <p class="card-text"Late: ${lateCount}</p>
  `;
  //total employees kpi
  document.getElementById("totalcard").innerHTML += `
    <p class="card-text display-6">${employees.length}</p>
  `;
  //payroll kpi
  document.getElementById("payrollcard").innerHTML += `
    <p class="card-text display-6">$${totalPayrollImpact}</p>
  `;
}
// Export Excel of employee Table
document
  .getElementById("btnExportEmployee")
  .addEventListener("click", function () {
    let table = document
      .getElementById("employee-table")
      .querySelector("table");
    // Convert table to sheet
    let wb = XLSX.utils.table_to_book(table, { sheet: "Employee Report" });
    // save in pc
    XLSX.writeFile(wb, "employee-report.xlsx");
  });


//**************************************************/

//sort table
const sorttable = document.getElementById("sortStatus");
function tableSort() {
  let filteredEmployees = [];
  if (sorttable.value.toLowerCase() === "all") {
    filteredEmployees = employeesData;
  } else {
    filteredEmployees = employeesData.filter((emp) => {
      const empAttendance = attendanceData.find((a) => a.employeeId === emp.id);
      return (
        empAttendance &&
        empAttendance.status.toLowerCase() === sorttable.value.toLowerCase()
      );
    });
  }

  renderTable(filteredEmployees, attendanceData, tasksData, payrollsData);
}

sorttable.addEventListener("change", tableSort);

///////********************************************8 */

//ideal employee
function findIdealEmployees(
  employeesData,
  attendanceData,
  tasksData,
  permissionRequestsData
) {
  let idealEmployees = [];

  for (let i = 0; i < employeesData.length; i++) {
    let emp = employeesData[i];

    // Attendance check
    let empAttendance = [];
    for (let j = 0; j < attendanceData.length; j++) {
      if (attendanceData[j].employeeId === emp.id) {
        empAttendance.push(attendanceData[j]);
      }
    }

    let isLate = false;
    for (let j = 0; j < empAttendance.length; j++) {
      if (empAttendance[j].status.toLowerCase() === "late") {
        isLate = true;
        break;
      }
    }

    // Permissions check
    let empPermissions = [];
    for (let j = 0; j < permissionRequestsData.length; j++) {
      if (
        permissionRequestsData[j].employeeId === emp.id &&
        permissionRequestsData[j].status === "approved" &&
        permissionRequestsData[j].type === "late"
      ) {
        empPermissions.push(permissionRequestsData[j]);
      }
    }

    // Tasks check
    let empTasks = [];
    for (let j = 0; j < tasksData.length; j++) {
      if (tasksData[j].employeeId === emp.id) {
        empTasks.push(tasksData[j]);
      }
    }

    let missedTask = false;
    for (let j = 0; j < empTasks.length; j++) {
      if (empTasks[j].status.toLowerCase() === "missed") {
        missedTask = true;
        break;
      }
    }

    // Strict Criteria
    if (!isLate && empPermissions.length === 0 && !missedTask) {
      idealEmployees.push(emp);
    }
  }

  return idealEmployees;
}

// ----------------- Render Ideal Employee Card -----------------
function renderIdealEmployeeCard(idealEmployees) {
  const container = document.getElementById("idealEmployeeCard");
  container.innerHTML = "";

  if (idealEmployees.length > 0) {
    let finalEmp = idealEmployees[0]; //first ideal employee
    let bonus = Number(finalEmp.monthlySalary) * 0.1;
    container.innerHTML = `
      <div class="card text-center p-3 position-relative ">
      <i class="fa-solid fa-star position-absolute top-0 start-0 m-2 fa-2x" style="color: #FFD43B;"></i>
       <img src="../assets/images/idealpic.jpg" class="rounded-circle idealimg mx-auto d-block" />
        <p><strong>${finalEmp.name}</strong></p>
        <p>Department: ${finalEmp.department}</p>
        <p>Bonus: $${bonus}</p>
       
      </div>
    `;
  } else {
    container.innerHTML = `<div class="alert alert-warning">⚠️ No Ideal Employee this month</div>`;
  }
}

/////////////////******************************************* */

//tasks
function renderTaskOversight(tasksData, employeesData) {
  const container = document.getElementById("hr-tasks");
  const taskscard = document.getElementById("taskkpi");

  let total = tasksData.length;
  let completed = tasksData.filter((t) => t.status === "Completed").length;
  let onTime = tasksData.filter(
    (t) => t.status === "Completed" && !t.late
  ).length;

  taskscard.innerHTML = `
  <i class="fa-solid fa-list-check fa-xl tasksicon"></i>
  <h5 class="card-title">Tasks completed</h5>
  <div class="kpis">
      <p>Total Tasks: ${total}</p>
      <p>Completed: ${completed} (${((completed / total) * 100).toFixed(
    1
  )}%)</p>
      <p>On-time: ${onTime} (${((onTime / total) * 100).toFixed(1)}%)</p>
    </div>
  
  `;

  container.innerHTML = `
    
        ${tasksData
          .map(
            (t) => `
          <tr>
            <td class="text-center" >${t.title}</td>
            <td class="text-center" >
             ${t.assignees
               .map((id) => {
                 let emp = employeesData.find((e) => e.id === id);
                 if (emp) {
                   return emp.name;
                 } else {
                   return "N/A";
                 }
               })
               .join(", ")}
             </td>
            <td class="text-center" >${t.deadline}</td>


            <td class="text-center" ><span class="status ${t.status}">${
              t.status
            }</span></td>

          </tr>
        `
          )
          .join("")}
     
  `;
}

// Export Excel of Tasks Table
document
  .getElementById("btnExportTasks")
  .addEventListener("click", function () {
    let table = document
      .getElementById("tasks-table");
    // Convert table to sheet
    let wb = XLSX.utils.table_to_book(table, { sheet: "Tasks Report" });
    // save in pc
    XLSX.writeFile(wb, "tasks-report.xlsx");
  });

// filtered table
const sortedtask = document.getElementById("sortTask");

function filterTasks() {
  let selected = sortedtask.value.toLowerCase();
  let filteredTasks = [];

  if (selected === "all") {
    filteredTasks = tasksData;
  } else {
    filteredTasks = tasksData.filter(
      (task) => task.status.trim().toLowerCase() === selected
    );
  }

  renderTaskOversight(filteredTasks, employeesData);
}

sortedtask.addEventListener("change", filterTasks);

//////***************************************/

function renderPermissionsOversight(permissionRequestsData, employeesData) {
  const container = document.getElementById("hr-permissions");

  container.innerHTML = `
  <div class="table-responsive">
    <table class="table text-center">
      <thead class="tabletitle">
        <tr class="tablehead">
        <th class="text-center" scope="col" >Employee</th>
        <th class="text-center" scope="col" >Type</th>
        <th class="text-center" scope="col" >Date</th>
        <th class="text-center" scope="col" >Status</th>
        
        </tr>
      </thead>
      <tbody>
        ${permissionRequestsData
          .map(
            (p) => `
          <tr>
            <td class="text-center">${
              employeesData.find((e) => e.id === p.employeeId)?.name || "N/A"
            }</td>
            <td class="text-center">${p.type}</td>
            <td class="text-center">${p.payload.requestedDate}</td>

            <td class="text-center"> <span class="status ${p.status}"> ${
              p.status
            } </span></td>

            
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    </div>
  `;
}
// Export Excel of Permision Table
document
  .getElementById("btnExportPermision")
  .addEventListener("click", function () {
    let table = document
      .getElementById("hr-permissions")
      .querySelector("table");
    // Convert table to sheet
    let wb = XLSX.utils.table_to_book(table, { sheet: "Permissions Report" });
    // save in pc
    XLSX.writeFile(wb, "permissions-report.xlsx");
  });


//filtering
const sortedPermission = document.getElementById("sortPermission");

function filterPermissions() {
  let selected = sortedPermission.value.trim().toLowerCase();
  let filteredPermissions = [];

  if (selected === "all") {
    filteredPermissions = permissionRequestsData;
  } else {
    filteredPermissions = permissionRequestsData.filter(
      (request) => request.status.trim().toLowerCase() === selected
    );
  }

  renderPermissionsOversight(filteredPermissions, employeesData);
}

sortedPermission.addEventListener("change", filterPermissions);

////********************************************** */

//setting panel

// default values
const defaultSettings = {
  // Attendance
  late30: 5,
  late60: 10,
  late120: 20,
  absent: 100,
  // Tasks
  low: 5,
  medium: 8,
  high: 12,
  critical: 20,
  // Overtime
  weekday: 1.25,
  weekend: 1.5,
  overtimePolicy: "Pay",
  // General
  cap: 25,
  bonus: 10,
  workweekStart: "Sunday",
};

// load settings on page load
function loadSettings() {
  let saved = localStorage.getItem("hrSettings");
  let settings = saved ? JSON.parse(saved) : defaultSettings;

  // Attendance
  document.getElementById("late30").value = settings.late30;
  document.getElementById("late60").value = settings.late60;
  document.getElementById("late120").value = settings.late120;
  document.getElementById("absent").value = settings.absent + "%";

  // Tasks
  document.getElementById("low-priority").value = settings.low;
  document.getElementById("medium-priority").value = settings.medium;
  document.getElementById("high-priority").value = settings.high;
  document.getElementById("critical-priority").value = settings.critical;

  // Overtime
  document.getElementById("weekday-multi").value = settings.weekday;
  document.getElementById("weekend-multi").value = settings.weekend;
  document.querySelector("#overtime select").value = settings.overtimePolicy;

  // General
  document.querySelector("#general input[placeholder='25']").value =
    settings.cap;
  document.querySelector("#general input[placeholder='10']").value =
    settings.bonus;
  document.querySelector("#general select").value = settings.workweekStart;
}

// save settings
function saveSettings() {
  const settings = {
    // Attendance
    late30: document.getElementById("late30").value,
    late60: document.getElementById("late60").value,
    late120: document.getElementById("late120").value,

    absent: 100,

    // Tasks
    low: document.getElementById("low-priority").value,
    medium: document.getElementById("medium-priority").value,
    high: document.getElementById("high-priority").value,
    critical: document.getElementById("critical-priority").value,
    // Overtime
    weekday: document.getElementById("weekday-multi").value,
    weekend: document.getElementById("weekend-multi").value,
    overtimePolicy: document.querySelector("#overtime select").value,
    // General
    cap: document.querySelector("#general input[placeholder='25']").value,
    bonus: document.querySelector("#general input[placeholder='10']").value,
    workweekStart: document.querySelector("#general select").value,
  };

  localStorage.setItem("hrSettings", JSON.stringify(settings));
  alert("Settings saved successfully!");
}

// reset defaults
function resetDefaults() {
  localStorage.setItem("hrSettings", JSON.stringify(defaultSettings));
  loadSettings();
  alert(" Settings reset to default!");
}

// attach events
document.querySelectorAll("#saveSettings").forEach((btn) => {
  btn.addEventListener("click", saveSettings);
});
document.querySelectorAll(".btn-secondary").forEach((btn) => {
  btn.addEventListener("click", resetDefaults);
});

// load when page starts
window.onload = loadSettings;
// search by name or id
let searchInput = document.getElementById("search");
searchInput.addEventListener("input", () => {
  let searchTerm = searchInput.value.toLowerCase();
  let filteredEmployees = employeesData.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm) ||
      emp.department.toLowerCase().includes(searchTerm)
  );
  renderTable(filteredEmployees, attendanceData, tasksData, payrollsData);
});

//handle Theme toggle
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;

  // check saved theme or default = light
  let savedTheme = localStorage.getItem("theme") || "light";

  // apply saved theme
  if (savedTheme === "dark") {
    root.classList.add("dark");
    themeToggle.querySelector(".light-icon").classList.add("d-none");
    themeToggle.querySelector(".dark-icon").classList.remove("d-none");
  } else {
    root.classList.remove("dark");
    themeToggle.querySelector(".light-icon").classList.remove("d-none");
    themeToggle.querySelector(".dark-icon").classList.add("d-none");
  }

  // toggle theme on click
  themeToggle.addEventListener("click", () => {
    root.classList.toggle("dark");

    if (root.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      themeToggle.querySelector(".light-icon").classList.add("d-none");
      themeToggle.querySelector(".dark-icon").classList.remove("d-none");
    } else {
      localStorage.setItem("theme", "light");
      themeToggle.querySelector(".light-icon").classList.remove("d-none");
      themeToggle.querySelector(".dark-icon").classList.add("d-none");
    }
  });
});
// display admin name and username
const employeeData = localStorage.getItem("employee");
if (employeeData) {
  const employeeObj = JSON.parse(employeeData);
  const adminName = document.getElementById("admin-name");
  const adminUsername = document.getElementById("admin-username");
  if (adminName) adminName.textContent = employeeObj.name;
  if (adminUsername) adminUsername.textContent = employeeObj.username;
}

// handle logout
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

// handle back to top button
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    backToTop.style.display = "block";
  } else {
    backToTop.style.display = "none";
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
