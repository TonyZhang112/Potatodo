# Potatodo 🥔 - Your Gamified AI To-Do List Companion

Potatodo is a fun and motivating desktop to-do list application that helps you stay productive with the help of a quirky, AI-powered potato companion. Complete tasks, maintain your streak, and get humorous, encouraging messages from your potato friend!

## ✨ Core Features

*   **AI-Powered Companion**: A potato character that reacts to your progress with dynamic expressions and humorous, AI-generated messages powered by Google Gemini.
*   **Complete Task Management**: Add, edit, complete, and delete your daily tasks with a clean and simple interface.
*   **Deadlines & Reminders**: Set specific deadlines and receive system notifications to never miss an important task.
*   **Gamified Productivity**:
    *   **Streaks**: Build and maintain a daily streak for completing all your tasks and a special daily quest.
    *   **Daily Quest**: Set one important goal for the day to accomplish alongside your regular tasks.
    *   **"Call It a Day"**: A celebration screen appears when you achieve a "perfect day" by completing everything.
*   **Automated Scheduling**:
    *   **Progress Check-ins**: The app checks in on you at 12 PM and 9 PM, offering motivational (or guilt-trippy!) messages based on your progress.
    *   **Midnight Reset**: Tasks are automatically cleared at midnight, giving you a fresh start every day.

## 🛠️ Tech Stack

*   **Backend**: Python with **FastAPI**
*   **Frontend**: Vanilla **HTML**, **CSS**, and **JavaScript** (designed for an Electron wrapper)
*   **AI**: **Google Gemini API** for dynamic message generation
*   **Database**: In-memory Python lists (Note: Data resets when the backend server is restarted).

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

*   Python 3.9+
*   A Google Gemini API Key
*   Node.js and npm (if you plan to wrap this in an Electron app)

### 1. Backend Setup

First, set up and run the FastAPI server which powers the application's logic.

1.  **Clone the repository:**
    ```
    git clone https://github.com/your-username/potatodo.git
    cd potatodo
    ```

2.  **Create and activate a virtual environment:**
    *   On macOS/Linux:
        ```
        python3 -m venv venv
        source venv/bin/activate
        ```
    *   On Windows:
        ```
        python -m venv venv
        .\venv\Scripts\activate
        ```

3.  **Install Python dependencies:**
    Create a file named `requirements.txt` in the root directory and add the following lines:
    ```
    fastapi
    uvicorn[standard]
    python-dotenv
    google-generativeai
    ```
    Then, run the installation command:
    ```
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a file named `.env` in the root directory. This file will store your secret API key.
    ```
    GOOGLE_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
    Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual Google Gemini API key.

5.  **Run the backend server:**
    ```
    uvicorn main:app --reload
    ```
    The backend server will start, typically on `http://localhost:8000`. You should see a message confirming that the application startup is complete.

### 2. Frontend Setup

The frontend is built with simple HTML, CSS, and JavaScript. It's designed to be run directly in a browser or as the user interface for an Electron application.

1.  **Ensure the backend is running.** The frontend `script.js` and `edit-task.js` files are hardcoded to make API calls to `http://localhost:8000`.

2.  **Open the application:**
    Simply open the `index.html` file in your web browser. All functionality should work as long as the backend server is running.

## ⚙️ How It Works

The application logic is separated between the frontend and a FastAPI backend.

*   **Frontend (`script.js`, `edit-task.js`)**: Handles user interactions, renders the UI, and sends HTTP requests to the backend for all operations (creating, reading, updating, deleting tasks). It also manages timers for scheduling frontend notifications.
*   **Backend (`main.py`)**:
    *   Exposes a series of API endpoints to manage tasks, user streaks, and daily quests.
    *   When an action occurs (e.g., a task is completed), it constructs a specific prompt based on the context.
    *   It sends this prompt to the **Google Gemini API** to get a unique, funny, and potato-themed response.
    *   The response is sent back to the frontend to be displayed to the user.
*   **Data Persistence**: The application uses global Python lists (`todo_list`, `user_stats`) to store data. This means all tasks and stats will be **reset if the backend server restarts**. For persistent storage, this could be upgraded to a database like SQLite or PostgreSQL.

<details>
<summary><strong>API Endpoints Overview</strong></summary>

*   `GET /health`: Checks if the backend is running.
*   `GET /tasks`: Retrieves the list of all tasks.
*   `POST /tasks`: Adds a new task.
*   `PATCH /tasks/{task_id}`: Updates a task's details (name, deadline, reminder).
*   `DELETE /tasks/{task_id}`: Deletes a task.
*   `POST /tasks/{task_id}/complete`: Toggles a task's completion status and gets an AI response.
*   `GET /daily-quests/`: Retrieves the current daily quest.
*   `POST /daily-quests/`: Creates a new daily quest for the day.
*   `PATCH /daily-quests/complete`: Marks the daily quest as complete.
*   `POST /task-progress-check`: Endpoint for scheduled check-ins to get a progress-based AI message.
*   `POST /check-in`: Updates the user's streak based on task completion (used by the "Call It a Day" feature).
*   `GET /streak`: Retrieves the current and longest streak counts.
*   `POST /midnight-reset`: Clears all tasks for a new day.

</details>

## 📈 Future Improvements

*   **Persistent Storage**: Replace the in-memory lists with a database like SQLite to save tasks and stats permanently.
*   **User Authentication**: Implement a user login system to support multiple users.
*   **Electron Packaging**: Add the necessary Electron configuration (`main.js`, `package.json`) to build and package the application for desktop platforms.
*   **Customization**: Allow users to customize the potato's appearance or choose different AI companion themes.
*   **Sound Effects**: Add satisfying sound effects for completing tasks or interacting with the UI.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
