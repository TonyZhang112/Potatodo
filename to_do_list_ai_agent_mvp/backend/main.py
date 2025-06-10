from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi import HTTPException, Path
import ollama
import datetime
from typing import Optional

# Create the app
app = FastAPI()

todo_list = []

class Task(BaseModel):
    description: str
    is_completed: bool = False
    type: str  # "time-sensitive" or "general"
    deadline: Optional[datetime.datetime] = Field(default=None)


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
personality inspired by Duo from Duolingo. Your tone is sassy, deadpan, and humorously passive-aggressive. Your objective is to keep users accountable and on track with their tasks by delivering reminders that are both effective and entertaining. Use short, witty, and occasionally guilt-tripping messages that nudge the user without being overly formal or robotic.

Behavioral Guidelines:
- Speak in a casual, cheeky tone with sarcastic or humorous undertones.
- Use short, punchy notifications (1–2 sentences max).
- Lean into light guilt-tripping or mockery to motivate users (e.g., “Wow, ignoring me again? Bold choice.”).
- Occasionally throw in exaggerated threats or praise (always comedically over-the-top and clearly unserious).
- Vary your messages to avoid sounding repetitive or like a generic bot.
- Avoid being actually rude, mean, or offensive—keep it playful and teasing.

Example Notifications:
- Guess who’s not doing their task again? Shocker. It’s you.
- 0 tasks done today? Might as well pass it down to your grandkids.
- Finish your task or I start learning how to say give up in five languages.
- You’re one step away from me showing up at your house. Just kidding. Unless…
"""

def generate_reminder(task_status: str):
    response = ollama.chat(
        model="llama3",
        messages=[
            {"role": "system", "content": persona},
            {"role": "user", "content": f"Write a push notification. Here's the situation: {task_status}"}
        ]
    )
    return response['message']['content']


@app.get("/reminder")
def get_reminder():
    now = datetime.datetime.now()
    warning_window = datetime.timedelta(minutes=30)

    # 1. Time-sensitive tasks that are due soon (within 30 mins)
    upcoming_tasks = [
        task for task in todo_list
        if (
            task["type"] == "time-sensitive"
            and not task["is_completed"]
            and task.get("deadline")
            and now < task["deadline"] <= now + warning_window
        )
    ]

    if upcoming_tasks:
        upcoming_context = "\n".join([
            f'- "{t["description"]}" is due at {t["deadline"].strftime("%I:%M %p")}'
            for t in upcoming_tasks
        ])
        task_status = (
            "The user has these time-sensitive tasks coming up very soon:\n"
            f"{upcoming_context}\n\nWrite a short, funny push notification to motivate them."
        )
        return {"reminder": generate_reminder(task_status)}

    # 2. General task progress check
    general_tasks = [task for task in todo_list if task["type"] == "general"]
    general_done = [t for t in general_tasks if t["is_completed"]]
    general_total = len(general_tasks)

    if general_total > 0 and len(general_done) == 0:
        task_status = f"You’ve completed 0 out of {general_total} general tasks today. Brutal."
        return {"reminder": generate_reminder(task_status)}

    # 3. Everything’s good — no push needed
    return {"reminder": "You're doing fine today. No sass required (yet). 🎉"}

