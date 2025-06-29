// Wait for the page to fully load before running our JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, setting up navigation...');
    
    // Get the current page's filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
    
    // Set up navigation based on which page we're currently viewing
    if (currentPage === 'index.html' || currentPage === '') {
        setupHomePage();
    } else if (currentPage === 'add-task-screen.html') {
        setupAddTaskPage();
    } else if (currentPage === 'edit-task.html') {
        setupEditTaskPage();
    }
});


// Function to get all tasks
// Task storage system - PERSISTENT VERSION using localStorage
function getTasks() {
    const stored = localStorage.getItem('potatodo-tasks');
    return stored ? JSON.parse(stored) : [];
}

function addTask(taskData) {
    const tasks = getTasks(); // Get current tasks from localStorage
    const newTask = {
        id: Date.now(),
        name: taskData.name,
        completed: false,
        hasReminder: taskData.hasReminder || false,
        deadline: taskData.deadline || null,
        reminderMinutes: taskData.reminderMinutes || null
    };
    
    tasks.push(newTask);
    localStorage.setItem('potatodo-tasks', JSON.stringify(tasks)); // Save to localStorage
    return newTask;
}

function saveTasks(tasks) {
    localStorage.setItem('potatodo-tasks', JSON.stringify(tasks));
}

// Remove the old 'let tasks = [];' line completely


// Function to add a new task
// CORRECTED addTask function for localStorage
function addTask(taskData) {
    const tasks = getTasks(); // Get current tasks from localStorage
    const newTask = {
        id: Date.now(),
        name: taskData.name,
        completed: false,
        hasReminder: taskData.hasReminder || false,
        deadline: taskData.deadline || null,
        reminderMinutes: taskData.reminderMinutes || null
    };
    
    tasks.push(newTask);
    localStorage.setItem('potatodo-tasks', JSON.stringify(tasks)); // Save to localStorage
    return newTask;
}


// Function to update the home screen display
function updateHomeDisplay() {
    const currentTasks = getTasks();
    
    if (currentTasks.length === 0) {
        showEmptyState();
    } else {
        showTaskList(currentTasks);
    }
}

// Function to show empty state (no tasks) - USING EXISTING HTML STRUCTURE
function showEmptyState() {
    // Show the original "Add your first task" button
    const addButton = document.getElementById('add-button');
    if (addButton) {
        addButton.classList.remove('hidden');
    }
    
    // Clear the task-list div
    const taskListContainer = document.querySelector('.task-list');
    if (taskListContainer) {
        taskListContainer.innerHTML = '';
    }
    
    // Remove the round + button if it exists
    const roundButton = document.getElementById('add-more-button');
    if (roundButton) {
        roundButton.remove();
    }
}


// Function to show task list (when tasks exist) - USING EXISTING HTML STRUCTURE
function showTaskList(tasks) {
    // Hide the "Add your first task" button
    const addButton = document.getElementById('add-button');
    if (addButton) {
        addButton.classList.add('hidden');
    }
    
    // Use your existing task-list div
    const taskListContainer = document.querySelector('.task-list');
    
    if (taskListContainer) {
        // Clear any existing content and add tasks
        taskListContainer.innerHTML = '';
        
        tasks.forEach(task => {
            const bellIcon = task.hasReminder ? '🔔' : '';
            
            // Create task item element
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            taskItem.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       class="task-checkbox" data-task-id="${task.id}">
                <span class="task-name">${task.name}</span>
                <span class="task-reminder">${bellIcon}</span>
                <button class="three-dots-menu" data-task-id="${task.id}">⋮</button>
            `;
            
            taskListContainer.appendChild(taskItem);
        });
        
        // Add event listeners to checkboxes
        const checkboxes = taskListContainer.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const taskId = parseInt(this.getAttribute('data-task-id'));
                toggleTask(taskId);
            });
        });
        
        // Add event listeners to three-dot buttons
        const threeDotButtons = taskListContainer.querySelectorAll('.three-dots-menu');
        threeDotButtons.forEach(button => {
            button.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-task-id'));
                editTask(taskId);
            });
        });
    }
    
    // Add the round "+" button at the bottom
    let roundButton = document.getElementById('add-more-button');
    if (!roundButton) {
        roundButton = document.createElement('button');
        roundButton.innerHTML = '+';
        roundButton.id = 'add-more-button';
        roundButton.className = 'round-add-button';
        document.body.appendChild(roundButton);
        
        // Add click listener to the + button
        roundButton.addEventListener('click', function() {
            window.location.href = 'add-task-screen.html';
        });
    }
}

// Function to handle the home page (index.html) - COMPLETE VERSION
function setupHomePage() {
    console.log('Setting up home page...');
    
    // Check if we have tasks
    const currentTasks = getTasks();
    
    if (currentTasks.length === 0) {
        // Show empty state and ensure button works
        showEmptyState();
        
        // IMPORTANT: Attach click listener to the original "Add your first task" button
        const addButton = document.getElementById('add-button');
        if (addButton) {
            console.log('Add button found, attaching listener');
            addButton.addEventListener('click', function() {
                console.log('Add button clicked, navigating...');
                window.location.href = 'add-task-screen.html';
            });
        } else {
            console.error('Add button not found!');
        }
    } else {
        // Show task list (which includes the round + button)
        showTaskList(currentTasks);
    }
}
    
// Function to handle the add task page - WITH NAVIGATION RESTORED
function setupAddTaskPage() {
    console.log('Setting up add task page...');
    
    // Handle back button
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    // Handle the "Add task" button
    const addTaskButton = document.querySelector('.finish-add');
    if (addTaskButton) {
        console.log('Add task button found');
        addTaskButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add task button clicked');
            
            // Get the task name from the textarea
            const taskNameInput = document.querySelector('textarea');
            const taskName = taskNameInput ? taskNameInput.value.trim() : '';
            
            console.log('Task name entered:', taskName);
            
            if (taskName) {
                // Create new task
                const newTask = {
                    name: taskName,
                    hasReminder: false,
                    deadline: null,
                    reminderMinutes: null
                };
                
                addTask(newTask);
                console.log('Task added successfully:', newTask);
                console.log('All tasks now:', getTasks());
                
                // RESTORE NAVIGATION - Go back to home screen
                window.location.href = 'index.html';
                
            } else {
                console.log('No task name entered');
                alert('Please enter a task name!');
            }
        });
    } else {
        console.error('Add task button not found!');
    }
}

// Function to handle the edit task page
function setupEditTaskPage() {
    console.log('Setting up edit task page...');
    
    const backButton = document.querySelector('.back-button');
    
    if (backButton) {
        console.log('Back button found');
        backButton.addEventListener('click', function() {
            console.log('Back button clicked, navigating...');
            window.location.href = 'index.html';
        });
    } else {
        console.error('Back button not found!');
    }
}
