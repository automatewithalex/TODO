// js/Task.js

export class Task {
  constructor(text, board, category, parentTask = null) {
    this.id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.text = text;
    this.board = board;
    this.category = category;
    this.parentTask = parentTask;
    this.subTasks = [];
    this.element = this.createTaskElement();
  }

  createTaskElement() {
    const li = document.createElement('li');
    li.classList.add('task-item');
    li.setAttribute('draggable', 'true');
    li.setAttribute('data-task-id', this.id);

    if (this.parentTask) {
      li.classList.add('subtask-item');
    }

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('task-content');

    // Indent Symbol (for sub-tasks)
    if (this.parentTask) {
      const indentSymbol = document.createElement('span');
      indentSymbol.classList.add('indent-symbol');
      indentSymbol.textContent = '⤷';
      contentContainer.appendChild(indentSymbol);
    }

    // Drag Handle
    const dragHandle = document.createElement('span');
    dragHandle.classList.add('drag-handle');
    dragHandle.innerHTML = '☰';
    contentContainer.appendChild(dragHandle);
  
    // Task Text
    const span = document.createElement('span');
    span.textContent = this.text;
    span.contentEditable = true;
    span.classList.add('task-text');
    span.addEventListener('blur', () => {
      this.text = span.textContent;
      this.board.saveData();
    });
    contentContainer.appendChild(span);
  
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('task-buttons');
  
    if (!this.parentTask) {
      const addSubTaskBtn = document.createElement('button');
      addSubTaskBtn.textContent = '+';
      addSubTaskBtn.classList.add('add-subtask-button');
      addSubTaskBtn.addEventListener('click', () => {
        this.addSubTask();
      });
      buttonContainer.appendChild(addSubTaskBtn);
    }
  
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.classList.add('delete-button');
    deleteBtn.addEventListener('click', () => {
      const confirmation = confirm('Are you sure you want to delete this task?');
      if (confirmation) {
        this.deleteTask();
      }
    });
    buttonContainer.appendChild(deleteBtn);
  
    contentContainer.appendChild(buttonContainer);
    li.appendChild(contentContainer);
  
    this.subTasksContainer = document.createElement('ul');
    this.subTasksContainer.classList.add('subtask-list');
    li.appendChild(this.subTasksContainer);
  
    return li;
  }

  addSubTask() {
    if (this.parentTask) {
      alert('Sub-tasks cannot have their own sub-tasks.');
      return;
    }
    const subTaskText = prompt('Enter sub-task name:');
    if (subTaskText) {
      const subTask = new Task(subTaskText.trim(), this.board, this.category, this);
      this.subTasks.push(subTask);
      this.subTasksContainer.appendChild(subTask.element);
      this.initSubTaskSortable();
      this.board.saveData();
    }
  }

  initSubTaskSortable() {
    new Sortable(this.subTasksContainer, {
      group: {
        name: 'subtasks',
        put: false,
        pull: false,
      },
      animation: 150,
      handle: '.drag-handle',
      draggable: '.task-item',
      onEnd: () => {
        this.updateSubTaskOrder();
        this.board.saveData();
      },
    });
  }

  updateSubTaskOrder() {
    const subTaskElements = Array.from(this.subTasksContainer.children);
    this.subTasks = subTaskElements.map((taskElement) =>
      this.subTasks.find((task) => task.element === taskElement)
    );
  }

  getSubTaskById(taskId) {
    for (const subTask of this.subTasks) {
      if (subTask.id === taskId) {
        return subTask;
      }
    }
    return null;
  }

  deleteTask() {
    this.element.remove();
    if (this.parentTask) {
      this.parentTask.subTasks = this.parentTask.subTasks.filter((t) => t !== this);
    } else {
      this.category.tasks = this.category.tasks.filter((t) => t !== this);
    }
    this.board.saveData();
  }

  getData() {
    return {
      id: this.id,
      text: this.text,
      subTasks: this.subTasks.map((subTask) => subTask.getData()),
    };
  }

  loadData(data) {
    this.text = data.text;
    this.element.querySelector('.task-text').textContent = this.text;

    this.subTasks = [];
    this.subTasksContainer.innerHTML = '';

    if (data.subTasks && data.subTasks.length > 0) {
      data.subTasks.forEach((subTaskData) => {
        const subTask = new Task(subTaskData.text, this.board, this.category, this);
        subTask.id = subTaskData.id;
        subTask.loadData(subTaskData);
        this.subTasks.push(subTask);
        this.subTasksContainer.appendChild(subTask.element);
      });
      this.initSubTaskSortable();
    }
  }
}
