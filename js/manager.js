
let db = {
    employees: [],
    attendance: [],
    requests: [],
    tasks: [],
    payroll: []
};

function saveToStorage() {
    localStorage.setItem("employees", JSON.stringify(db.employees));
    localStorage.setItem("attendance", JSON.stringify(db.attendance));
    localStorage.setItem("requests", JSON.stringify(db.requests));
    localStorage.setItem("tasks", JSON.stringify(db.tasks));
    localStorage.setItem("payroll", JSON.stringify(db.payroll));
}

function loadFromStorage() {
    if (localStorage.getItem("employees")) db.employees = JSON.parse(localStorage.getItem("employees"));
    if (localStorage.getItem("attendance")) db.attendance = JSON.parse(localStorage.getItem("attendance"));
    if (localStorage.getItem("requests")) db.requests = JSON.parse(localStorage.getItem("requests"));
    if (localStorage.getItem("tasks")) db.tasks = JSON.parse(localStorage.getItem("tasks"));
    if (localStorage.getItem("payroll")) db.payroll = JSON.parse(localStorage.getItem("payroll"));
}

function initData() {
    if (localStorage.getItem("employees")) {
        loadFromStorage();
        renderAll();
        return;
    }
    fetch("../data.json")
        .then(function (res) { return res.json(); })
        .then(function (data) {
            db.employees = data.employees || [];
            db.attendance = data.attendanceRecords || [];
            db.requests = data.permissionRequests || [];
            db.tasks = data.tasks || [];
            db.payroll = data.monthlyPayrollImpacts || [];
            saveToStorage();
            renderAll();
        })
        .catch(function (err) { console.error("Error loading data.json:", err); });
}

function empName(id) {
    for (var i = 0; i < db.employees.length; i++) {
        if (db.employees[i].id === id) return db.employees[i].name;
    }
    return id;
}

function setActivePage(key) {
    var navs = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navs.length; i++) {
        navs[i].classList.remove('active');
        navs[i].style.color = '';
    }
    var activeLink = document.querySelector('.nav-link[data-page="' + key + '"]');
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.style.color = 'var(--bs-primary)';
    }
    var pages = ['approvals', 'attendance', 'tasks', 'reports'];
    for (var j = 0; j < pages.length; j++) {
        var page = document.getElementById('page-' + pages[j]);
        if (page) page.classList.add('d-none');
    }
    var showPage = document.getElementById('page-' + key);
    if (showPage) showPage.classList.remove('d-none');
    if (key === 'approvals') renderApprovals();
    if (key === 'attendance') renderAttendance();
    if (key === 'tasks') renderTasks();
    if (key === 'reports') renderReports();
}

//belongs to renderApprovals
function typeBadge(type) {
    var map = {
        Late: '#FF401C',
        Leave: '#254787',
        WFH: '#084298',
        Overtime: '#0f5132',
        Absence: '#CF7C1C',
        DeadlineExtension: '#41464b',
        'Extend Task': '#212529'
    };
    var color = map[type] || '#41464b';
    return '<span class="badge" style="background:#E8EBF1;color:' + color + ';">' + type + '</span>';
}

//belongs to renderApprovals
function statusBadge(s) {
    var map = { Pending: 'warning', Approved: 'success', Rejected: 'danger' };
    var cls = map[s] || 'secondary';
    return '<span class="badge bg-' + cls + '">' + s + '</span>';
}

//belongs to renderApprovals
function detailForRequest(r) {
    if (r.type === 'Late') return 'Late ~' + (r.payload && r.payload.minutesExpectedLate ? r.payload.minutesExpectedLate : '') + ' min · ' + (r.payload && r.payload.reason ? r.payload.reason : '');
    if (r.type === 'Leave') return 'Leave · ' + (r.payload && r.payload.reason ? r.payload.reason : '');
    if (r.type === 'WFH') return 'WFH · ' + (r.payload && r.payload.reason ? r.payload.reason : '');
    if (r.type === 'Overtime') return 'OT ' + (r.payload && r.payload.hours ? r.payload.hours : 0) + 'h · ' + (r.payload && r.payload.reason ? r.payload.reason : '');
    if (r.type === 'DeadlineExtension') return 'Extra ' + (r.payload && r.payload.extraDays ? r.payload.extraDays : 0) + ' days · ' + (r.payload && r.payload.reason ? r.payload.reason : '');
    if (r.type === 'Extend Task') return 'Extension · ' + (r.payload && r.payload.reason ? r.payload.reason : '');
    return '';
}

