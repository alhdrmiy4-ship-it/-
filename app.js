// حالة التطبيق والتخزين المحلي
let tasks = JSON.parse(localStorage.getItem('daily_tasks')) || [];
let theme = localStorage.getItem('daily_tasks_theme') || 'light';

// عناصر الـ DOM
const tasksList = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const currentDateEl = document.getElementById('current-date');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// عناصر الإحصائيات
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');

// عناصر البحث والتصفية
const searchInput = document.getElementById('search-input');
const filterPriority = document.getElementById('filter-priority');
const filterCategory = document.getElementById('filter-category');

// عناصر النافذة المنبثقة
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const addTaskFab = document.getElementById('add-task-fab');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');

// عناصر حقول النموذج
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescInput = document.getElementById('task-desc-input');
const taskPriorityInput = document.getElementById('task-priority-input');
const taskCategoryInput = document.getElementById('task-category-input');
const taskTimeInput = document.getElementById('task-time-input');

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderDate();
    renderTasks();

    // الأحداث
    themeToggleBtn.addEventListener('click', toggleTheme);
    addTaskFab.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    taskForm.addEventListener('submit', handleTaskSave);

    searchInput.addEventListener('input', renderTasks);
    filterPriority.addEventListener('change', renderTasks);
    filterCategory.addEventListener('change', renderTasks);
});

// عرض تاريخ اليوم باللغة العربية
function renderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('ar-EG', options);
}

// إدارة المظهر (فاتح / داكن)
function initTheme() {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        themeToggleBtn.textContent = '🌙';
    }
}

function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('daily_tasks_theme', theme);
    initTheme();
}

// حفظ المهام في LocalStorage
function saveTasks() {
    localStorage.setItem('daily_tasks', JSON.stringify(tasks));
    renderTasks();
}

// عرض القائمة وحساب الإحصائيات
function renderTasks() {
    const query = searchInput.value.toLowerCase().trim();
    const priorityVal = filterPriority.value;
    const categoryVal = filterCategory.value;

    const filtered = tasks.filter(task => {
        const matchesQuery = task.title.toLowerCase().includes(query) || task.desc.toLowerCase().includes(query);
        const matchesPriority = priorityVal === 'ALL' || task.priority === priorityVal;
        const matchesCategory = categoryVal === 'ALL' || task.category === categoryVal;
        return matchesQuery && matchesPriority && matchesCategory;
    });

    tasksList.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="task-main">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})">
                    <div>
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${task.desc ? `<div class="task-desc">${escapeHtml(task.desc)}</div>` : ''}
                        <div class="task-meta">
                            <span class="badge">${task.category}</span>
                            ${task.time ? `<span class="badge">⏰ ${task.time}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn" onclick="editTask(${task.id})">✏️</button>
                    <button class="task-btn" onclick="deleteTask(${task.id})">🗑️</button>
                </div>
            `;
            tasksList.appendChild(li);
        });
    }

    updateStats();
}

// تحديث كروت الإحصائيات
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    statTotal.textContent = total;
    statCompleted.textContent = completed;
    statPending.textContent = pending;
}

// إضافة / حفظ مهمة
function handleTaskSave(e) {
    e.preventDefault();

    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const category = taskCategoryInput.value;
    const time = taskTimeInput.value;

    if (!title) return;

    if (id) {
        // تعديل مهمة سابقة
        tasks = tasks.map(t => t.id == id ? { ...t, title, desc, priority, category, time } : t);
    } else {
        // إضافة مهمة جديدة
        const newTask = {
            id: Date.now(),
            title,
            desc,
            priority,
            category,
            time,
            completed: false
        };
        tasks.unshift(newTask);
    }

    saveTasks();
    closeModal();
}

// تغيير حالة الإكمال
window.toggleComplete = function(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
};

// فتح modal التعديل
window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.desc;
    taskPriorityInput.value = task.priority;
    taskCategoryInput.value = task.category;
    taskTimeInput.value = task.time;

    modalTitle.textContent = 'تعديل المهمة';
    openModal();
};

// حذف مهمة
window.deleteTask = function(id) {
    if (confirm('هل أنت تأكد من حذف هذه المهمة؟')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
    }
};

// إغلاق وفتح النافذة
function openModal() {
    taskModal.classList.add('active');
}

function closeModal() {
    taskModal.classList.remove('active');
    taskForm.reset();
    taskIdInput.value = '';
    modalTitle.textContent = 'إضافة مهمة جديدة';
}

// الحماية من XSS
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
