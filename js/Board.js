// js/Board.js

import { Category } from './Category.js';
import { Storage } from './utils/Storage.js';

export class Board {
  constructor(id, name, color, colorIndex, manager) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.colorIndex = colorIndex;
    this.manager = manager;
    this.categories = [];
    this.element = this.createBoardElement();
  }

  createBoardElement() {
    const boardContainer = document.createElement('div');
    boardContainer.classList.add('board-container');
    boardContainer.setAttribute('data-board-id', this.id);

    const board = document.createElement('div');
    board.classList.add('board');
    board.style.backgroundColor = this.color;

    const boardTitleContainer = this.createBoardTitle();
    this.categoryContainer = this.createCategoryContainer();

    board.appendChild(boardTitleContainer);
    board.appendChild(this.categoryContainer);

    this.initCategorySortable();

    const addCategoryButton = this.createAddCategoryButton();
    board.appendChild(addCategoryButton);

    boardContainer.appendChild(board);
    return boardContainer;
  }

  createBoardTitle() {
    const boardTitleContainer = document.createElement('div');
    boardTitleContainer.classList.add('board-title-container');

    const boardTitle = document.createElement('h2');
    boardTitle.textContent = this.name;
    boardTitle.classList.add('board-title');
    boardTitle.contentEditable = true;
    boardTitle.addEventListener('blur', () => {
      this.name = boardTitle.textContent.trim();
      this.saveData();
    });

    const boardButtons = this.createBoardButtons();

    boardTitleContainer.appendChild(boardTitle);
    boardTitleContainer.appendChild(boardButtons);

    return boardTitleContainer;
  }

  createBoardButtons() {
    const boardButtons = document.createElement('div');
    boardButtons.classList.add('board-buttons');

    const copyButton = document.createElement('button');
    copyButton.innerHTML = '⎘';
    copyButton.classList.add('copy-button');
    copyButton.addEventListener('click', () => this.manager.copyBoard(this.id));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '✕';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', () => {
      const confirmation = confirm(
        `Are you sure you want to delete the board "${this.name}"? This action cannot be undone.`
      );
      if (confirmation) {
        this.manager.deleteBoard(this.id);
      }
    });

    boardButtons.appendChild(copyButton);
    boardButtons.appendChild(deleteButton);

    return boardButtons;
  }

  createCategoryContainer() {
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('category-container');

    if (!this.categories || this.categories.length === 0) {
      // Initialize categories
      const defaultCategories = ['To Do', 'In Progress', 'Done'];
      defaultCategories.forEach((categoryName) => {
        const category = new Category(this.id, categoryName, this);
        this.categories.push(category);
        categoryContainer.appendChild(category.element);
      });
    } else {
      // Append existing categories
      this.categories.forEach((category) => {
        categoryContainer.appendChild(category.element);
      });
    }

    return categoryContainer;
  }

  createAddCategoryButton() {
    const addCategoryButton = document.createElement('button');
    addCategoryButton.textContent = '+ Add Category';
    addCategoryButton.classList.add('add-category-button');
    addCategoryButton.addEventListener('click', () => this.addCategory());
    return addCategoryButton;
  }

  addCategory() {
    const categoryName = prompt('Enter new category name:');
    if (categoryName) {
      const trimmedName = categoryName.trim();
      if (trimmedName.toLowerCase() === 'to do') {
        alert('A category named "To Do" already exists.');
        return;
      }
      const category = new Category(this.id, trimmedName, this);
      this.categories.push(category);
      this.categoryContainer.appendChild(category.element);
      this.initCategorySortable(); // Re-initialize to include new category
      this.saveData();
    }
  }

  removeCategory(category) {
    this.categoryContainer.removeChild(category.element);
    this.categories = this.categories.filter((cat) => cat !== category);
    this.saveData();
  }

  initCategorySortable() {
    new Sortable(this.categoryContainer, {
      animation: 150,
      handle: '.drag-handle',
      draggable: '.category',
      onEnd: () => {
        this.updateCategoryOrder();
        this.saveData();
      },
    });
  }

  updateCategoryOrder() {
    const categoryElements = this.categoryContainer.querySelectorAll('.category');
    this.categories = Array.from(categoryElements).map((categoryElement) =>
      this.categories.find((cat) => cat.element === categoryElement)
    );
  }

  saveData() {
    const data = this.getData();
    Storage.saveBoardData(this.id, data);
  }

  getData() {
    return {
      id: this.id,
      boardName: this.name,
      boardColorIndex: this.colorIndex,
      categories: this.categories.map((category) => category.getData()),
    };
  }

  loadData(data) {
    this.name = data.boardName;
    this.colorIndex = data.boardColorIndex;
    this.element.querySelector('.board-title').textContent = this.name;

    this.categories = [];
    this.categoryContainer.innerHTML = '';

    data.categories.forEach((categoryData) => {
      const category = new Category(this.id, categoryData.name, this, categoryData.id);
      this.categories.push(category);
      category.loadData(categoryData);
      this.categoryContainer.appendChild(category.element);
    });

    this.initCategorySortable();
  }

  getCategoryByTask(task) {
    return this.categories.find((category) => category.tasks.includes(task));
  }

  getTaskById(taskId) {
    for (const category of this.categories) {
      for (const task of category.tasks) {
        if (task.id === taskId) {
          return task;
        }
        // Check subtasks
        const foundSubTask = this.getSubTaskById(task, taskId);
        if (foundSubTask) {
          return foundSubTask;
        }
      }
    }
    return null;
  }

  getSubTaskById(task, taskId) {
    for (const subTask of task.subTasks) {
      if (subTask.id === taskId) {
        return subTask;
      }
    }
    return null;
  }

  getTaskById(taskId) {
    for (const category of this.categories) {
      for (const task of category.tasks) {
        if (task.id === taskId) {
          return task;
        }
        const foundSubTask = task.getSubTaskById(taskId);
        if (foundSubTask) {
          return foundSubTask;
        }
      }
    }
    return null;
  }
  
}
