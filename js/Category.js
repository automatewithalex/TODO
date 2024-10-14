// js/Category.js

import { Task } from './Task.js';

export class Category {
  constructor(boardId, name, board, id = null) {
    this.boardId = boardId;
    this.name = name;
    this.board = board;
    this.id = id || `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.tasks = [];
    this.element = this.createCategoryElement();
  }

  createCategoryElement() {
    const categoryDiv = document.createElement('div');
    categoryDiv.classList.add('category');
    categoryDiv.setAttribute('data-category-name', this.name);
    categoryDiv.setAttribute('data-category-id', this.id); // Set category ID

    const headerContainer = this.createHeaderContainer();
    categoryDiv.appendChild(headerContainer);

    this.taskList = this.createTaskList();
    categoryDiv.appendChild(this.taskList);

    if (this.name.toLowerCase() === 'to do') {
      const addTaskContainer = this.createAddTaskContainer();
      categoryDiv.appendChild(addTaskContainer);
    }

    this.initTaskListDragAndDrop();

    return categoryDiv;
  }

  createHeaderContainer() {
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('category-header');

    const dragHandle = document.createElement('span');
    dragHandle.classList.add('drag-handle');
    dragHandle.innerHTML = '☰';
    headerContainer.appendChild(dragHandle);

    const header = document.createElement('h3');
    header.textContent = this.name;

    if (this.name.toLowerCase() !== 'to do') {
      header.contentEditable = true;
      header.addEventListener('blur', () => {
        this.name = header.textContent.trim();
        this.element.setAttribute('data-category-name', this.name);
        this.board.saveData();
      });
    } else {
      header.contentEditable = false;
      header.style.cursor = 'default';
    }

    headerContainer.appendChild(header);

    if (this.name.toLowerCase() !== 'to do') {
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '✕';
      deleteButton.classList.add('delete-button');
      deleteButton.addEventListener('click', () => {
        const confirmation = confirm(
          `Are you sure you want to delete the category "${this.name}"? This action cannot be undone.`
        );
        if (confirmation) {
          this.board.removeCategory(this);
        }
      });
      headerContainer.appendChild(deleteButton);
    }

    return headerContainer;
  }

  createTaskList() {
    const taskList = document.createElement('ul');
    taskList.classList.add('task-list');
    taskList.setAttribute('id', `${this.boardId}-${this.name.toLowerCase().replace(/\s+/g, '-')}-list`);
    return taskList;
  }

  createAddTaskContainer() {
    const addTaskContainer = document.createElement('div');
    addTaskContainer.classList.add('add-task-container');

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add a new task';
    input.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        const taskText = input.value.trim();
        if (taskText) {
          const task = new Task(taskText, this.board, this);
          this.tasks.push(task);
          this.taskList.appendChild(task.element);
          input.value = '';
          this.board.saveData();
        }
      }
    });

    addTaskContainer.appendChild(input);
    return addTaskContainer;
  }

  initTaskListDragAndDrop() {
    new Sortable(this.taskList, {
      group: 'tasks',
      animation: 150,
      handle: '.drag-handle',
      draggable: '.task-item:not(.subtask-item)',
      onAdd: (evt) => {
        const taskElement = evt.item;
        const taskId = taskElement.getAttribute('data-task-id');
        const task = this.board.getTaskById(taskId);

        if (task) {
          // Remove from old category
          if (task.category && task.category !== this) {
            task.category.tasks = task.category.tasks.filter((t) => t !== task);
          }
          // Update task's category
          task.category = this;
          // Add to new category
          this.tasks.push(task);
          this.updateTaskOrder();
          this.board.saveData();
        }
      },
      onEnd: () => {
        this.updateTaskOrder();
        this.board.saveData();
      },
    });
  }

  updateTaskOrder() {
    const taskElements = Array.from(this.taskList.children).filter(
      (el) => !el.classList.contains('subtask-item')
    );
    this.tasks = taskElements.map((taskElement) =>
      this.board.getTaskById(taskElement.getAttribute('data-task-id'))
    );
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
      tasks: this.tasks.map((task) => task.getData()),
    };
  }

  loadData(data) {
    this.name = data.name;
    this.id = data.id || this.id;
    this.element.setAttribute('data-category-id', this.id);
    this.element.querySelector('.category-header h3').textContent = this.name;

    this.tasks = [];
    this.taskList.innerHTML = '';

    data.tasks.forEach((taskData) => {
      const task = new Task(taskData.text, this.board, this);
      task.id = taskData.id; // Preserve ID
      task.loadData(taskData);
      this.tasks.push(task);
      this.taskList.appendChild(task.element);
    });

    this.initTaskListDragAndDrop();
  }

}