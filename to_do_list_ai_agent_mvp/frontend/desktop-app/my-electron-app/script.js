// === API CONNECTION FUNCTIONS ===

const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI server URL

// Test connection to backend
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Backend connection successful');
            return true;
        }
    } catch (error) {
        console.error('❌ Backend connection failed:', error);
        return false;
    }
}

// === POTATO IMAGE SWITCHING SYSTEM ===
let currentPotatoState = 'default';
let potatoRevertTimer = null;  // ← ADD THIS LINE


// Get tasks from backend instead of localStorage
async function getTasksFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (response.ok) {
            const tasks = await response.json();
            console.log('Tasks loaded from backend:', tasks);
            return tasks;
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return []; // Return empty array on error
    }
}

// Create new task on backend
async function createTaskOnBackend(taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            const newTask = await response.json();
            console.log('Task created on backend:', newTask);
            return newTask;
        }
    } catch (error) {
        console.error('Error creating task:', error);
        return null;
    }
}

// Complete task on backend and get AI response
async function completeTaskOnBackend(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Task completed on backend:', result);
            
            // Update AI message if provided
            if (result.ai_message) {
                document.getElementById('ai-message').textContent = result.ai_message;
            }
            
            // Update potato emotion if provided
            if (result.potato_emotion) {
                updatePotatoEmotion(result.potato_emotion);
            }
            
            // Update streak display if provided
            if (result.current_streak !== undefined) {
                updateStreakFromBackend(result.current_streak);
            }
            
            return result;
        }
    } catch (error) {
        console.error('Error completing task:', error);
        return null;
    }
}

function saveTasks(tasks) {
    localStorage.setItem('potatodo-tasks', JSON.stringify(tasks));
    console.log('Tasks saved to localStorage:', tasks);
}