// function renderApprovals() {
//     var tbody = document.querySelector('#requestsTable tbody');
//     if (!tbody) return;
//     tbody.innerHTML = '';
//     var q = '';
//     var searchEl = document.getElementById('searchRequests');
//     if (searchEl && searchEl.value) q = searchEl.value.toLowerCase();

//     var rows = [];
//     for (var i = 0; i < db.requests.length; i++) {
//         var r = db.requests[i];
//         if (window.approvalsFilter && window.approvalsFilter !== 'All' && r.type !== window.approvalsFilter) continue;
//         var str = empName(r.employeeId) + ' ';
//         if (r.payload && r.payload.reason) str += r.payload.reason;
//         if (str.toLowerCase().indexOf(q) === -1) continue;
//         rows.push(r);
//     }
//     rows.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

//     for (var j = 0; j < rows.length; j++) {
//         var r2 = rows[j];
//         var tr = document.createElement('tr');
//         tr.innerHTML =
//             '<td><input type="checkbox" class="rowChk" data-id="' + r2.id + '" /></td>' +
//             '<td>' + (j + 1) + '</td>' +
//             '<td>' + empName(r2.employeeId) + '</td>' +
//             '<td>' + typeBadge(r2.type) + '</td>' +
//             '<td>' + (r2.payload && r2.payload.requestedDate ? r2.payload.requestedDate : '-') + '</td>' +
//             '<td class="small text-secondary">' + detailForRequest(r2) + '</td>' +
//             '<td class="text-center">' + statusBadge(r2.status) + '</td>' +
//             '<td>' +
//             '<button class="btn btn-success btn-sm me-1"' + (r2.status !== 'Pending' ? ' disabled' : '') + ' data-action="approve" data-id="' + r2.id + '"><i class="bi bi-check2"></i></button>' +
//             '<button class="btn btn-danger btn-sm"' + (r2.status !== 'Pending' ? ' disabled' : '') + ' data-action="reject" data-id="' + r2.id + '"><i class="bi bi-x"></i></button>' +
//             '</td>';
//         tbody.appendChild(tr);
//     }
//     var selAll = document.getElementById('selectAllRequests');
//     if (selAll) selAll.checked = false;
// }
window.approvalsPage = 1;
window.approvalsPageSize = 5;

