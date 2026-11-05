
// ==========================================
//              NEXtask SETTINGS
// ==========================================

// Backend API
const API_URL = "http://127.0.0.1:5000/api";


// ==========================================
//              LOAD SETTINGS
// ==========================================

let settings = JSON.parse(localStorage.getItem("nextask_settings")) || {
    theme: "dark",
    defaultPriority: "Medium",
    defaultCategory: "Work"
};


// ==========================================
//              HTML ELEMENTS
// ==========================================

const themeSetting = document.getElementById("theme-setting");
const prioritySetting = document.getElementById("default-priority");
const categorySetting = document.getElementById("default-category");
const exportButton = document.getElementById("export-backup");
const importInput = document.getElementById("import-backup");


// ==========================================
//              API FUNCTION
// ==========================================

async function apiRequest(endpoint, method = "GET", body = null) {

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Server request failed.");
    }

    return data;
}


// ==========================================
//              SAVE SETTINGS
// ==========================================

function saveSettings() {
    localStorage.setItem(
        "nextask_settings",
        JSON.stringify(settings)
    );
}


// ==========================================
//              APPLY THEME
// ==========================================

function applyTheme() {

    if (settings.theme === "light") {
        document.documentElement.classList.add("light-theme");
    } else {
        document.documentElement.classList.remove("light-theme");
    }

}


// ==========================================
//              LOAD SETTINGS INTO PAGE
// ==========================================

function loadSettings() {

    themeSetting.value = settings.theme;
    prioritySetting.value = settings.defaultPriority;
    categorySetting.value = settings.defaultCategory;

    applyTheme();

}


// ==========================================
//              THEME EVENT
// ==========================================

themeSetting.addEventListener("change", () => {

    settings.theme = themeSetting.value;

    saveSettings();
    applyTheme();

});


// ==========================================
//              DEFAULT PRIORITY EVENT
// ==========================================

prioritySetting.addEventListener("change", () => {

    settings.defaultPriority = prioritySetting.value;

    saveSettings();

});


// ==========================================
//              DEFAULT CATEGORY EVENT
// ==========================================

categorySetting.addEventListener("change", () => {

    settings.defaultCategory = categorySetting.value;

    saveSettings();

});


// ==========================================
//              EXPORT BACKUP
// ==========================================

exportButton.addEventListener("click", async () => {

    try {

        // Fetch active and deleted tasks from backend
        const [activeTasks, deletedTasks] = await Promise.all([
            apiRequest("/tasks"),
            apiRequest("/trash")
        ]);

        // Combine both lists
        const allTasks = [...activeTasks, ...deletedTasks];

        // Create backup data
        const backupData = {
            app: "NexTask",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            tasks: allTasks,
            settings: settings
        };

        // Create JSON backup file
        const backupFile = new Blob(
            [JSON.stringify(backupData, null, 4)],
            { type: "application/json" }
        );

        const downloadURL = URL.createObjectURL(backupFile);

        const downloadLink = document.createElement("a");

        downloadLink.href = downloadURL;
        downloadLink.download = "NexTask_Backup.json";

        document.body.appendChild(downloadLink);

        downloadLink.click();
        downloadLink.remove();

        URL.revokeObjectURL(downloadURL);

        alert("Backup exported successfully!");

    } catch (error) {

        console.error("Backup export error:", error);

        alert("Could not export backup. Please check your backend connection.");

    }

});


// ==========================================
//              IMPORT BACKUP
// ==========================================

importInput.addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {

        try {

            const backupData = JSON.parse(reader.result);

            // Validate backup structure
            if (
                backupData.app !== "NexTask" ||
                !Array.isArray(backupData.tasks) ||
                !backupData.settings ||
                typeof backupData.settings !== "object"
            ) {

                alert("Invalid NexTask backup file.");
                return;

            }


            // Validate task structure
            const validTasks = backupData.tasks.every(task =>

                task &&
                typeof task.title === "string" &&
                task.title.trim() !== "" &&
                typeof task.description === "string" &&
                typeof task.category === "string" &&
                typeof task.priority === "string" &&
                typeof task.dueDate === "string" &&
                typeof task.completed === "boolean" &&
                typeof task.deleted === "boolean" &&
                typeof task.createdAt === "string" &&
                task.createdAt.trim() !== ""

            );


            if (!validTasks) {

                alert("The backup contains invalid task data.");
                return;

            }


            // Validate task categories and priorities
            const validCategories = [
                "Work",
                "Study",
                "Personal",
                "Other"
            ];

            const validPriorities = [
                "High",
                "Medium",
                "Low"
            ];

            const invalidOptions = backupData.tasks.some(task =>
                !validCategories.includes(task.category) ||
                !validPriorities.includes(task.priority)
            );


            if (invalidOptions) {

                alert("The backup contains invalid categories or priorities.");
                return;

            }


            // Validate settings
            const importedSettings = backupData.settings;

            if (
                !["dark", "light"].includes(importedSettings.theme) ||
                !["High", "Medium", "Low"].includes(importedSettings.defaultPriority) ||
                !["Work", "Study", "Personal", "Other"].includes(importedSettings.defaultCategory)
            ) {

                alert("The backup contains invalid settings.");
                return;

            }


            // Ask for confirmation
            const confirmed = confirm(
                "Importing this backup will replace your current tasks and settings. Continue?"
            );

            if (!confirmed) return;


            // Send tasks to backend
            await apiRequest(
                "/tasks/backup",
                "POST",
                {
                    tasks: backupData.tasks
                }
            );


            // Restore settings
            settings = {
                theme: importedSettings.theme,
                defaultPriority: importedSettings.defaultPriority,
                defaultCategory: importedSettings.defaultCategory
            };

            saveSettings();

            alert("Backup imported successfully!");

            // Reload page
            window.location.reload();


        } catch (error) {

            console.error("Backup import error:", error);

            alert(
                error.message === "Failed to fetch"
                    ? "Could not connect to the backend."
                    : "Could not import backup. " + error.message
            );

        } finally {

            importInput.value = "";

        }

    };

    reader.readAsText(file);

});


// ==========================================
//              INITIAL SETUP
// ==========================================

loadSettings();
