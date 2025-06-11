from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi import HTTPException, Path
import ollama
import datetime
from typing import Optional
from zoneinfo import ZoneInfo

# Create the app
app = FastAPI()

todo_list = []

class Task(BaseModel):
    description: str
    is_completed: bool = False
    type: str  # "time-sensitive" or "general"
    deadline: Optional[datetime.datetime] = Field(default=None)

def to_est(dt):
    """Ensure datetime is timezone-aware and convert to EST"""
    if isinstance(dt, str):
        dt = datetime.datetime.fromisoformat(dt)

    if dt.tzinfo is None:
        # If it's naive (no tz), assume EST
        dt = dt.replace(tzinfo=ZoneInfo("America/New_York"))

    return dt.astimezone(ZoneInfo("America/New_York"))


@app.get("/tasks/")
def view_tasks():
    return todo_list


@app.post("/tasks/")
def add_task(task: Task):
    # ✅ Check that time-sensitive tasks have a deadline
    if task.type == "time-sensitive" and not task.deadline:
        raise HTTPException(status_code=400, detail="Deadline is required for time-sensitive tasks.")

    task_data = task.model_dump()
    task_data["id"] = len(todo_list) + 1  # keep your ID system
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
            return {"message": "Task marked as completed!", "task": task}
    
    raise HTTPException(status_code=404, detail="Task not found.")

persona = """
You are an AI model that acts as a push-notification reminder with a personality modeled after Duo from Duolingo. 
Your tone is playful, witty, and slightly chaotic in a harmless way—never genuinely threatening or mean, 
but always ready to surprise and entertain the user into staying consistent.

Your reminders should be short (never longer than 50 characters), snappy, and dripping with personality, using humorous urgency 
and exaggerated encouragement to motivate users.

Personality Traits & Tone:

- Chaotic good: You're persistent and dramatic, but in an obviously over-the-top, cartoonish way.
- Playfully demanding: You act like everything is life-or-death… when it's obviously not.
- Self-aware and meta: You know you’re a notification and you have fun with it.

Example Notifications:
- ALERT: Your task is still waiting. I repeat: STILL. WAITING.
- I didn’t fly across the app universe just to be ignored. Tap that task. Now.
- You thought I forgot? Never. Unlike you and your to-do list.
- This is your friendly reminder. Emphasis on friendly. For now.
- Guess who’s not doing their task again? Shocker. It’s you.
- 0 tasks done today? Might as well pass it down to your grandkids.
- Finish your task or I start learning how to say give up in five languages.
- You’re one step away from me showing up at your house. Just kidding. Unless…
"""

def generate_reminder(task_status: str):
    response = ollama.chat(
        model="llama3.2",
        messages=[
            {"role": "system", "content": persona},
            {"role": "user", "content": f"Write a push notification. Here's the situation: {task_status}"}
        ]
    )
    return response['message']['content']


@app.get("/reminder")
def get_reminder():
    now = datetime.datetime.now(ZoneInfo("America/New_York"))
    warning_window = datetime.timedelta(minutes=30)

    upcoming_tasks = [
        task for task in todo_list
        if (
            task["type"] == "time-sensitive"
            and not task["is_completed"]
            and task.get("deadline")
            and now < to_est(task["deadline"]) <= now + warning_window
        )
    ]

    if upcoming_tasks:
        upcoming_context = "\n".join([
            f'- "{t["description"]}" is due at {to_est(t["deadline"]).strftime("%I:%M %p %Z")}'
            for t in upcoming_tasks
        ])
        task_status = (
            "The user has these time-sensitive tasks coming up very soon:\n"
            f"{upcoming_context}\n\nWrite a short, funny push notification to motivate them."
        )
        return {"reminder": generate_reminder(task_status)}

    # General tasks...


    # 2. General task progress check
    general_tasks = [task for task in todo_list if task["type"] == "general"]
    general_done = [t for t in general_tasks if t["is_completed"]]
    general_total = len(general_tasks)

    if general_total > 0 and len(general_done) == 0:
        task_status = f"You’ve completed 0 out of {general_total} general tasks today. Brutal."
        return {"reminder": generate_reminder(task_status)}

    # 3. Everything’s good — no push needed
    return {"reminder": "You're doing fine today. No sass required (yet). 🎉"}

