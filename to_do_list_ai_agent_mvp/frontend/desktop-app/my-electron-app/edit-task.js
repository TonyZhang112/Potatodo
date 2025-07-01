// edit-task.js - Handles the edit task screen

// Function to load task data into edit form
function loadTaskForEditing() {
    console.log('Loading task for editing...');
    
    // Get the task data from localStorage
    const editingTaskData = localStorage.getItem('editingTask');
    
    if (editingTaskData) {
        const task = JSON.parse(editingTaskData);
        console.log('Task to edit:', task);
        
        // Populate the task name
        const taskNameInput = document.querySelector('textarea');
        if (taskNameInput) {
            taskNameInput.value = task.name;
            console.log('Task name populated:', task.name);
        }
        
        // Handle deadline display dynamically
        const deadlineButton = document.querySelector('.ddl-button');
        if (deadlineButton) {
            if (task.deadline) {
                // Task has deadline - show the actual deadline
                const deadlineDate = new Date(task.deadline);
                const formattedDate = deadlineDate.toLocaleDateString();
                const formattedTime = deadlineDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                deadlineButton.textContent = `📅 ${formattedDate} at ${formattedTime}`;
                
                // Store the deadline for editing
                window.currentDeadline = task.deadline;
                console.log('Deadline loaded:', task.deadline);
            } else {
                // Task has no deadline - show default button
                deadlineButton.textContent = '📅 Add a deadline';
                window.currentDeadline = null;
                console.log('No deadline found - showing default button');
            }
        }
        
        // Handle reminder display dynamically
        const reminderButton = document.querySelector('.reminder-button');
        if (reminderButton) {
            if (task.reminderMinutes) {
                // Task has reminder - show the actual reminder
                if (task.deadline) {
                    reminderButton.textContent = `🔔 ${task.reminderMinutes} min before deadline`;
                } else {
                    reminderButton.textContent = `🔔 Remind in ${task.reminderMinutes} min`;
                }
                
                // Store the reminder for editing
                window.currentReminderMinutes = task.reminderMinutes;
                console.log('Reminder loaded:', task.reminderMinutes);
            } else {
                // Task has no reminder - show default button
                reminderButton.textContent = '🔔 Add Reminder';
                window.currentReminderMinutes = null;
                console.log('No reminder found - showing default button');
            }
        }
        
        console.log('Form populated with task data');
        console.log('Current deadline:', window.currentDeadline);
        console.log('Current reminder:', window.currentReminderMinutes);
        
    } else {
        console.error('No task data found for editing');
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


// Main reminder click handler
function handleReminderClick() {
    const reminderButton = document.querySelector('.reminder-button');
    
    // Check if reminder is already set
    if (window.currentReminderMinutes) {
        showReminderOptions();
        return;
    }
    
    // Clear any previous reminder value first
    window.currentReminderMinutes = null;
    
    // Remove any existing reminder input first
    const existingContainer = document.querySelector('#reminder-input-container');
    if (existingContainer) {
        existingContainer.remove();
        return;
    }
    
    // Get the reminder button position
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
    input.value = '15';
    input.style.width = '40px';
    input.style.padding = '4px';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    input.style.textAlign = 'center';
    input.style.marginRight = '8px';
    
    // Create dynamic text based on whether deadline exists
    const text = document.createElement('span');
    const hasDeadline = window.currentDeadline;
    
    if (hasDeadline) {
        text.textContent = 'mins before deadline';
        text.style.color = 'black';
        text.style.fontFamily = 'Fredoka, sans-serif';
    } else {
        text.textContent = 'mins from now';
        text.style.color = 'black';
        text.style.fontFamily = 'Fredoka, sans-serif';
    }
    
    text.style.fontSize = '14px';
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

// Save reminder value
function saveReminderValue(input, container) {
    const value = input.value.trim();
    const minutes = parseInt(value);
    
    if (!isNaN(minutes) && minutes > 0) {
        // Update button text based on context
        const reminderButton = document.querySelector('.reminder-button');
        const hasDeadline = window.currentDeadline;
        
        if (hasDeadline) {
            reminderButton.textContent = `🔔 ${minutes} min before deadline`;
        } else {
            reminderButton.textContent = `🔔 Remind in ${minutes} min`;
        }
        
        // Store the value
        window.currentReminderMinutes = minutes;
    }
    
    // Remove the container
    container.remove();
}

// Show options for existing reminder (edit/delete)
function showReminderOptions() {
    const reminderButton = document.querySelector('.reminder-button');
    const buttonRect = reminderButton.getBoundingClientRect();
    
    // Remove any existing options container
    const existingOptions = document.querySelector('#reminder-options-container');
    if (existingOptions) {
        existingOptions.remove();
        return;
    }
    
    // Create options container
    const container = document.createElement('div');
    container.id = 'reminder-options-container';
    container.style.position = 'fixed';
    container.style.top = buttonRect.bottom + 5 + 'px';
    container.style.left = buttonRect.left + 'px';
    container.style.height = '100px'
    container.style.width = '10px'
    container.style.backgroundColor = '#FFFAEF';
    container.style.border = '2px solid #C19A6B';
    container.style.borderRadius = '6px';
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    container.style.zIndex = '1000';
    container.style.padding = '8px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.minWidth = '120px';
    
    // Edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.margin= 'auto';
    editButton.style.width = '120px'
    editButton.style.padding = '5px';
    editButton.style.border = '1px solid #C19A6B';
    editButton.style.backgroundColor = '#FFFAEF';
    editButton.style.color = 'black';
    editButton.style.borderRadius = '4px';
    editButton.style.cursor = 'pointer';
    editButton.style.fontSize = '14px';
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.margin= 'auto';
    deleteButton.style.width = '120px'
    deleteButton.style.padding = '5px';
    deleteButton.style.border = '1px solid #ff3b30';
    deleteButton.style.backgroundColor = '#FFFAEF';
    deleteButton.style.color = '#ff3b30';
    deleteButton.style.borderRadius = '4px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.fontSize = '14px';
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.margin= 'auto';
    cancelButton.style.padding = '5px';
    cancelButton.style.width = '120px'
    cancelButton.style.border = '1px solid #666';
    cancelButton.style.backgroundColor = '#FFFAEF';
    cancelButton.style.color = '#666';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontSize = '14px';
    
    // Add hover effects
    [editButton, deleteButton, cancelButton].forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        button.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });
    
    // Add event listeners
    editButton.addEventListener('click', function() {
        container.remove();
        editExistingReminder();
    });
    
    deleteButton.addEventListener('click', function() {
        container.remove();
        deleteReminder();
    });
    
    cancelButton.addEventListener('click', function() {
        container.remove();
    });
    
    // Add buttons to container
    container.appendChild(editButton);
    container.appendChild(deleteButton);
    container.appendChild(cancelButton);
    
    document.body.appendChild(container);
    
    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeOptions(e) {
            if (!container.contains(e.target) && e.target !== reminderButton) {
                container.remove();
                document.removeEventListener('click', closeOptions);
            }
        });
    }, 100);
}

