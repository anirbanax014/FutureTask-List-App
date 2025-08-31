// Task Management System with Advanced Animations - FIXED CHECKBOX ISSUE
class FutureTodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.draggedTask = null;
        this.editingTaskId = null;
        this.theme = this.loadTheme();
        this.animationTimers = {}; // Store animation timers
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.renderTasks();
        this.updateStats();
        this.setupDragAndDrop();
        this.animateOnLoad();
    }

    // Load data from localStorage with fallback
    loadTasks() {
        try {
            const saved = localStorage.getItem('futureTasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    loadTheme() {
        return localStorage.getItem('theme') || 'dark';
    }

    // Event Listeners Setup - FIXED WITH EVENT DELEGATION
    setupEventListeners() {
        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.closest('.filter-tab'));
                this.currentFilter = e.target.closest('.filter-tab').dataset.filter;
                this.renderTasks();
            });
        });

        // Category filters
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                this.setActiveCategoryFilter(e.target);
                this.currentCategory = e.target.dataset.category;
                this.renderTasks();
            });
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEditedTask());
        
        // Close modal on overlay click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeEditModal();
        });

        // FIXED: Use event delegation for task interactions
        this.setupTaskEventDelegation();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // FIXED: Event delegation for task interactions
    setupTaskEventDelegation() {
        const container = document.getElementById('tasksContainer');
        
        // Single event listener for all task interactions using event delegation
        container.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            
            const taskId = parseInt(taskItem.dataset.taskId);
            
            // Handle checkbox clicks
            if (e.target.matches('.task-checkbox input') || e.target.closest('.task-checkbox')) {
                e.preventDefault(); // Prevent default checkbox behavior
                this.toggleTask(taskId);
                return;
            }
            
            // Handle edit button clicks
            if (e.target.closest('.task-action.edit')) {
                e.preventDefault();
                this.editTask(taskId);
                return;
            }
            
            // Handle delete button clicks
            if (e.target.closest('.task-action.delete')) {
                e.preventDefault();
                this.deleteTask(taskId);
                return;
            }
        });

        // Handle checkbox changes specifically
        container.addEventListener('change', (e) => {
            if (e.target.matches('.task-checkbox input')) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.taskId);
                this.toggleTask(taskId);
            }
        });
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    document.getElementById('taskInput').focus();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                    break;
                case 'd':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeEditModal();
        }
    }

    // Theme Management
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveTheme();
        
        // Animate theme transition
        document.body.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    saveTheme() {
        try {
            localStorage.setItem('theme', this.theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }

    // Task Management
    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const categorySelect = document.getElementById('categorySelect');
        const dueDateInput = document.getElementById('dueDateInput');
        const text = taskInput.value.trim();

        if (!text) {
            this.showToast('Please enter a task!', 'warning');
            this.shakeElement(taskInput);
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            priority: prioritySelect.value,
            category: categorySelect.value,
            dueDate: dueDateInput.value || null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        // Clear inputs
        taskInput.value = '';
        dueDateInput.value = '';
        prioritySelect.value = 'medium';
        categorySelect.value = 'personal';

        this.showToast('Task added successfully!', 'success');
        this.animateTaskAdd();
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        
        // Populate modal
        document.getElementById('editTaskText').value = task.text;
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editCategory').value = task.category;
        document.getElementById('editDueDate').value = task.dueDate || '';

        // Show modal with animation
        const modal = document.getElementById('editModal');
        modal.classList.add('active');
        
        // Focus on text input
        setTimeout(() => {
            document.getElementById('editTaskText').focus();
        }, 300);
    }

    saveEditedTask() {
        const taskText = document.getElementById('editTaskText').value.trim();
        if (!taskText) {
            this.showToast('Task text cannot be empty!', 'warning');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = taskText;
            task.priority = document.getElementById('editPriority').value;
            task.category = document.getElementById('editCategory').value;
            task.dueDate = document.getElementById('editDueDate').value || null;

            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.closeEditModal();
            this.showToast('Task updated successfully!', 'success');
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('active');
        this.editingTaskId = null;
    }

    deleteTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('deleting');
            
            setTimeout(() => {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showToast('Task deleted!', 'info');
            }, 500);
        }
    }

    // FIXED: Toggle task method with proper UI updates
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        this.saveTasks();
        
        // Update the UI immediately for better UX
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            const checkbox = taskElement.querySelector('.task-checkbox input');
            const taskText = taskElement.querySelector('.task-text');
            
            // Update checkbox state
            checkbox.checked = task.completed;
            
            // Update task appearance
            if (task.completed) {
                taskElement.classList.add('completed');
                taskText.classList.add('completed');
            } else {
                taskElement.classList.remove('completed');
                taskText.classList.remove('completed');
            }
        }

        this.updateStats();
        
        const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
        const type = task.completed ? 'success' : 'info';
        this.showToast(message, type);
        
        // Animate completion
        if (task.completed) {
            this.animateTaskCompletion(taskId);
        }
    }

    // Filtering and Search
    setActiveFilter(activeTab) {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    setActiveCategoryFilter(activeFilter) {
        document.querySelectorAll('.category-filter').forEach(filter => {
            filter.classList.remove('active');
        });
        activeFilter.classList.add('active');
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery) ||
                task.category.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply status filter
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'high':
                filtered = filtered.filter(task => task.priority === 'high');
                break;
        }

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(task => task.category === this.currentCategory);
        }

        return filtered;
    }

    // Rendering - FIXED: No more separate event listener attachment
    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // No need to attach event listeners since we're using event delegation
    }

    createTaskHTML(task) {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const dueDateFormatted = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : null;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}" draggable="true">
                <div class="task-content">
                    <div class="task-checkbox">
                        <input type="checkbox" ${task.completed ? 'checked' : ''}>
                        <div class="checkbox-custom">
                            <i class="fas fa-check checkbox-icon"></i>
                        </div>
                    </div>
                    <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                    <div class="task-actions">
                        <button class="task-action edit" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action delete" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta">
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    <span class="category-badge">${task.category}</span>
                    ${dueDateFormatted ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar"></i>
                        ${dueDateFormatted}
                    </span>` : ''}
                </div>
            </div>
        `;
    }

    // Statistics
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Clear any existing animation timers
        Object.keys(this.animationTimers).forEach(timerId => {
            clearInterval(this.animationTimers[timerId]);
            delete this.animationTimers[timerId];
        });
        
        // Animate number changes
        this.animateNumber('totalTasks', total);
        this.animateNumber('completedTasks', completed);
        this.animateNumber('pendingTasks', pending);
        this.animateNumber('completionRate', completionRate, '%');
        
        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${completionRate}%`;
    }

    animateNumber(elementId, targetValue, suffix = '') {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        
        // If already at target value, do nothing
        if (currentValue === targetValue) return;
        
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 1000;
        const steps = Math.abs(targetValue - currentValue);
        const stepDuration = steps > 0 ? duration / steps : 0;
        let current = currentValue;
        
        // Clear any existing timer for this element
        if (this.animationTimers[elementId]) {
            clearInterval(this.animationTimers[elementId]);
        }
        
        this.animationTimers[elementId] = setInterval(() => {
            current += increment;
            element.textContent = current + suffix;
            
            if (current === targetValue) {
                clearInterval(this.animationTimers[elementId]);
                delete this.animationTimers[elementId];
            }
        }, stepDuration);
    }

    // Drag and Drop
    setupDragAndDrop() {
        const container = document.getElementById('tasksContainer');
        
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedTask = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                this.draggedTask = null;
                this.removeDragPlaceholders();
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const dragPlaceholder = this.createDragPlaceholder();
            
            if (afterElement == null) {
                container.appendChild(dragPlaceholder);
            } else {
                container.insertBefore(dragPlaceholder, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedTask) {
                const afterElement = this.getDragAfterElement(container, e.clientY);
                const draggedTaskId = parseInt(this.draggedTask.dataset.taskId);
                
                // Reorder tasks array
                this.reorderTasks(draggedTaskId, afterElement);
                this.saveTasks();
                this.renderTasks();
                this.showToast('Task reordered!', 'info');
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    createDragPlaceholder() {
        this.removeDragPlaceholders();
        const placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder active';
        return placeholder;
    }

    removeDragPlaceholders() {
        document.querySelectorAll('.drag-placeholder').forEach(p => p.remove());
    }

    reorderTasks(draggedTaskId, afterElement) {
        const draggedTask = this.tasks.find(t => t.id === draggedTaskId);
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedTaskId);
        
        if (draggedIndex === -1) return;
        
        // Remove dragged task from array
        this.tasks.splice(draggedIndex, 1);
        
        if (afterElement) {
            const afterTaskId = parseInt(afterElement.dataset.taskId);
            const afterIndex = this.tasks.findIndex(t => t.id === afterTaskId);
            this.tasks.splice(afterIndex, 0, draggedTask);
        } else {
            this.tasks.push(draggedTask);
        }
    }

    // Animations
    animateOnLoad() {
        // Stagger animation for initial elements
        const elements = document.querySelectorAll('.stat-card, .task-item');
        elements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
        });
    }

    animateTaskAdd() {
        const addBtn = document.getElementById('addTaskBtn');
        addBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            addBtn.style.transform = '';
        }, 150);
    }

    animateTaskCompletion(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            // Create celebration effect
            this.createCelebrationEffect(taskElement);
        }
    }

    createCelebrationEffect(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Create particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: var(--primary-cyan);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${centerX}px;
                top: ${centerY}px;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (i / 12) * Math.PI * 2;
            const velocity = 100 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => particle.remove();
        }
    }

    shakeElement(element) {
        element.style.animation = 'shake 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="${icons[type]} toast-icon"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Data Persistence
    saveTasks() {
        try {
            const dataToSave = JSON.stringify(this.tasks);
            const tempTasks = [...this.tasks]; // Create a backup
            
            // Store in memory as fallback
            window.futureTasks = tempTasks;
            
            // Try to save to localStorage if available
            if (typeof Storage !== "undefined") {
                localStorage.setItem('futureTasks', dataToSave);
            }
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showToast('Warning: Could not save tasks to storage', 'warning');
        }
    }

    // Export/Import functionality
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `future-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Tasks exported successfully!', 'success');
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showToast('Tasks imported successfully!', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showToast('Error importing tasks. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    isOverdue(dueDate) {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    }

    // Cleanup method
    destroy() {
        // Remove event listeners and clean up
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Clear all animation timers
        Object.keys(this.animationTimers).forEach(timerId => {
            clearInterval(this.animationTimers[timerId]);
        });
    }
}

// Add shake animation to CSS dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FutureTodoApp();
    
    // Add some sample tasks for demonstration (only if no tasks exist)
    if (app.tasks.length === 0) {
        const sampleTasks = [
            {
                id: Date.now() - 3,
                text: "Welcome to FutureTasks! 🚀",
                completed: false,
                priority: "high",
                category: "personal",
                dueDate: null,
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: Date.now() - 2,
                text: "Try editing this task by clicking the edit button",
                completed: false,
                priority: "medium",
                category: "work",
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: Date.now() - 1,
                text: "Drag and drop tasks to reorder them",
                completed: true,
                priority: "low",
                category: "other",
                dueDate: null,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            }
        ];
        
        app.tasks = sampleTasks;
        app.saveTasks();
        app.renderTasks();
        app.updateStats();
    }
});

// Add keyboard shortcut hints
document.addEventListener('DOMContentLoaded', () => {
    const shortcuts = [
        'Ctrl+N: Add new task',
        'Ctrl+F: Search tasks',
        'Ctrl+D: Toggle theme',
        'Esc: Close modal'
    ];
    
    console.log('🚀 FutureTasks Keyboard Shortcuts:');
    shortcuts.forEach(shortcut => console.log(`  ${shortcut}`));
});

// Memory fallback system (in case localStorage fails)
if (typeof window !== 'undefined') {
    window.futureTasks = window.futureTasks || [];
}