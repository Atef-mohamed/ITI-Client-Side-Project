

//-----------------------------------------------------
// Employee Data and Logout Functionality

document.addEventListener('DOMContentLoaded', function() {
    let employeesData = [];
    let currentEmployee = { name: "Guest User", role: "Employee" }; // Default fallback

    // Fetch employee data
    fetch("../data.json")
        .then(response => response.json())
        .then(data => {
            employeesData = data.employees || data; // يدعم لو JSON فيه key "employees" أو مصفوفة مباشرة

            const currentEmployeeId = localStorage.getItem('currentEmployeeId');
            if (currentEmployeeId && employeesData) {
                const employee = employeesData.find(emp => emp.id == currentEmployeeId);
                if (employee) currentEmployee = employee;
            }

            // Display employee info in header
            const employeeNameElement = document.getElementById('employeeName');
            const employeeRoleElement = document.getElementById('employeeRole');
            const avatarImg = document.querySelector('.avatar-img');

            if (employeeNameElement) employeeNameElement.textContent = `Welcome, ${currentEmployee.name}`;
            if (employeeRoleElement) employeeRoleElement.textContent = currentEmployee.role;
            if (avatarImg) {
                avatarImg.src = "../assets/images/idealpic.jpg"; // Default avatar
                avatarImg.alt = `${currentEmployee.name} Avatar`;
            }
        })
        .catch(error => {
            console.error("Error loading employee data:", error);
        });

    // Logout functionality with SweetAlert
    const logoutBtn = document.getElementById('logoutBtn');

    function performLogout() {
        localStorage.removeItem('currentEmployeeId');
        localStorage.removeItem('employee');
        localStorage.removeItem('tasks');
        localStorage.removeItem('permissions');
        localStorage.removeItem('userSession');
        window.location.href = './login.html';
    }

    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                performLogout();
            }
        });
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;

    if (themeBtn) {
        themeBtn.onclick = () => {
            root.style.colorScheme = root.style.colorScheme === "dark" ? "light" : "dark";
        };
    }
});

