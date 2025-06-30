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
            const bellIcon = task.hasReminder ? '🔔' : '';
            
            // Create task item element with completion state
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
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
        dateInput.style.backgroundColor = '#FFFFFF';
        
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
        setButton.style.left = '85px';
        setButton.style.right = '95px';
        setButton.style.height = '50px';
        setButton.style.padding = '12px';
        setButton.style.backgroundColor = '#CA9D67';
        setButton.style.color = 'white';
        setButton.style.border = 'none';
        setButton.style.borderRadius = '8px';
        setButton.style.fontSize = '16px';
        setButton.style.fontfamily = 'Fredoka';
        setButton.style.fontWeight = 'bold';
        setButton.style.cursor = 'pointer';
        
        // Add click handler
        setButton.addEventListener('click', function() {
            saveDeadlineSelection();
        });
        
        document.body.appendChild(setButton);
    }
    
    // Show all inputs
    dateInput.style.display = 'block';
    timeInput.style.display = 'block';
    setButton.style.display = 'block';
    
    // Focus on date input
    dateInput.focus();
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
            deadlineButton.textContent = `📅 ${selectedDate} at ${selectedTime}`;
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
    
    if (dateInput) dateInput.style.display = 'none';
    if (timeInput) timeInput.style.display = 'none';
    if (setButton) setButton.style.display = 'none';
}


function handleReminderClick() {
    console.log('=== REMINDER BUTTON CLICKED ===');
    
    // Remove any existing reminder container first
    const existingContainer = document.querySelector('#reminder-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create fresh container
    const reminderContainer = document.createElement('div');
    reminderContainer.id = 'reminder-container';
    reminderContainer.className = 'reminder-container';
    
    // Use simple text input - most reliable approach
    reminderContainer.innerHTML = `
        <h3>Set Reminder</h3>
        <div class="reminder-input-group">
            <input type="text" id="reminder-minutes" value="15" placeholder="15">
            <span>minutes before the deadline</span>
        </div>
        <button class="set-reminder-btn">Set Reminder</button>
        <button class="cancel-reminder">Cancel</button>
    `;
    
    document.body.appendChild(reminderContainer);
    
    // Add event listeners with bulletproof validation
    const setButton = reminderContainer.querySelector('.set-reminder-btn');
    setButton.addEventListener('click', function() {
        console.log('=== SET REMINDER CLICKED ===');
        const minutesInput = document.querySelector('#reminder-minutes');
        
        const rawValue = minutesInput.value.trim();
        console.log('Raw value:', `"${rawValue}"`);
        
        // Simple regex check for numbers only
        if (!/^\d+$/.test(rawValue)) {
            alert('Please enter numbers only!');
            return;
        }
        
        const minutes = parseInt(rawValue, 10);
        console.log('Parsed minutes:', minutes);
        
        if (minutes > 0 && minutes <= 10080) {
            console.log('✅ Setting reminder for', minutes, 'minutes');
            setReminder(minutes);
        } else {
            alert('Please enter a number between 1 and 10080!');
        }
    });
    
    const cancelButton = reminderContainer.querySelector('.cancel-reminder');
    cancelButton.addEventListener('click', function() {
        hideReminderContainer();
    });
    
    // Show container and focus input
    reminderContainer.style.display = 'block';
    
    setTimeout(() => {
        const minutesInput = document.querySelector('#reminder-minutes');
        minutesInput.focus();
        minutesInput.select();
    }, 100);
}


function setReminder(minutes) {
    console.log('Setting reminder for', minutes, 'minutes before deadline');
    
    // Update the reminder button text
    const reminderButton = document.querySelector('.reminder-button');
    if (reminderButton) {
        reminderButton.textContent = `🔔 ${minutes} min before deadline`;
    }
    
    // Store the reminder data
    window.currentReminderMinutes = minutes;
    
    // Hide the reminder container
    hideReminderContainer();
    
    alert(`Reminder set for ${minutes} minutes before deadline!`);
}



function setReminder(minutes, displayText) {
    console.log('Setting reminder for', minutes, 'minutes before');
    
    // Update the reminder button text
    const reminderButton = document.querySelector('.reminder-button');
    if (reminderButton) {
        reminderButton.textContent = `🔔 ${displayText}`;
    }
    
    // Store the reminder data
    window.currentReminderMinutes = minutes;
    
    // Hide the reminder container
    hideReminderContainer();
    
    alert(`Reminder set for ${displayText}!`);
}

function hideReminderContainer() {
    const reminderContainer = document.querySelector('#reminder-container');
    if (reminderContainer) {
        reminderContainer.style.display = 'none';
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
