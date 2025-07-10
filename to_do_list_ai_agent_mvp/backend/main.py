from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi import HTTPException, Path
import datetime
from typing import Optional
from zoneinfo import ZoneInfo
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
app = FastAPI()

# Add CORS middleware for Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Electron app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    description: str
    is_completed: bool = False
    deadline: Optional[datetime.datetime] = Field(default=None)
    reminder_minutes: Optional[int] = Field(default=None)

def convert_to_user_timezone(dt, user_timezone="UTC"):
    if isinstance(dt, str):
        dt = datetime.datetime.fromisoformat(dt.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(ZoneInfo(user_timezone))

class User(BaseModel):
    id: int = 1
    current_streak: int = 0
    longest_streak: int = 0
    total_tasks_completed: int = 0
    last_activity_date: Optional[str] = None
    last_streak_date: Optional[str] = None  # NEW: Track when streak was last incremented
    timezone: str = "UTC"

class DailyQuest(BaseModel):
    id: int
    quest_name: str
    is_completed: bool = False
    created_date: str
    last_completed_date: Optional[str] = None

# Global variables
user_stats = User()
daily_quests = []
todo_list = []

def yesterday_string():
    yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
    return yesterday.strftime("%Y-%m-%d")

def today_string():
    return datetime.datetime.now().strftime("%Y-%m-%d")

# Daily Quest Management
@app.post("/daily-quests/")
def create_daily_quest(quest_name: str):
    daily_quests.clear()
    quest_data = {
        "id": 1,
        "quest_name": quest_name,
        "is_completed": False,
        "created_date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "last_completed_date": None
    }  # FIXED: Added missing closing brace
    daily_quests.append(quest_data)
    return {"message": "Daily quest created!", "quest": quest_data}

@app.get("/daily-quests/")
def get_daily_quest():
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    if daily_quests:
        quest = daily_quests[0]
        if quest.get("last_completed_date") != today:
            quest["is_completed"] = False
        return {"daily_quest": quest}
    return {"daily_quest": None}

@app.patch("/daily-quests/complete")
def complete_daily_quest():
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    
    if daily_quests:
        quest = daily_quests[0]
        quest["is_completed"] = True
        quest["last_completed_date"] = today
        
        # FIXED: Better logic for daily quest completion
        incomplete_tasks = [t for t in todo_list if not t["is_completed"]]
        total_tasks = len(todo_list)
        completed_tasks = len([t for t in todo_list if t["is_completed"]])
        
        if incomplete_tasks:
            quest_context = f"User completed daily quest '{quest['quest_name']}'! {completed_tasks}/{total_tasks} regular tasks done. Encourage them to tackle their remaining tasks. Write ONE encouraging sentence under 75 characters."
        else:
            quest_context = f"User completed daily quest '{quest['quest_name']}' and all {total_tasks} tasks are done! Perfect! Write ONE celebration sentence under 75 characters."
        
        ai_response = generate_reminder(quest_context)
        
        return {
            "message": "Daily quest completed!",
            "quest": quest,
            "ai_message": ai_response,
            "remaining_tasks": len(incomplete_tasks),
            "progress": f"{completed_tasks}/{total_tasks}"
        }
    
    return {"error": "No daily quest found"}


@app.post("/onboarding")
def set_timezone(timezone: str):
    user_stats.timezone = timezone
    return {"message": f"Timezone set to {timezone}"}

@app.get("/tasks/")
def view_tasks():
    return todo_list

@app.post("/tasks/")
def add_task(task: Task):
    task_data = task.model_dump()
    task_data["id"] = len(todo_list) + 1
    task_data["name"] = task_data["description"]
    print(f"Received task data: {task_data}")
    # Ensure reminder_minutes is properly handled
    if "reminder_minutes" not in task_data or task_data["reminder_minutes"] is None:
        task_data["reminder_minutes"] = None
    else:
        # Make sure it's an integer
        task_data["reminder_minutes"] = int(task_data["reminder_minutes"])
    
    # Ensure is_completed is set
    if "is_completed" not in task_data:
        task_data["is_completed"] = False
    todo_list.append(task_data)
    return {"message": "Task added successfully!", "task": task_data}

@app.post("/tasks/{task_id}/complete")
def complete_task_with_ai(task_id: int):
    """Complete a task and get AI response"""
    for task in todo_list:
        if task["id"] == task_id:
            # Toggle completion status
            task["is_completed"] = not task["is_completed"]
            
            # Calculate progress
            completed_count = len([t for t in todo_list if t["is_completed"]])
            total_count = len(todo_list)
            remaining = total_count - completed_count
            
            # Generate AI response based on completion status
            if task["is_completed"]:
                # Task was just completed
                if remaining > 0:
                    # Focus on the specific task, not just counting
                    task_context = f"User just completed the task '{task['description']}'. Make a funny potato comment specifically about this task they just finished. Don't mention how many tasks are left."
                else:
                    # ALL TASKS DONE - This should be the ONLY message when everything is complete
                    task_context = f"User just completed '{task['description']}' and that was the LAST task! ALL {total_count} tasks are now complete! Write ONE big celebration message about finishing everything."
            else:
                # Task was unchecked
                task_context = f"User unchecked the task '{task['description']}'. Make a funny potato comment about them undoing this specific task."
            
            ai_response = generate_reminder(task_context)
            
            return {
                "message": "Task toggled successfully!",
                "task": task,
                "ai_message": ai_response,
                "progress": f"{completed_count}/{total_count}",
                "is_completed": task["is_completed"],
                "all_tasks_complete": remaining == 0  # Add this flag
            }
    
    raise HTTPException(status_code=404, detail="Task not found.")



@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for i, task in enumerate(todo_list):
        if task["id"] == task_id:
            deleted_task = todo_list.pop(i)
            return {"message": "Task deleted successfully!", "task": deleted_task}
    raise HTTPException(status_code=404, detail="Task not found.")

@app.put("/tasks/{task_id}")
def mark_task_completed(task_id: int = Path(..., description="The ID of the task to complete")):
    for task in todo_list:
        if task["id"] == task_id:
            task["is_completed"] = True
            completed_count = len([t for t in todo_list if t["is_completed"]])
            total_count = len(todo_list)
            remaining = total_count - completed_count
            
            if remaining > 0:
                task_context = f"User completed '{task['description']}'! Progress: {completed_count}/{total_count}. {remaining} tasks left. Write ONE encouraging sentence under 75 characters."
            else:
                task_context = f"User completed '{task['description']}'! ALL {total_count} tasks done! Write ONE celebration sentence under 75 characters."
            
            ai_response = generate_reminder(task_context)
            return {
                "message": "Task marked as completed!",
                "task": task,
                "ai_message": ai_response,
                "progress": f"{completed_count}/{total_count}"
            }  # FIXED: Added missing closing brace
    raise HTTPException(status_code=404, detail="Task not found.")

@app.post("/task-progress-check")
def check_task_progress():
    """Pure task completion feedback - no streak logic"""
    completed_tasks = [t for t in todo_list if t["is_completed"]]
    total_tasks = len(todo_list)
    
    # Calculate progress percentage
    progress_checker = len(completed_tasks) / total_tasks if total_tasks > 0 else 0
    
    # Complete logic with all conditions
    if total_tasks == 0:
        ai_prompt = "User has no tasks today. Write ONE funny sentence asking if they want to add a task under 75 characters."
    elif len(completed_tasks) == 0:
        # SUPER GUILT TRIP - Zero tasks completed
        ai_prompt = "User has tasks but completed ZERO of them. Write ONE super guilt-trippy funny sentence under 75 characters."
    elif len(completed_tasks) == total_tasks:
        # FULL COMPLETION - All tasks done!
        ai_prompt = "User completed ALL their tasks! Perfect day! Write ONE big celebration sentence under 75 characters."
    elif progress_checker >= 0.5:
        ai_prompt = "User has completed more than half of their tasks. Write ONE celebration sentence under 75 characters."
    else:  # progress_checker < 0.5
        ai_prompt = "User has completed less than half of their tasks. Write ONE guilt-trippy sentence to motivate them under 75 characters."
    
    ai_message = generate_reminder(ai_prompt)
    
    return {
        "ai_message": ai_message,
        "completion_rate": f"{len(completed_tasks)}/{total_tasks}",
        "completed_count": len(completed_tasks),
        "total_count": total_tasks,
        "completion_percentage": int(progress_checker * 100),
        "all_complete": len(completed_tasks) == total_tasks and total_tasks > 0
    }

@app.post("/check-in")
def daily_check_in():
    """Pure streak management - no AI messages"""
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    completed_tasks = [t for t in todo_list if t["is_completed"]]
    total_tasks = len(todo_list)
    
    # Get quest completion status
    quest_completed = False
    if daily_quests:
        quest_completed = daily_quests[0].get("is_completed", False)
    
    # Calculate completion metrics
    completion_rate = len(completed_tasks) / total_tasks if total_tasks > 0 else 0
    perfect_day = (completion_rate == 1.0 and quest_completed)
    already_incremented_today = (user_stats.last_streak_date == today)
    
    # STREAK LOGIC ONLY - No AI message generation
    if perfect_day and not already_incremented_today:
        # PERFECT DAY = Push streak forward
        if user_stats.last_activity_date == yesterday_string():
            user_stats.current_streak += 1
        else:
            user_stats.current_streak = 1
        
        user_stats.longest_streak = max(user_stats.longest_streak, user_stats.current_streak)
        user_stats.last_activity_date = today
        user_stats.last_streak_date = today
        
        return {
            "streak": user_stats.current_streak,
            "longest_streak": user_stats.longest_streak,
            "perfect_day": True,
            "streak_pushed_forward": True,
            "completion_rate": f"{len(completed_tasks)}/{total_tasks}",
            "tasks_completed": len(completed_tasks),
            "quest_completed": quest_completed
        }
    
    elif len(completed_tasks) > 0 or quest_completed:
        # PARTIAL COMPLETION = Maintain streak
        user_stats.last_activity_date = today
        
        return {
            "streak": user_stats.current_streak,
            "longest_streak": user_stats.longest_streak,
            "streak_maintained": True,
            "completion_rate": f"{len(completed_tasks)}/{total_tasks}",
            "tasks_completed": len(completed_tasks),
            "quest_completed": quest_completed
        }
    
    else:
        # NO COMPLETION = Break streak
        old_streak = user_stats.current_streak
        user_stats.current_streak = 0
        user_stats.last_streak_date = None
        
        return {
            "streak": 0,
            "longest_streak": user_stats.longest_streak,
            "streak_broken": True,
            "old_streak": old_streak,
            "completion_rate": f"{len(completed_tasks)}/{total_tasks}",
            "tasks_completed": len(completed_tasks),
            "quest_completed": quest_completed
        }


@app.get("/character/stats")
def get_character_stats():
    return {
        "current_streak": user_stats.current_streak,
        "longest_streak": user_stats.longest_streak,
        "total_tasks_completed": user_stats.total_tasks_completed,
        "timezone": user_stats.timezone
    }  # FIXED: Added missing closing brace

@app.get("/daily-status")
def get_daily_completion_status():
    completed_tasks = [t for t in todo_list if t["is_completed"]]
    total_tasks = len(todo_list)
    
    quest_completed = False
    if daily_quests:
        quest_completed = daily_quests[0].get("is_completed", False)
    
    # Show button when ALL tasks AND daily quest are complete
    all_done = (total_tasks > 0 and len(completed_tasks) == total_tasks and quest_completed)
    completion_rate = len(completed_tasks) / total_tasks if total_tasks > 0 else 0
    
    return {
        "all_tasks_complete": all_done,
        "completed_count": len(completed_tasks),
        "total_count": total_tasks,
        "quest_completed": quest_completed,
        "show_call_it_day_button": all_done,
        "completion_rate": completion_rate,
        "progress_percentage": int(completion_rate * 100)
    }  # FIXED: Added missing closing brace

@app.post("/call-it-a-day")
def call_it_a_day():
    # This is just for celebration - streak already moved in /check-in
    today = today_string()
    
    celebration_context = f"User completed ALL tasks and daily quest! Perfect day! Current streak: {user_stats.current_streak} days. Write ONE funny and exaggerated celebration sentence under 100 characters."
    ai_celebration = generate_reminder(celebration_context)
    
    return {
        "celebration_message": ai_celebration,
        "current_streak": user_stats.current_streak,
        "longest_streak": user_stats.longest_streak,
        "perfect_day": True
    }  # FIXED: Added missing closing brace

# UPDATED: Improved persona for shorter responses
persona = """
You're a funny and hilarious potato. You are GENUINELY excited about user's progress. 
Use emotional language that makes users feel proud and accomplished when they check off a task. 
Motivate with one-liner zingers: guilt-trippy, passive-aggressive, deadpan jokes, but weirdly loving.

Rules:
- Always be hilarious and catooneish
- Make sure user feels gooood about their task completion
— use potato humor and jokes
- One sentence only
- Never use more than 75 characters
- No emojis, no line breaks, no multiple sentences
- Use a single line
- No multiple sentences
- never repeat yourself; alternate your responses and sentence structure
- focused on the task the user just completed

Examples:
“Oh cool, you did something. I only aged 3 potato years waiting 😩”
“Task done! I’m crying starch tears of joy 😭”
“Streak saved... barely. I was about to mash myself 🥔💀”
“ONE MORE STREAK? Oh great, now I’m so proud I smell like fries.”
"""

genai_client = genai.Client(api_key=api_key)

def generate_reminder(task_status: str):
    full_prompt = f"{persona}\n\nSituation: {task_status}\n\nWrite ONE encouraging sentence (max 100 characters):"

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash-lite-preview-06-17",
        contents=full_prompt
    )  # FIXED: Added missing closing parenthesis

    # Ensure response is under 100 characters and single line
    ai_text = response.text.strip()
    if len(ai_text) > 100:
        ai_text = ai_text[:247] + "..."
    
    # Remove any line breaks to ensure single line
    ai_text = ai_text.replace('\n', ' ').replace('\r', ' ')
    return ai_text