// Get current streak from backend
async function getStreakFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/streak`);
        if (response.ok) {
            const streakData = await response.json();
            console.log('Streak data from backend:', streakData);
            return streakData;
        }
    } catch (error) {
        console.error('Error fetching streak:', error);
        return { count: 0, message: "Start your journey!" };
    }
}

async function updateStreakDisplay() {
    try {
        const streakData = await getStreakFromBackend();
        const streakElement = document.getElementById('streak-count');
        
        if (streakElement && streakData) {
            streakElement.textContent = streakData.current_streak || 0;
            console.log('Streak updated:', streakData.current_streak);
        }
    } catch (error) {
        console.error('Failed to update streak display:', error);
        // Fallback to show 0
        const streakElement = document.getElementById('streak-count');
        if (streakElement) {
            streakElement.textContent = '0';
        }
    }
}

// Wait for the page to fully load before running our JavaScript
document.addEventListener('DOMContentLoaded', async function() {
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

function switchPotatoImage(newState, revertAfterDelay = false) {
    console.log(`Switching potato to: ${newState}`);
    
    // Clear any existing revert timer
    if (potatoRevertTimer) {
        clearTimeout(potatoRevertTimer);
        potatoRevertTimer = null;
    }
    
    const allPotatoes = [
        'potato-default',
        'potato-task-complete',
        'potato-task-clear',
        'potato-no-task-complete'
    ];
    
    // Hide only the potatoes we're NOT switching to
    allPotatoes.forEach(id => {
        const img = document.getElementById(id);
        if (img && id !== `potato-${newState}`) {
            img.style.display = 'none';
            img.classList.remove('bounce-in');
        }
    });
    
    // Show the target potato with bounce animation
    const newPotato = document.getElementById(`potato-${newState}`);
    if (newPotato) {
        newPotato.style.display = 'block';
        setTimeout(() => {
            newPotato.classList.add('bounce-in');
        }, 50);
        currentPotatoState = newState;
    }
    
    // MODIFIED: Only set revert timer for certain states (NOT no-task-complete)
    if (revertAfterDelay && newState !== 'default' && newState !== 'no-task-complete') {
        potatoRevertTimer = setTimeout(() => {
            switchPotatoImage('default', false);
        }, 60000); // 1 minute
    }
}


// Function to trigger potato bounce (for AI messages)
function bouncePotatoForAI() {
    const currentPotato = document.getElementById(`potato-${currentPotatoState}`);
    if (currentPotato && currentPotato.style.display !== 'none') {
        currentPotato.classList.remove('ai-bounce');
        // Force reflow
        currentPotato.offsetHeight;
        currentPotato.classList.add('ai-bounce');
        
        // Remove class after animation
        setTimeout(() => {
            currentPotato.classList.remove('ai-bounce');
        }, 600);
    }
}

// === SIMPLIFIED CHECK-IN TIMING SYSTEM ===

let checkInTimers = [];

// Function to schedule check-ins
function scheduleCheckIns() {
    console.log('Scheduling daily check-ins...');
    
    // Clear any existing timers
    checkInTimers.forEach(timer => clearTimeout(timer));
    checkInTimers = [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Schedule 12 PM check-in
    const midday = new Date(today);
    midday.setHours(12, 0, 0, 0);
    
    // Schedule 9 PM check-in
    const evening = new Date(today);
    evening.setHours(21, 0, 0, 0);
    
    // If current time is past these times today, schedule for tomorrow
    if (now > midday) {
        midday.setDate(midday.getDate() + 1);
    }
    if (now > evening) {
        evening.setDate(evening.getDate() + 1);
    }
    
    // Calculate milliseconds until each check-in
    const middayDelay = midday.getTime() - now.getTime();
    const eveningDelay = evening.getTime() - now.getTime();
    
    console.log(`Next midday check-in in: ${Math.round(middayDelay / 1000 / 60)} minutes`);
    console.log(`Next evening check-in in: ${Math.round(eveningDelay / 1000 / 60)} minutes`);
    
    // Schedule midday check-in
    const middayTimer = setTimeout(() => {
        performSimpleCheckIn('midday');
        // Reschedule for next day
        scheduleCheckIns();
    }, middayDelay);
    
    // Schedule evening check-in
    const eveningTimer = setTimeout(() => {
        performSimpleCheckIn('evening');
        // Reschedule for next day
        scheduleCheckIns();
    }, eveningDelay);
    
    checkInTimers.push(middayTimer, eveningTimer);
}

async function performSimpleCheckIn() {
    console.log('Performing check-in...');
    try {
        const progressResponse = await fetch(`${API_BASE_URL}/task-progress-check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (progressResponse.ok) {
            const progressResult = await progressResponse.json();
            console.log('Check-in result:', progressResult);

            // ADD THIS: Determine potato emotion based on progress
            let potatoEmotion = 'default';
            
            if (progressResult.completed_count === 0 && progressResult.total_count > 0) {
                // User has tasks but completed zero - disappointed potato
                potatoEmotion = 'no-task-complete';
            } else if (progressResult.all_complete) {
                // All tasks done - celebration potato
                potatoEmotion = 'task-clear';
            } else if (progressResult.completed_count > 0) {
                // Some progress made - encouraging potato
                potatoEmotion = 'task-complete';
            }

            // Display AI message
            if (progressResult.ai_message) {
                typewriterEffect(progressResult.ai_message, 'ai-message', true);
            }

            // ADD THIS: Switch potato emotion
            switchPotatoImage(potatoEmotion, true); // Use revert for most states
            
            // Special handling for no-task-complete (don't revert)
            if (potatoEmotion === 'no-task-complete') {
                switchPotatoImage(potatoEmotion, false); // Don't revert disappointed potato
            }

        } else {
            console.error('Check-in failed:', progressResponse.status);
        }
    } catch (error) {
        console.error('Check-in failed:', error);
    }
}




// Function to manually trigger check-in (for testing)
async function triggerManualCheckIn() {
    console.log('Manual check-in triggered');
    await performSimpleCheckIn('manual');
}