function renderApprovals() {
    var tbody = document.querySelector('#requestsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var q = '';
    var searchEl = document.getElementById('searchRequests');
    if (searchEl && searchEl.value) q = searchEl.value.toLowerCase();

    var rows = [];
    for (var i = 0; i < db.requests.length; i++) {
        var r = db.requests[i];
        if (window.approvalsFilter && window.approvalsFilter !== 'All' && r.type !== window.approvalsFilter) continue;
        var str = empName(r.employeeId) + ' ';
        if (r.payload && r.payload.reason) str += r.payload.reason;
        if (str.toLowerCase().indexOf(q) === -1) continue;
        rows.push(r);
    }
    rows.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    // Pagination logic
    var page = window.approvalsPage || 1;
    var pageSize = window.approvalsPageSize || 10;
    var totalRows = rows.length;
    var totalPages = Math.ceil(totalRows / pageSize);
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    window.approvalsPage = page;

    var startIdx = (page - 1) * pageSize;
    var endIdx = Math.min(startIdx + pageSize, totalRows);
    var pagedRows = rows.slice(startIdx, endIdx);

    for (var j = 0; j < pagedRows.length; j++) {
        var r2 = pagedRows[j];
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><input type="checkbox" class="rowChk" data-id="' + r2.id + '" /></td>' +
            '<td>' + (startIdx + j + 1) + '</td>' +
            '<td>' + empName(r2.employeeId) + '</td>' +
            '<td>' + typeBadge(r2.type) + '</td>' +
            '<td>' + (r2.payload && r2.payload.requestedDate ? r2.payload.requestedDate : '-') + '</td>' +
            '<td class="small text-secondary style="max-width: 100px; overflow-y: auto;" class="text-center">' + detailForRequest(r2) + '</td>' +
            '<td  ">' + statusBadge(r2.status) + '</td>' +
            '<td>' +
            '<button class="btn btn-success btn-sm me-1"' + (r2.status !== 'Pending' ? ' disabled' : '') + ' data-action="approve" data-id="' + r2.id + '"><i class="bi bi-check2"></i></button>' +
            '<button class="btn btn-danger btn-sm"' + (r2.status !== 'Pending' ? ' disabled' : '') + ' data-action="reject" data-id="' + r2.id + '"><i class="bi bi-x"></i></button>' +
            '</td>';
        tbody.appendChild(tr);
    }
    var selAll = document.getElementById('selectAllRequests');
    if (selAll) selAll.checked = false;

    renderApprovalsPagination(totalPages, page);
}


function renderApprovalsPagination(totalPages, currentPage) {
    var container = document.getElementById('approvalsPagination');
    if (!container) {
       
        var table = document.getElementById('requestsTable');
        if (!table) return;
        container = document.createElement('nav');
        container.id = 'approvalsPagination';
        container.className = 'mt-3';
        table.parentNode.appendChild(container);
    }
    container.innerHTML = '';

    if (totalPages <= 1) return;

    var ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Previous button
    var prevLi = document.createElement('li');
    prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
    var prevBtn = document.createElement('button');
    prevBtn.className = 'page-link';
    prevBtn.innerHTML = '&laquo;';
    prevBtn.onclick = function () {
        if (window.approvalsPage > 1) {
            window.approvalsPage--;
            renderApprovals();
        }
    };
    prevLi.appendChild(prevBtn);
    ul.appendChild(prevLi);

    // Page numbers (show max 5 pages)
    var start = Math.max(1, currentPage - 2);
    var end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (var i = start; i <= end; i++) {
        var li = document.createElement('li');
        li.className = 'page-item' + (i === currentPage ? ' active' : '');
        var btn = document.createElement('button');
        btn.className = 'page-link';
        btn.textContent = i;
        (function (pageNum) {
            btn.onclick = function () {
                window.approvalsPage = pageNum;
                renderApprovals();
            };
        })(i);
        li.appendChild(btn);
        ul.appendChild(li);
    }

    
    var nextLi = document.createElement('li');
    nextLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
    var nextBtn = document.createElement('button');
    nextBtn.className = 'page-link';
    nextBtn.innerHTML = '&raquo;';
    nextBtn.onclick = function () {
        if (window.approvalsPage < totalPages) {
            window.approvalsPage++;
            renderApprovals();
        }
    };
    nextLi.appendChild(nextBtn);
    ul.appendChild(nextLi);

    container.appendChild(ul);
}
function renderAttendance() {
    var fromEl = document.getElementById('attFrom');
    var toEl = document.getElementById('attTo');
    var from = fromEl && fromEl.value ? fromEl.value : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    var to = toEl && toEl.value ? toEl.value : new Date().toISOString().slice(0, 10);
    if (fromEl) fromEl.value = from;
    if (toEl) toEl.value = to;

    var tbody = document.querySelector('#attendanceTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var rows = [];
    for (var i = 0; i < db.attendance.length; i++) {
        var a = db.attendance[i];
        if (a.date >= from && a.date <= to) rows.push(a);
    }
    rows.sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    var late = 0, absent = 0, wfh = 0, leave = 0;
    for (var j = 0; j < rows.length; j++) {
        var r = rows[j];
        if (r.status === 'Late') late++;
        if (r.status === 'Absent') absent++;
        if (r.isWFH) wfh++;
        if (r.isLeave) leave++;
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + r.date + '</td><td>' + empName(r.employeeId) + '</td><td>' + (r.checkIn || '--') + '</td><td>' + (r.checkOut || '--') + '</td><td>' + r.status + '</td><td>' + r.minutesLate + '</td><td>' + (r.isWFH ? 'Yes' : 'No') + '</td><td>' + (r.isLeave ? 'Yes' : 'No') + '</td>';
        tbody.appendChild(tr);
    }
    var lateCount = document.getElementById('lateCount');
    var absentCount = document.getElementById('absentCount');
    var wfhCount = document.getElementById('wfhCount');
    var leaveCount = document.getElementById('leaveCount');
    if (lateCount) lateCount.innerText = late;
    if (absentCount) absentCount.innerText = absent;
    if (wfhCount) wfhCount.innerText = wfh;
    if (leaveCount) leaveCount.innerText = leave;


    renderHeatmap()
}

function renderTasks() {
    var statuses = ["Pending", "Ongoing", "Missed", "Completed"];
    for (var i = 0; i < statuses.length; i++) {
        var col = document.getElementById("col-" + statuses[i]);
        if (col) col.innerHTML = '';
    }
    var tasks = db.tasks.slice();
    tasks.sort(function (a, b) { return new Date(a.deadline) - new Date(b.deadline); });

    var now = Date.now();
    var overdue = [];
    for (var j = 0; j < tasks.length; j++) {
        var t = tasks[j];
        var isOverdue = new Date(t.deadline).getTime() < now && t.status !== "Completed" && !t.extensionApproved;
        if (isOverdue) overdue.push(t);

        var card = document.createElement("div");
        card.className = "task-card priority-" + t.priority;
        card.innerHTML =
            '<div class="d-flex justify-content-between align-items-start">' +
            '<div>' +
            '<div class="title">' + t.title + '</div>' +
            '<div class="small text-secondary">' + t.priority + ' · Due ' + new Date(t.deadline).toLocaleString() + '</div>' +
            '<div class="small">Assignees: ' + t.assignees.map(empName).join(", ") + '</div>' +
            '</div>' +
            '<div class="btn-group btn-group-sm">' +
            (t.status !== "Completed" ? '<button class="btn btn-outline-success" data-act="advance" data-id="' + t.taskId + '"><i class="bi bi-arrow-right-circle"></i></button>' : '') +
            '<button class="btn btn-outline-info" data-act="edit" data-id="' + t.taskId + '"><i class="bi bi-pencil"></i></button>' +
            '</div>' +
            '</div>';
        var col2 = document.getElementById("col-" + t.status);
        if (col2) col2.appendChild(card);
    }
}

function advanceTask(id) {
    var t = null;
    for (var i = 0; i < db.tasks.length; i++) {
        if (db.tasks[i].taskId == id) t = db.tasks[i];
    }
    if (!t) return;
    var statusOrder = ["Pending", "Ongoing", "Completed"];
    var idx = -1;
    for (var j = 0; j < statusOrder.length; j++) {
        if (statusOrder[j] === t.status) idx = j;
    }
    if (idx !== -1 && idx < statusOrder.length - 1) {
        t.status = statusOrder[idx + 1];
        t.updatedAt = new Date().toISOString();
        saveToStorage();
        renderTasks();
    }
}

function openTaskModal(task) {
    var idEl = document.getElementById('taskId');
    var titleEl = document.getElementById('taskTitle');
    var prioEl = document.getElementById('taskPriority');
    var descEl = document.getElementById('taskDesc');
    var deadlineEl = document.getElementById('taskDeadline');
    var sel = document.getElementById('taskAssignees');
    if (idEl) idEl.value = task && task.taskId ? task.taskId : '';
    if (titleEl) titleEl.value = task && task.title ? task.title : '';
    if (prioEl) prioEl.value = task && task.priority ? task.priority : 'Low';
    if (descEl) descEl.value = task && task.description ? task.description : '';
    if (deadlineEl) deadlineEl.value = task && task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '';
    if (sel && task && task.assignees) {
        for (var i = 0; i < sel.options.length; i++) {
            sel.options[i].selected = false;
            for (var j = 0; j < task.assignees.length; j++) {
                if (parseInt(sel.options[i].value, 10) === task.assignees[j]) sel.options[i].selected = true;
            }
        }
    }
    new bootstrap.Modal(document.getElementById('taskModal')).show();
}

function saveTaskFromModal() {
    var idInput = document.getElementById("taskId").value;
    var nextId = 1;
    for (var i = 0; i < db.tasks.length; i++) {
        var tid = parseInt(db.tasks[i].taskId, 10);
        if (tid >= nextId) nextId = tid + 1;
    }
    var id = idInput ? parseInt(idInput, 10) : nextId;
    var existing = null;
    for (var j = 0; j < db.tasks.length; j++) {
        if (db.tasks[j].taskId == id) existing = db.tasks[j];
    }
    var sel = document.getElementById("taskAssignees");
    var assignees = [];
    if (sel) {
        for (var k = 0; k < sel.selectedOptions.length; k++) {
            assignees.push(parseInt(sel.selectedOptions[k].value, 10));
        }
    }
    var t = {
        taskId: id,
        title: document.getElementById("taskTitle").value.trim(),
        description: document.getElementById("taskDesc").value.trim(),
        priority: document.getElementById("taskPriority").value,
        deadline: new Date(document.getElementById("taskDeadline").value).toISOString(),
        assignees: assignees,
        status: existing && existing.status ? existing.status : "Pending",
        attachments: existing && existing.attachments ? existing.attachments : [],
        comments: existing && existing.comments ? existing.comments : [],
        createdBy: existing && existing.createdBy ? existing.createdBy : "manager",
        createdAt: existing && existing.createdAt ? existing.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dependencyTaskIds: existing && existing.dependencyTaskIds ? existing.dependencyTaskIds : []
    };
    if (existing) {
        for (var key in t) existing[key] = t[key];
    } else {
        db.tasks.push(t);
    }
    saveToStorage();
    bootstrap.Modal.getInstance(document.getElementById("taskModal")).hide();
    renderTasks();
}

function TaskAssignees() {
    var sel = document.getElementById('taskAssignees');
    if (!sel) return;
    sel.innerHTML = '';
    for (var i = 0; i < db.employees.length; i++) {
        var e = db.employees[i];
        var opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.name;
        sel.appendChild(opt);
    }
}
function renderReports() {

    var tasks = db.tasks;
    var employees = db.employees;

    // Attendance KPIs for the current month
    var month = new Date().toISOString().slice(0, 7);
    var att = [];
    for (var i = 0; i < db.attendance.length; i++) {
        if (db.attendance[i].date && db.attendance[i].date.indexOf(month) === 0) {
            att.push(db.attendance[i]);
        }
    }
    var late = 0, absent = 0, wfh = 0, leave = 0;
    for (var j = 0; j < att.length; j++) {
        if (att[j].status === 'Late') late++;
        if (att[j].status === 'Absent') absent++;
        if (att[j].isWFH) wfh++;
        if (att[j].isLeave) leave++;
    }
    var kpiLate = document.getElementById('kpiLate');
    var kpiAbsent = document.getElementById('kpiAbsent');
    var kpiWfh = document.getElementById('kpiWFH');
    var kpiLeave = document.getElementById('kpiLeave');
    if (kpiLate) kpiLate.innerText = late;
    if (kpiAbsent) kpiAbsent.innerText = absent;
    if (kpiWfh) kpiWfh.innerText = wfh;
    if (kpiLeave) kpiLeave.innerText = leave;

    // Overtime KPI
    var ot = [];
    for (var k = 0; k < db.requests.length; k++) {
        if (db.requests[k].type === 'Overtime' && db.requests[k].status === 'Approved') {
            ot.push(db.requests[k]);
        }
    }
    var otHours = 0;
    for (var m = 0; m < ot.length; m++) {
        otHours += ot[m].payload && ot[m].payload.hours ? ot[m].payload.hours : 0;
    }
    var kpiOT = document.getElementById('kpiOT');
    if (kpiOT) kpiOT.innerText = otHours;

    // On-time completion KPI
    var comp = [];
    for (var n = 0; n < tasks.length; n++) {
        if (tasks[n].status === 'Completed') comp.push(tasks[n]);
    }
    var ontime = 0;
    for (var p = 0; p < comp.length; p++) {
        var deadline = new Date(comp[p].deadline);
        var updated = new Date(comp[p].updatedAt);
        if (deadline >= updated) ontime++;
    }
    var ontimePct = comp.length > 0 ? Math.round((ontime / comp.length) * 100) : 0;
    var kpiOnTime = document.getElementById('kpiOnTime');
    if (kpiOnTime) kpiOnTime.innerText = ontimePct + '%';

    // Per-employee task report
    var tbody = document.querySelector('#reportTasksTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        for (var q = 0; q < employees.length; q++) {
            var e = employees[q];
            var mine = [];
            for (var r = 0; r < tasks.length; r++) {
                if (tasks[r].assignees && tasks[r].assignees.indexOf(e.id) !== -1) {
                    mine.push(tasks[r]);
                }
            }
            var mComp = [];
            var mOver = [];
            var mOn = 0;
            for (var s = 0; s < mine.length; s++) {
                if (mine[s].status === 'Completed') {
                    mComp.push(mine[s]);
                    var deadline2 = new Date(mine[s].deadline);
                    var updated2 = new Date(mine[s].updatedAt);
                    if (deadline2 >= updated2) mOn++;
                }
                if (new Date(mine[s].deadline) < new Date() && mine[s].status !== 'Completed' && !mine[s].extensionApproved) {
                    mOver.push(mine[s]);
                }
            }
            var pct = mComp.length > 0 ? Math.round((mOn / mComp.length) * 100) : 0;
            var tr = document.createElement('tr');
            tr.innerHTML = '<td>' + e.name + '</td><td>' + mComp.length + '</td><td>' + mOver.length + '</td><td>' + pct + '%</td>';
            tbody.appendChild(tr);
        }
    }
}

function renderHeatmap() {
    var cont = document.getElementById('heatmap');
    if (!cont) return;
    cont.innerHTML = '';
    // Show last 42 attendance records (6 weeks)
    var records = db.attendance.slice(-42);
    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        var div = document.createElement('div');
        div.title = r.date + ' · ' + empName(r.employeeId) + ' · ' + r.status;
        var cls = 'heatmap-cell ';
        if (r.isWFH) cls += 'wfh';
        else if (r.isLeave) cls += 'leave';
        else if (r.status === 'Present') cls += 'present';
        else if (r.status === 'Late') cls += 'late';
        else if (r.status === 'Absent') cls += 'absent';
        div.className = cls;
        cont.appendChild(div);
    }
}