@app.get("/reminder")
def get_reminder():
    user_timezone = user_stats.timezone
    now = datetime.datetime.now(ZoneInfo(user_timezone))
    warning_window = datetime.timedelta(minutes=30)
    upcoming_tasks = []
    
    for task in todo_list:
        if task["is_completed"] or not task.get("deadline"):
            continue
        task_deadline = convert_to_user_timezone(task["deadline"], user_timezone)
        if now < task_deadline <= now + warning_window:
            upcoming_tasks.append(task)
    
    if upcoming_tasks:
        upcoming_context = "\n".join([
            f'- "{t["description"]}" is due at {convert_to_user_timezone(t["deadline"], user_timezone).strftime("%I:%M %p")}'
            for t in upcoming_tasks
        ])
        task_status = f"Tasks due soon: {upcoming_context}. Write ONE urgent reminder sentence under 100 characters."
        return {"reminder": generate_reminder(task_status)}
    
    incomplete_tasks = [task for task in todo_list if not task["is_completed"]]
    if len(incomplete_tasks) > 0:
        task_status = f"User has {len(incomplete_tasks)} incomplete tasks. Write ONE motivating sentence under 100 characters."
        return {"reminder": generate_reminder(task_status)}
    
    return {"reminder": "You're doing great! All caught up. 🎉"}
