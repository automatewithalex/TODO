// js/BoardManager.js

import { Board } from './Board.js';
import { Storage } from './utils/Storage.js';

export class BoardManager {
  constructor() {
    this.boardColors = ['#edeae1'];
    // this.boardColors = ['#1b2651', '#cd2028', '#ffffff', '#edeae1', '#166c96'];
    this.lastColorIndex = -1;
    this.boardsContainer = document.getElementById('boards-container');
    this.newBoardInput = document.getElementById('new-board-input');
    this.boards = [];
  }

  init() {
    this.loadBoards();
    this.setupEventListeners();
    this.initBoardsSortable();
  }

  setupEventListeners() {
    this.newBoardInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        const boardName = this.newBoardInput.value.trim();
        if (boardName !== '') {
          this.createBoard(boardName);
          this.newBoardInput.value = '';
        }
      }
    });
  }

  createBoard(boardName, boardId = null, boardData = null, isCopy = false) {
    if (!boardId) {
      if (boardData && boardData.id && !isCopy) {
        boardId = boardData.id; // Use the ID from the data when importing
      } else {
        boardId = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    const colorIndex = this.selectBoardColor(boardData, isCopy);
    const boardColor = this.boardColors[colorIndex];
    const board = new Board(boardId, boardName, boardColor, colorIndex, this);

    this.boards.push(board);
    this.boardsContainer.appendChild(board.element);

    if (boardData) {
      board.loadData(boardData);
    }

    board.saveData();
    this.saveBoardOrder();
  }

  selectBoardColor(boardData, isCopy) {
    let colorIndex;
    if (isCopy || !boardData) {
      const availableColors = this.boardColors.filter((_, index) => index !== this.lastColorIndex);
      if (availableColors.length === 0) {
        colorIndex = Math.floor(Math.random() * this.boardColors.length);
      } else {
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        colorIndex = this.boardColors.indexOf(randomColor);
      }
      this.lastColorIndex = colorIndex;
    } else if (boardData.boardColorIndex !== undefined) {
      colorIndex = boardData.boardColorIndex;
    } else {
      colorIndex = 0; // Default to the first color if no color index is specified
    }
    return colorIndex;
  }

  deleteBoard(boardId) {
    const board = this.boards.find((b) => b.id === boardId);
    if (board) {
      this.boardsContainer.removeChild(board.element);
      Storage.removeBoardData(boardId);
      this.boards = this.boards.filter((b) => b.id !== boardId);
      this.saveBoardOrder();
    }
  }

  copyBoard(originalBoardId) {
    const originalBoard = this.boards.find((b) => b.id === originalBoardId);
    if (originalBoard) {
      originalBoard.saveData(); // Ensure latest data is saved
      const originalData = originalBoard.getData(); // Get data from the instance
      const copiedData = JSON.parse(JSON.stringify(originalData)); // Deep copy
      copiedData.boardName += ' (Copy)';

      // Generate new IDs for copied data
      this.generateNewIds(copiedData);

      // Create the copied board without specifying an ID
      this.createBoard(copiedData.boardName, null, copiedData, true);
    }
  }

  generateNewIds(boardData) {
    boardData.id = this.generateUniqueId('board');
    if (boardData.categories && boardData.categories.length > 0) {
      boardData.categories.forEach((category) => {
        category.id = this.generateUniqueId('category');
        if (category.tasks && category.tasks.length > 0) {
          category.tasks.forEach((task) => {
            task.id = this.generateUniqueId('task');
            if (task.subTasks && task.subTasks.length > 0) {
              task.subTasks.forEach((subTask) => {
                subTask.id = this.generateUniqueId('task');
              });
            }
          });
        }
      });
    }
  }

  generateUniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  saveBoardOrder() {
    const boardOrder = this.boards.map((board) => board.id);
    Storage.saveBoardOrder(boardOrder);
  }

  loadBoards() {
    const savedBoardOrder = Storage.getBoardOrder();
    savedBoardOrder.forEach((boardId) => {
      const data = Storage.getBoardData(boardId);
      if (data) {
        this.lastColorIndex = data.boardColorIndex;
        this.createBoard(data.boardName, boardId, data);
      }
    });
  }

  initBoardsSortable() {
    new Sortable(this.boardsContainer, {
      animation: 150,
      handle: '.board-title-container',
      draggable: '.board-container',
      onEnd: () => {
        this.saveBoardOrder();
      },
    });
  }

  exportData() {
    // Collect data from all boards
    const data = this.boards.map((board) => board.getData());

    // Convert data to JSON string
    const jsonData = JSON.stringify(data, null, 2);

    // Create a blob from the JSON string
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create a link to download the blob
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'todo_data.json';
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);

        // Clear existing data
        this.boardsContainer.innerHTML = '';
        this.boards = [];
        localStorage.clear();

        // Load boards from imported data
        jsonData.forEach((boardData) => {
          this.createBoard(boardData.boardName, null, boardData);
        });

        // Save board order
        this.saveBoardOrder();

        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data. Please ensure the file is a valid JSON export.');
        console.error(error);
      }
    };

    reader.readAsText(file);
  }
}
