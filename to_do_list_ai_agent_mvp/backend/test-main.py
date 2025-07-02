from fastapi.testclient import TestClient
from main import app, user_stats, daily_quests, todo_list
import datetime

client = TestClient(app)

def setup_function():
    """Reset data before each test"""
    user_stats.current_streak = 0
    user_stats.longest_streak = 0
    user_stats.total_tasks_completed = 0
    user_stats.last_activity_date = None
    user_stats.timezone = "UTC"
    daily_quests.clear()
    todo_list.clear()

def test_onboarding():
    """Test timezone setup"""
    response = client.post("/onboarding?timezone=America/New_York")
    assert response.status_code == 200
    assert response.json() == {"message": "Timezone set to America/New_York"}
    assert user_stats.timezone == "America/New_York"

def test_create_daily_quest():
    """Test daily quest creation"""
    response = client.post("/daily-quests/?quest_name=Drink 8 glasses of water")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Daily quest created!"
    assert data["quest"]["quest_name"] == "Drink 8 glasses of water"
    assert len(daily_quests) == 1

def test_get_daily_quest():
    """Test getting daily quest"""
    # Create a quest first
    client.post("/daily-quests/?quest_name=Exercise for 30 minutes")
    
    response = client.get("/daily-quests/")
    assert response.status_code == 200
    data = response.json()
    assert data["daily_quest"]["quest_name"] == "Exercise for 30 minutes"
    assert data["daily_quest"]["is_completed"] == False

def test_complete_daily_quest():
    """Test completing daily quest"""
    # Create a quest first
    client.post("/daily-quests/?quest_name=Read for 20 minutes")
    
    response = client.patch("/daily-quests/complete")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Daily quest completed!"
    assert data["quest"]["is_completed"] == True

def test_add_task():
    """Test adding a task"""
    task_data = {
        "description": "Finish project report",
        "is_completed": False,
        "deadline": "2025-01-02T17:00:00Z",
        "reminder_minutes": 30
    }
    
    response = client.post("/tasks/", json=task_data)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task added successfully!"
    assert data["task"]["description"] == "Finish project report"
    assert len(todo_list) == 1

def test_complete_task():
    """Test marking task as completed"""
    # Add a task first
    task_data = {"description": "Call mom", "is_completed": False}
    client.post("/tasks/", json=task_data)
    
    response = client.put("/tasks/1")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Task marked as completed!"
    assert data["task"]["is_completed"] == True

def test_daily_status_incomplete():
    """Test daily status when tasks are incomplete"""
    # Add tasks but don't complete them
    client.post("/tasks/", json={"description": "Task 1"})
    client.post("/tasks/", json={"description": "Task 2"})
    client.post("/daily-quests/?quest_name=Daily habit")
    
    response = client.get("/daily-status")
    assert response.status_code == 200
    data = response.json()
    assert data["all_tasks_complete"] == False
    assert data["completed_count"] == 0
    assert data["total_count"] == 2
    assert data["show_call_it_day_button"] == False

def test_daily_status_complete():
    """Test daily status when everything is complete"""
    # Add and complete tasks and daily quest
    client.post("/tasks/", json={"description": "Task 1"})
    client.put("/tasks/1")
    client.post("/daily-quests/?quest_name=Daily habit")
    client.patch("/daily-quests/complete")
    
    response = client.get("/daily-status")
    assert response.status_code == 200
    data = response.json()
    assert data["all_tasks_complete"] == True
    assert data["completed_count"] == 1
    assert data["total_count"] == 1
    assert data["quest_completed"] == True
    assert data["show_call_it_day_button"] == True

def test_check_in_productive_day():
    """Test check-in with productive day (builds streak)"""
    # Complete some tasks and daily quest
    client.post("/tasks/", json={"description": "Task 1"})
    client.put("/tasks/1")
    client.post("/daily-quests/?quest_name=Daily habit")
    client.patch("/daily-quests/complete")
    
    response = client.post("/check-in")
    assert response.status_code == 200
    data = response.json()
    assert data["streak"] == 1
    assert data["tasks_completed"] == 1
    assert data["quest_completed"] == True
    assert "ai_message" in data

def test_check_in_unproductive_day():
    """Test check-in with no completed tasks (breaks streak)"""
    # Set up a streak first
    user_stats.current_streak = 5
    
    # Don't complete anything
    client.post("/tasks/", json={"description": "Task 1"})
    client.post("/daily-quests/?quest_name=Daily habit")
    
    response = client.post("/check-in")
    assert response.status_code == 200
    data = response.json()
    assert data["streak"] == 0
    assert data["streak_broken"] == True
    assert "ai_message" in data

def test_call_it_a_day():
    """Test the celebration endpoint"""
    # Complete everything
    client.post("/tasks/", json={"description": "Task 1"})
    client.put("/tasks/1")
    client.post("/daily-quests/?quest_name=Daily habit")
    client.patch("/daily-quests/complete")
    
    response = client.post("/call-it-a-day")
    assert response.status_code == 200
    data = response.json()
    assert data["perfect_day"] == True
    assert data["current_streak"] == 1
    assert "celebration_message" in data

def test_character_stats():
    """Test getting character stats"""
    user_stats.current_streak = 7
    user_stats.longest_streak = 10
    user_stats.timezone = "America/New_York"
    
    response = client.get("/character/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["current_streak"] == 7
    assert data["longest_streak"] == 10
    assert data["timezone"] == "America/New_York"

def test_reminder_with_incomplete_tasks():
    """Test reminder when there are incomplete tasks"""
    client.post("/tasks/", json={"description": "Incomplete task"})
    
    response = client.get("/reminder")
    assert response.status_code == 200
    data = response.json()
    assert "reminder" in data
    # The AI should generate a reminder about incomplete tasks

def test_reminder_all_complete():
    """Test reminder when everything is complete"""
    response = client.get("/reminder")
    assert response.status_code == 200
    data = response.json()
    assert data["reminder"] == "You're doing great! All caught up. 🎉"
