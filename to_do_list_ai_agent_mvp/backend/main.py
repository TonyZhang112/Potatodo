from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import HTTPException, Path
import ollama

# Create the app
app = FastAPI()

todo_list = []

class Task(BaseModel):
    description: str
    is_completed: bool = False

@app.get("/tasks/")
def view_tasks():
    return todo_list

@app.post("/tasks/")
def add_task(task: Task):
    task_data = task.model_dump()
    task_data["id"] = len(todo_list) + 1  # simple ID assignment
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

def generate_reminder()