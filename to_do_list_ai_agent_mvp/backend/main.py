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
            quest_context = f"User completed daily quest '{quest['quest_name']}'! {completed_tasks}/{total_tasks} regular tasks done. Encourage them to tackle their remaining tasks. Write ONE encouraging sentence under 250 characters."
        else:
            quest_context = f"User completed daily quest '{quest['quest_name']}' and all {total_tasks} tasks are done! Perfect! Write ONE celebration sentence under 250 characters."
        
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
    todo_list.append(task_data)
    return {"message": "Task added successfully!", "task": task_data}

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
                task_context = f"User completed '{task['description']}'! Progress: {completed_count}/{total_count}. {remaining} tasks left. Write ONE encouraging sentence under 250 characters."
            else:
                task_context = f"User completed '{task['description']}'! ALL {total_count} tasks done! Write ONE celebration sentence under 250 characters."
            
            ai_response = generate_reminder(task_context)
            return {
                "message": "Task marked as completed!",
                "task": task,
                "ai_message": ai_response,
                "progress": f"{completed_count}/{total_count}"
            }  # FIXED: Added missing closing brace
    raise HTTPException(status_code=404, detail="Task not found.")

@app.post("/check-in")
def daily_check_in():
    today = datetime.datetime.now().strftime("%Y-%m-%d")  # This is correct now
    
    completed_tasks = [t for t in todo_list if t["is_completed"]]
    total_tasks = len(todo_list)
    
    # FIXED: Correct way to access daily quest completion
    quest_completed = False
    if daily_quests:
        quest_completed = daily_quests[0].get("is_completed", False)  # Access first item, then get
    
    # Progress checker logic
    completion_rate = len(completed_tasks) / total_tasks if total_tasks > 0 else 0
    perfect_day = (completion_rate == 1.0 and quest_completed)
    
    # Check if streak already moved forward today
    already_incremented_today = (user_stats.last_streak_date == today)
    
    if perfect_day and not already_incremented_today:
        # PERFECT DAY + Haven't incremented today = Push streak forward
        if user_stats.last_activity_date == yesterday_string():
            user_stats.current_streak += 1
        else:
            user_stats.current_streak = 1
        
        user_stats.longest_streak = max(user_stats.longest_streak, user_stats.current_streak)
        user_stats.last_activity_date = today
        user_stats.last_streak_date = today
        
        streak_status = f"PERFECT DAY! User completed ALL {total_tasks} tasks AND daily quest. Streak pushed to {user_stats.current_streak} days! Write ONE celebration sentence under 250 characters."
        ai_response = generate_reminder(streak_status)
        
        return {
            "streak": user_stats.current_streak,
            "longest_streak": user_stats.longest_streak,
            "ai_message": ai_response,
            "tasks_completed": len(completed_tasks),
            "quest_completed": quest_completed,
            "perfect_day": True,
            "streak_pushed_forward": True,
            "completion_rate": f"{len(completed_tasks)}/{total_tasks}"
        }
        
    elif len(completed_tasks) > 0 or quest_completed:
        # PARTIAL COMPLETION = Maintain streak
        user_stats.last_activity_date = today
        
        streak_status = f"User completed {len(completed_tasks)}/{total_tasks} tasks and daily quest: {quest_completed}. Streak maintained at {user_stats.current_streak} days. Write ONE funny but friendly guilt-tripping sentence to push them to finish the remaining tasks under 250 characters."
        ai_response = generate_reminder(streak_status)
        
        return {
            "streak": user_stats.current_streak,
            "longest_streak": user_stats.longest_streak,
            "ai_message": ai_response,
            "tasks_completed": len(completed_tasks),
            "quest_completed": quest_completed,
            "streak_maintained": True,
            "completion_rate": f"{len(completed_tasks)}/{total_tasks}"
        }
    else:
        # NO COMPLETION = Break streak
        old_streak = user_stats.current_streak
        user_stats.current_streak = 0
        user_stats.last_streak_date = None
        
        break_message = f"User broke {old_streak} day streak by completing nothing. Write ONE funny, guilt tripping but not mean sentence under 250 characters."
        ai_response = generate_reminder(break_message)
        
        return {
            "streak": 0,
            "longest_streak": user_stats.longest_streak,
            "ai_message": ai_response,
            "streak_broken": True,
            "completion_rate": "0/0"
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
    
    celebration_context = f"User completed ALL tasks and daily quest! Perfect day! Current streak: {user_stats.current_streak} days. Write ONE funny and exaggerated celebration sentence under 250 characters."
    ai_celebration = generate_reminder(celebration_context)
    
    return {
        "celebration_message": ai_celebration,
        "current_streak": user_stats.current_streak,
        "longest_streak": user_stats.longest_streak,
        "perfect_day": True
    }  # FIXED: Added missing closing brace

# UPDATED: Improved persona for shorter responses
persona = """
You're a sad, funny potato with a clingy vibe. Motivate with one-liner zingers: guilt-trippy, passive-aggressive, deadpan jokes, full of potato food-referenced hellish gags when excited and extremely disappointed, but weirdly loving.

Rules:
- One sentence only
- Max 200 chars
- No line breaks
- Use emojis like 🥔😭😩✨

Examples:
“Oh cool, you did something. I only aged 3 potato years waiting 😩”
“Task done! I’m crying starch tears of joy 😭”
“Streak saved... barely. I was about to mash myself 🥔💀”
“ONE MORE STREAK? Oh great, now I’m so proud I smell like fries.”
"""

genai_client = genai.Client(api_key=api_key)

def generate_reminder(task_status: str):
    full_prompt = f"{persona}\n\nSituation: {task_status}\n\nWrite ONE encouraging sentence (max 250 characters):"

    response = genai_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=full_prompt
    )  # FIXED: Added missing closing parenthesis

    # Ensure response is under 250 characters and single line
    ai_text = response.text.strip()
    if len(ai_text) > 250:
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
        task_status = f"Tasks due soon: {upcoming_context}. Write ONE urgent reminder sentence under 250 characters."
        return {"reminder": generate_reminder(task_status)}
    
    incomplete_tasks = [task for task in todo_list if not task["is_completed"]]
    if len(incomplete_tasks) > 0:
        task_status = f"User has {len(incomplete_tasks)} incomplete tasks. Write ONE motivating sentence under 250 characters."
        return {"reminder": generate_reminder(task_status)}
    
    return {"reminder": "You're doing great! All caught up. 🎉"}
