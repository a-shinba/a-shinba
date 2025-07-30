// Application state
let todos = [];
let timerState = {
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    currentTime: 0
};
let timerInterval = null;
let currentFilter = 'all';

// DOM elements
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const timeRecordsList = document.getElementById('time-records-list');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    loadTimeRecords();
    updateTodoCount();
    updateTimerDisplay();
    
    // Event listeners
    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(btn.dataset.filter);
        });
    });
    
    // Timer event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
});

// Todo functionality
function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') return;
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.unshift(todo);
    todoInput.value = '';
    saveTodos();
    renderTodos();
    updateTodoCount();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateTodoCount();
    }
}

function deleteTodo(id) {
    const todoElement = document.querySelector(`[data-id="${id}"]`);
    if (todoElement) {
        todoElement.classList.add('slide-out');
        setTimeout(() => {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderTodos();
            updateTodoCount();
        }, 300);
    }
}

function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
    updateTodoCount();
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTodos();
}

function renderTodos() {
    let filteredTodos = todos;
    
    switch (currentFilter) {
        case 'active':
            filteredTodos = todos.filter(t => !t.completed);
            break;
        case 'completed':
            filteredTodos = todos.filter(t => t.completed);
            break;
    }
    
    todoList.innerHTML = filteredTodos.map(todo => `
        <li class="todo-item fade-in ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" onclick="deleteTodo(${todo.id})" title="削除">
                ×
            </button>
        </li>
    `).join('');
}

function updateTodoCount() {
    const activeTodos = todos.filter(t => !t.completed).length;
    const totalTodos = todos.length;
    todoCount.textContent = `${activeTodos} / ${totalTodos} 個のタスク`;
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const saved = localStorage.getItem('todos');
    if (saved) {
        todos = JSON.parse(saved);
    }
    renderTodos();
}

// Timer functionality
function startTimer() {
    if (!timerState.isRunning) {
        timerState.isRunning = true;
        timerState.isPaused = false;
        timerState.startTime = Date.now() - timerState.pausedTime;
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = '実行中...';
        
        timerInterval = setInterval(updateTimer, 100);
    }
}

function pauseTimer() {
    if (timerState.isRunning && !timerState.isPaused) {
        timerState.isPaused = true;
        timerState.pausedTime = Date.now() - timerState.startTime;
        clearInterval(timerInterval);
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = '再開';
    }
}

function resetTimer() {
    // Save current time if it's substantial (more than 1 minute)
    if (timerState.currentTime > 60000) {
        saveTimeRecord(timerState.currentTime);
    }
    
    clearInterval(timerInterval);
    timerState = {
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedTime: 0,
        currentTime: 0
    };
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = '開始';
    
    updateTimerDisplay();
}

function updateTimer() {
    if (timerState.isRunning && !timerState.isPaused) {
        timerState.currentTime = Date.now() - timerState.startTime;
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    const time = timerState.currentTime;
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    
    timerDisplay.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function saveTimeRecord(duration) {
    const records = getTimeRecords();
    const record = {
        id: Date.now(),
        duration: duration,
        date: new Date().toISOString(),
        formattedDuration: formatDuration(duration)
    };
    
    records.unshift(record);
    // Keep only last 10 records
    if (records.length > 10) {
        records.splice(10);
    }
    
    localStorage.setItem('timeRecords', JSON.stringify(records));
    renderTimeRecords();
}

function getTimeRecords() {
    const saved = localStorage.getItem('timeRecords');
    return saved ? JSON.parse(saved) : [];
}

function loadTimeRecords() {
    renderTimeRecords();
}

function renderTimeRecords() {
    const records = getTimeRecords();
    timeRecordsList.innerHTML = records.map(record => `
        <li class="fade-in">
            <span>${record.formattedDuration}</span>
            <span>${new Date(record.date).toLocaleDateString('ja-JP')} ${new Date(record.date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
        </li>
    `).join('');
}

function formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
        return `${hours}時間${minutes}分${seconds}秒`;
    } else if (minutes > 0) {
        return `${minutes}分${seconds}秒`;
    } else {
        return `${seconds}秒`;
    }
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to add todo
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === todoInput) {
            addTodo();
        }
    }
    
    // Space to start/pause timer when not in input
    if (e.code === 'Space' && document.activeElement !== todoInput) {
        e.preventDefault();
        if (!timerState.isRunning || timerState.isPaused) {
            startTimer();
        } else {
            pauseTimer();
        }
    }
    
    // Escape to reset timer
    if (e.key === 'Escape' && document.activeElement !== todoInput) {
        resetTimer();
    }
});

// Auto-save functionality
window.addEventListener('beforeunload', function() {
    if (timerState.isRunning && timerState.currentTime > 60000) {
        saveTimeRecord(timerState.currentTime);
    }
});