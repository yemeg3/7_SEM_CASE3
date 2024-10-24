from flask import Flask, send_from_directory, jsonify, request
import mysql.connector
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)

# JWT
app.config['JWT_SECRET_KEY'] = 'super-secret-key'
jwt = JWTManager(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="case3"
)
cursor = db.cursor()


cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    )
''')
db.commit()


cursor.execute('''
    CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        user_id INT
    )
''')
db.commit()

# Маршрут для регистрации
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = generate_password_hash(data['password'])  # Хешируем пароль

    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
    db.commit()

    return jsonify({"message": "User registered successfully!"}), 201

# Маршрут для входа
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()

    if user and check_password_hash(user[2], password):
        access_token = create_access_token(identity=user[0])  # id пользователя
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)

@app.route('/tasks/create', methods=['POST'])
@jwt_required()
def create_task():
    task_data = request.json
    title = task_data.get('title')
    description = task_data.get('description')
    due_date = task_data.get('due_date')

    user_id = get_jwt_identity()  # Получаем ID пользователя из токена

    query = "INSERT INTO tasks (title, description, due_date, user_id) VALUES (%s, %s, %s, %s)"
    values = (title, description, due_date, user_id)
    cursor.execute(query, values)
    db.commit()

    return jsonify({"message": "Task created successfully!"}), 201

@app.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()  # Получаем ID пользователя из токена

    query = "SELECT * FROM tasks WHERE user_id = %s"
    cursor.execute(query, (user_id,))
    tasks = cursor.fetchall()

    task_list = []
    for task in tasks:
        task_list.append({
            'id': task[0],
            'title': task[1],
            'description': task[2],
            'due_date': str(task[3])
        })

    return jsonify(task_list)

@app.route('/tasks/<int:id>/edit', methods=['PUT'])
@jwt_required()
def edit_task(id):
    task_data = request.json
    title = task_data.get('title')
    description = task_data.get('description')
    due_date = task_data.get('due_date')

    user_id = get_jwt_identity()  # Получаем ID пользователя из токена

    query = "UPDATE tasks SET title=%s, description=%s, due_date=%s WHERE id=%s AND user_id=%s"
    values = (title, description, due_date, id, user_id)
    cursor.execute(query, values)
    db.commit()

    return jsonify({"message": "Task updated successfully!"}), 200

@app.route('/tasks/<int:id>/delete', methods=['DELETE'])
@jwt_required()
def delete_task(id):
    user_id = get_jwt_identity()  # Получаем ID пользователя из токена

    query = "DELETE FROM tasks WHERE id=%s AND user_id=%s"
    cursor.execute(query, (id, user_id))
    db.commit()

    return jsonify({"message": "Task deleted successfully!"}), 200

if __name__ == '__main__':
    app.run(debug=True)
