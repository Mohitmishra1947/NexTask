
// ==========================================
//              NEXtask ALL TASKS
// ==========================================

// Backend API
const API_URL = "http://127.0.0.1:5000/api";

// Store tasks from backend
let tasks = [];

// Get HTML elements
const taskList = document.getElementById("all-tasks-list");
const taskCount = document.getElementById("all-tasks-count");
const searchInput = document.getElementById("task-search");
const sortSelect = document.getElementById("task-sort");
const emptyMessage = document.getElementById("all-tasks-empty");
const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "all";


// ==========================================
//              API FUNCTION
// ==========================================

async function apiRequest(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}


// ==========================================
//              LOAD TASKS
// ==========================================

async function loadTasks() {
    try {
        const data = await apiRequest("/tasks");

        tasks = Array.isArray(data) ? data : (data.tasks || []);

        renderTasks();

    } catch (error) {
        console.error("Error loading tasks:", error);

        taskList.innerHTML = `
            <p class="error-message">
                Could not load tasks. Please check your server connection.
            </p>
        `;

        taskCount.textContent = "0 tasks";
    }
}


// ==========================================
//              DATE FUNCTIONS
// ==========================================

// Get today's date in YYYY-MM-DD format
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Format date for display
function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


// Check whether a task is overdue
function isOverdue(task) {
    if (!task.dueDate || task.completed) {
        return false;
    }

    return task.dueDate < getTodayString();
}


// ==========================================
//              FILTER AND SORT
// ==========================================

function getFilteredTasks() {
    let filteredTasks = tasks.filter(task => task.deleted !== true);

    // Apply selected filter
    if (currentFilter === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);

    } else if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);

    } else if (currentFilter === "overdue") {
        filteredTasks = filteredTasks.filter(task => isOverdue(task));
    }

    // Apply search
    const searchText = searchInput.value.toLowerCase().trim();

    if (searchText) {
        filteredTasks = filteredTasks.filter(task =>
            (task.title || "").toLowerCase().includes(searchText)
        );
    }

    // Apply sorting
    const sortValue = sortSelect.value;

    filteredTasks.sort((a, b) => {

        if (sortValue === "earliest") {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
        }

        if (sortValue === "latest") {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return b.dueDate.localeCompare(a.dueDate);
        }

        if (sortValue === "newest") {
            return new Date(b.createdAt || 0) -
                   new Date(a.createdAt || 0);
        }

        if (sortValue === "oldest") {
            return new Date(a.createdAt || 0) -
                   new Date(b.createdAt || 0);
        }

        return 0;
    });

    return filteredTasks;
}


// ==========================================
//              ESCAPE HTML
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}


// ==========================================
//              CREATE TASK CARD
// ==========================================

function createTaskCard(task) {
    const card = document.createElement("article");

    card.className = "all-task-card";

    const status = task.completed ? "Completed" : "Pending";
    const priority = task.priority || "Medium";
    const category = task.category || "Other";

    card.innerHTML = `
        <h3>${escapeHTML(task.title || "Untitled Task")}</h3>

        <p class="all-task-description">
            ${escapeHTML(task.description || "No description provided.")}
        </p>

        <div class="all-task-meta">
            <span class="all-task-tag">
                ${escapeHTML(category)}
            </span>

            <span class="all-task-tag">
                ${escapeHTML(priority)} Priority
            </span>

            <span class="all-task-tag">
                ${formatDate(task.dueDate)}
            </span>

            <span class="all-task-status ${task.completed ? "completed" : "pending"}">
                ${status}
            </span>
        </div>
    `;

    // Open task details on dashboard
    card.addEventListener("click", () => {
        window.location.href =
            `../index.html?task=${encodeURIComponent(task.id)}`;
    });

    return card;
}


// ==========================================
//              RENDER TASKS
// ==========================================

function renderTasks() {
    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = "";

    filteredTasks.forEach(task => {
        const card = createTaskCard(task);

        taskList.appendChild(card);
    });

    // Update task count
    taskCount.textContent =
        `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`;

    // Show or hide empty message
    emptyMessage.hidden = filteredTasks.length !== 0;
}


// ==========================================
//              FILTER BUTTONS
// ==========================================

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        renderTasks();
    });

});


// ==========================================
//              SEARCH AND SORT
// ==========================================

searchInput.addEventListener("input", renderTasks);

sortSelect.addEventListener("change", renderTasks);


// ==========================================
//              INITIAL LOAD
// ==========================================

loadTasks();
