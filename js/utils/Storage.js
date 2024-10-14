// js/utils/Storage.js

export class Storage {
  static saveBoardData(boardId, data) {
    localStorage.setItem(`taskData-${boardId}`, JSON.stringify(data));
  }

  static getBoardData(boardId) {
    return JSON.parse(localStorage.getItem(`taskData-${boardId}`));
  }

  static removeBoardData(boardId) {
    localStorage.removeItem(`taskData-${boardId}`);
  }

  static saveBoardOrder(boardOrder) {
    localStorage.setItem('boardOrder', JSON.stringify(boardOrder));
  }

  static getBoardOrder() {
    return JSON.parse(localStorage.getItem('boardOrder')) || [];
  }
}
