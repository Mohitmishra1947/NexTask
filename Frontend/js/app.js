
// ==========================================
//              NEXtask APP
// ==========================================

// Flask API address
const API_URL = "http://127.0.0.1:5000/api";

// Tasks will now come from SQLite through Flask
let tasks = [];

// Settings remain in localStorage
let settings = JSON.parse(
    localStorage.getItem("nextask_settings")
) || {
    theme: "dark",
    defaultPriority: "Medium",
    defaultCategory: "Work"
};

// Selected task
let selectedTaskId = null;
let editingTaskId = null;


// ==========================================
//              API FUNCTIONS
// ==========================================

// Send requests to Flask
async function apiRequest(endpoint, method = "GET", data = null) {

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API_URL + endpoint, options);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
    }

    return result;
}


// Load tasks from SQLite
async function loadTasks() {

    try {

        tasks = await apiRequest("/tasks");

        renderTasks();
        openTaskFromURL();

    } catch (error) {

        console.error("Unable to load tasks:", error);

        alert(
            "Could not connect to NexTask backend. " +
            "Please make sure Flask is running."
        );

    }

}


// ==========================================
//              HTML ELEMENTS
// ==========================================

// Navigation
const addTaskBtn = document.querySelector(".add-task-btn");

// Welcome section
const greeting = document.getElementById("greeting");
const productivityMessage = document.getElementById("productivity-message");
const currentDate = document.getElementById("current-date");

// Statistics
const totalTasksElement = document.getElementById("total-tasks");
const completedTasksElement = document.getElementById("completed-tasks");
const pendingTasksElement = document.getElementById("pending-tasks");
const overdueTasksElement = document.getElementById("overdue-tasks");

const completionRateElement = document.getElementById("completion-rate");
const progressFill = document.getElementById("progress-fill");

// Task lists
const pendingList = document.getElementById("pending-list");
const completedList = document.getElementById("completed-list");

const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");

// Add task modal
const taskModal = document.getElementById("task-modal");
const closeModal = document.getElementById("close-modal");
const taskForm = document.getElementById("task-form");
const cancelTask = document.getElementById("cancel-task");

// Task inputs
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskCategoryInput = document.getElementById("task-category");
const taskPriorityInput = document.getElementById("task-priority");
const taskDateInput = document.getElementById("task-date");

// Details modal
const detailsModal = document.getElementById("details-modal");
const closeDetails = document.getElementById("close-details");

const detailsTitle = document.getElementById("details-title");
const detailsDescription = document.getElementById("details-description");
const detailsCategory = document.getElementById("details-category");
const detailsPriority = document.getElementById("details-priority");
const detailsDate = document.getElementById("details-date");
const detailsStatus = document.getElementById("details-status");

const detailsDelete = document.getElementById("details-delete");
const detailsEdit = document.getElementById("details-edit");
const detailsToggle = document.getElementById("details-toggle");

// Deadline alerts
const deadlineAlerts = document.getElementById("deadline-alerts");


// ==========================================
//              DATE FUNCTIONS
// ==========================================

function getTodayString() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDate(dateString) {

    if (!dateString) {
        return "No due date";
    }

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}


function isOverdue(task) {

    return (
        task.dueDate &&
        task.dueDate < getTodayString() &&
        !task.completed &&
        !task.deleted
    );

}


function isDueToday(task) {

    return (
        task.dueDate === getTodayString() &&
        !task.completed &&
        !task.deleted
    );

}


// ==========================================
//              WELCOME SECTION
// ==========================================

function updateWelcomeSection() {

    const hour = new Date().getHours();

    let greetingText = "Good evening";

    if (hour < 12) {
        greetingText = "Good morning";
    } else if (hour < 17) {
        greetingText = "Good afternoon";
    }

    greeting.textContent = greetingText;

    currentDate.textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const activeTasks = tasks.filter(task => task.deleted !== true);
    const pendingTasks = activeTasks.filter(task => !task.completed);

    let message = "A fresh day is a fresh opportunity. Let's get started!";

    if (activeTasks.length === 0) {
        message = "Your productivity journey starts here. Add your first task!";
    } else if (pendingTasks.length === 0) {
        message = "Amazing work! You've completed all your tasks.";
    } else if (pendingTasks.length <= 3) {
        message = "You're making progress. Keep going!";
    } else {
        message = "One task at a time. You've got this!";
    }

    productivityMessage.textContent = message;

}


// ==========================================
//              STATISTICS
// ==========================================

function updateStatistics(activeTasks, pendingTasksArray, completedTasksArray) {

    const overdueTasks = pendingTasksArray.filter(task => isOverdue(task));

    const total = activeTasks.length;

    const completionRate = total === 0
        ? 0
        : Math.round((completedTasksArray.length / total) * 100);

    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completedTasksArray.length;
    pendingTasksElement.textContent = pendingTasksArray.length;
    overdueTasksElement.textContent = overdueTasks.length;

    completionRateElement.textContent = completionRate + "%";
    progressFill.style.width = completionRate + "%";

    pendingCount.textContent = pendingTasksArray.length;
    completedCount.textContent = completedTasksArray.length;

}


