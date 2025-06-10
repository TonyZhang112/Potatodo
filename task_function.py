import task

todo_list = []
def add_task():
    """
    add a task to the todo list
    """
    while True:
        task_description = input('Enter the task description: ')
        new_task = task.Task(task_description)
        todo_list.append(new_task)
        print(f'Task "{task_description}" added successfully!')
        another = input('Do you want to add another task? (yes/no): ').strip().lower()
        if another != 'yes':
            break

def delete_task():
    view_tasks() # Display tasks before deletion
    if not todo_list:
        print("No tasks to delete.")
        return
    while True:
        task_index = int(input('Enter the task number to delete: ')) - 1
        if 0 <= task_index < len(todo_list):
            deleted_task = todo_list.pop(task_index)
            print(f'Task "{deleted_task.description}" deleted successfully!')
        else:
            print('Invalid task number. Please try again.')
        another = input('Do you want to delete another task? (yes/no): ').strip().lower()
        if another != 'yes' or not todo_list:
            break

def view_tasks():
    """
    view all tasks in the todo list
    """
    if not todo_list:
        print("No tasks available.")
        return
    else:
        print("\nCurrent Tasks:")
        for index, task in enumerate(todo_list, start=1):
            if task.is_completed == True:
                status = "✅"
            else:
                status = "▪️"
            print(f"{index}. {task.description} - {status}")