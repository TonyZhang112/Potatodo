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

// Function to toggle task completion status
// Function to toggle task completion and auto-reorder
function toggleTask(taskId) {
    console.log('Toggling task:', taskId);
    
    const tasks = getTasks(); // Get from localStorage
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        // Toggle the completed status
        task.completed = !task.completed;
        
        // Auto-reorder: Move completed tasks to bottom
        const reorderedTasks = reorderTasksByCompletion(tasks);
        saveTasks(reorderedTasks); // Save reordered tasks
        
        console.log('Task', taskId, 'is now', task.completed ? 'completed' : 'incomplete');
        
        // Update the display with reordered tasks
        const currentTasks = getTasks();
        showTaskList(currentTasks);
    }
}

// Function to reorder tasks: incomplete tasks first, completed tasks at bottom
function reorderTasksByCompletion(tasks) {
    // From the search results: separate active and completed tasks
    const incompleteTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    
    // Return incomplete tasks first, then completed tasks at bottom
    return [...incompleteTasks, ...completedTasks];
}

// Function to handle edit task - passes task data to edit screen
function editTask(taskId) {
    console.log('Edit task clicked for:', taskId);
    
    // Get the specific task data
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        console.log('Editing task:', task);
        
        // Store the task data for the edit screen to access
        localStorage.setItem('editingTask', JSON.stringify(task));
        
        // Navigate to edit screen
        window.location.href = 'edit-task.html';
    } else {
        console.error('Task not found:', taskId);
    }
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


// Function to show task list (when tasks exist) - WITH COMPLETION SUPPORT
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
            // Create task item element with completion state
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            // Build the task content with reminder and deadline indicators
            let taskContent = `
                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="task-name">${task.name}</span>
            `;
            
            // Add bell icon if task has reminder
            if (task.reminderMinutes) {
                taskContent += `<span class="reminder-indicator">🔔</span>`;
            }
            
            // Add deadline indicator if task has deadline
            if (task.deadline) {
                const deadlineDate = new Date(task.deadline);
                taskContent += `<span class="deadline-indicator">📅</span>`;
            }
            
            taskContent += `<button class="three-dots-menu" data-task-id="${task.id}">⋮</button>`;
            
            taskItem.innerHTML = taskContent;
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

    // Handle deadline button
    const deadlineButton = document.querySelector('.ddl-button');
    if (deadlineButton) {
        deadlineButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Deadline button clicked');
            handleDeadlineClick();
        });
    }

    // Handle reminder button  
    const reminderButton = document.querySelector('.reminder-button');
    if (reminderButton) {
        reminderButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Reminder button clicked');
            handleReminderClick();
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
                    deadline: window.currentDeadline || null,  // Add the deadline we stored
                    reminderMinutes: window.currentReminderMinutes || null
                };
                
                console.log('Creating task with deadline:', window.currentDeadline);
                
                addTask(newTask);
                console.log('Task added successfully:', newTask);
                console.log('All tasks now:', getTasks());
                
                // 🧹 CLEANUP - Add this section
                window.currentDeadline = null;
                window.currentReminderMinutes = null;
                hideDeadlineInputs();
                
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

function handleDeadlineClick() {
    console.log('Handling deadline click...');
    
    // Create date input if it doesn't exist
    let dateInput = document.querySelector('#deadline-date-input');
    if (!dateInput) {
        dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'deadline-date-input';
        dateInput.className = 'deadline-input';
        
        // Style the date input
        dateInput.style.position = 'fixed';
        dateInput.style.top = '250px';
        dateInput.style.left = '25px';
        dateInput.style.right = '25px';
        dateInput.style.padding = '10px';
        dateInput.style.fontSize = '16px';
        dateInput.style.border = '1px solid #CA9D67';
        dateInput.style.borderRadius = '8px';
        dateInput.style.backgroundColor = '#FFFFFF';
        
        document.body.appendChild(dateInput);
    }
    
    // Create time input if it doesn't exist
    let timeInput = document.querySelector('#deadline-time-input');
    if (!timeInput) {
        timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.id = 'deadline-time-input';
        timeInput.className = 'deadline-input';
        
        // Style the time input
        timeInput.style.position = 'fixed';
        timeInput.style.top = '300px';
        timeInput.style.left = '25px';
        timeInput.style.right = '25px';
        timeInput.style.padding = '10px';
        timeInput.style.fontSize = '16px';
        timeInput.style.border = '1px solid #ccc';
        timeInput.style.borderRadius = '8px';
        timeInput.style.backgroundColor = '#FFFFFF';
        
        document.body.appendChild(timeInput);
    }
    
    // Create a "Set Deadline" button if it doesn't exist
    let setButton = document.querySelector('#set-deadline-button');
    if (!setButton) {
        setButton = document.createElement('button');
        setButton.id = 'set-deadline-button';
        setButton.textContent = 'Set Deadline';
        setButton.className = 'set-deadline-btn';
        
        // Style the button
        setButton.style.position = 'fixed';
        setButton.style.top = '385px';
        setButton.style.left = '25px';
        setButton.style.width = '55%';
        setButton.style.height = '50px';
        setButton.style.padding = '12px';
        setButton.style.backgroundColor = '#CA9D67';
        setButton.style.color = 'white';
        setButton.style.border = 'none';
        setButton.style.borderRadius = '8px';
        setButton.style.fontSize = '16px';
        setButton.style.fontFamily = 'Fredoka';
        setButton.style.fontWeight = '500px';
        setButton.style.cursor = 'pointer';
        
        // Add click handler
        setButton.addEventListener('click', function() {
            saveDeadlineSelection();
        });
        
        document.body.appendChild(setButton);
    }
    
    // Create a "Cancel" button if it doesn't exist
    let cancelButton = document.querySelector('#cancel-deadline-button');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancel-deadline-button';
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'cancel-deadline-btn';
        
        // Style the cancel button
        cancelButton.style.position = 'fixed';
        cancelButton.style.top = '385px';
        cancelButton.style.right = '25px';
        cancelButton.style.width = '30%';
        cancelButton.style.height = '50px';
        cancelButton.style.padding = '12px';
        cancelButton.style.backgroundColor = '#ff3b30';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '8px';
        cancelButton.style.fontSize = '16px';
        cancelButton.style.fontFamily = 'Fredoka';
        cancelButton.style.fontWeight = 'bold';
        cancelButton.style.cursor = 'pointer';
        
        // Add click handler
        cancelButton.addEventListener('click', function() {
            cancelDeadlineSelection();
        });
        
        document.body.appendChild(cancelButton);
    }
    
    // Show all inputs and buttons
    dateInput.style.display = 'block';
    timeInput.style.display = 'block';
    setButton.style.display = 'block';
    cancelButton.style.display = 'block';
    
    // Focus on date input
    dateInput.focus();
}

