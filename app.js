// Переключение форм
document.getElementById('showLoginForm').addEventListener('click', function() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
});

document.getElementById('showRegisterForm').addEventListener('click', function() {
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
});

// Рег
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;

    const user = { username: newUsername, password: newPassword };

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Error:', error));
});

// Вход
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const credentials = { username: username, password: password };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);  
            alert('Вход выполнен успешно!');
            
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('auth-choice').style.display = 'none';
            document.getElementById('logout-section').style.display = 'block';
            
            document.getElementById('taskForm').style.display = 'block';
            document.getElementById('taskList').style.display = 'block';
            document.getElementById('taskListHeader').style.display = 'block';

            loadTasks();
        } else {
            alert('Ошибка входа!');
        }
    })
    .catch(error => console.error('Error:', error));
});

// Выход
document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem('token');
    alert('Вы успешно вышли из системы!');
    
    // Возвращаем пользователя на экран входа/регистрации
    document.getElementById('auth-choice').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('logout-section').style.display = 'none';
    document.getElementById('taskForm').style.display = 'none';
    document.getElementById('taskList').style.display = 'none';
    document.getElementById('taskListHeader').style.display = 'none';
});

// Добавление задачи
document.getElementById('taskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const dueDate = document.getElementById('due_date').value;

    const task = {
        title: title,
        description: description,
        due_date: dueDate
    };

    // Отправка данных на сервер
    fetch('/tasks/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(task)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Task created successfully!") {
            alert('Задача добавлена!');
            loadTasks();
        }
    })
    .catch(error => console.error('Error:', error));
});

// Список задач
function loadTasks() {
    fetch('/tasks', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(tasks => {
        console.log("Ответ от сервера:", tasks);

        if (Array.isArray(tasks)) {
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';
            tasks.forEach(task => {
                const li = document.createElement('li');

                // Текст задачи (Название задачи)
                const taskTitle = document.createElement('p');
                taskTitle.textContent = task.title;
                taskTitle.style.fontWeight = 'bold';
                li.appendChild(taskTitle);

                const taskDeadline = document.createElement('p');
                taskDeadline.textContent = `Дедлайн: ${task.due_date}`;
                taskDeadline.style.color = 'gray';
                li.appendChild(taskDeadline);

                const descriptionDiv = document.createElement('div');
                descriptionDiv.style.display = 'none';
                descriptionDiv.textContent = `Описание:\n${task.description || "Описание отсутствует"}`;
                descriptionDiv.style.whiteSpace = 'pre-wrap';
                li.appendChild(descriptionDiv);

                const descriptionButton = document.createElement('button');
                descriptionButton.textContent = "Описание задачи";
                descriptionButton.classList.add('small-button');
                descriptionButton.onclick = function() {
                    descriptionDiv.style.display = descriptionDiv.style.display === 'none' ? 'block' : 'none';
                };
                li.appendChild(descriptionButton);

                const editForm = document.createElement('div');
                editForm.style.display = 'none';
                editForm.innerHTML = `
                    <label>Новое название:</label>
                    <input type="text" id="newTitle${task.id}" value="${task.title}">
                    <label>Новое описание:</label>
                    <textarea id="newDescription${task.id}">${task.description}</textarea>
                    <label>Новая дата:</label>
                    <input type="date" id="newDueDate${task.id}" value="${task.due_date}">
                    <button onclick="submitEditTask(${task.id})">Сохранить</button>
                `;
                li.appendChild(editForm);

                const editButton = document.createElement('button');
                editButton.textContent = "Редактировать";
                editButton.classList.add('small-button');
                editButton.onclick = function() {
                    editForm.style.display = editForm.style.display === 'none' ? 'block' : 'none';
                };
                li.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = "Удалить";
                deleteButton.classList.add('small-button');
                deleteButton.onclick = function() {
                    deleteTask(task.id);
                };
                li.appendChild(deleteButton);

                taskList.appendChild(li);
            });
        } else {
            console.error("Полученные данные не являются массивом задач:", tasks);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Редактирование
function submitEditTask(id) {
    const newTitle = document.getElementById(`newTitle${id}`).value;
    const newDescription = document.getElementById(`newDescription${id}`).value;
    const newDueDate = document.getElementById(`newDueDate${id}`).value;

    const task = {
        title: newTitle,
        description: newDescription,
        due_date: newDueDate
    };

    fetch(`/tasks/${id}/edit`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(task)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Task updated successfully!") {
            alert('Задача обновлена!');
            loadTasks();
        }
    })
    .catch(error => console.error('Error:', error));
}

// Удаление
function deleteTask(id) {
    fetch(`/tasks/${id}/delete`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Task deleted successfully!") {
            alert('Задача удалена!');
            loadTasks();
        }
    })
    .catch(error => console.error('Error:', error));
}

// Токен проверка
window.onload = function() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('taskForm').style.display = 'block';
        document.getElementById('taskList').style.display = 'block';
        document.getElementById('taskListHeader').style.display = 'block';
        document.getElementById('logout-section').style.display = 'block';
        document.getElementById('auth-choice').style.display = 'none';

        loadTasks();  
    } else {
        document.getElementById('auth-choice').style.display = 'block';
        document.getElementById('taskForm').style.display = 'none';
        document.getElementById('taskList').style.display = 'none';
        document.getElementById('taskListHeader').style.display = 'none';
        document.getElementById('logout-section').style.display = 'none';
    }
};