// Approve a single request
function approveRequest(id) {
    for (var i = 0; i < db.requests.length; i++) {
        if (db.requests[i].id == id && db.requests[i].status === 'Pending') {
            db.requests[i].status = 'Approved';
            db.requests[i].managerComment = '';
            db.requests[i].decidedAt = new Date().toISOString();
        }
    }
    saveToStorage();
    renderApprovals();
    toast('Approved');
}

// Reject a single or multiple requests
function rejectRequests(ids, comment) {
    for (var i = 0; i < ids.length; i++) {
        for (var j = 0; j < db.requests.length; j++) {
            if (db.requests[j].id == ids[i] && db.requests[j].status === 'Pending') {
                db.requests[j].status = 'Rejected';
                db.requests[j].managerComment = comment;
                db.requests[j].decidedAt = new Date().toISOString();
            }
        }
    }
    saveToStorage();
    renderApprovals();
    toast('Rejected');
}

// Bulk Approve
function bulkApprove() {
    var selected = [];
    var chks = document.querySelectorAll('.rowChk:checked');
    for (var i = 0; i < chks.length; i++) selected.push(chks[i].dataset.id);
    if (selected.length === 0) {
        alert('Please select at least one request.');
        return;
    }
    for (var j = 0; j < selected.length; j++) {
        for (var k = 0; k < db.requests.length; k++) {
            if (db.requests[k].id == selected[j] && db.requests[k].status === 'Pending') {
                db.requests[k].status = 'Approved';
                db.requests[k].managerComment = '';
                db.requests[k].decidedAt = new Date().toISOString();
            }
        }
    }
    saveToStorage();
    renderApprovals();
    toast('Approved');
}