function cancelDeadlineSelection() {
    console.log('Deadline selection cancelled');
    
    // Hide all deadline inputs and buttons
    hideDeadlineInputs();
    
    // Clear any stored deadline data
    window.currentDeadline = null;
}


function saveDeadlineSelection() {
    const dateInput = document.querySelector('#deadline-date-input');
    const timeInput = document.querySelector('#deadline-time-input');
    
    const selectedDate = dateInput.value;
    const selectedTime = timeInput.value;
    
    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);
    
    if (selectedDate && selectedTime) {
        // Combine date and time
        const deadlineDateTime = `${selectedDate} ${selectedTime}`;
        console.log('Full deadline:', deadlineDateTime);
        
        // Update the deadline button text
        const deadlineButton = document.querySelector('.ddl-button');
        if (deadlineButton) {
            deadlineButton.textContent = `📅${selectedDate} at ${selectedTime}`;
        }
        
        // Store the deadline data (we'll use this when saving the task)
        window.currentDeadline = deadlineDateTime;
        
        // Hide the inputs
        hideDeadlineInputs();
        
        alert('Deadline set successfully!');
    } else {
        alert('Please select both date and time!');
    }
}

function hideDeadlineInputs() {
    const dateInput = document.querySelector('#deadline-date-input');
    const timeInput = document.querySelector('#deadline-time-input');
    const setButton = document.querySelector('#set-deadline-button');
    const cancelButton = document.querySelector('#cancel-deadline-button');
    
    if (dateInput) dateInput.style.display = 'none';
    if (timeInput) timeInput.style.display = 'none';
    if (setButton) setButton.style.display = 'none';
    if (cancelButton) cancelButton.style.display = 'none';
}


function handleReminderClick() {
    // Clear any previous reminder value first
    window.currentReminderMinutes = null;
    
    // Remove any existing reminder input first
    const existingContainer = document.querySelector('#reminder-input-container');
    if (existingContainer) {
        existingContainer.remove();
        return;
    }
    
    // Get the reminder button position
    const reminderButton = document.querySelector('.reminder-button');
    const buttonRect = reminderButton.getBoundingClientRect();
    
    // Create a container for input + text
    const container = document.createElement('div');
    container.id = 'reminder-input-container';
    container.style.position = 'fixed';
    container.style.top = buttonRect.bottom + 10 + 'px';
    container.style.left = buttonRect.left + 'px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.backgroundColor = 'white';
    container.style.padding = '8px';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '6px';
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    container.style.zIndex = '1000';
    
    // Create the input with default value
    const input = document.createElement('input');
    input.id = 'simple-reminder-input';
    input.type = 'text';
    input.value = '15'; // Always start with default
    input.style.width = '40px';
    input.style.padding = '4px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    input.style.textAlign = 'center';
    input.style.marginRight = '8px';
    
    // Create the text
    const text = document.createElement('span');
    text.textContent = 'mins before ddl';
    text.style.fontSize = '14px';
    text.style.color = '#666';
    text.style.whiteSpace = 'nowrap';
    
    // Add input and text to container
    container.appendChild(input);
    container.appendChild(text);
    document.body.appendChild(container);
    
    // Focus and select the input
    input.focus();
    input.select();
    
    // Handle Enter key or blur to save
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveReminderValue(input, container);
        }
    });
    
    input.addEventListener('blur', function() {
        setTimeout(() => saveReminderValue(input, container), 100);
    });
    
    // Handle clicking outside to close
    document.addEventListener('click', function closeOnClickOutside(e) {
        if (!container.contains(e.target) && e.target !== reminderButton) {
            saveReminderValue(input, container);
            document.removeEventListener('click', closeOnClickOutside);
        }
    });
}

function saveReminderValue(input, container) {
    const value = input.value.trim();
    const minutes = parseInt(value);
    
    if (!isNaN(minutes) && minutes > 0) {
        // Update button text
        const reminderButton = document.querySelector('.reminder-button');
        reminderButton.textContent = `🔔 ${minutes} min before ddl`;
        
        // Store the value
        window.currentReminderMinutes = minutes;
    }
    
    // Remove the container
    container.remove();
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
