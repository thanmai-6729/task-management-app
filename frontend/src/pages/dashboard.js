import api from '../utils/api.js';
import toast from '../utils/toast.js';

/**
 * @fileoverview Dashboard logic for managing tasks, filtering, searching, and statistics.
 * @author Thanmai
 */

// Auth Check
const userString = localStorage.getItem('user');
if (!localStorage.getItem('token') || !userString) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userString);
document.getElementById('user-name').textContent = user.name;

// Global State
let allTasks = [];
let filteredTasks = [];
let isLoading = false;
let statsCache = { data: null, timestamp: 0 };

// Filter & Sort State (Persisted)
const filterState = JSON.parse(localStorage.getItem('filterState')) || {
    status: 'All',
    priority: 'All',
    search: '',
    sortBy: 'created_at',
    order: 'DESC'
};

// DOM Elements
const tasksGrid = document.getElementById('tasks-grid');
const emptyState = document.getElementById('empty-state');
const logoutBtn = document.getElementById('logout-btn');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const taskForm = document.getElementById('task-form');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const orderToggle = document.getElementById('order-toggle');

// Initialize
initDashboard();

/**
 * Initializes the dashboard by setting up listeners and fetching data.
 */
async function initDashboard() {
    setupEventListeners();
    applyPersistedFilters();
    await fetchDashboardData();
}

/**
 * Sets up all DOM event listeners and keyboard shortcuts.
 */
function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
    addTaskBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    taskForm.addEventListener('submit', handleTaskSubmit);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && taskModal.classList.contains('active')) closeModal();
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openModal();
        }
        if (e.key === '/') {
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInput.focus();
            }
        }
    });

    // Debounced Search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterState.search = e.target.value.toLowerCase();
            saveState();
            applyFiltersAndRender();
        }, 300);
    });

    // Filtering
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterState.status = btn.dataset.status;
            saveState();
            applyFiltersAndRender();
        });
    });

    // Sorting
    sortSelect.addEventListener('change', (e) => {
        filterState.sortBy = e.target.value;
        saveState();
        applyFiltersAndRender();
    });

    orderToggle.addEventListener('click', () => {
        filterState.order = filterState.order === 'ASC' ? 'DESC' : 'ASC';
        orderToggle.innerHTML = filterState.order === 'ASC' ? '<i class="fas fa-sort-amount-up"></i>' : '<i class="fas fa-sort-amount-down"></i>';
        saveState();
        applyFiltersAndRender();
    });
}

/**
 * Applies filters from localStorage to the UI on load.
 */
