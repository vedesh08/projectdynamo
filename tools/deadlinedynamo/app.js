// State
let tasks = [];
let categories = [];
let currentView = 'home';
let currentFilter = 'all';
let currentSort = 'created';
let currentSearch = '';
let currentCategoryFilter = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedReportDate = null;
let editingTaskId = null;
let editingCategoryId = null;
let confirmCallback = null;

// Colors for categories
const categoryColorOptions = [
    '#F6AD55', '#68D391', '#FC8181', '#63B3ED', '#B794F4', '#F687B3', '#F6E05E', '#4FD1C5'
];

// Initialize
function init() {
    loadData();
    renderAll();
    setupEventListeners();
}

// Data Management
function loadData() {
    const storedTasks = localStorage.getItem('deadline_dynamo_tasks');
    const storedCategories = localStorage.getItem('deadline_dynamo_categories');

    tasks = storedTasks ? JSON.parse(storedTasks) : [];
    categories = storedCategories ? JSON.parse(storedCategories) : [];

    // Add default categories if none exist
    if (categories.length === 0) {
        categories = [
            { id: generateId(), name: 'Work', color: '#F6AD55', createdAt: Date.now() },
            { id: generateId(), name: 'Personal', color: '#68D391', createdAt: Date.now() },
            { id: generateId(), name: 'Health', color: '#FC8181', createdAt: Date.now() },
            { id: generateId(), name: 'Learning', color: '#63B3ED', createdAt: Date.now() }
        ];
        saveCategories();
    }
}

function saveTasks() {
    localStorage.setItem('deadline_dynamo_tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('deadline_dynamo_categories', JSON.stringify(categories));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Render Functions
function renderAll() {
    renderTaskList();
    renderReport();
    renderCalendar();
    renderCategories();
    updateCounts();
    updateCategorySelect();

    // Update progress based on current view
    if (currentView === 'home') {
        updateHomePageProgress();
    } else if (currentView === 'report') {
        update7DayProgress();
    } else if (currentView === 'calendar') {
        updateCalendarProgress();
    }
}

function updateCounts() {
    // Sidebar - Total tasks in portal (all time)
    const totalTasks = tasks.length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    const totalPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    document.getElementById('sidebar-progress-fill').style.width = totalPercentage + '%';
    document.getElementById('sidebar-completed').textContent = totalCompleted;
    document.getElementById('sidebar-total').textContent = totalTasks;
}

function updateHomePageProgress() {
    // Check if category filter is active
    if (currentCategoryFilter) {
        // Show category tasks progress
        const category = categories.find(c => c.id === currentCategoryFilter);
        const categoryTasks = tasks.filter(t => t.category === currentCategoryFilter);
        const categoryCompleted = categoryTasks.filter(t => t.completed).length;
        const percentage = categoryTasks.length > 0 ? Math.round((categoryCompleted / categoryTasks.length) * 100) : 0;

        document.getElementById('progress-title').textContent = category ? category.name + ' Tasks' : 'Category Tasks';
        document.getElementById('progress-percentage').textContent = percentage + '%';
        document.getElementById('progress-fill').style.width = percentage + '%';
        document.getElementById('progress-completed').textContent = categoryCompleted;
        document.getElementById('progress-total').textContent = categoryTasks.length;

        document.getElementById('count-total').textContent = categoryTasks.length;
        document.getElementById('count-active').textContent = categoryTasks.filter(t => !t.completed && !t.canceled).length;
        document.getElementById('count-completed').textContent = categoryCompleted;
    } else {
        // Show today's tasks progress
        const today = getLocalDateString(new Date());
        const todayTasks = tasks.filter(t => t.dueDate === today);
        const todayCompleted = todayTasks.filter(t => t.completed).length;
        const todayPercentage = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

        document.getElementById('progress-title').textContent = "Today's Tasks";
        document.getElementById('progress-percentage').textContent = todayPercentage + '%';
        document.getElementById('progress-fill').style.width = todayPercentage + '%';
        document.getElementById('progress-completed').textContent = todayCompleted;
        document.getElementById('progress-total').textContent = todayTasks.length;

        document.getElementById('count-total').textContent = todayTasks.length;
        document.getElementById('count-active').textContent = todayTasks.filter(t => !t.completed && !t.canceled).length;
        document.getElementById('count-completed').textContent = todayCompleted;
    }
}

function update7DayProgress() {
    // 7-Day Report - Tasks in next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sevenDayTasks = tasks.filter(t => {
        if (!t.dueDate || t.completed || t.canceled) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < nextWeek;
    });

    const sevenDayCompleted = tasks.filter(t => {
        if (!t.dueDate || !t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < nextWeek;
    }).length;

    const percentage = sevenDayTasks.length > 0 ? Math.round((sevenDayCompleted / (sevenDayTasks.length + sevenDayCompleted)) * 100) : 0;

    // Update 7-day view progress if it exists
    const progressEl = document.getElementById('report-progress');
    if (progressEl) {
        progressEl.innerHTML = `
            <div class="report-progress-bar">
                <div class="report-progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span>${sevenDayCompleted}/${sevenDayTasks.length + sevenDayCompleted} completed</span>
        `;
    }
}

function updateCalendarProgress() {
    // Calendar - Current month tasks
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const monthTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= firstDay && dueDate <= lastDay;
    });

    const monthCompleted = monthTasks.filter(t => t.completed).length;
    const percentage = monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0;

    // Update calendar view progress if it exists
    const progressEl = document.getElementById('calendar-progress');
    if (progressEl) {
        progressEl.innerHTML = `
            <div class="calendar-progress-bar">
                <div class="calendar-progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span>${monthCompleted}/${monthTasks.length} completed</span>
        `;
    }
}