// Bulk Reject (show modal for comment)
function bulkReject() {
    var selected = [];
    var chks = document.querySelectorAll('.rowChk:checked');
    for (var i = 0; i < chks.length; i++) selected.push(chks[i].dataset.id);
    if (selected.length === 0) {
        alert('Please select at least one request.');
        return;
    }
    window.rejectSelection = selected;
    document.getElementById('rejectComment').value = '';
    new bootstrap.Modal(document.getElementById('rejectModal')).show();
}


var selAll = document.getElementById('selectAllRequests');
if (selAll) {
    selAll.addEventListener('change', function (e) {
        var checked = e.target.checked;
        var chks = document.querySelectorAll('.rowChk');
        for (var i = 0; i < chks.length; i++) chks[i].checked = checked;
    });
}

// Confirm reject modal
var confirmRejectBtn = document.getElementById('confirmRejectBtn');
if (confirmRejectBtn) {
    confirmRejectBtn.addEventListener('click', function () {
        var c = document.getElementById('rejectComment').value.trim();
        if (!c) { alert('Comment is required'); return; }
        rejectRequests(window.rejectSelection, c);
        bootstrap.Modal.getInstance(document.getElementById('rejectModal')).hide();
    });
}

function setupApprovalsFilter() {
    window.approvalsFilter = "All";
    var filterSelect = document.getElementById('requestTypeFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', function () {
            window.approvalsFilter = this.value;
            renderApprovals();
        });
    }
}