// Function to get all tasks
async function getTasks() {
    try {
        const tasks = await getTasksFromBackend();
        console.log('Tasks loaded from backend:', tasks);
        
        // Make sure we always return an array
        if (Array.isArray(tasks)) {
            return tasks;
        } else {
            console.warn('Backend returned non-array, using empty array');
            return [];
        }
    } catch (error) {
        console.error('Failed to get tasks from backend:', error);
        // Fallback to localStorage if backend fails
        const stored = localStorage.getItem('potatodo-tasks');
        const localTasks = stored ? JSON.parse(stored) : [];
        
        // Double-check localStorage data is an array too
        return Array.isArray(localTasks) ? localTasks : [];
    }
}

// Global variable to track the current typewriter timer
let currentTypewriterTimer = null;

function typewriterEffect(message, targetElementId = 'ai-message', scheduleRevert = true) {
    // Your existing safety checks...
    if (!message || typeof message !== 'string') {
        console.error('typewriterEffect: Invalid message provided:', message);
        return;
    }
    
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
        console.error(`typewriterEffect: Element '${targetElementId}' not found`);
        return;
    }
    
    // Clear any existing typewriter timer
    if (currentTypewriterTimer) {
        clearInterval(currentTypewriterTimer);
        currentTypewriterTimer = null;
    }
    
    // Bounce potato for regular AI messages
    if (targetElementId === 'ai-message') {
        bouncePotatoForAI();
    }
    
    // Your existing typewriter animation code...
    targetElement.textContent = '';
    let i = 0;
    
    currentTypewriterTimer = setInterval(() => {
        targetElement.textContent += message.charAt(i);
        i++;
        
        if (i >= message.length) {
            clearInterval(currentTypewriterTimer);
            currentTypewriterTimer = null;
            
            // ADDED: Schedule AI message reversion (only for regular AI messages)
            if (targetElementId === 'ai-message' && scheduleRevert) {
                scheduleAIMessageRevert();
            }
        }
    }, 55);
}





