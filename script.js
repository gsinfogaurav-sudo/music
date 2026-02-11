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
  const chordsGameSec = document.getElementById('chords-game-section');
  const scalesGameSec = document.getElementById('scales-game-section');

  const btnFreePlay = document.getElementById('btn-free-play');
  const btnNoteGame = document.getElementById('btn-note-game');
  const btnChordsGame = document.getElementById('btn-chords-game');
  const btnScalesGame = document.getElementById('btn-scales-game');
  // New buttons for advanced games
  const btnIntervalGame = document.getElementById('btn-interval-game');
  const btnTimeGame = document.getElementById('btn-time-game');
  const backButtons = document.querySelectorAll('.back-btn');

  // Free Play keyboard container
  const freePlayKeyboard = document.getElementById('keyboard');
  // Game keyboard container
  const gameKeyboard = document.getElementById('keyboard-game');

  // Chord Builder keyboard container
  const chordsKeyboard = document.getElementById('chords-keyboard');
  // Scale Practice keyboard container
  const scalesKeyboard = document.getElementById('scales-keyboard');

  // Interval Trainer keyboard container
  const intervalsKeyboard = document.getElementById('intervals-keyboard');
  // Time Signature Challenge controls
  const timeButtonsContainer = document.getElementById('time-buttons');

  // Game state variables
  let currentRound = 0;
  const totalRounds = 5;
  let score = 0;
  let currentNote = null;

  // Chord builder state variables
  let chordRound = 0;
  const chordTotalRounds = 5;
  let chordScore = 0;
  let currentChord = null;
  let selectedNotes = [];
  // Define a list of simple triad chords using only the natural notes
  const CHORDS = [
    { name: 'C major', notes: ['C', 'E', 'G'] },
    { name: 'F major', notes: ['F', 'A', 'C'] },
    { name: 'G major', notes: ['G', 'B', 'D'] },
    { name: 'A minor', notes: ['A', 'C', 'E'] },
    { name: 'D minor', notes: ['D', 'F', 'A'] },
    { name: 'E minor', notes: ['E', 'G', 'B'] }
  ];

  // Scale practice state variables
  let scaleRound = 0;
  const scaleTotalRounds = 3;
  let scaleScore = 0;
  let currentScale = null;
  let scaleIndex = 0;
  // Define scales using only natural notes (no sharps or flats)
  const SCALES = [
    { name: 'C major', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'] },
    { name: 'A natural minor', notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A'] },
    { name: 'G pentatonic', notes: ['G', 'A', 'B', 'D', 'E', 'G'] } // shorter pentatonic scale
  ];

  // Interval trainer state variables
  let intervalRound = 0;
  const intervalTotalRounds = 5;
  let intervalScore = 0;
  let intervalRoot = null;
  let currentIntervalObj = null;
  // Define intervals by number of steps (semitone leaps counted by note names on our diatonic keyboard)
  const INTERVALS = [
    { name: 'major second', steps: 1 },
    { name: 'major third', steps: 2 },
    { name: 'perfect fourth', steps: 3 },
    { name: 'perfect fifth', steps: 4 },
    { name: 'major sixth', steps: 5 },
    { name: 'octave', steps: 7 }
  ];

  // Time signature challenge state variables
  let timeRound = 0;
  const timeTotalRounds = 5;
  let timeScore = 0;
  let currentTimeSig = null;
  let currentMeasureTotal = 0;
  // Define simple time signatures (top number only; bottom 4 implies quarter note is one beat)
  const TIME_SIGS = [
    { name: '2/4', beats: 2 },
    { name: '3/4', beats: 3 },
    { name: '4/4', beats: 4 }
  ];

  // Display total rounds in UI
  document.getElementById('total-rounds').textContent = totalRounds.toString();
  document.getElementById('chord-total-rounds').textContent = chordTotalRounds.toString();
  document.getElementById('scale-total-rounds').textContent = scaleTotalRounds.toString();
  // Set totals for new games
  document.getElementById('interval-total-rounds').textContent = intervalTotalRounds.toString();
  document.getElementById('time-total-rounds').textContent = timeTotalRounds.toString();

  /**
   * Show the specified section and hide others.
   * @param {HTMLElement} sectionToShow
   */
  function showSection(sectionToShow) {
    // Hide all major sections before showing the requested one. This ensures
    // that only one mode is displayed at a time. Without hiding the chords
    // and scales sections, they can remain visible when navigating back to
    // the main menu.
    // Hide all sections to ensure only one mode is visible. Include new games.
    mainMenu.classList.add('hidden');
    freePlaySec.classList.add('hidden');
    noteGameSec.classList.add('hidden');
    chordsGameSec.classList.add('hidden');
    scalesGameSec.classList.add('hidden');
    const intervalGameSec = document.getElementById('interval-game-section');
    const timeGameSec = document.getElementById('time-game-section');
    if (intervalGameSec) intervalGameSec.classList.add('hidden');
    if (timeGameSec) timeGameSec.classList.add('hidden');
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

  // Set up Chord Builder mode
  btnChordsGame.addEventListener('click', () => {
    showSection(chordsGameSec);
    // Reset chord game state
    chordRound = 0;
    chordScore = 0;
    selectedNotes = [];
    document.getElementById('chord-score').textContent = '0';
    document.getElementById('selected-notes').textContent = '';
    document.getElementById('chord-feedback').textContent = '';
    // Create keyboard for chord game; in this mode, clicking toggles selection
    createKeyboard(chordsKeyboard, (note, keyEl) => {
      handleChordKeyClick(note, keyEl);
    });
    // Start first chord round
    nextChordRound();
  });

  // Set up Scale Practice mode
  btnScalesGame.addEventListener('click', () => {
    showSection(scalesGameSec);
    // Reset scale game state
    scaleRound = 0;
    scaleScore = 0;
    document.getElementById('scale-score').textContent = '0';
    document.getElementById('scale-feedback').textContent = '';
    // Create keyboard for scales; clicking keys will check scale sequence
    createKeyboard(scalesKeyboard, (note, keyEl) => {
      handleScaleKeyClick(note, keyEl);
    });
    // Start first scale round
    nextScaleRound();
  });

  // Set up Interval Trainer mode
  btnIntervalGame.addEventListener('click', () => {
    showSection(document.getElementById('interval-game-section'));
    // Reset interval game state
    intervalRound = 0;
    intervalScore = 0;
    document.getElementById('interval-score').textContent = '0';
    document.getElementById('interval-feedback').textContent = '';
    // Build keyboard for interval game
    createKeyboard(intervalsKeyboard, (note, keyEl) => {
      handleIntervalKeyClick(note, keyEl);
    });
    // Start first interval round
    nextIntervalRound();
  });

  // Set up Time Signature Challenge mode
  btnTimeGame.addEventListener('click', () => {
    showSection(document.getElementById('time-game-section'));
    // Reset time game state
    timeRound = 0;
    timeScore = 0;
    currentMeasureTotal = 0;
    document.getElementById('time-score').textContent = '0';
    document.getElementById('time-feedback').textContent = '';
    document.getElementById('time-progress').textContent = 'Beats: 0';
    // Start first time signature round
    nextTimeRound();
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

  /**
   * Start the next chord building round. If all rounds are complete, show
   * completion feedback. Otherwise, select a random chord and reset UI.
   */
  function nextChordRound() {
    if (chordRound >= chordTotalRounds) {
      document.getElementById('chord-question').textContent = 'All done!';
      document.getElementById('chord-feedback').textContent = `Great job! You built ${chordScore} out of ${chordTotalRounds} chords correctly.`;
      return;
    }
    // Choose a random chord
    currentChord = CHORDS[Math.floor(Math.random() * CHORDS.length)];
    // Reset selected notes
    selectedNotes = [];
    document.getElementById('selected-notes').textContent = '';
    // Update UI question
    document.getElementById('chord-question').textContent = `Build the chord: ${currentChord.name}`;
    // Remove any previous selection or feedback classes
    chordsKeyboard.querySelectorAll('.key').forEach(key => {
      key.classList.remove('selected', 'correct', 'wrong');
    });
  }

  /**
   * Handle key clicks in the chord builder. Clicking toggles selection. The
   * selected notes array and visual highlight are updated accordingly.
   *
   * @param {Object} note
   * @param {HTMLElement} keyEl
   */
  function handleChordKeyClick(note, keyEl) {
    // toggle selection state
    const idx = selectedNotes.indexOf(note.name);
    if (idx >= 0) {
      // deselect
      selectedNotes.splice(idx, 1);
      keyEl.classList.remove('selected');
    } else {
      selectedNotes.push(note.name);
      keyEl.classList.add('selected');
    }
    // Update selected notes display (sorted for readability)
    document.getElementById('selected-notes').textContent = selectedNotes.join(', ');
  }

  // Submit button for chord builder
  document.getElementById('check-chord').addEventListener('click', () => {
    if (!currentChord) return;
    // Sort both arrays for comparison (use slice to avoid mutating original)
    const userSet = selectedNotes.slice().sort().join('');
    const correctSet = currentChord.notes.slice().sort().join('');
    if (userSet === correctSet) {
      chordScore++;
      document.getElementById('chord-score').textContent = chordScore.toString();
      document.getElementById('chord-feedback').textContent = 'Correct!';
      // Mark the correct notes for visual feedback
      chordsKeyboard.querySelectorAll('.key').forEach(key => {
        if (currentChord.notes.includes(key.dataset.noteName)) {
          key.classList.add('correct');
        }
        key.classList.remove('selected');
      });
    } else {
      document.getElementById('chord-feedback').textContent = `Not quite. The correct notes were ${currentChord.notes.join(', ')}.`;
      // Highlight wrong selection
      chordsKeyboard.querySelectorAll('.key').forEach(key => {
        if (selectedNotes.includes(key.dataset.noteName) && !currentChord.notes.includes(key.dataset.noteName)) {
          key.classList.add('wrong');
        }
        if (currentChord.notes.includes(key.dataset.noteName)) {
          key.classList.add('correct');
        }
        key.classList.remove('selected');
      });
    }
    chordRound++;
    // Start next chord after a short delay
    setTimeout(() => {
      document.getElementById('chord-feedback').textContent = '';
      nextChordRound();
    }, 1000);
  });

  /**
   * Start the next scale practice round. If all rounds are complete, provide
   * completion feedback. Otherwise, select a random scale and reset state.
   */
  function nextScaleRound() {
    if (scaleRound >= scaleTotalRounds) {
      document.getElementById('scale-question').textContent = 'All done!';
      document.getElementById('scale-feedback').textContent = `Fantastic! You played ${scaleScore} out of ${scaleTotalRounds} scales correctly.`;
      return;
    }
    // Choose a random scale
    currentScale = SCALES[Math.floor(Math.random() * SCALES.length)];
    scaleIndex = 0;
    document.getElementById('scale-question').textContent = `Play the ${currentScale.name} scale`;
    // Clear highlights and wrong classes
    scalesKeyboard.querySelectorAll('.key').forEach(key => {
      key.classList.remove('scale-highlight', 'correct', 'wrong');
    });
    // Highlight the first note to guide the learner
    highlightExpectedScaleNote();
  }

  /**
   * Highlights the expected note in the current scale by adding the
   * `scale-highlight` class. Removes highlight from other keys.
   */
  function highlightExpectedScaleNote() {
    if (!currentScale) return;
    const expected = currentScale.notes[scaleIndex];
    scalesKeyboard.querySelectorAll('.key').forEach(key => {
      if (key.dataset.noteName === expected) {
        key.classList.add('scale-highlight');
      } else {
        key.classList.remove('scale-highlight');
      }
    });
  }

  /**
   * Handle key clicks during scale practice. Checks if the clicked note is the
   * next note in the scale. Provides feedback and progresses through the
   * scale. If the scale is completed, increments score and moves to next
   * round.
   *
   * @param {Object} note
   * @param {HTMLElement} keyEl
   */
  function handleScaleKeyClick(note, keyEl) {
    if (!currentScale) return;
    const expected = currentScale.notes[scaleIndex];
    // Guard against repeated clicks on same correct note
    if (keyEl.classList.contains('correct')) return;
    if (note.name === expected) {
      // Mark as correct and advance
      keyEl.classList.add('correct');
      keyEl.classList.remove('wrong');
      scaleIndex++;
      if (scaleIndex >= currentScale.notes.length) {
        scaleScore++;
        document.getElementById('scale-score').textContent = scaleScore.toString();
        document.getElementById('scale-feedback').textContent = 'Great job! You completed the scale.';
        scaleRound++;
        // Wait briefly then proceed to next scale
        setTimeout(() => {
          document.getElementById('scale-feedback').textContent = '';
          nextScaleRound();
        }, 1200);
        return;
      }
      // Highlight next expected note
      highlightExpectedScaleNote();
    } else {
      // Wrong note: mark briefly and encourage retry
      keyEl.classList.add('wrong');
      document.getElementById('scale-feedback').textContent = 'Try again...';
      // Clear message after a moment
      setTimeout(() => {
        keyEl.classList.remove('wrong');
        document.getElementById('scale-feedback').textContent = '';
      }, 800);
    }
  }

  /**
   * Start the next interval trainer round. If all rounds are complete, show
   * completion feedback. Otherwise, choose a random root note and interval
   * that fits on our seven-key keyboard. Highlight the root note for context.
   */
  function nextIntervalRound() {
    if (intervalRound >= intervalTotalRounds) {
      document.getElementById('interval-question').textContent = 'All done!';
      document.getElementById('interval-feedback').textContent = `Excellent! You identified ${intervalScore} out of ${intervalTotalRounds} intervals correctly.`;
      return;
    }
    // Reset highlights on keyboard
    intervalsKeyboard.querySelectorAll('.key').forEach(key => {
      key.classList.remove('correct', 'wrong', 'interval-root');
    });
    // Choose a valid root and interval. Ensure rootIndex + steps < NOTES.length
    let rootIndex;
    let intervalObj;
    do {
      rootIndex = Math.floor(Math.random() * NOTES.length);
      intervalObj = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    } while (rootIndex + intervalObj.steps >= NOTES.length);
    intervalRoot = NOTES[rootIndex];
    currentIntervalObj = intervalObj;
    // Update question
    document.getElementById('interval-question').textContent = `From ${intervalRoot.name}, which note is a ${intervalObj.name}?`;
    // Highlight the root note for orientation
    intervalsKeyboard.querySelectorAll('.key').forEach(key => {
      if (key.dataset.noteName === intervalRoot.name) {
        key.classList.add('interval-root');
      }
    });
  }

  /**
   * Handle key clicks during the interval trainer game. Checks if the clicked
   * note is the correct interval above the root. Provides feedback and
   * progresses to the next round.
   *
   * @param {Object} note
   * @param {HTMLElement} keyEl
   */
  function handleIntervalKeyClick(note, keyEl) {
    if (!intervalRoot || !currentIntervalObj) return;
    // Prevent multiple selections after correct answer
    if (keyEl.classList.contains('correct') || keyEl.classList.contains('wrong')) return;
    // Determine expected note based on root index and interval steps
    const rootIndex = NOTES.findIndex(n => n.name === intervalRoot.name);
    const expectedIndex = rootIndex + currentIntervalObj.steps;
    const expectedName = NOTES[expectedIndex].name;
    if (note.name === expectedName) {
      keyEl.classList.add('correct');
      document.getElementById('interval-feedback').textContent = 'Correct!';
      intervalScore++;
      document.getElementById('interval-score').textContent = intervalScore.toString();
      intervalRound++;
      // Delay before next round
      setTimeout(() => {
        document.getElementById('interval-feedback').textContent = '';
        nextIntervalRound();
      }, 1000);
    } else {
      keyEl.classList.add('wrong');
      document.getElementById('interval-feedback').textContent = 'Try again...';
      // Remove wrong indicator after a moment
      setTimeout(() => {
        keyEl.classList.remove('wrong');
        document.getElementById('interval-feedback').textContent = '';
      }, 800);
    }
  }

  /**
   * Start the next round in the time signature challenge. If all rounds are
   * completed, display a final message. Otherwise, choose a random time
   * signature, reset the current measure total, and update the question.
   */
  function nextTimeRound() {
    if (timeRound >= timeTotalRounds) {
      document.getElementById('time-question').textContent = 'All done!';
      document.getElementById('time-feedback').textContent = `Great job! You completed ${timeScore} out of ${timeTotalRounds} measures correctly.`;
      return;
    }
    // Pick random time signature
    currentTimeSig = TIME_SIGS[Math.floor(Math.random() * TIME_SIGS.length)];
    currentMeasureTotal = 0;
    // Update UI
    document.getElementById('time-question').textContent = `Build a ${currentTimeSig.name} measure using the notes:`;
    document.getElementById('time-progress').textContent = `Beats: 0/${currentTimeSig.beats}`;
    document.getElementById('time-feedback').textContent = '';
  }

  /**
   * Handle note duration button clicks in the time signature challenge.
   * Adds the selected note value to the current measure total and checks
   * whether the measure is complete, too long, or still incomplete.
   *
   * @param {number} value
   */
  function handleTimeNoteClick(value) {
    if (!currentTimeSig) return;
    currentMeasureTotal += value;
    // Round to two decimals to avoid floating precision issues
    currentMeasureTotal = Math.round(currentMeasureTotal * 100) / 100;
    // Update progress display
    document.getElementById('time-progress').textContent = `Beats: ${currentMeasureTotal}/${currentTimeSig.beats}`;
    // Check for completion or overflow
    if (Math.abs(currentMeasureTotal - currentTimeSig.beats) < 0.001) {
      // Completed measure correctly
      timeScore++;
      document.getElementById('time-score').textContent = timeScore.toString();
      document.getElementById('time-feedback').textContent = 'Nice! Measure complete.';
      timeRound++;
      // Start next round after short delay
      setTimeout(() => {
        document.getElementById('time-feedback').textContent = '';
        nextTimeRound();
      }, 1200);
    } else if (currentMeasureTotal > currentTimeSig.beats) {
      // Exceeded beats; reset measure
      document.getElementById('time-feedback').textContent = 'Too many beats! Try again.';
      setTimeout(() => {
        // Reset measure
        currentMeasureTotal = 0;
        document.getElementById('time-progress').textContent = `Beats: 0/${currentTimeSig.beats}`;
        document.getElementById('time-feedback').textContent = '';
      }, 1200);
    }
  }

  // Attach event listeners to note buttons for time signature game
  if (timeButtonsContainer) {
    timeButtonsContainer.querySelectorAll('.note-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.dataset.value);
        handleTimeNoteClick(val);
      });
    });
  }

  // Reset measure button
  const resetBtn = document.getElementById('time-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (currentTimeSig) {
        currentMeasureTotal = 0;
        document.getElementById('time-progress').textContent = `Beats: 0/${currentTimeSig.beats}`;
        document.getElementById('time-feedback').textContent = '';
      }
    });
  }
}

// Initialize once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);