function applyPersistedFilters() {
    searchInput.value = filterState.search;
    sortSelect.value = filterState.sortBy;
    orderToggle.innerHTML = filterState.order === 'ASC' ? '<i class="fas fa-sort-amount-up"></i>' : '<i class="fas fa-sort-amount-down"></i>';

    filterBtns.forEach(btn => {
        if (btn.dataset.status === filterState.status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Saves current filter/sort state to localStorage.
 */
function saveState() {
    localStorage.setItem('filterState', JSON.stringify(filterState));
}

/**
 * Fetches tasks and statistics from the API.
 */
async function fetchDashboardData() {
    if (isLoading) return;
    showSkeletons();
    isLoading = true;

    try {
        // Use cached stats if available and not expired (5 mins)
        const now = Date.now();
        let stats;
        if (statsCache.data && (now - statsCache.timestamp < 300000)) {
            stats = statsCache.data;
        } else {
            const statsRes = await api.get('/tasks/stats');
            stats = statsRes.data;
            statsCache = { data: stats, timestamp: now };
        }

        const tasksRes = await api.get('/tasks');
        allTasks = tasksRes.data;

        updateStatsUI(stats);
        applyFiltersAndRender();
    } catch (error) {
        toast.error('Failed to sync with server. Check your connection.');
    } finally {
        isLoading = false;
    }
}

/**
 * Displays skeleton loading UI while fetching data.
 */
function showSkeletons() {
    tasksGrid.innerHTML = Array(6).fill(0).map(() => `
        <div class="task-card">
            <div style="display:flex; gap:0.5rem">
                <div class="skeleton" style="width:80px; height:24px"></div>
                <div class="skeleton" style="width:60px; height:24px"></div>
            </div>
            <div class="skeleton" style="width:100%; height:20px; margin-top:1rem"></div>
            <div class="skeleton" style="width:80%; height:16px; margin-top:0.5rem"></div>
            <div class="task-footer" style="border:none">
                <div class="skeleton" style="width:100px; height:16px"></div>
                <div class="skeleton" style="width:40px; height:16px"></div>
            </div>
        </div>
    `).join('');
}

/**
 * Updates the statistics board with current data.
 * @param {Object} stats - The statistics object from API.
 */
function updateStatsUI(stats) {
    const total = stats.total_tasks || 0;
    const completed = stats.completed_count || 0;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update main counts
    animateValue('stat-total', total);
    animateValue('stat-pending', stats.pending_count);
    animateValue('stat-in-progress', stats.in_progress_count);
    animateValue('stat-completed', completed);

    // Update progress bars
    document.getElementById('completion-rate').textContent = `${rate}%`;
    document.getElementById('completion-bar').style.width = `${rate}%`;

    // Highlight overdue
    const overdueEl = document.getElementById('stat-overdue');
    if (overdueEl) {
        overdueEl.textContent = stats.overdue_count;
        overdueEl.closest('.stat-card').style.borderColor = stats.overdue_count > 0 ? 'var(--high)' : 'var(--gray-100)';
    }
}

/**
 * Animates a numeric value change in the UI.
 * @param {string} id - The DOM element ID.
 * @param {number} value - The target value.
 */
function animateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 500;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        el.textContent = Math.floor(progress * (value - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}

/**
 * Applies current status/search/sort filters and triggers a re-render.
 */
function applyFiltersAndRender() {
    filteredTasks = [...allTasks];

    // Status Filter
    if (filterState.status !== 'All') {
        filteredTasks = filteredTasks.filter(t => t.status === filterState.status);
    }

    // Search
    if (filterState.search) {
        filteredTasks = filteredTasks.filter(t =>
            t.title.toLowerCase().includes(filterState.search) ||
            (t.description && t.description.toLowerCase().includes(filterState.search))
        );
    }

    // Sorting
    filteredTasks.sort((a, b) => {
        let valA = a[filterState.sortBy];
        let valB = b[filterState.sortBy];

        if (filterState.sortBy === 'priority') {
            const weights = { High: 3, Medium: 2, Low: 1 };
            valA = weights[valA];
            valB = weights[valB];
        }

        if (valA < valB) return filterState.order === 'ASC' ? -1 : 1;
        if (valA > valB) return filterState.order === 'ASC' ? 1 : -1;
        return 0;
    });

    renderTasks();
}

/**
 * Renders the filtered tasks into the grid.
 */
function renderTasks() {
    if (filteredTasks.length === 0) {
        tasksGrid.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        tasksGrid.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');

        // Dynamic event binding
        tasksGrid.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => openModal(allTasks.find(t => t.id == btn.dataset.id));
        });
        tasksGrid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => handleDelete(btn.dataset.id);
        });
    }
}

/**
 * Creates HTML string for a task card.
 * @param {Object} task - Task data.
 * @returns {string} - HTML string.
 */
function createTaskCard(task) {
    const statusClass = task.status.toLowerCase().replace(' ', '-');
    const priorityClass = task.priority.toLowerCase();
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed';

    const formattedDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : 'No due date';

    return `
        <div class="task-card ${isOverdue ? 'overdue-border' : ''}">
            <div class="task-badges">
                <span class="badge status-${statusClass}">
                    <i class="fas ${getStatusIcon(task.status)}"></i>
                    ${task.status}
                </span>
                <span class="badge priority-${priorityClass}">
                    <i class="fas fa-flag"></i>
                    ${task.priority}
                </span>
                ${isOverdue ? '<span class="badge overdue"><i class="fas fa-exclamation-triangle"></i> Overdue</span>' : ''}
            </div>
            <h3 class="task-title">${task.title}</h3>
            <p class="task-desc">${task.description || 'No description provided.'}</p>
            <div class="task-footer">
                <div class="due-date ${isOverdue ? 'color-high' : ''}">
                    <i class="far fa-calendar"></i>
                    ${formattedDate}
                </div>
                <div class="task-actions">
                    <button class="action-btn btn-edit" data-id="${task.id}" title="Edit Task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete btn-delete" data-id="${task.id}" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Returns FontAwesome icon class based on status.
 */
function getStatusIcon(status) {
    switch (status) {
        case 'Completed': return 'fa-check-circle';
        case 'In Progress': return 'fa-spinner';
        default: return 'fa-clock';
    }
}

/**
 * Opens the task modal for adding or editing.
 * @param {Object|null} task - Task to edit, or null for new.
 */
function openModal(task = null) {
    const modalTitle = document.getElementById('modal-title');
    const saveBtn = document.getElementById('save-task-btn');

    taskForm.reset();
    document.getElementById('task-id').value = '';

    if (task) {
        modalTitle.textContent = 'Edit Task';
        saveBtn.textContent = 'Update Task';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        if (task.due_date) {
            document.getElementById('task-due-date').value = task.due_date.split('T')[0];
        }
    } else {
        modalTitle.textContent = 'Add New Task';
        saveBtn.textContent = 'Save Task';
    }

    taskModal.classList.add('active');
    setTimeout(() => document.getElementById('task-title').focus(), 100);
}

/**
 * Closes the active modal.
 */
function closeModal() {
    taskModal.classList.remove('active');
}

/**
 * Handles the task form submission for both CREATE and UPDATE.
 */
async function handleTaskSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        due_date: document.getElementById('task-due-date').value || null
    };

    const saveBtn = document.getElementById('save-task-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="loading-spinner"></div>';
    saveBtn.disabled = true;

    try {
        let response;
        if (id) {
            // Optimistic update
            const idx = allTasks.findIndex(t => t.id == id);
            const oldTask = allTasks[idx];
            allTasks[idx] = { ...oldTask, ...taskData };
            applyFiltersAndRender();

            response = await api.put(`/tasks/${id}`, taskData);
            if (response.success) toast.success('Changes saved');
        } else {
            response = await api.post('/tasks', taskData);
            if (response.success) toast.success('Task created');
        }

        if (response.success) {
            closeModal();
            fetchDashboardData(); // Full refresh to sync stats
        }
    } catch (error) {
        toast.error(error.message);
        fetchDashboardData(); // Revert on error
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

/**
 * Handles task deletion with optimistic UI update and server confirmation.
 */
async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

    try {
        // Optimistic delete
        allTasks = allTasks.filter(t => t.id != id);
        applyFiltersAndRender();

        const response = await api.delete(`/tasks/${id}`);
        if (response.success) {
            toast.success('Task removed');
            fetchDashboardData(); // Sync stats
        }
    } catch (error) {
        toast.error('Failed to delete task');
        fetchDashboardData();
    }
}

/**
 * Clears storage and redirects to login.
 */
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