// Edit existing reminder
function editExistingReminder() {
    // Clear the current reminder and show input again
    window.currentReminderMinutes = null;
    const reminderButton = document.querySelector('.reminder-button');
    reminderButton.textContent = '🔔 Add Reminder';
    
    // Trigger the normal reminder input
    setTimeout(() => {
        handleReminderClick();
    }, 100);
}

// Delete reminder
function deleteReminder() {
    // Clear the reminder completely
    window.currentReminderMinutes = null;
    const reminderButton = document.querySelector('.reminder-button');
    reminderButton.textContent = '🔔 Add Reminder';
    
    console.log('Reminder deleted');
}

// Function to save edited task
function saveEditedTask() {
    console.log('=== SAVE BUTTON CLICKED ===');
    
    const editingTaskData = localStorage.getItem('editingTask');
    if (!editingTaskData) {
        console.error('No original task data found');
        return;
    }

    const originalTask = JSON.parse(editingTaskData);
    const taskNameInput = document.querySelector('textarea');
    const updatedName = taskNameInput ? taskNameInput.value.trim() : '';
    
    if (!updatedName) {
        alert('Please enter a task name!');
        return;
    }

    // Get all tasks from storage
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === originalTask.id);
    
    if (taskIndex !== -1) {
        // Update the task with new data including deadline and reminder
        tasks[taskIndex].name = updatedName;
        tasks[taskIndex].deadline = window.currentDeadline || null;
        tasks[taskIndex].reminderMinutes = window.currentReminderMinutes || null;
        tasks[taskIndex].hasReminder = window.currentReminderMinutes ? true : false;
        
        console.log('Task updated with:', {
            name: updatedName,
            deadline: window.currentDeadline,
            reminderMinutes: window.currentReminderMinutes
        });
        
        // Save updated tasks back to localStorage
        saveTasks(tasks);
        
        // Clean up and return to main screen
        localStorage.removeItem('editingTask');
        window.currentDeadline = null;
        window.currentReminderMinutes = null;
        
        window.location.href = 'index.html';
    } else {
        console.error('Task not found for updating');
    }
}


// Function to delete task
function deleteTask() {
    console.log('Deleting task...');
    
    const editingTaskData = localStorage.getItem('editingTask');
    if (!editingTaskData) {
        console.error('No task data found for deletion');
        return;
    }
    
    const taskToDelete = JSON.parse(editingTaskData);
    
    // Confirm deletion
    if (confirm(`Are you sure you want to delete "${taskToDelete.name}"?`)) {
        // Get all tasks
        const tasks = getTasks();
        
        // Remove the task
        const filteredTasks = tasks.filter(t => t.id !== taskToDelete.id);
        
        // Save updated tasks
        saveTasks(filteredTasks);
        
        console.log('Task deleted successfully');
        
        // Clean up and return to main screen
        localStorage.removeItem('editingTask');
        window.location.href = 'index.html';
    }
}

// Function to handle back button
function goBackToMain() {
    // Clean up editing data
    localStorage.removeItem('editingTask');
    window.location.href = 'index.html';
}

// Add your existing localStorage functions here
function getTasks() {
    const stored = localStorage.getItem('potatodo-tasks');
    return stored ? JSON.parse(stored) : [];
}

function saveTasks(tasks) {
    localStorage.setItem('potatodo-tasks', JSON.stringify(tasks));
}

// Initialize edit screen when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Edit task screen loaded');
    loadTaskForEditing();
    
    // Set up event listeners for save/delete/back buttons
    const saveButton = document.querySelector('.finish-edit');
    const deleteButton = document.querySelector('.delete-button');
    const backButton = document.querySelector('.back-button');
    
    if (saveButton) {
        saveButton.addEventListener('click', function(e) {
            e.preventDefault();
            saveEditedTask();
        });
    }
    
    if (deleteButton) {
        deleteButton.addEventListener('click', function(e) {
            e.preventDefault();
            deleteTask();
        });
    }
    
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            goBackToMain();
        });
    }
    
    // Add event listeners for deadline and reminder buttons
    const deadlineButton = document.querySelector('.ddl-button');
    const reminderButton = document.querySelector('.reminder-button');
    
    if (deadlineButton) {
        deadlineButton.addEventListener('click', function(e) {
            e.preventDefault();
            handleDeadlineClick();
        });
    }
    
    if (reminderButton) {
        reminderButton.addEventListener('click', function(e) {
            e.preventDefault();
            handleReminderClick();
        });
    }
});






