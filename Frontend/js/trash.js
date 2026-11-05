
// ==========================================
//              NEXtask TRASH
// ==========================================

// Backend API
const API_URL = "http://127.0.0.1:5000/api";

// Store deleted tasks
let tasks = [];

// Get HTML elements
const trashList = document.getElementById("trash-list");
const trashCount = document.getElementById("trash-count");
const emptyTrashButton = document.getElementById("empty-trash-btn");
const trashEmptyMessage = document.getElementById("trash-empty");


// ==========================================
//              API FUNCTION
// ==========================================

async function apiRequest(endpoint, method = "GET") {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}


// ==========================================
//              HELPER FUNCTIONS
// ==========================================

// Prevent task text from being treated as HTML
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


// Format date
function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


// ==========================================
//              LOAD TRASH
// ==========================================

async function loadTrash() {
    try {
        const data = await apiRequest("/trash");

        // Support either a direct array or an object containing tasks
        tasks = Array.isArray(data)
            ? data
            : (data.tasks || data.trash || []);

        renderTrash();

    } catch (error) {
        console.error("Error loading Trash:", error);
        trashList.innerHTML = `
            <p class="error-message">
                Could not connect to the server. Please refresh the page.
            </p>
        `;
    }
}


// ==========================================
//              CREATE TRASH CARD
// ==========================================

function createTrashCard(task) {
    const card = document.createElement("article");
    card.className = "trash-task-card";

    const status = task.completed ? "Completed" : "Pending";

    card.innerHTML = `
        <h3>${escapeHTML(task.title || "Untitled Task")}</h3>

        <p class="trash-task-description">
            ${escapeHTML(task.description || "No description provided.")}
        </p>

        <div class="trash-task-meta">
            <span class="trash-tag">
                ${escapeHTML(task.category || "Other")}
            </span>

            <span class="trash-tag">
                ${escapeHTML(task.priority || "Medium")} Priority
            </span>

            <span class="trash-tag">
                ${formatDate(task.dueDate)}
            </span>

            <span class="trash-task-status">
                ${status}
            </span>
        </div>

        <div class="trash-task-actions">
            <button class="restore-task-btn" type="button">
                Restore
            </button>

            <button class="permanent-delete-btn" type="button">
                Delete Permanently
            </button>
        </div>
    `;


    // Restore task
    const restoreButton = card.querySelector(".restore-task-btn");

    restoreButton.addEventListener("click", async () => {
        try {
            await apiRequest(
                `/tasks/${task.id}/restore`,
                "PATCH"
            );

            await loadTrash();

        } catch (error) {
            console.error("Restore error:", error);
            alert("Could not restore this task.");
        }
    });


    // Permanently delete task
    const deleteButton = card.querySelector(".permanent-delete-btn");

    deleteButton.addEventListener("click", async () => {
        const confirmed = confirm(
            "Are you sure you want to permanently delete this task?"
        );

        if (!confirmed) return;

        try {
            await apiRequest(
                `/tasks/${task.id}/permanent`,
                "DELETE"
            );

            await loadTrash();

        } catch (error) {
            console.error("Delete error:", error);
            alert("Could not delete this task.");
        }
    });

    return card;
}


// ==========================================
//              RENDER TRASH
// ==========================================

function renderTrash() {
    const deletedTasks = tasks;

    trashList.innerHTML = "";

    deletedTasks.forEach(task => {
        trashList.appendChild(createTrashCard(task));
    });


    // Update count
    trashCount.textContent =
        `${deletedTasks.length} ${deletedTasks.length === 1 ? "task" : "tasks"}`;


    // Show or hide empty message
    trashEmptyMessage.hidden = deletedTasks.length !== 0;


    // Disable Empty Trash button if Trash is empty
    emptyTrashButton.disabled = deletedTasks.length === 0;
}


// ==========================================
//              EMPTY TRASH
// ==========================================

emptyTrashButton.addEventListener("click", async () => {
    if (tasks.length === 0) return;

    const confirmed = confirm(
        "Are you sure you want to permanently delete all tasks in Trash?"
    );

    if (!confirmed) return;

    try {
        await apiRequest("/trash", "DELETE");

        await loadTrash();

    } catch (error) {
        console.error("Empty Trash error:", error);
        alert("Could not empty Trash.");
    }
});


// ==========================================
//              INITIAL LOAD
// ==========================================

loadTrash();
