/*
 * script.js
 *
 * This file implements the interactivity for the Kids Music Learning App.
 * It provides two modes: Free Play and Note Match Game. In Free Play,
 * children can tap colorful keys to hear corresponding pitches generated
 * via the Web Audio API. In the Note Match Game, a random note is
 * presented and the child is asked to find the matching key; immediate
 * feedback is provided with positive reinforcement for correct answers
 * and gentle cues for incorrect ones. The design respects research on
 * children’s app interfaces by keeping instructions short and readable
 *【370761767231327†L220-L237】, providing large touch targets【370761767231327†L248-L265】,
 * rewarding interactions【370761767231327†L277-L299】, and minimal visual clutter【370761767231327†L305-L326】.
 */

// List of note definitions with names, frequencies, and colors.
// Frequencies are for the fourth octave (C4–B4).
const NOTES = [
  { name: 'C', freq: 261.63, color: '#f44336' },  // red
  { name: 'D', freq: 293.66, color: '#e91e63' },  // pink
  { name: 'E', freq: 329.63, color: '#9c27b0' },  // purple
  { name: 'F', freq: 349.23, color: '#3f51b5' },  // indigo
  { name: 'G', freq: 392.0,  color: '#009688' },  // teal
  { name: 'A', freq: 440.0,  color: '#4caf50' },  // green
  { name: 'B', freq: 493.88, color: '#ff9800' }   // orange
];

// Audio context for note generation. Some browsers restrict audio
// context creation until user interaction, so we instantiate on demand.
let audioContext = null;

/**
 * Create a DOM keyboard inside a given container element.
 *
 * @param {HTMLElement} container - The parent element where keys will be appended.
 * @param {function(Object, HTMLElement):void} onKeyPress - Callback executed
 *        when a key is clicked. Receives the note object and the key element.
 */
function createKeyboard(container, onKeyPress) {
  // Remove any existing keys
  container.innerHTML = '';
  NOTES.forEach(note => {
    const key = document.createElement('div');
    key.classList.add('key');
    // Set custom color per note
    key.style.backgroundColor = note.color;
    key.textContent = note.name;
    key.dataset.noteName = note.name;
    // Click handler
    key.addEventListener('click', () => {
      // Start audio context on first user interaction
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      playNote(note.freq);
      onKeyPress(note, key);
    });
    container.appendChild(key);
  });
}

/**
 * Play a tone of the given frequency for a short duration using the Web
 * Audio API. Uses a sine wave for a pleasant, pure tone.
 *
 * @param {number} frequency - The frequency of the note in Hertz.
 */
function playNote(frequency) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gainNode  = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  // Fade out smoothly
  gainNode.gain.setValueAtTime(1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
  oscillator.stop(audioContext.currentTime + 0.6);
}

/**
 * Initialize the application by wiring up event listeners and loading
 * appropriate keyboards for each section.
 */
function initApp() {
  const mainMenu    = document.getElementById('main-menu');
  const freePlaySec = document.getElementById('free-play-section');
  const noteGameSec = document.getElementById('note-game-section');

  const btnFreePlay = document.getElementById('btn-free-play');
  const btnNoteGame = document.getElementById('btn-note-game');
  const backButtons = document.querySelectorAll('.back-btn');

  // Free Play keyboard container
  const freePlayKeyboard = document.getElementById('keyboard');
  // Game keyboard container
  const gameKeyboard = document.getElementById('keyboard-game');

  // Game state variables
  let currentRound = 0;
  const totalRounds = 5;
  let score = 0;
  let currentNote = null;

  // Display total rounds in UI
  document.getElementById('total-rounds').textContent = totalRounds.toString();

  /**
   * Show the specified section and hide others.
   * @param {HTMLElement} sectionToShow
   */
  function showSection(sectionToShow) {
    mainMenu.classList.add('hidden');
    freePlaySec.classList.add('hidden');
    noteGameSec.classList.add('hidden');
    sectionToShow.classList.remove('hidden');
  }

  // Set up keyboards when entering each mode
  btnFreePlay.addEventListener('click', () => {
    showSection(freePlaySec);
    createKeyboard(freePlayKeyboard, () => {
      // free-play callback does not need to update state
    });
  });

  btnNoteGame.addEventListener('click', () => {
    showSection(noteGameSec);
    // Reset game state
    currentRound = 0;
    score = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('feedback').textContent = '';
    // Create keyboard for game; pass game click handler
    createKeyboard(gameKeyboard, (note, keyEl) => {
      handleGameKeyClick(note, keyEl);
    });
    // Start first round
    nextRound();
  });

  // All back buttons return to main menu
  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showSection(mainMenu);
    });
  });

  /**
   * Progress to the next round in the note matching game. If all rounds
   * complete, present a completion message; otherwise pick a new note.
   */
  function nextRound() {
    if (currentRound >= totalRounds) {
      document.getElementById('note-question').textContent = 'All done!';
      document.getElementById('feedback').textContent = `Great job! You scored ${score} out of ${totalRounds}.`;
      return;
    }
    // Choose a random note from the list
    currentNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    // Update the UI to show the target note name
    document.getElementById('note-display').textContent = currentNote.name;
    // Clear any previous key highlight states
    gameKeyboard.querySelectorAll('.key').forEach(key => {
      key.classList.remove('correct', 'wrong');
    });
  }

  /**
   * Handle a key click during the note matching game.
   * Provides immediate feedback and updates the score if correct.
   *
   * @param {Object} note - The note data for the clicked key.
   * @param {HTMLElement} keyEl - The DOM element representing the clicked key.
   */
  function handleGameKeyClick(note, keyEl) {
    if (!currentNote) return;
    // Prevent multiple selections by ignoring clicks after selection until next round
    const alreadySelected = keyEl.classList.contains('correct') || keyEl.classList.contains('wrong');
    if (alreadySelected) return;
    if (note.name === currentNote.name) {
      keyEl.classList.add('correct');
      document.getElementById('feedback').textContent = 'Correct!';
      score++;
      document.getElementById('score').textContent = score.toString();
    } else {
      keyEl.classList.add('wrong');
      document.getElementById('feedback').textContent = 'Try again...';
      return; // Do not advance round on wrong attempt
    }
    currentRound++;
    // Delay before moving to next round to allow child to see feedback
    setTimeout(() => {
      document.getElementById('feedback').textContent = '';
      nextRound();
    }, 800);
  }
}

// Initialize once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);