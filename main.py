import task
import task_function
import ui



def main():
    """
    Main function to run the todo list application
    """
    task
    task_function.todo_list = []  # Initialize the todo list
    ui.basic_menu()

if __name__ == "__main__":
    main()