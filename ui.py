
import task_function
def basic_menu():
    """
    display the menu options to the user
    """
    print('Welcome to the very annoying to do list app!')
    while True:
        print('\n')
        print('-----------------------------------')
        print('Please select an option:')
        print('1. Add a task')
        print('2. Delete a task')
        print('3. View tasks')
        print('4. Exit')
        print('-----------------------------------')
        choice = input('Enter your choice: ')
        if choice == '1':
            task_function.add_task()
        elif choice == '2':
            task_function.delete_task()
        elif choice == '3':
            task_function.view_tasks()
        elif choice == '4':
            print('Thank you for using the very annoying to do list app!')
            break
        else:
            print('Invalid choice. Please try again.')

