// edit-task.js - Handles the edit task screen

// Function to load task data into edit form
function loadTaskForEditing() {
    console.log('Loading task for editing...');
    
    // Get the task data from localStorage
    const editingTaskData = localStorage.getItem('editingTask');
    
    if (editingTaskData) {
        const task = JSON.parse(editingTaskData);
        console.log('Task to edit:', task);
        
        // Populate the form fields with existing task data
        const taskNameInput = document.querySelector('textarea');
        if (taskNameInput) {
            taskNameInput.value = task.name;
        }
        
        // If you have deadline fields, populate them too
        if (task.deadline) {
            const deadlineInput = document.querySelector('input[type="date"]');
            if (deadlineInput) {
                deadlineInput.value = task.deadline;
            }
        }
        
        // If you have reminder fields, populate them too
        const reminderCheckbox = document.querySelector('input[type="checkbox"]');
        if (reminderCheckbox) {
            reminderCheckbox.checked = task.hasReminder;
        }
        
        console.log('Form populated with task data');
    } else {
        console.error('No task data found for editing');
    }
}

// Function to save edited task
function saveEditedTask() {
    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Starting save process...');
    
    // Get the original task data
    const editingTaskData = localStorage.getItem('editingTask');
    console.log('Original task data from localStorage:', editingTaskData);
    
    if (!editingTaskData) {
        console.error('No original task data found');
        return;
    }

    const originalTask = JSON.parse(editingTaskData);
    console.log('Parsed original task:', originalTask);
    
    // Get updated values from form - FIX THE SELECTOR HERE
    const taskNameInput = document.querySelector('textarea'); // CHANGED THIS LINE
    console.log('Textarea element found:', taskNameInput);
    
    const updatedName = taskNameInput ? taskNameInput.value.trim() : '';
    console.log('Updated task name from form:', updatedName);
    
    if (!updatedName) {
        console.log('No task name entered, showing alert');
        alert('Please enter a task name!');
        return;
    }

    // Get all tasks from storage
    const tasks = getTasks();
    console.log('All tasks before update:', tasks);
    
    // Find and update the specific task
    const taskIndex = tasks.findIndex(t => t.id === originalTask.id);
    console.log('Task index found:', taskIndex);
    
    if (taskIndex !== -1) {
        console.log('Updating task at index:', taskIndex);
        
        // Update the task with new data
        tasks[taskIndex].name = updatedName;
        console.log('Task updated to:', tasks[taskIndex]);
        
        // Save updated tasks back to localStorage
        saveTasks(tasks);
        console.log('Tasks saved to localStorage');
        console.log('All tasks after update:', getTasks());
        
        // Clean up and return to main screen
        localStorage.removeItem('editingTask');
        console.log('Cleaned up editingTask from localStorage');
        console.log('Navigating back to index.html...');
        
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
    
    // DEBUG: Check if buttons are found
    const saveButton = document.querySelector('.finish-edit');
    const deleteButton = document.querySelector('.delete-button');
    const backButton = document.querySelector('.back-button');
    
    console.log('Save button found:', saveButton);
    console.log('Delete button found:', deleteButton);
    console.log('Back button found:', backButton);
    
    // Set up event listeners for buttons
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
});





