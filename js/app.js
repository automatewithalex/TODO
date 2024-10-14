// js/app.js

import { BoardManager } from './BoardManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const boardManager = new BoardManager();
  boardManager.init();

  // Add event listener for the "Delete All Data" button
  const clearDataButton = document.getElementById('clear-data-button');
  clearDataButton.addEventListener('click', () => {
    const confirmation = confirm('Are you sure you want to delete all data? This action cannot be undone.');
    if (confirmation) {
      localStorage.clear(); // Clear all data from localStorage
      location.reload();    // Reload the page to reflect changes
    }
  });

  // Add event listener for the "Export Data" button
  const exportDataButton = document.getElementById('export-data-button');
  exportDataButton.addEventListener('click', () => {
    boardManager.exportData();
  });

  // Add event listener for the "Import Data" button
  const importDataButton = document.getElementById('import-data-button');
  const importDataInput = document.getElementById('import-data-input');
  importDataButton.addEventListener('click', () => {
    importDataInput.click();
  });
  importDataInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      boardManager.importData(file);
    }
  });

  // Timer functionality
  const startTimerButton = document.getElementById('start-timer-button');
  const restartTimerButton = document.getElementById('restart-timer-button');
  const timerDisplay = document.getElementById('timer-display');
  // const timerSound = document.getElementById('timer-sound'); // Uncomment if using sound
  let timerInterval = null; // To keep track of the timer interval
  let isBreak = false; // To track if we're in a break period
  let timerDuration = 25 * 60; // Default duration is 25 minutes
  let timerRunning = false; // Flag to indicate if timer is running

  // Disable the Restart button initially
  restartTimerButton.disabled = true;

  startTimerButton.addEventListener('click', () => {
    if (!timerRunning) {
      // Start the timer
      startTimerButton.textContent = 'Stop Timer';
      restartTimerButton.disabled = false; // Enable the Restart button
      isBreak = false;
      timerDuration = 25 * 60; // Reset to 25 minutes
      clearInterval(timerInterval); // Clear any existing timer
      startTimer(timerDuration, isBreak);
    } else {
      // Stop the timer
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.textContent = '25:00'; // Reset display
      startTimerButton.textContent = 'Start Timer';
      restartTimerButton.disabled = true; // Disable the Restart button
      isBreak = false;
    }
  });

  restartTimerButton.addEventListener('click', () => {
    if (timerRunning) {
      // Clear any existing timer
      clearInterval(timerInterval);
      if (!isBreak) {
        timerDuration = 25 * 60; // Reset to 25 minutes
      } else {
        timerDuration = 5 * 60; // Reset to 5 minutes for break
      }
      startTimer(timerDuration, isBreak);
    }
  });

  function startTimer(duration, isBreakPeriod) {
    let timer = duration;
    timerRunning = true; // Set flag
    updateTimerDisplay(timer);

    timerInterval = setInterval(() => {
      timer--;

      if (timer < 0) {
        clearInterval(timerInterval);
        if (!isBreakPeriod) {
          // Work period ended, start break
          isBreak = true;
          timerDuration = 5 * 60; // 5-minute break
          // timerSound.play(); // Uncomment if using sound
          alert('Time is up! Starting a 5-minute break.');
          startTimer(timerDuration, isBreak);
        } else {
          // Break period ended
          isBreak = false;
          timerDuration = 25 * 60; // Reset to 25 minutes
          timerDisplay.textContent = '25:00'; // Reset display
          startTimerButton.textContent = 'Start Timer';
          restartTimerButton.disabled = true; // Disable the Restart button
          // timerSound.play(); // Uncomment if using sound
          alert('Break is over! Ready to start another session?');
          timerRunning = false; // Reset flag
        }
      } else {
        updateTimerDisplay(timer);
      }
    }, 1000);
  }

  function updateTimerDisplay(timer) {
    let minutes = parseInt(timer / 60, 10);
    let seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    timerDisplay.textContent = minutes + ':' + seconds;
  }
   
});