function renderAll() {
    renderApprovals();
    renderAttendance();
    renderTasks();
    TaskAssignees();
    renderReports()
}

document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initData();
    setupApprovalsFilter();
});

document.getElementById('saveTaskBtn').addEventListener('click', saveTaskFromModal);
document.getElementById('btnFilterAtt').addEventListener('click', renderAttendance);
document.getElementById('searchRequests').addEventListener('input', renderApprovals);

document.addEventListener('click', function (e) {
    var link = e.target.closest('.nav-link');
    if (link && link.dataset && link.dataset.page) {
        e.preventDefault();
        setActivePage(link.dataset.page);
    }
    var btn = e.target.closest('button');
    if (btn) {
        if (btn.dataset && btn.dataset.action === 'approve') {
            approveRequest(btn.dataset.id);
        }
        if (btn.dataset && btn.dataset.action === 'reject') {
            window.rejectSelection = [btn.dataset.id];
            document.getElementById('rejectComment').value = '';
            new bootstrap.Modal(document.getElementById('rejectModal')).show();
        }
        if (btn.id === 'btnApproveSelected') {
            bulkApprove();
        }
        // Bulk reject
        if (btn.id === 'btnRejectSelected') {
            bulkReject();
        }

        if (btn.dataset && btn.dataset.act === 'advance') {
            advanceTask(btn.dataset.id);
        }
        if (btn.dataset && btn.dataset.act === 'edit') {
            var t = null;
            for (var i = 0; i < db.tasks.length; i++) {
                if (db.tasks[i].taskId == btn.dataset.id) t = db.tasks[i];
            }
            if (t) openTaskModal(t);
        }

        if (btn.dataset && btn.dataset.act === 'markDone') {
            var t2 = null;
            for (var i = 0; i < db.tasks.length; i++) {
                if (db.tasks[i].taskId == btn.dataset.id) t2 = db.tasks[i];
            }
            if (t2) {
                t2.status = 'Completed';
                t2.updatedAt = new Date().toISOString();
                saveToStorage();
                renderTasks();
                renderReports();
            }
        }
    }
});