//-----------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    // ===== Load Tasks from Manager's localStorage =====
    let tasks = [];
    
    // Function to load tasks assigned to current employee
    function loadEmployeeTasks() {
        try {
            // Get tasks from localStorage (stored by manager) or from data.json
            let storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
            
            console.log('=== Loading Employee Tasks ===');
            console.log('Current Employee ID:', currentEmployeeId);
            console.log('All stored tasks in localStorage:', storedTasks);
            
            if (!currentEmployeeId) {
                console.warn('No employee ID found in localStorage. Please set currentEmployeeId.');
                tasks = [];
                return;
            }
            
            // If no tasks in localStorage, try to load from data.json
            if (storedTasks.length === 0) {
                console.log('No tasks in localStorage, checking data.json...');
                // This will be handled by the manager system, but we can show a message
                console.log('No tasks found. Manager needs to assign tasks first.');
                tasks = [];
                return;
            }
            
            // Filter tasks assigned to current employee
            // Match employee ID from data.json with assignees value in tasks array
            tasks = storedTasks.filter(task => {
                if (!task.assignees || !Array.isArray(task.assignees)) {
                    console.log(`Task "${task.title}" has no valid assignees array`);
                    return false;
                }
                
                const isAssigned = task.assignees.includes(currentEmployeeId);
                console.log(`Task "${task.title}" (ID: ${task.taskId}) - Assignees: [${task.assignees.join(', ')}], Current Employee: ${currentEmployeeId}, Assigned: ${isAssigned}`);
                return isAssigned;
            });
            
            console.log(`Found ${tasks.length} tasks assigned to employee ${currentEmployeeId}`);
            
            // Map manager task statuses to employee Kanban statuses
            tasks = tasks.map(task => {
                const mappedTask = { ...task };
                
                // Map manager statuses to employee Kanban statuses
                switch (task.status) {
                    case 'Pending':
                        mappedTask.status = 'todo';
                        break;
                    case 'Ongoing':
                        mappedTask.status = 'progress';
                        break;
                    case 'Completed':
                        mappedTask.status = 'done';
                        break;
                    case 'Missed':
                        mappedTask.status = 'todo'; // Show missed tasks in todo for visibility
                        break;
                    default:
                        mappedTask.status = 'todo';
                }
                
                console.log(`Mapped task "${task.title}" from "${task.status}" to "${mappedTask.status}"`);
                return mappedTask;
            });
            
            console.log('Final filtered and mapped tasks for current employee:', tasks);
            
        } catch (error) {
            console.error('Error loading employee tasks:', error);
            tasks = [];
        }
    }
    
    // Load tasks for current employee
    loadEmployeeTasks();
    
    // Debug: Log current state
    console.log('Employee dashboard loaded');
    console.log('Current employee ID:', localStorage.getItem('currentEmployeeId'));
    console.log('Tasks loaded for employee:', tasks.length);
    
    // Store and log the current logged-in employee ID
    let currentEmployeeId = localStorage.getItem('currentEmployeeId');
    
    // Try to get employee ID from employee object in localStorage
    const employeeObject = localStorage.getItem('employee');
    if (employeeObject) {
        try {
            const employee = JSON.parse(employeeObject);
            if (employee && employee.id) {
                console.log('=== FOUND EMPLOYEE OBJECT IN LOCALSTORAGE ===');
                console.log('Employee object:', employee);
                console.log('Employee ID from object:', employee.id);
                
                // Set currentEmployeeId to match the employee object's id
                currentEmployeeId = employee.id.toString();
                localStorage.setItem('currentEmployeeId', currentEmployeeId);
                console.log('Set currentEmployeeId to match employee object ID:', currentEmployeeId);
            }
        } catch (error) {
            console.log('Error parsing employee object from localStorage:', error);
        }
    }
    
    // If still no employee ID is stored, set a default one for testing
    if (!currentEmployeeId) {
        console.log('=== NO EMPLOYEE ID FOUND ===');
        console.log('No employee object found in localStorage');
        console.log('Setting default employee ID to 2 (Atef Mohamed)');
        currentEmployeeId = '2';
        localStorage.setItem('currentEmployeeId', currentEmployeeId);
        console.log('Employee ID stored in localStorage:', currentEmployeeId);
    }
    
    // Log the current logged-in employee ID
    console.log('=== CURRENT LOGGED-IN EMPLOYEE ===');
    console.log('Employee ID stored in localStorage:', currentEmployeeId);
    console.log('Employee ID type:', typeof currentEmployeeId);
    console.log('Employee ID as integer:', parseInt(currentEmployeeId));
    console.log('localStorage key "currentEmployeeId":', localStorage.getItem('currentEmployeeId'));
    
    // Verify the storage worked
    const storedId = localStorage.getItem('currentEmployeeId');
    if (storedId === currentEmployeeId) {
        console.log('✅ Employee ID successfully stored and retrieved from localStorage');
    } else {
        console.log('❌ Error: Employee ID storage verification failed');
    }

    // Save tasks to localStorage (update manager's task system)
    function saveTasks() {
        try {
            // Get all tasks from localStorage
            const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
            
            // Update tasks for current employee in the main task list
            tasks.forEach(employeeTask => {
                const taskIndex = allTasks.findIndex(task => task.taskId === employeeTask.taskId);
                if (taskIndex !== -1) {
                    // Map employee Kanban statuses back to manager statuses
                    let managerStatus = employeeTask.status;
                    switch (employeeTask.status) {
                        case 'todo':
                            managerStatus = 'Pending';
                            break;
                        case 'progress':
                            managerStatus = 'Ongoing';
                            break;
                        case 'done':
                            managerStatus = 'Completed';
                            break;
                        default:
                            managerStatus = 'Pending';
                    }
                    
                    // Update the task in the main list
                    allTasks[taskIndex] = {
                        ...allTasks[taskIndex],
                        status: managerStatus,
                        updatedAt: new Date().toISOString()
                    };
                }
            });
            
            // Save updated tasks back to localStorage
            localStorage.setItem('tasks', JSON.stringify(allTasks));
            console.log('Tasks updated in localStorage:', allTasks);
            
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    const columns = document.querySelectorAll('.kanban-column');

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ===== Drag & Drop =====
    let draggedTask = null;

    function dragStart(e) {
        draggedTask = this;
        e.dataTransfer.setData("text/plain", this.dataset.taskId);
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function dragEnd() {
        this.classList.remove('dragging');
        columns.forEach(column => column.classList.remove('over'));
    }

    function dragOver(e) { e.preventDefault(); }
    function dragEnter(e) { e.preventDefault(); this.classList.add('over'); }
    function dragLeave() { this.classList.remove('over'); }

    function drop(e) {
        e.preventDefault();
        this.classList.remove('over');

        const taskId = e.dataTransfer.getData("text/plain");
        const taskCard = document.querySelector(`[data-task-id='${taskId}']`);
        const targetColumn = this.querySelector(".kanban-tasks");

        if (taskCard && targetColumn) {
            targetColumn.appendChild(taskCard);

            // Update task status in tasks array & localStorage
            const newStatus = e.currentTarget.id.replace("-column", "");
            const task = tasks.find(t => t.taskId == taskId);
            if (task) {
                task.status = newStatus;
                task.updatedAt = new Date().toISOString(); // تحديث تاريخ التعديل
                saveTasks();
            }

            updateAllTaskCounts();
        }
    }

    function updateAllTaskCounts() {
        columns.forEach(column => {
            const taskCount = column.querySelectorAll('.kanban-task').length;
            const badge = column.querySelector('.kanban-column-header .badge');
            badge.textContent = taskCount;
        });
    }

    // ===== Generate task cards =====
    function generateTasks() {
        columns.forEach(column => column.querySelector('.kanban-tasks').innerHTML = ''); // Clear column

        tasks.forEach(task => {
            const column = document.querySelector(`#${task.status.toLowerCase()}-column .kanban-tasks`);
            if (!column) return;

            const taskDiv = document.createElement('div');
            taskDiv.classList.add('kanban-task');
            taskDiv.setAttribute('draggable', 'true');
            taskDiv.dataset.taskId = task.taskId;

            // تحويل تاريخ Deadline لعرض مناسب
            const deadlineDate = new Date(task.deadline).toLocaleDateString();

            taskDiv.innerHTML = `
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
                <div class="task-dates">
                    <div class="d-flex flex-column">
                        <span class="date-label fw-bold">Deadline</span>
                        <span class="date-value fw-normal">${deadlineDate}</span>
                    </div>
                </div>
                <div class="d-flex justify-content-start">
                    <span class="badge priority-${task.priority.toLowerCase()} rounded-pill">${capitalize(task.priority)} Priority</span>
                </div>
            `;

            column.appendChild(taskDiv);

            // Add drag & drop events
            taskDiv.addEventListener('dragstart', dragStart);
            taskDiv.addEventListener('dragend', dragEnd);
        });
    }

    // ===== Attach drop events to columns =====
    columns.forEach(column => {
        column.addEventListener('dragover', dragOver);
        column.addEventListener('dragenter', dragEnter);
        column.addEventListener('dragleave', dragLeave);
        column.addEventListener('drop', drop);
    });

    // ===== Initialize =====
    generateTasks();
    updateAllTaskCounts();
    
    // Debug: Log initialization
    console.log('Kanban board initialized with', tasks.length, 'tasks');
});

//----------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const permissionType = document.getElementById('permissionType');
    const dynamicFields = document.getElementById('dynamicFields');
    const form = document.getElementById('permissionForm');
    const reasonField = document.getElementById('reason');
    
    // Handle permission type change
    permissionType.addEventListener('change', function() {
        const selectedValue = this.value;
        
        // Clear previous dynamic fields
        dynamicFields.innerHTML = '';
        
        // Create new fields based on selection
        if (['late', 'absence', 'wfh'].includes(selectedValue)) {
            dynamicFields.innerHTML = `
                <div class="form-group dynamic-field">
                    <label for="date">Date</label>
                    <input type="date" class="form-control" id="date" required>
                </div>
            `;
        } else if (selectedValue === 'overtime') {
            dynamicFields.innerHTML = `
                <div class="form-group dynamic-field">
                    <label for="date">Date</label>
                    <input type="date" class="form-control" id="date" required>
                </div>
                <div class="form-group dynamic-field">
                    <label for="hours">Number of Hours</label>
                    <input type="number" class="form-control" id="hours" min="1" placeholder="Enter hours" required>
                </div>
            `;
        } else if (selectedValue === 'deadline') {
            // For "Deadline Extension" only reason is visible; ensure dynamic fields are cleared
            dynamicFields.innerHTML = '';
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        const selectedType = permissionType.value;
        if (!selectedType) {
            alert('Please select a permission type.');
            return;
        }
        if (!reasonField.value || reasonField.value.trim() === '') {
            alert('Please provide a reason for your request.');
            return;
        }

        // Additional validation and value collection based on permission type
        const dateField = document.getElementById('date');
        const hoursField = document.getElementById('hours');

        let requestedDate = null;
        let hours = null;

        if (['late', 'absence', 'wfh'].includes(selectedType)) {
            if (!dateField || !dateField.value) {
                alert('Please select a date.');
                return;
            }
            requestedDate = dateField.value; // yyyy-mm-dd
        } else if (selectedType === 'overtime') {
            if (!dateField || !dateField.value) {
                alert('Please select a date.');
                return;
            }
            if (!hoursField || !hoursField.value || Number(hoursField.value) <= 0) {
                alert('Please enter a valid number of hours.');
                return;
            }
            requestedDate = dateField.value;
            hours = Number(hoursField.value);
        }

        // Prepare storage and sequential ID generation
        const storageKey = 'requests';
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');

        let nextId = 1;
        if (Array.isArray(existing) && existing.length > 0) {
            const maxId = existing.reduce((max, req) => {
                const numericId = typeof req.id === 'number'
                    ? req.id
                    : parseInt(String(req.id).replace(/\D/g, ''), 10);
                return isNaN(numericId) ? max : Math.max(max, numericId);
            }, 0);
            nextId = maxId + 1;
        }

        // Build request object according to required structure
        const now = new Date();

        // Map internal values to display type
        const typeMap = {
            late: 'Late',
            absence: 'Absence',
            wfh: 'WFH',
            overtime: 'Overtime',
            deadline: 'Deadline Extension'
        };

        // Ensure we have a valid currentEmployeeId before saving the request
        let currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
        if (!currentEmployeeId) {
            // Try to read from stored employee object
            const employeeObjectRaw = localStorage.getItem('employee');
            try {
                if (employeeObjectRaw) {
                    const employeeObj = JSON.parse(employeeObjectRaw);
                    if (employeeObj && employeeObj.id) {
                        currentEmployeeId = parseInt(employeeObj.id);
                        localStorage.setItem('currentEmployeeId', String(currentEmployeeId));
                    }
                }
            } catch (e) { /* ignore parse error and fallback below */ }
        }
        if (!currentEmployeeId) {
            // Last-resort fallback to keep UX flowing in case ID not set elsewhere
            currentEmployeeId = 2;
            localStorage.setItem('currentEmployeeId', '2');
        }

        const newRequest = {
            id: nextId,
            employeeId: currentEmployeeId,
            type: typeMap[selectedType] || 'Unknown',
            status: 'Pending',
            createdAt: now.toISOString(),
            payload: {
                requestedDate: requestedDate || null,
                hours: hours !== null ? hours : null,
                reason: reasonField.value.trim()
            }
        };

        // Persist to localStorage under key 'employeeRequests'
        try {
            existing.push(newRequest);
            localStorage.setItem(storageKey, JSON.stringify(existing));
            alert('Your request has been submitted successfully!');
            form.reset();
            dynamicFields.innerHTML = '';

            // Notify other parts of the page (e.g., summary cards) to refresh
            window.dispatchEvent(new Event('requests-updated'));
        } catch (err) {
            console.error('Failed to save request:', err);
            alert('Failed to submit request. Please try again.');
        }
    });
    
    // ===== Testing Functions for Task Integration =====
    
    // Function to refresh tasks (can be called from console)
    window.refreshTasks = function() {
        console.log('Refreshing tasks...');
        loadEmployeeTasks();
        generateTasks();
        updateAllTaskCounts();
    };
    
    // Function to test task integration (can be called from console)
    window.testTaskIntegration = function() {
        console.log('=== Task Integration Test ===');
        console.log('Current Employee ID:', localStorage.getItem('currentEmployeeId'));
        
        const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        console.log('All tasks in localStorage:', allTasks);
        
        // Show assignees for each task
        allTasks.forEach(task => {
            console.log(`Task "${task.title}" (ID: ${task.taskId}) - Assignees: [${task.assignees}]`);
        });
        
        console.log('Filtered tasks for current employee:', tasks);
        console.log('Kanban columns:', document.querySelectorAll('.kanban-column').length);
        
        // Test the filtering logic
        const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
        if (currentEmployeeId) {
            const assignedTasks = allTasks.filter(task => 
                task.assignees && task.assignees.includes(currentEmployeeId)
            );
            console.log(`Tasks assigned to employee ${currentEmployeeId}:`, assignedTasks.length);
        }
    };
    
    // Function to create a test task for current employee (can be called from console)
    window.createTestTask = function() {
        const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
        if (!currentEmployeeId) {
            console.log('Please set an employee ID first using setEmployeeId(id)');
            return;
        }
        
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const newTask = {
            taskId: allTasks.length + 1,
            title: "Test Task for Employee " + currentEmployeeId,
            description: "This is a test task created for testing the integration",
            priority: "Medium",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            assignees: [currentEmployeeId],
            status: "Pending",
            attachments: [],
            comments: [],
            createdBy: "manager",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dependencyTaskIds: []
        };
        
        allTasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(allTasks));
        console.log('Test task created:', newTask);
        
        // Refresh the display
        refreshTasks();
    };
    
    // Function to create sample tasks for demonstration (can be called from console)
    window.createSampleTasks = function() {
        const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
        if (!currentEmployeeId) {
            console.log('Please set an employee ID first using setEmployeeId(id)');
            return;
        }
        
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        // Create sample tasks for the current employee
        const sampleTasks = [
            {
                taskId: allTasks.length + 1,
                title: "Complete Project Documentation",
                description: "Write comprehensive documentation for the current project",
                priority: "High",
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
                assignees: [currentEmployeeId],
                status: "Pending",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: allTasks.length + 2,
                title: "Code Review Session",
                description: "Review and provide feedback on team member's code",
                priority: "Medium",
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                assignees: [currentEmployeeId],
                status: "Ongoing",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: allTasks.length + 3,
                title: "Bug Fix Implementation",
                description: "Fix the reported bug in the authentication module",
                priority: "Critical",
                deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
                assignees: [currentEmployeeId],
                status: "Completed",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            }
        ];
        
        // Add sample tasks to the main task list
        allTasks.push(...sampleTasks);
        localStorage.setItem('tasks', JSON.stringify(allTasks));
        console.log('Sample tasks created for employee', currentEmployeeId, ':', sampleTasks);
        
        // Refresh the display
        refreshTasks();
    };
    
    // Function to create tasks for multiple employees (for testing assignees filtering)
    window.createMultiEmployeeTasks = function() {
        const allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        // Create tasks assigned to different employees
        const multiEmployeeTasks = [
            {
                taskId: allTasks.length + 1,
                title: "Frontend Development Task",
                description: "Develop the user interface components",
                priority: "High",
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [2, 3], // Assigned to employees 2 and 3
                status: "Pending",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: allTasks.length + 2,
                title: "Backend API Development",
                description: "Create REST API endpoints",
                priority: "Critical",
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [1, 8], // Assigned to employees 1 and 8
                status: "Ongoing",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: allTasks.length + 3,
                title: "Database Optimization",
                description: "Optimize database queries and indexes",
                priority: "Medium",
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [4, 6], // Assigned to employees 4 and 6
                status: "Pending",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: allTasks.length + 4,
                title: "Security Audit",
                description: "Perform security review of the application",
                priority: "High",
                deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [5, 7], // Assigned to employees 5 and 7
                status: "Completed",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            }
        ];
        
        // Add multi-employee tasks to the main task list
        allTasks.push(...multiEmployeeTasks);
        localStorage.setItem('tasks', JSON.stringify(allTasks));
        console.log('Multi-employee tasks created:', multiEmployeeTasks);
        
        // Show which tasks are assigned to which employees
        multiEmployeeTasks.forEach(task => {
            console.log(`Task "${task.title}" assigned to employees: [${task.assignees.join(', ')}]`);
        });
        
        // Refresh the display
        refreshTasks();
    };
    
    // Function to load tasks from data.json and demonstrate the matching
    window.loadTasksFromDataJson = async function() {
        try {
            console.log('=== Loading Tasks from data.json ===');
            
            // Fetch data.json
            const response = await fetch('../data.json');
            const data = await response.json();
            
            console.log('Data loaded from data.json:', data);
            console.log('Employees in data.json:', data.employees);
            console.log('Tasks in data.json:', data.tasks);
            
            // Show employee IDs from data.json
            console.log('Employee IDs from data.json:');
            data.employees.forEach(emp => {
                console.log(`- Employee ID: ${emp.id}, Name: ${emp.name}`);
            });
            
            // Show tasks with their assignees
            console.log('Tasks with assignees from data.json:');
            data.tasks.forEach(task => {
                console.log(`- Task "${task.title}" (ID: ${task.taskId}) - Assignees: [${task.assignees.join(', ')}]`);
            });
            
            // Store tasks in localStorage for the employee system to use
            localStorage.setItem('tasks', JSON.stringify(data.tasks));
            console.log('Tasks from data.json stored in localStorage');
            
            // Refresh the display
            refreshTasks();
            
        } catch (error) {
            console.error('Error loading tasks from data.json:', error);
        }
    };
    
    // Function to demonstrate the matching process
    window.demonstrateMatching = function() {
        const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
        const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        
        console.log('=== Demonstrating Employee ID Matching ===');
        console.log('Current Employee ID:', currentEmployeeId);
        
        if (!currentEmployeeId) {
            console.log('Please set an employee ID first using setEmployeeId(id)');
            return;
        }
        
        console.log('All tasks and their assignees:');
        allTasks.forEach(task => {
            const isAssigned = task.assignees && task.assignees.includes(currentEmployeeId);
            console.log(`Task "${task.title}" - Assignees: [${task.assignees.join(', ')}] - Assigned to employee ${currentEmployeeId}: ${isAssigned ? 'YES' : 'NO'}`);
        });
        
        const assignedTasks = allTasks.filter(task => 
            task.assignees && task.assignees.includes(currentEmployeeId)
        );
        
        console.log(`\nResult: ${assignedTasks.length} tasks are assigned to employee ${currentEmployeeId}`);
        assignedTasks.forEach(task => {
            console.log(`- "${task.title}" (Status: ${task.status})`);
        });
    };
    
    // Function to set up test data and verify everything works
    window.setupTestData = function() {
        console.log('=== Setting Up Test Data ===');
        
        // Set employee ID to 2 (Atef Mohamed from data.json)
        localStorage.setItem('currentEmployeeId', '2');
        console.log('Set employee ID to 2 (Atef Mohamed)');
        
        // Create test tasks with assignees
        const testTasks = [
            {
                taskId: 1,
                title: "Test Task for Employee 2",
                description: "This task is assigned to employee 2",
                priority: "High",
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [2], // Assigned to employee 2
                status: "Pending",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: 2,
                title: "Another Task for Employee 2",
                description: "This is another task for employee 2",
                priority: "Medium",
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [2], // Assigned to employee 2
                status: "Ongoing",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            },
            {
                taskId: 3,
                title: "Task for Different Employee",
                description: "This task is for employee 1, not 2",
                priority: "Low",
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                assignees: [1], // Assigned to employee 1, not 2
                status: "Pending",
                attachments: [],
                comments: [],
                createdBy: "manager",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dependencyTaskIds: []
            }
        ];
        
        // Store test tasks in localStorage
        localStorage.setItem('tasks', JSON.stringify(testTasks));
        console.log('Created test tasks:', testTasks);
        
        // Refresh the display
        refreshTasks();
        
        console.log('Test data setup complete! You should see 2 tasks on the Kanban board for employee 2.');
    };
    
    // Function to check current state
    window.checkCurrentState = function() {
        console.log('=== Current State Check ===');
        console.log('Current Employee ID:', localStorage.getItem('currentEmployeeId'));
        console.log('Tasks in localStorage:', JSON.parse(localStorage.getItem('tasks') || '[]'));
        console.log('Tasks array in JavaScript:', tasks);
        console.log('Kanban columns found:', document.querySelectorAll('.kanban-column').length);
        console.log('Task cards in DOM:', document.querySelectorAll('.kanban-task').length);
    };
    
    // Function to log current employee ID
    window.logCurrentEmployee = function() {
        const currentEmployeeId = localStorage.getItem('currentEmployeeId');
        console.log('=== CURRENT LOGGED-IN EMPLOYEE ===');
        if (currentEmployeeId) {
            console.log('Employee ID:', currentEmployeeId);
            console.log('Employee ID type:', typeof currentEmployeeId);
            console.log('Employee ID as integer:', parseInt(currentEmployeeId));
            
            // Try to get employee name from data.json
            fetch('../data.json')
                .then(response => response.json())
                .then(data => {
                    const employee = data.employees.find(emp => emp.id == currentEmployeeId);
                    if (employee) {
                        console.log('Employee Name:', employee.name);
                        console.log('Employee Role:', employee.role);
                        console.log('Employee Department:', employee.department);
                    } else {
                        console.log('Employee not found in data.json');
                    }
                })
                .catch(error => {
                    console.log('Could not fetch employee details from data.json');
                });
        } else {
            console.log('No employee is currently logged in');
            console.log('To set an employee ID, use: setEmployeeId(2)');
        }
    };
    
    // Function to set and store employee ID in localStorage
    window.setEmployeeId = function(employeeId) {
        console.log('=== SETTING EMPLOYEE ID ===');
        console.log('Setting employee ID to:', employeeId);
        
        // Store in localStorage
        localStorage.setItem('currentEmployeeId', employeeId.toString());
        
        // Verify storage
        const storedId = localStorage.getItem('currentEmployeeId');
        console.log('Employee ID stored in localStorage:', storedId);
        console.log('Storage verification:', storedId === employeeId.toString() ? '✅ SUCCESS' : '❌ FAILED');
        
        // Log the stored ID
        console.log('=== CURRENT STORED EMPLOYEE ID ===');
        console.log('Employee ID:', storedId);
        console.log('Employee ID type:', typeof storedId);
        console.log('Employee ID as integer:', parseInt(storedId));
        
        // Refresh tasks for the new employee
        refreshTasks();
        
        return storedId;
    };
    
    // Function to get current employee ID from localStorage
    window.getCurrentEmployeeId = function() {
        const currentEmployeeId = localStorage.getItem('currentEmployeeId');
        console.log('=== GETTING CURRENT EMPLOYEE ID ===');
        console.log('Current Employee ID from localStorage:', currentEmployeeId);
        console.log('Employee ID type:', typeof currentEmployeeId);
        console.log('Employee ID as integer:', parseInt(currentEmployeeId));
        return currentEmployeeId;
    };
    
    // Function to sync currentEmployeeId with employee object in localStorage
    window.syncEmployeeId = function() {
        console.log('=== SYNCING EMPLOYEE ID WITH EMPLOYEE OBJECT ===');
        
        const employeeObject = localStorage.getItem('employee');
        if (employeeObject) {
            try {
                const employee = JSON.parse(employeeObject);
                console.log('Employee object found:', employee);
                
                if (employee && employee.id) {
                    const employeeId = employee.id.toString();
                    localStorage.setItem('currentEmployeeId', employeeId);
                    
                    console.log('✅ Synced currentEmployeeId with employee object ID');
                    console.log('Employee ID from object:', employee.id);
                    console.log('currentEmployeeId set to:', employeeId);
                    console.log('Employee Name:', employee.name);
                    console.log('Employee Role:', employee.role);
                    
                    // Refresh tasks for the synced employee
                    refreshTasks();
                    
                    return employeeId;
                } else {
                    console.log('❌ Employee object found but no ID property');
                }
            } catch (error) {
                console.log('❌ Error parsing employee object:', error);
            }
        } else {
            console.log('❌ No employee object found in localStorage');
            console.log('Available localStorage keys:', Object.keys(localStorage));
        }
    };
    
    // Function to check what's in localStorage
    window.checkLocalStorage = function() {
        console.log('=== LOCALSTORAGE CONTENTS ===');
        console.log('All localStorage keys:', Object.keys(localStorage));
        
        // Check for employee object
        const employeeObject = localStorage.getItem('employee');
        if (employeeObject) {
            try {
                const employee = JSON.parse(employeeObject);
                console.log('Employee object:', employee);
            } catch (error) {
                console.log('Error parsing employee object:', error);
            }
        } else {
            console.log('No employee object found');
        }
        
        // Check currentEmployeeId
        const currentEmployeeId = localStorage.getItem('currentEmployeeId');
        console.log('currentEmployeeId:', currentEmployeeId);
        
        // Check for other possible keys
        const possibleKeys = ['user', 'currentUser', 'loggedInUser', 'userData'];
        possibleKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                console.log(`${key}:`, value);
            }
        });
    };
});