// ==========================================
//              CREATE TASK CARD
// ==========================================

function createTaskCard(task) {

    const card = document.createElement("div");
    card.className = "task-card";
    card.dataset.taskId = task.id;

    if (task.completed) {
        card.classList.add("completed");
    }

    if (isOverdue(task)) {
        card.classList.add("overdue");
    }

    // Task content
    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title || "Untitled task";

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description || "No description provided.";

    // Task information
    const meta = document.createElement("div");
    meta.className = "task-meta";

    const category = document.createElement("span");
    category.className = "task-tag";
    category.textContent = task.category || "Other";

    const priority = document.createElement("span");
    priority.className = "task-tag";
    priority.textContent = `${task.priority || "Medium"} Priority`;

    const dueDate = document.createElement("span");
    dueDate.className = "task-tag";
    dueDate.textContent = task.dueDate
        ? `Due: ${formatDate(task.dueDate)}`
        : "No due date";

    meta.append(category, priority, dueDate);

    content.append(title, description, meta);

    // Task buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeButton = document.createElement("button");
    completeButton.className = "complete-task-btn";
    completeButton.type = "button";
    completeButton.textContent = task.completed ? "Reopen" : "Complete";

    completeButton.addEventListener("click", event => {
        event.stopPropagation();
        toggleTaskStatus(task.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", event => {
        event.stopPropagation();
        deleteTask(task.id);
    });

    actions.append(completeButton, deleteButton);

    card.append(content, actions);

    card.addEventListener("click", () => {
        openTaskDetails(task.id);
    });

    return card;

}


// ==========================================
//              RENDER TASKS
// ==========================================

function renderTasks() {

    const activeTasks = tasks.filter(task => task.deleted !== true);

    const pendingTasksArray = activeTasks.filter(task => !task.completed);

    const completedTasksArray = activeTasks.filter(task => task.completed);

    updateStatistics(
        activeTasks,
        pendingTasksArray,
        completedTasksArray
    );

    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    pendingTasksArray.forEach(task => {
        pendingList.appendChild(createTaskCard(task));
    });

    completedTasksArray.forEach(task => {
        completedList.appendChild(createTaskCard(task));
    });

    updateEmptyMessages();
    updateWelcomeSection();
    showDeadlineAlerts();

}


// ==========================================
//              EMPTY MESSAGES
// ==========================================

function updateEmptyMessages() {

    if (pendingList.children.length === 0) {

        pendingList.innerHTML = `
            <div class="empty-state">
                <p>No pending tasks. You're all caught up!</p>
            </div>
        `;

    }

    if (completedList.children.length === 0) {

        completedList.innerHTML = `
            <div class="empty-state">
                <p>No completed tasks yet.</p>
            </div>
        `;

    }

}


// ==========================================
//              OPEN ADD TASK MODAL
// ==========================================

function openTaskModal() {

    editingTaskId = null;

    taskForm.reset();

    taskCategoryInput.value = settings.defaultCategory || "Work";
    taskPriorityInput.value = settings.defaultPriority || "Medium";

    taskModal.classList.add("active");

}


// ==========================================
//              CLOSE ADD TASK MODAL
// ==========================================

function closeTaskModal() {

    taskModal.classList.remove("active");

    taskForm.reset();

    editingTaskId = null;

}


// ==========================================
//              ADD / EDIT TASK
// ==========================================

taskForm.addEventListener("submit", async event => {

    event.preventDefault();

    const title = taskTitleInput.value.trim();

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    const taskData = {
        title: title,
        description: taskDescriptionInput.value.trim(),
        category: taskCategoryInput.value,
        priority: taskPriorityInput.value,
        dueDate: taskDateInput.value
    };

    try {

        // Edit existing task
        if (editingTaskId !== null) {

            const updatedTask = await apiRequest(
                `/tasks/${editingTaskId}`,
                "PUT",
                taskData
            );

            tasks = tasks.map(task =>
                task.id === updatedTask.id ? updatedTask : task
            );

        }

        // Create new task
        else {

            const newTask = await apiRequest(
                "/tasks",
                "POST",
                taskData
            );

            tasks.push(newTask);

        }

        closeTaskModal();
        renderTasks();

    } catch (error) {

        console.error("Task save failed:", error);
        alert(error.message);

    }

});


// ==========================================
//              OPEN TASK DETAILS
// ==========================================

function openTaskDetails(taskId) {

    const task = tasks.find(task => task.id === String(taskId));

    if (!task || task.deleted) {
        return;
    }

    selectedTaskId = task.id;

    detailsTitle.textContent = task.title || "Untitled task";

    detailsDescription.textContent =
        task.description || "No description provided.";

    detailsCategory.textContent = task.category || "Other";

    detailsPriority.textContent = task.priority || "Medium";

    detailsDate.textContent = formatDate(task.dueDate);

    detailsStatus.textContent = task.completed
        ? "Completed"
        : "Pending";

    detailsToggle.textContent = task.completed
        ? "Mark as Pending"
        : "Mark as Completed";

    detailsModal.classList.add("active");

}


// ==========================================
//              CLOSE TASK DETAILS
// ==========================================

function closeDetailsModal() {

    detailsModal.classList.remove("active");

    selectedTaskId = null;

}


// ==========================================
//              EDIT TASK
// ==========================================

function editTask(taskId) {

    const task = tasks.find(task => task.id === String(taskId));

    if (!task || task.deleted) {
        return;
    }

    editingTaskId = task.id;

    taskTitleInput.value = task.title || "";
    taskDescriptionInput.value = task.description || "";
    taskCategoryInput.value = task.category || "Work";
    taskPriorityInput.value = task.priority || "Medium";
    taskDateInput.value = task.dueDate || "";

    closeDetailsModal();

    taskModal.classList.add("active");

}


// ==========================================
//              DELETE TASK
// ==========================================

async function deleteTask(taskId) {

    const confirmDelete = confirm(
        "Are you sure you want to move this task to Trash?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        await apiRequest(
            `/tasks/${taskId}`,
            "DELETE"
        );

        tasks = tasks.filter(task => task.id !== String(taskId));

        closeDetailsModal();
        renderTasks();

    } catch (error) {

        console.error("Task deletion failed:", error);
        alert(error.message);

    }

}