const btn = document.getElementById("themeToggle");

btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");

    if (document.body.classList.contains("dark-theme")) {
        btn.innerHTML = '<i class="bi bi-sun"></i>';
    } else {
        btn.innerHTML = '<i class="bi bi-moon"></i>';
    }
});

if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.classList.add("dark-theme");
    btn.innerHTML = '<i class="bi bi-sun"></i>';
} else {
    document.body.classList.add("light-theme");
    btn.innerHTML = '<i class="bi bi-moon text-white"></i>';
}

function initTheme() {
    var toggleBtn = document.getElementById("themeToggle");
    var savedTheme = localStorage.getItem("theme");
    if (!savedTheme) {
        savedTheme = "light";
        localStorage.setItem("theme", savedTheme);
    }
    document.documentElement.dataset.theme = savedTheme;
    document.body.classList.add(savedTheme);
    if (toggleBtn) toggleBtn.innerHTML = savedTheme === "dark"
        ? '<i class="bi bi-sun"></i>'
        : '<i class="bi bi-moon text-white"></i>';
    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            var newTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = newTheme;
            document.body.classList.remove("light");
            document.body.classList.remove("dark");
            document.body.classList.add(newTheme);
            localStorage.setItem("theme", newTheme);
            toggleBtn.innerHTML = newTheme === "dark"
                ? '<i class="bi bi-sun"></i>'
                : '<i class="bi bi-moon text-white"></i>';
        });
    }
}