function setupDailyTaskInput() {
    const dailyInput = document.getElementById('daily-input');
    
    if (dailyInput) {
        // Save on blur (when user clicks away)
        dailyInput.addEventListener('blur', async function() {
            const taskName = this.value.trim();
            if (taskName && taskName !== '') {
                try {
                    // Use your existing backend endpoint
                    const response = await fetch(`${API_BASE_URL}/daily-quests/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ quest_name: taskName })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Daily quest saved:', result);
                        // showSavedIndicator(); ← REMOVED THIS LINE
                    } else {
                        console.error('Failed to save daily quest:', response.status);
                    }
                } catch (error) {
                    console.error('Error saving daily quest:', error);
                }
            }
        });
        
        // Also save on Enter key
        dailyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.blur(); // Trigger blur event
            }
        });
    }
}



//addTask function
async function addTask(taskData) {
    try {
        const backendTask = {
            description: taskData.name,
            deadline: taskData.deadline,
            reminder_minutes: taskData.reminderMinutes
        };
        
        const newTask = await createTaskOnBackend(backendTask);
        
        if (newTask) {
            // Schedule reminder timer immediately when task is created
            if (newTask.deadline && newTask.reminder_minutes) {
                scheduleReminderTimer(newTask);
            }
            
            return {
                id: newTask.id,
                name: newTask.description,
                completed: newTask.is_completed,
                deadline: newTask.deadline,
                reminderMinutes: newTask.reminder_minutes,
                hasReminder: newTask.reminder_minutes ? true : false
            };
        }
    } catch (error) {
        console.error('Failed to create task on backend:', error);
        // Your existing fallback code stays the same...
        const tasks = JSON.parse(localStorage.getItem('potatodo-tasks') || '[]');
        const newTask = {
            id: Date.now(),
            name: taskData.name,
            completed: false,
            hasReminder: taskData.hasReminder || false,
            deadline: taskData.deadline || null,
            reminderMinutes: taskData.reminderMinutes || null
        };
        tasks.push(newTask);
        localStorage.setItem('potatodo-tasks', JSON.stringify(tasks));
        return newTask;
    }
}



async function toggleTask(taskId) {
    console.log('Toggling task:', taskId);

    if (activeReminderTimers.has(taskId)) {
        clearTimeout(activeReminderTimers.get(taskId));
        activeReminderTimers.delete(taskId);
        console.log('Reminder timer cancelled for completed task');
    }
    
    // ADD: Get the task element for animation
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    
    try {
        // ADD: Trigger completion animation immediately
        if (taskElement) {
            taskElement.classList.add('completing');
            // Remove animation class after it completes
            setTimeout(() => taskElement.classList.remove('completing'), 800);
        }
        
        // Try to complete task on backend first
        const result = await completeTaskOnBackend(taskId);
        
        if (result && result.ai_message) {
            // WITH the typewriter effect:
            typewriterEffect(result.ai_message);
            console.log('AI response:', result.ai_message);
        }
        
        await checkAndUpdatePotatoState(result);

        const currentTasks = await getTasks();
        const reorderedTasks = reorderTasksByCompletion(currentTasks);
        
        // Save reordered tasks back to localStorage (as fallback)
        saveTasks(reorderedTasks);
        
        // Update the display with reordered tasks
        showTaskList(reorderedTasks);
        
        // If all tasks are complete, we can add special handling here if needed
        if (result && result.all_tasks_complete) {
            console.log('All tasks complete! Display updated with celebration message.');
            // Any additional celebration logic can go here
        }
        
    } catch (error) {
        console.error('Backend toggle failed, using localStorage:', error);
        
        // Your existing fallback code stays the same...
        const tasks = await getTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            task.is_completed = task.completed;
            const reorderedTasks = reorderTasksByCompletion(tasks);
            saveTasks(reorderedTasks);
            console.log('Task', taskId, 'is now', task.completed ? 'completed' : 'incomplete');
            showTaskList(reorderedTasks);
        }
    }
}

// Function to check and update potato state after task completion
async function checkAndUpdatePotatoState(backendResult) {
    try {
        // Get current daily status to determine potato state
        const response = await fetch('http://localhost:8000/daily-status');
        const status = await response.json();
        
        console.log('=== POTATO STATE CHECK ===');
        console.log('Tasks completed:', status.completed_count);
        console.log('Total tasks:', status.total_count);
        console.log('Daily quest completed:', status.quest_completed);
        console.log('=== END DEBUG ===');
        
        // Determine appropriate potato state
        if (status.completed_count === 0 && status.total_count > 0) {
            // FIXED: User has tasks but completed ZERO - show disappointed potato
            console.log('No tasks completed but tasks exist - switching to no-task-complete potato');
            switchPotatoImage('no-task-complete', false); // Note: false to prevent auto-revert
        } else if (status.completed_count === 0 && status.total_count === 0) {
            // No tasks at all - keep default potato
            console.log('No tasks exist - staying default');
            return;
        } else if (status.completed_count === status.total_count && status.quest_completed) {
            // Perfect day achieved - celebration potato
            console.log('Perfect day achieved - switching to task-clear potato');
            switchPotatoImage('task-clear', true);
        } else if (status.completed_count > 0) {
            // Some tasks completed - celebration for individual task
            console.log('Task completed - switching to task-complete potato');
            switchPotatoImage('task-complete', true);
        }
        
        await checkAndShowCallItADayButton();
        
    } catch (error) {
        console.error('Error checking potato state:', error);
    }
}


function reorderTasksByCompletion(tasks) {
    // From the search results: separate active and completed tasks
    const incompleteTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    
    // Return incomplete tasks first, then completed tasks at bottom
    return [...incompleteTasks, ...completedTasks];
}



// Function to handle edit task - passes task data to edit screen
async function editTask(taskId) {
    console.log('Edit task clicked for:', taskId);
    
    // Get the specific task data
    const tasks = await getTasks();
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

// Function to update the home screen display
async function updateHomeDisplay() {
    const currentTasks = await getTasks();
    
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
    // Add safety check at the beginning
    if (!Array.isArray(tasks)) {
        console.error('showTaskList received non-array:', tasks);
        tasks = []; // Default to empty array
    }
    
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
            // Fix: Check both completed and is_completed
            const isCompleted = task.completed || task.is_completed;
            taskItem.className = `task-item ${isCompleted ? 'completed' : ''}`;
            
            // CRITICAL FIX: Put data-task-id on the CONTAINER, not the checkbox
            taskItem.setAttribute('data-task-id', task.id);
            
            // Build the task content with proper checkbox state
            let taskContent = `
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                <span class="task-name">${task.description || task.name}</span>
            `;
            // Add bell icon if task has reminder
            if (task.reminderMinutes || task.reminder_minutes) {
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
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', function() {
                // Get task ID from the parent container instead
                const taskId = parseInt(this.closest('.task-item').getAttribute('data-task-id'));
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

function setupDailyTaskCheckbox() {
    const dailyCheckbox = document.getElementById('daily-checkbox');
    
    if (dailyCheckbox) {
        dailyCheckbox.addEventListener('change', async function() {
            const isCompleted = this.checked;
            
            try {
                if (isCompleted) {
                    // Use your existing complete endpoint
                    const response = await fetch(`${API_BASE_URL}/daily-quests/complete`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Daily quest completed:', result);
                        
                        // Show AI message if provided
                        if (result.ai_message) {
                            typewriterEffect(result.ai_message);
                        }
                        
                        // Update potato state for daily quest completion
                        switchPotatoImage('task-complete', true);
                    } else {
                        console.error('Failed to complete daily quest:', response.status);
                        // Revert checkbox on error
                        this.checked = false;
                    }
                } else {
                    // Handle unchecking - you might want to add an endpoint for this
                    console.log('Daily quest unchecked');
                }
            } catch (error) {
                console.error('Error updating daily quest:', error);
                // Revert checkbox state on error
                this.checked = !isCompleted;
            }
        });
    }
}

async function loadExistingDailyQuest() {
    try {
        // Use your existing GET endpoint
        const response = await fetch(`${API_BASE_URL}/daily-quests/`);
        if (response.ok) {
            const data = await response.json();
            const dailyQuest = data.daily_quest;
            
            if (dailyQuest) {
                const dailyInput = document.getElementById('daily-input');
                const dailyCheckbox = document.getElementById('daily-checkbox');
                
                if (dailyInput && dailyQuest.quest_name) {
                    dailyInput.value = dailyQuest.quest_name;
                    dailyInput.placeholder = dailyQuest.quest_name;
                }
                
                if (dailyCheckbox) {
                    dailyCheckbox.checked = dailyQuest.is_completed;
                }
            }
        } else {
            console.error('Failed to load daily quest:', response.status);
        }
    } catch (error) {
        console.error('Error loading daily quest:', error);
    }
}

// Global timer for AI message reversion
let aiMessageRevertTimer = null;

// Revert AI message back to default after delay
function scheduleAIMessageRevert(skipRevert = false) {
    // Clear any existing timer
    if (aiMessageRevertTimer) {
        clearTimeout(aiMessageRevertTimer);
        aiMessageRevertTimer = null;
    }
    
    // Skip revert for motivation notes (when user completed 0 tasks)
    if (skipRevert) {
        console.log('Skipping AI message revert - keeping motivation note visible');
        return;
    }
    
    // Schedule revert to default message after 1 minute
    aiMessageRevertTimer = setTimeout(() => {
        const aiElement = document.getElementById('ai-message');
        if (aiElement) {
            typewriterEffect("What's the plan?");
        }
        aiMessageRevertTimer = null;
    }, 60000); // 1 minute = 60,000 milliseconds
}


// Function to handle the home page (index.html) - COMPLETE VERSION
async function setupHomePage() {
    console.log('Setting up home page...');

    // INITIALIZE: Show default potato immediately when app loads
    const defaultPotato = document.getElementById('potato-default');
    if (defaultPotato) {
        defaultPotato.style.display = 'block';
        currentPotatoState = 'default';
    }

    const currentTasks = await getTasks();
    currentTasks.forEach(task => {
        if (!task.completed && !task.is_completed) {
            scheduleReminderTimer(task);
        }
    });

    scheduleCheckIns();
    
    // ADD: Setup daily task functionality
    setupDailyTaskInput();
    setupDailyTaskCheckbox();
    await loadExistingDailyQuest();
    
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
    
    await updateStreakDisplay();

    setupCallItADayButton();

    scheduleMidnightReset();
}
    
// Function to handle the add task page - WITH NAVIGATION RESTORED
async function setupAddTaskPage() {
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
        addTaskButton.addEventListener('click', async function(e) {
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
                
                await addTask(newTask);
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
        dateInput.style.top = '50%';
        dateInput.style.left = '10%';
        dateInput.style.right = '10%';
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
        timeInput.style.top = '60%';
        timeInput.style.left = '10%';
        timeInput.style.right = '10%';
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
        setButton.style.bottom = '5%';
        setButton.style.left = '10%';
        setButton.style.width = '60%';
        setButton.style.height = '10%';
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
        cancelButton.style.bottom = '5%';
        cancelButton.style.right = '10%';
        cancelButton.style.width = '20%';
        cancelButton.style.height = '10%';
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

// Timer-based reminder system
let activeReminderTimers = new Map();

function scheduleReminderTimer(task) {
    if (!task.reminder_minutes) return; // Only need reminder_minutes to be set
    
    let reminderTime;
    
    if (task.deadline) {
        // CONDITION 1: Reminder X minutes BEFORE deadline
        const deadlineTime = new Date(task.deadline).getTime();
        reminderTime = deadlineTime - (task.reminder_minutes * 60 * 1000);
        console.log(`Reminder set for "${task.description}" ${task.reminder_minutes} minutes before deadline`);
    } else {
        // CONDITION 2: Reminder X minutes FROM NOW (not from creation time)
        const now = Date.now();
        reminderTime = now + (task.reminder_minutes * 60 * 1000);
        console.log(`Reminder set for "${task.description}" ${task.reminder_minutes} minutes from now`);
    }
    
    const now = Date.now();
    
    // Only set timer if reminder is in the future
    if (reminderTime > now) {
        const delay = reminderTime - now;
        console.log(`Timer will fire in ${Math.round(delay/1000/60)} minutes`);
        
        const timerId = setTimeout(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/reminder/${task.id}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.reminder) {
                        typewriterEffect(data.reminder);
                    }
                }
            } catch (error) {
                console.error('Failed to get reminder message:', error);
                typewriterEffect(`⏰ "${task.description}" reminder!`);
            }
            
            activeReminderTimers.delete(task.id);
        }, delay);
        
        activeReminderTimers.set(task.id, timerId);
    } else {
        console.log('Reminder time has already passed, not setting timer');
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

// Function to check if "Call It a Day" button should be shown
async function checkAndShowCallItADayButton() {
    console.log('=== DEBUG: checkAndShowCallItADayButton called ===');
    try {
        const currentTasks = await getTasks();
        const allTasksComplete = currentTasks.length > 0 && currentTasks.every(task => 
            task.completed || task.is_completed
        );
        
        // Check daily quest status
        const dailyQuestComplete = await checkDailyQuestStatus();
        
        // Show button only if both conditions are met
        const shouldShowButton = allTasksComplete && dailyQuestComplete;
        
        const buttonContainer = document.getElementById('call-it-a-day-container');
        if (buttonContainer) {
            if (shouldShowButton) {
                buttonContainer.classList.remove('hidden');
            } else {
                buttonContainer.classList.add('hidden');
            }
        }
        
        return shouldShowButton;
        
    } catch (error) {
        console.error('Error checking Call It a Day button status:', error);
        return false;
    }
}

// Update your existing setupCallItADayButton function
function setupCallItADayButton() {
    // Existing "Call It a Day" button handler
    const callItADayButton = document.getElementById('call-it-a-day-button');
    if (callItADayButton) {
        callItADayButton.addEventListener('click', function() {
            console.log('Call It a Day button clicked!');
            showCelebrationModal();
        });
    }
    
    // ADD THIS: Streak+1 button handler
    const streakButton = document.getElementById('streak-button');
    if (streakButton) {
        streakButton.addEventListener('click', handleStreakIncrement);
    }
    
    // Optional: Close modal when clicking backdrop
    const backdrop = document.querySelector('.celebration-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            document.getElementById('celebration-overlay').classList.add('hidden');
        });
    }
}


// Helper function to check daily quest completion
async function checkDailyQuestStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/daily-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const status = await response.json();
            return status.quest_completed || false;
        }
    } catch (error) {
        console.error('Error checking daily quest status:', error);
    }
    return false;
}


// Show celebration modal when everything is complete
async function showCelebrationModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/call-it-a-day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const celebrationData = await response.json();
            
            // Show modal
            const overlay = document.getElementById('celebration-overlay');
            overlay.classList.remove('hidden');
            
            // FIXED: Specify the correct element ID for celebration
            typewriterEffect(celebrationData.celebration_message, 'celebration-ai-text');
            
        } else {
            console.error('Failed to get celebration message');
        }
    } catch (error) {
        console.error('Error showing celebration modal:', error);
    }
}

// Handle Streak+1 button click
async function handleStreakIncrement() {
    try {
        console.log('Streak+1 button clicked!');
        
        // Call your existing /check-in endpoint to increment streak
        const response = await fetch(`${API_BASE_URL}/check-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Streak incremented:', result);
            
            // Hide celebration modal
            const overlay = document.getElementById('celebration-overlay');
            overlay.classList.add('hidden');
            
            // ADD THIS LINE: Hide the "Call It a Day" button
            const callItADayContainer = document.getElementById('call-it-a-day-container');
            if (callItADayContainer) {
                callItADayContainer.classList.add('hidden');
            }
            
            // Update streak display on home screen
            await updateStreakDisplay();
            
            // Optional: Show brief confirmation
            console.log(`New streak: ${result.streak} days!`);
            
        } else {
            console.error('Failed to increment streak:', response.status);
        }
        
    } catch (error) {
        console.error('Error incrementing streak:', error);
    }
}


// Schedule midnight reset functionality
function scheduleMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    console.log(`Midnight reset scheduled in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
    
    setTimeout(async () => {
        await performMidnightReset();
        // Schedule the next midnight reset (24 hours later)
        scheduleMidnightReset();
    }, timeUntilMidnight);
}

// Execute the midnight reset
async function performMidnightReset() {
    try {
        console.log('🌙 Performing midnight reset...');
        
        const response = await fetch(`${API_BASE_URL}/midnight-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Midnight reset completed:', result);
            
            // Refresh the UI to show empty state
            const currentTasks = await getTasks();
            showTaskList(currentTasks);
            
            // Reset potato to default state
            switchPotatoImage('default');
            
            // Update daily quest display
            await loadExistingDailyQuest();
            
            // Optional: Show brief notification to user if they're awake
            showMidnightResetNotification(result);
            
        } else {
            console.error('Failed to perform midnight reset:', response.status);
        }
        
    } catch (error) {
        console.error('Error during midnight reset:', error);
    }
}

// Optional: Show notification if user is active during reset
function showMidnightResetNotification(resetResult) {
    // Only show if user seems to be actively using the app
    if (document.hasFocus()) {
        const notification = {
            message: `🌙 Fresh start! Cleared ${resetResult.tasks_cleared} tasks for tomorrow`,
            type: 'midnight-reset'
        };
        
        // You could integrate this with your existing notification system
        // or simply log it
        console.log('Midnight Reset:', notification.message);
    }
}