function updateCategorySelect() {
    const select = document.getElementById('task-category');
    select.innerHTML = '<option value="">No Category</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

function getFilteredTasks() {
    let filtered = [...tasks];

    // Filter by category
    if (currentCategoryFilter) {
        filtered = filtered.filter(t => t.category === currentCategoryFilter);
    }

    // Filter by status
    switch (currentFilter) {
        case 'active':
            filtered = filtered.filter(t => !t.completed && !t.canceled);
            break;
        case 'completed':
            filtered = filtered.filter(t => t.completed);
            break;
        case 'canceled':
            filtered = filtered.filter(t => t.canceled);
            break;
        case 'starred':
            filtered = filtered.filter(t => t.starred);
            break;
    }

    // Search
    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search))
        );
    }

    // Sort
    filtered.sort((a, b) => {
        switch (currentSort) {
            case 'dueDate':
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'category':
                return (a.category || '').localeCompare(b.category || '');
            case 'created':
            default:
                return b.createdAt - a.createdAt;
        }
    });

    return filtered;
}

function renderTaskList() {
    const container = document.getElementById('task-list');
    const filtered = getFilteredTasks();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                    <line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
                <h3>No tasks found</h3>
                <p>Create your first task to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(task => {
        const category = categories.find(c => c.id === task.category);
        const isOverdue = task.dueDate && !task.completed && !task.canceled && new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0);

        return `
            <div class="task-card ${task.completed ? 'completed' : ''} ${task.canceled ? 'canceled' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                    </div>
                    <span class="task-title">${escapeHtml(task.title)}</span>
                    <div class="task-actions">
                        <button class="task-action-btn ${task.starred ? 'starred' : ''}" data-action="star" data-id="${task.id}" title="Star">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="${task.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                            </svg>
                        </button>
                        <button class="task-action-btn priority-${task.priority === 'high' ? 'priority-high' : ''}" data-action="priority" data-id="${task.id}" title="Priority">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5"/>
                                <path d="M2 12l10 5 10-5"/>
                            </svg>
                        </button>
                        <div class="task-dropdown">
                            <button class="task-action-btn" data-action="more" data-id="${task.id}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="12" cy="5" r="1"/>
                                    <circle cx="12" cy="19" r="1"/>
                                </svg>
                            </button>
                            <div class="dropdown-menu" id="dropdown-${task.id}">
                                <button class="dropdown-item" data-action="edit" data-id="${task.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Edit
                                </button>
                                <button class="dropdown-item" data-action="shift" data-id="${task.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="17,1 21,5 17,9"/>
                                        <path d="M3 11V9a4 4 0 014-4h14"/>
                                        <polyline points="7,23 3,19 7,15"/>
                                        <path d="M21 13v2a4 4 0 01-4 4H3"/>
                                    </svg>
                                    Shift to Tomorrow
                                </button>
                                <button class="dropdown-item" data-action="duplicate" data-id="${task.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                    </svg>
                                    Duplicate
                                </button>
                                <button class="dropdown-item" data-action="cancel" data-id="${task.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="15" y1="9" x2="9" y2="15"/>
                                        <line x1="9" y1="9" x2="15" y2="15"/>
                                    </svg>
                                    Cancel
                                </button>
                                <button class="dropdown-item danger" data-action="delete" data-id="${task.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3,6 5,6 21,6"/>
                                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${category ? `<span class="task-badge category">${escapeHtml(category.name)}</span>` : ''}
                    <span class="task-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                    ${task.dueDate ? `<span class="task-badge ${isOverdue ? 'overdue' : ''}">${formatDate(task.dueDate)}${task.dueTime ? ' ' + task.dueTime : ''}</span>` : '<span class="task-badge">No deadline</span>'}
                </div>
            </div>
        `;
    }).join('');
}