// logoutBtn.addEventListener("click", () => {
//     const isLoggedIn = localStorage.getItem("employee");
//     console.log(isLoggedIn);
// })

// logoutBtn.addEventListener("click", () => {
//     const isLoggedIn = localStorage.getItem("employee");

//     if (!isLoggedIn) {
//         swal({
//             title: "No active session!",
//             text: "You're not logged in to logout.",
//             icon: "error",
//             buttons: false,
//             timer: 2000,
//         });
//         return;
//     }

//     swal({
//         title: "Are you sure?",
//         text: "Once you logout, you will need to login again to access this page.",
//         icon: "warning",
//         buttons: true,
//         dangerMode: true,
//     }).then((willLogout) => {
//         if (willLogout) {
//             localStorage.removeItem("employee");

//             swal({
//                 title: "Logged out!",
//                 text: "You have successfully logged out.",
//                 icon: "success",
//                 timer: 1500,
//                 buttons: false,
//             }).then(() => {
//                 window.location.replace("login.html");
//             });
//         } else {
//             swal({
//                 title: "Cancelled",
//                 text: "You're still logged in!",
//                 icon: "info",
//                 buttons: false,
//                 timer: 2000,
//             });
//         }
//     });
// });


// Export Attendance Table to CSV
document.getElementById("exportAttendanceCsv").addEventListener("click", function () {
    var table = document.getElementById("attendanceTable");
    if (!table) return;
    var wb = XLSX.utils.table_to_book(table, { sheet: "Attendance" });
    XLSX.writeFile(wb, "attendance-report.xlsx");
});
// Export Tasks Table to CSV
document.getElementById("exportTasksCsv").addEventListener("click", function () {
    var table = document.getElementById("reportTasksTable");
    if (!table) return;
    var wb = XLSX.utils.table_to_book(table, { sheet: "Tasks" });
    XLSX.writeFile(wb, "tasks-report.xlsx");
});


document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm("Are you sure you want to reset all data?")) return;
    localStorage.clear();
    initData();
    initTheme();
    toast("Data reset and reloaded from JSON");
});