// ==========================================
//              COMPLETE / REOPEN TASK
// ==========================================

async function toggleTaskStatus(taskId) {

    const task = tasks.find(task => task.id === String(taskId));

    if (!task || task.deleted) {
        return;
    }

    try {

        const updatedTask = await apiRequest(
            `/tasks/${taskId}/status`,
            "PATCH",
            {
                completed: !task.completed
            }
        );

        tasks = tasks.map(item =>
            item.id === updatedTask.id ? updatedTask : item
        );

        if (selectedTaskId === String(taskId)) {
            openTaskDetails(taskId);
        }

        renderTasks();

    } catch (error) {

        console.error("Task status update failed:", error);
        alert(error.message);

    }

}


// ==========================================
//              DETAILS BUTTONS
// ==========================================

closeDetails.addEventListener("click", closeDetailsModal);


detailsDelete.addEventListener("click", () => {

    if (selectedTaskId !== null) {
        deleteTask(selectedTaskId);
    }

});


detailsEdit.addEventListener("click", () => {

    if (selectedTaskId !== null) {
        editTask(selectedTaskId);
    }

});


detailsToggle.addEventListener("click", () => {

    if (selectedTaskId !== null) {
        toggleTaskStatus(selectedTaskId);
    }

});


// ==========================================
//              MODAL BUTTONS
// ==========================================

addTaskBtn.addEventListener("click", event => {

    event.preventDefault();

    openTaskModal();

});


closeModal.addEventListener("click", closeTaskModal);

cancelTask.addEventListener("click", closeTaskModal);


taskModal.addEventListener("click", event => {

    if (event.target === taskModal) {
        closeTaskModal();
    }

});


detailsModal.addEventListener("click", event => {

    if (event.target === detailsModal) {
        closeDetailsModal();
    }

});


// ==========================================
//              DEADLINE ALERTS
// ==========================================

function showDeadlineAlerts() {

    deadlineAlerts.innerHTML = "";

    const pendingTasksArray = tasks.filter(task =>
        task.deleted !== true &&
        task.completed !== true
    );

    const overdueTasks = pendingTasksArray.filter(task => isOverdue(task));

    const todayTasks = pendingTasksArray.filter(task => isDueToday(task));

    if (overdueTasks.length === 0 && todayTasks.length === 0) {

        deadlineAlerts.hidden = true;

        return;

    }

    deadlineAlerts.hidden = false;

    // Overdue alerts
    overdueTasks.forEach(task => {

        const alertBox = document.createElement("div");

        alertBox.className = "deadline-alert overdue-alert";

        alertBox.textContent =
            `Overdue: "${task.title}" was due on ${formatDate(task.dueDate)}.`;

        deadlineAlerts.appendChild(alertBox);

    });

    // Due today alerts
    todayTasks.forEach(task => {

        const alertBox = document.createElement("div");

        alertBox.className = "deadline-alert due-today";

        alertBox.textContent = `"${task.title}" is due today!`;

        deadlineAlerts.appendChild(alertBox);

    });

}


// ==========================================
//              OPEN TASK FROM URL
// ==========================================

function openTaskFromURL() {

    const urlParams = new URLSearchParams(window.location.search);

    const taskId = urlParams.get("task");

    if (!taskId) {
        return;
    }

    const task = tasks.find(task =>
        task.id === taskId &&
        task.deleted !== true
    );

    if (task) {
        openTaskDetails(task.id);
    }

}


// ==========================================
//              APPLY THEME
// ==========================================

function applyTheme() {

    document.documentElement.classList.toggle(
        "light-theme",
        settings.theme === "light"
    );

}


// ==========================================
//              START APPLICATION
// ==========================================

applyTheme();

loadTasks();