function renderReport() {
    const container = document.getElementById('report-grid');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active tasks (not completed, not canceled)
    const activeTasks = tasks.filter(t => !t.completed && !t.canceled);

    // Tasks with due dates in the 7-day range
    const days = [];
    for (let i = 3; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({ date, type: 'past', label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) });
    }
    days.push({ date: new Date(today), type: 'today', label: 'Today' });
    for (let i = 1; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        days.push({ date, type: 'future', label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) });
    }

    // Tasks without due date
    const noDateTasks = activeTasks.filter(t => !t.dueDate);

    let html = '';

    // Render each day section
    days.forEach(day => {
        const dateStr = getLocalDateString(day.date);
        const dayTasks = activeTasks.filter(t => t.dueDate === dateStr);
        const completed = dayTasks.filter(t => t.completed);
        const incomplete = dayTasks.filter(t => !t.completed && !t.canceled);

        html += `
            <div class="report-section ${day.type}" onclick="showReportDateTasks('${dateStr}')" style="cursor: pointer;">
                <h3>${day.type === 'today' ? 'Today' : day.label} <span class="report-date">${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></h3>
                ${dayTasks.length === 0 ? '<div class="report-empty">No tasks - Click to add</div>' : `
                    <div class="report-tasks">
                        ${incomplete.map(t => `
                            <div class="report-task">
                                <span class="report-task-title">${escapeHtml(t.title)}</span>
                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); completeTask('${t.id}')">Complete</button>
                            </div>
                        `).join('')}
                        ${completed.map(t => `
                            <div class="report-task completed">
                                <span class="report-task-title">${escapeHtml(t.title)}</span>
                                <span style="color: var(--success)">Done</span>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    });

    // Add "No Due Date" section for tasks without due date
    if (noDateTasks.length > 0) {
        html += `
            <div class="report-section" onclick="showReportDateTasks('noduedate')" style="cursor: pointer;">
                <h3>No Due Date <span class="report-date">${noDateTasks.length} task${noDateTasks.length > 1 ? 's' : ''}</span></h3>
                <div class="report-tasks">
                    ${noDateTasks.map(t => `
                        <div class="report-task">
                            <span class="report-task-title">${escapeHtml(t.title)}</span>
                            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); completeTask('${t.id}')">Complete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateString(today);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = days.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += '<div class="calendar-day past" style="visibility: hidden;"></div>';
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = getLocalDateString(date);
        const isToday = dateStr === todayStr;
        const isPast = date < today;
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        const highCount = dayTasks.filter(t => t.priority === 'high' && !t.completed).length;
        const mediumCount = dayTasks.filter(t => t.priority === 'medium' && !t.completed).length;
        const lowCount = dayTasks.filter(t => t.priority === 'low' && !t.completed).length;

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}" data-date="${dateStr}">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-tasks-count">
                    ${Array(highCount).fill('<span class="calendar-task-dot high"></span>').join('')}
                    ${Array(mediumCount).fill('<span class="calendar-task-dot medium"></span>').join('')}
                    ${Array(lowCount).fill('<span class="calendar-task-dot low"></span>').join('')}
                    ${dayTasks.length > 0 ? `<span>${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function showSelectedDateTasks(dateStr) {
    const panel = document.getElementById('selected-date-tasks');
    const titleEl = document.getElementById('selected-date-title');
    const listEl = document.getElementById('selected-date-task-list');

    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    titleEl.textContent = `Tasks for ${formattedDate}`;

    // Get all tasks for this date (including completed and canceled)
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);

    if (dayTasks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="padding: 30px;">
                <p>No tasks for this date</p>
                <button class="btn btn-primary btn-sm" onclick="openTaskModalWithDate('${dateStr}')" style="margin-top: 12px;">
                    Add Task
                </button>
            </div>
        `;
    } else {
        listEl.innerHTML = dayTasks.map(task => {
            const category = categories.find(c => c.id === task.category);
            return `
                <div class="task-card ${task.completed ? 'completed' : ''} ${task.canceled ? 'canceled' : ''}" data-id="${task.id}">
                    <div class="task-header">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="completeTask('${task.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20,6 9,17 4,12"/>
                            </svg>
                        </div>
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        <div class="task-actions">
                            <button class="task-action-btn" onclick="editTask('${task.id}')">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        ${category ? `<span class="task-badge category">${escapeHtml(category.name)}</span>` : ''}
                        <span class="task-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        ${task.dueTime ? `<span class="task-badge">${task.dueTime}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    panel.style.display = 'block';
}

function showReportDateTasks(dateStr) {
    const panel = document.getElementById('report-selected-tasks');
    const titleEl = document.getElementById('report-selected-date-title');
    const listEl = document.getElementById('report-selected-task-list');

    selectedReportDate = dateStr;

    let formattedDate, dayTasks;

    if (dateStr === 'noduedate') {
        formattedDate = 'No Due Date';
        dayTasks = tasks.filter(t => !t.dueDate && !t.completed && !t.canceled);
    } else {
        const date = new Date(dateStr);
        formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        dayTasks = tasks.filter(t => t.dueDate === dateStr);
    }

    titleEl.textContent = `Tasks for ${formattedDate}`;

    if (dayTasks.length === 0) {
        const addDateParam = dateStr === 'noduedate' ? '' : `, '${dateStr}'`;
        listEl.innerHTML = `
            <div class="empty-state" style="padding: 30px;">
                <p>No tasks for this date</p>
                <button class="btn btn-primary btn-sm" onclick="openTaskModal(${addDateParam})" style="margin-top: 12px;">
                    Add Task
                </button>
            </div>
        `;
    } else {
        listEl.innerHTML = dayTasks.map(task => {
            const category = categories.find(c => c.id === task.category);
            return `
                <div class="task-card ${task.completed ? 'completed' : ''} ${task.canceled ? 'canceled' : ''}" data-id="${task.id}">
                    <div class="task-header">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="completeTask('${task.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20,6 9,17 4,12"/>
                            </svg>
                        </div>
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        <div class="task-actions">
                            <button class="task-action-btn" onclick="editTask('${task.id}')">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        ${category ? `<span class="task-badge category">${escapeHtml(category.name)}</span>` : ''}
                        <span class="task-badge priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        ${task.dueTime ? `<span class="task-badge">${task.dueTime}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    panel.style.display = 'block';
}

function renderCategories() {
    const container = document.getElementById('categories-grid');

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg>
                <h3>No categories</h3>
                <p>Create categories to organize your tasks!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(cat => {
        const count = tasks.filter(t => t.category === cat.id).length;
        return `
            <div class="category-card" data-id="${cat.id}">
                <div class="category-color" style="background: ${cat.color}"></div>
                <div class="category-actions">
                    <button class="category-edit-btn" data-id="${cat.id}" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="category-delete-btn" data-id="${cat.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="category-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                </div>
                <div class="category-name">${escapeHtml(cat.name)}</div>
                <div class="category-count">${count} task${count !== 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
}

// Event Listeners
function setupEventListeners() {
    // Hamburger
    document.getElementById('hamburger').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Navigation
    document.querySelectorAll('.nav-item, .header-nav button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;

            // Clear category filter when going to Home
            if (view === 'home') {
                currentCategoryFilter = null;
            }

            switchView(view);

            // Update active states
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.header-nav button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll(`.nav-item[data-view="${view}"]`).forEach(b => b.classList.add('active'));
            document.querySelectorAll(`.header-nav button[data-view="${view}"]`).forEach(b => b.classList.add('active'));

            // Close sidebar on mobile
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTaskList();
        });
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTaskList();
    });

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderTaskList();
    });

    // Add Task Button
    document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal());

    // Calendar Add Task Button
    document.getElementById('calendar-add-task-btn').addEventListener('click', () => openTaskModal());

    // Report Add Task Button
    document.getElementById('report-add-task-btn').addEventListener('click', () => openTaskModal());

    // Add task to selected report date
    document.getElementById('add-task-to-report-date').addEventListener('click', () => {
        if (selectedReportDate === 'noduedate') {
            openTaskModal();
        } else if (selectedReportDate) {
            openTaskModalWithDate(selectedReportDate);
        }
    });

    // Task Modal
    document.getElementById('task-modal-close').addEventListener('click', closeTaskModal);
    document.getElementById('task-modal-cancel').addEventListener('click', closeTaskModal);
    document.getElementById('task-modal-save').addEventListener('click', saveTask);

    // Priority Selector
    document.querySelectorAll('.priority-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.priority-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
        });
    });

    // Task List Actions (delegated)
    document.getElementById('task-list').addEventListener('click', handleTaskAction);

    // Calendar Navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Calendar Day Click
    document.getElementById('calendar-grid').addEventListener('click', (e) => {
        const day = e.target.closest('.calendar-day');
        if (day && day.dataset.date) {
            const dateStr = day.dataset.date;
            selectedDate = dateStr;
            showSelectedDateTasks(dateStr);
        }
    });

    // Add task to selected calendar date button
    document.getElementById('add-task-to-selected-date').addEventListener('click', () => {
        if (selectedDate) {
            openTaskModalWithDate(selectedDate);
        }
    });

    // Add Category Button
    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal());

    // Category Modal
    document.getElementById('category-modal-close').addEventListener('click', closeCategoryModal);
    document.getElementById('category-modal-cancel').addEventListener('click', closeCategoryModal);
    document.getElementById('category-modal-save').addEventListener('click', saveCategory);

    // Category Colors
    renderCategoryColorOptions();

    // Category Cards Click - View tasks in category
    document.getElementById('categories-grid').addEventListener('click', (e) => {
        const card = e.target.closest('.category-card');
        const editBtn = e.target.closest('.category-edit-btn');
        const deleteBtn = e.target.closest('.category-delete-btn');

        if (card && !editBtn && !deleteBtn) {
            const catId = card.dataset.id;
            currentCategoryFilter = catId;
            currentFilter = 'all';
            currentSearch = '';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
            switchView('home');
            updatePageTitleWithCategory(catId);
        }
    });

    // Category edit button click
    document.getElementById('categories-grid').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.category-edit-btn');
        if (editBtn) {
            e.stopPropagation();
            const catId = editBtn.dataset.id;
            const category = categories.find(c => c.id === catId);
            if (category) {
                openCategoryModal(category);
            }
        }
    });

    // Category delete button click
    document.getElementById('categories-grid').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.category-delete-btn');
        if (deleteBtn) {
            e.stopPropagation();
            const catId = deleteBtn.dataset.id;
            confirmDeleteCategory(catId);
        }
    });

    // Confirm Modal
    document.getElementById('confirm-modal-close').addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-cancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-ok').addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeConfirmModal();
    });

    // Clear All Data Button
    document.getElementById('clear-all-data-btn').addEventListener('click', () => {
        confirmClearAllData();
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.task-dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('open'));
        }
    });
}

function handleTaskAction(e) {
    const checkbox = e.target.closest('.task-checkbox');
    if (checkbox) {
        const taskId = checkbox.dataset.taskId;
        toggleComplete(taskId);
        return;
    }

    const actionBtn = e.target.closest('.task-action-btn');
    if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;

        if (action === 'more') {
            const dropdown = document.getElementById(`dropdown-${id}`);
            dropdown.classList.toggle('open');
            return;
        }

        handleDropdownAction(action, id);
        return;
    }

    const dropdownItem = e.target.closest('.dropdown-item');
    if (dropdownItem) {
        const action = dropdownItem.dataset.action;
        const id = dropdownItem.dataset.id;
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('open'));
        handleDropdownAction(action, id);
    }
}

function handleDropdownAction(action, id) {
    switch (action) {
        case 'edit':
            editTask(id);
            break;
        case 'star':
            toggleStar(id);
            break;
        case 'priority':
            cyclePriority(id);
            break;
        case 'shift':
            shiftToTomorrow(id);
            break;
        case 'duplicate':
            duplicateTask(id);
            break;
        case 'cancel':
            cancelTask(id);
            break;
        case 'delete':
            confirmDeleteTask(id);
            break;
    }
}

// Task Actions
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? Date.now() : null;
        saveTasks();
        renderAll();
        showToast(task.completed ? 'Task completed!' : 'Task marked incomplete');
    }
}

function completeTask(id) {
    toggleComplete(id);
}

function toggleStar(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.starred = !task.starred;
        saveTasks();
        renderTaskList();
        showToast(task.starred ? 'Task starred' : 'Star removed');
    }
}

function cyclePriority(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const priorities = ['low', 'medium', 'high'];
        const currentIndex = priorities.indexOf(task.priority);
        task.priority = priorities[(currentIndex + 1) % 3];
        saveTasks();
        renderTaskList();
    }
}

function shiftToTomorrow(id) {
    const task = tasks.find(t => t.id === id);
    if (task && task.dueDate) {
        const date = new Date(task.dueDate);
        date.setDate(date.getDate() + 1);
        task.dueDate = getLocalDateString(date);
        saveTasks();
        renderAll();
        showToast('Task shifted to tomorrow');
    } else {
        showToast('Set a due date first');
    }
}

function duplicateTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newTask = {
            ...task,
            id: generateId(),
            title: task.title + ' (copy)',
            createdAt: Date.now(),
            completed: false,
            completedAt: null,
            canceled: false
        };
        tasks.push(newTask);
        saveTasks();
        renderAll();
        showToast('Task duplicated');
    }
}

function cancelTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.canceled = !task.canceled;
        saveTasks();
        renderAll();
        showToast(task.canceled ? 'Task canceled' : 'Task restored');
    }
}

function confirmDeleteTask(id) {
    document.getElementById('confirm-message').textContent = 'Are you sure you want to delete this task?';
    confirmCallback = () => {
        deleteTask(id);
    };
    document.getElementById('confirm-modal').classList.add('open');
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
    showToast('Task deleted');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        openTaskModal(task);
    }
}

// Modal Functions
function openTaskModal(task = null) {
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('task-modal-title');
    const saveBtn = document.getElementById('task-modal-save');

    editingTaskId = task ? task.id : null;

    if (task) {
        title.textContent = 'Edit Task';
        saveBtn.textContent = 'Update Task';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title-input').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-category').value = task.category || '';
        document.getElementById('task-due-date').value = task.dueDate || '';
        document.getElementById('task-due-time').value = task.dueTime || '';

        // Set priority
        document.querySelectorAll('.priority-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.priority === task.priority);
        });
    } else {
        title.textContent = 'Add New Task';
        saveBtn.textContent = 'Save Task';
        document.getElementById('task-form').reset();
        document.getElementById('task-id').value = '';
        document.querySelectorAll('.priority-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.priority === 'medium');
        });
    }

    modal.classList.add('open');
}

// Store pre-filled date for new tasks from calendar
let prefilledDate = null;

function openTaskModalWithDate(dateStr) {
    prefilledDate = dateStr;
    openTaskModal();
    document.getElementById('task-due-date').value = dateStr;
    prefilledDate = null;
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('open');
    editingTaskId = null;
}

function saveTask() {
    const title = document.getElementById('task-title-input').value.trim();
    if (!title) {
        showToast('Please enter a task title');
        return;
    }

    const priority = document.querySelector('.priority-option.selected').dataset.priority;

    if (editingTaskId) {
        // Update existing task
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.title = title;
            task.description = document.getElementById('task-description').value.trim();
            task.category = document.getElementById('task-category').value || null;
            task.dueDate = document.getElementById('task-due-date').value || null;
            task.dueTime = document.getElementById('task-due-time').value || null;
            task.priority = priority;
        }
        showToast('Task updated');
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            description: document.getElementById('task-description').value.trim(),
            category: document.getElementById('task-category').value || null,
            dueDate: document.getElementById('task-due-date').value || null,
            dueTime: document.getElementById('task-due-time').value || null,
            priority,
            completed: false,
            canceled: false,
            starred: false,
            createdAt: Date.now(),
            completedAt: null
        };
        tasks.push(newTask);
        showToast('Task created');
    }

    saveTasks();
    closeTaskModal();
    renderAll();
}

// Category Modal
function renderCategoryColorOptions() {
    const container = document.getElementById('category-colors');
    container.innerHTML = categoryColorOptions.map(color => `
        <div class="color-option" data-color="${color}" style="background: ${color}"></div>
    `).join('');

    container.addEventListener('click', (e) => {
        const option = e.target.closest('.color-option');
        if (option) {
            container.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        }
    });
}

function openCategoryModal(category = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const saveBtn = document.getElementById('category-modal-save');

    editingCategoryId = category ? category.id : null;

    if (category) {
        title.textContent = 'Edit Category';
        saveBtn.textContent = 'Update';
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;

        // Set color
        document.querySelectorAll('.color-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.color === category.color);
        });
    } else {
        title.textContent = 'Add Category';
        saveBtn.textContent = 'Save';
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        document.querySelector('.color-option').classList.add('selected');
    }

    modal.classList.add('open');
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('open');
    editingCategoryId = null;
}

function saveCategory() {
    const name = document.getElementById('category-name').value.trim();
    if (!name) {
        showToast('Please enter a category name');
        return;
    }

    const selectedColor = document.querySelector('.color-option.selected');
    const color = selectedColor ? selectedColor.dataset.color : categoryColorOptions[0];

    if (editingCategoryId) {
        const category = categories.find(c => c.id === editingCategoryId);
        if (category) {
            category.name = name;
            category.color = color;
        }
        showToast('Category updated');
    } else {
        const newCategory = {
            id: generateId(),
            name,
            color,
            createdAt: Date.now()
        };
        categories.push(newCategory);
        showToast('Category created');
    }

    saveCategories();
    closeCategoryModal();
    renderAll();
}

// Confirm Modal
function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('open');
    confirmCallback = null;
}

// View Switching
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(`view-${view}`).style.display = 'block';

    // Re-render to show updated data in the new view
    renderAll();
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toast.className = `toast ${type} show`;
    toastMessage.textContent = message;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Update page title to show selected category
function updatePageTitleWithCategory(catId) {
    const category = categories.find(c => c.id === catId);
    const titleEl = document.querySelector('#view-home .page-title');
    if (titleEl && category) {
        titleEl.innerHTML = `${escapeHtml(category.name)} Tasks <button class="btn btn-sm btn-secondary" onclick="clearCategoryFilter()" style="margin-left: 12px;">Clear Filter</button>`;
    }
}

// Clear category filter
function clearCategoryFilter() {
    currentCategoryFilter = null;
    document.querySelector('#view-home .page-title').innerHTML = 'All Tasks';
    renderAll();
}

// Confirm clear all data
function confirmClearAllData() {
    const totalTasks = tasks.length;
    const message = totalTasks > 0
        ? `Clear all data? This will delete ${totalTasks} task(s) and cannot be undone.`
        : 'Clear all data? This will reset the app to its initial state.';

    document.getElementById('confirm-message').textContent = message;
    confirmCallback = () => {
        clearAllData();
    };
    document.getElementById('confirm-modal').classList.add('open');
}

// Clear all data from localStorage
function clearAllData() {
    localStorage.removeItem('deadline_dynamo_tasks');
    localStorage.removeItem('deadline_dynamo_categories');

    // Reset state
    tasks = [];
    categories = [
        { id: generateId(), name: 'Work', color: '#F6AD55', createdAt: Date.now() },
        { id: generateId(), name: 'Personal', color: '#68D391', createdAt: Date.now() },
        { id: generateId(), name: 'Health', color: '#FC8181', createdAt: Date.now() },
        { id: generateId(), name: 'Learning', color: '#63B3ED', createdAt: Date.now() }
    ];
    currentFilter = 'all';
    currentSearch = '';
    currentCategoryFilter = null;

    // Save default categories
    saveCategories();

    // Re-render all views
    renderAll();

    // Reset page title if viewing category
    document.querySelector('#view-home .page-title').innerHTML = 'All Tasks';

    showToast('All data cleared successfully');
}

// Confirm delete category
function confirmDeleteCategory(catId) {
    const category = categories.find(c => c.id === catId);
    if (!category) return;

    const taskCount = tasks.filter(t => t.category === catId).length;
    const message = taskCount > 0
        ? `Delete "${category.name}"? ${taskCount} task(s) will become uncategorized.`
        : `Delete "${category.name}"?`;

    document.getElementById('confirm-message').textContent = message;
    confirmCallback = () => {
        deleteCategory(catId);
    };
    document.getElementById('confirm-modal').classList.add('open');
}

// Delete category
function deleteCategory(catId) {
    // Update tasks to remove category reference
    tasks.forEach(task => {
        if (task.category === catId) {
            task.category = null;
        }
    });
    saveTasks();

    // Remove category
    categories = categories.filter(c => c.id !== catId);
    saveCategories();

    // Clear filter if deleted category was selected
    if (currentCategoryFilter === catId) {
        currentCategoryFilter = null;
    }

    renderAll();
    showToast('Category deleted');
}

// Get date string in local time (YYYY-MM-DD)
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize app
init();