//----------------------------------------------------------
// Attendance Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Attendance elements
    const attendanceDate = document.querySelector("#attendanceDate");
    const btnFilterAtt = document.querySelector("#btnFilterAtt");
    const attendanceTableBody = document.querySelector("#attendanceTableBody");

    // Fetch attendance data
    const getAttendanceData = async () => {
        try {
            const response = await fetch("../data.json");
            const data = await response.json();
            const attendanceRecords = data.attendanceRecords || [];
            return attendanceRecords;
        } catch (error) {
            console.error("Error loading attendance data:", error);
            return [];
        }
    };

    // Get current employee ID
    function getCurrentEmployeeId() {
        const currentEmployeeId = parseInt(localStorage.getItem('currentEmployeeId'));
        if (currentEmployeeId) return currentEmployeeId;
        
        // Fallback: try to get from employee object
        const employeeObject = localStorage.getItem('employee');
        if (employeeObject) {
            try {
                const employee = JSON.parse(employeeObject);
                return employee.id;
            } catch (error) {
                console.error('Error parsing employee object:', error);
            }
        }
        
        // Last resort fallback
        return 2;
    }

    // Filter attendance by date
    if (btnFilterAtt) {
        btnFilterAtt.addEventListener("click", async () => {
            if (!attendanceDate || !attendanceTableBody) return;
            
            let selectedDate = attendanceDate.value;
            let today = new Date().toISOString().split("T")[0];

            if (selectedDate > today) {
                Swal.fire({
                    title: "Invalid Date",
                    text: "You can't select a future date!",
                    icon: "error",
                    timer: 2000,
                    showConfirmButton: false
                });
                return;
            }

            const attendanceRecords = await getAttendanceData();
            const empId = getCurrentEmployeeId();
            
            let filteredRecords = attendanceRecords.filter(
                (record) => record.employeeId == empId && record.date === selectedDate
            );
            
            renderAttendanceTable(filteredRecords);
        });
    }

    // Render attendance data in table
    const renderAttendanceTable = (records) => {
        if (!attendanceTableBody) return;
        
        attendanceTableBody.innerHTML = "";
        
        if (records.length === 0) {
            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center" style="color: light-dark(#97A1C0, #8C96A9);">
                        No attendance records found for the selected date.
                    </td>
                </tr>
            `;
            return;
        }
        
        records.forEach((record) => {
            let row = document.createElement("tr");
            
            // Create status badge
            const statusClass = getStatusClass(record.status);
            const statusBadge = `<span class="${statusClass}">${record.status}</span>`;
            
            row.innerHTML = `
                <td>${statusBadge}</td>
                <td style="color: light-dark(#0C243C, #FFFFFF);">${record.minutesLate || 0}</td>
                <td style="color: light-dark(#0C243C, #FFFFFF);">${record.isWFH ? "Yes" : "No"}</td>
                <td style="color: light-dark(#0C243C, #FFFFFF);">${record.isLeave ? "Yes" : "No"}</td>
            `;
            attendanceTableBody.appendChild(row);
        });
    };

    // Get status class for styling
    const getStatusClass = (status) => {
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('present')) return 'attendance-status-present';
        if (statusLower.includes('absent')) return 'attendance-status-absent';
        if (statusLower.includes('late')) return 'attendance-status-late';
        return 'attendance-status-present'; // default
    };

    // Set today's date as default
    if (attendanceDate) {
        const today = new Date().toISOString().split("T")[0];
        attendanceDate.value = today;
        
        // Load today's attendance by default
        setTimeout(async () => {
            const attendanceRecords = await getAttendanceData();
            const empId = getCurrentEmployeeId();
            
            let todayRecords = attendanceRecords.filter(
                (record) => record.employeeId == empId && record.date === today
            );
            
            renderAttendanceTable(todayRecords);
        }, 100);
    }
});
