document.addEventListener('DOMContentLoaded', function() {
  // Timer elements
  const minutesElement = document.getElementById('minutes');
  const secondsElement = document.getElementById('seconds');
  const startPauseButton = document.getElementById('start-pause');
  const resetButton = document.getElementById('reset');
  const initializeButton = document.getElementById('initialize-btn');
  const timeInput = document.getElementById('time-input');
  const timerCountdown = document.getElementById('timer-countdown');
  const hoursInput = document.getElementById('hours-input');
  
  // Topics
  const topicsList = document.querySelector('.topics-list');
  const addTopicButton = document.getElementById('add-topic-btn');
  const topicInput = document.getElementById('new-topic');
  
  // Progress
  const topicsProgress = document.getElementById('topics-progress');
  const timeProgress = document.getElementById('time-progress');
  
  // Constants
  const WORK_TIME = 25; // 25 minutes for work
  const BREAK_TIME = 5; // 5 minutes for break
  const PROGRESS_BLOCKS = 12; // Number of progress blocks to display
  
  // App state
  const timer = {
    minutes: WORK_TIME,
    seconds: 0,
    isRunning: false,
    interval: null,
    mode: 'work' // 'work' or 'break'
  };
  
  // Session state
  const session = {
    isActive: false,
    totalTimeMinutes: 0,
    completedPomodoros: 0,
    expectedPomodoros: 0
  };
  
  const stats = {
    completedTopics: 0
  };
  
  // Initialize the app
  initApp();
  
  // Function to initialize the app
  function initApp() {
    setupEventListeners();
    loadSessionState();
    setupSessionControls();
    
    // If no session is active, go to setup mode
    if (!session.isActive) {
      showSetupMode();
    } else {
      showSessionMode();
    }
    
    // Load topics
    const hasSavedTopics = localStorage.getItem('pomodoro-topics');
    if (hasSavedTopics) {
      loadTopics();
    } else {
      saveExistingTopics();
    }
    
    generateProgressBlocks();
    updateTopicsProgress();
    updateTimeProgress();
  }
  
  // Show setup mode UI
  function showSetupMode() {
    session.isActive = false;
    timeInput.style.display = 'block';
    timerCountdown.style.display = 'none';
    initializeButton.style.display = 'inline-block';
    startPauseButton.style.display = 'none';
    resetButton.style.display = 'none';
    
    // Save session state
    saveSessionState();
  }
  
  // Show session mode UI
  function showSessionMode() {
    session.isActive = true;
    timeInput.style.display = 'none';
    timerCountdown.style.display = 'block';
    initializeButton.style.display = 'none';
    startPauseButton.style.display = 'inline-block';
    resetButton.style.display = 'inline-block';
    
    // Reset timer to initial state
    resetTimer();
    
    // Save session state
    saveSessionState();
  }
  
  // Initialize the study session
  function initializeSession() {
    // Check if we have at least one topic
    if (document.querySelectorAll('.topic').length === 0) {
      alert('Please add at least one study topic before starting a session');
      return;
    }
    
    // Get total time from input
    const totalHours = parseFloat(hoursInput.value);
    if (isNaN(totalHours) || totalHours <= 0) {
      alert('Please enter a valid study time');
      return;
    }
    
    // Calculate total minutes and expected pomodoros
    session.totalTimeMinutes = totalHours * 60;
    // 30 min per pomodoro cycle (25 min work + 5 min break)
    session.expectedPomodoros = Math.floor(session.totalTimeMinutes / 30);
    session.completedPomodoros = 0;
    
    // Show the session UI
    showSessionMode();
  }
 
    // --------------------- Session Functions ---------------------

  // End the current session
  function endSession() {
    session.isActive = false;
    clearInterval(timer.interval);
    showSetupMode();
  }

  function setupSessionControls() {
      // End session button
      document.getElementById('end-session-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to end your study session?')) {
          endSession();
          showRestoreButton();
        }
      });
      
      // Restore session button
      document.getElementById('restore-session-btn').addEventListener('click', function() {
        restoreSession();
        hideRestoreButton();
      });
      
      // Check if we should show restore button on load
      if (!session.isActive && localStorage.getItem('pomodoro-session')) {
        showRestoreButton();
      }
    }

    function showRestoreButton() {
      document.getElementById('end-session-btn').style.display = 'none';
      document.getElementById('restore-session-btn').style.display = 'inline-block';
    }

    function hideRestoreButton() {
      document.getElementById('end-session-btn').style.display = 'inline-block';
      document.getElementById('restore-session-btn').style.display = 'none';
    }

    function restoreSession() {
      // Load session from localStorage
      loadSessionState();
      
      // Only proceed if we have a valid session stored
      if (session.totalTimeMinutes > 0 && session.expectedPomodoros > 0) {
        // Show session mode UI
        showSessionMode();
      } else {
        alert('No valid previous session found to restore.');
        hideRestoreButton();
      }
    }



  
  // Set up event listeners
  function setupEventListeners() {
    // Timer controls
    startPauseButton.addEventListener('click', toggleTimer);
    resetButton.addEventListener('click', resetTimer);
    initializeButton.addEventListener('click', initializeSession);
    
    // Topic controls
    addTopicButton.addEventListener('click', addNewTopic);
    topicInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addNewTopic();
      }
    });
    
    // Set up existing topic toggles and checkboxes
    setupExistingTopics();
  }
  
  // Save session state to localStorage
  function saveSessionState() {
    localStorage.setItem('pomodoro-session', JSON.stringify(session));
  }
  
  // Load session state from localStorage
  function loadSessionState() {
    const savedSession = localStorage.getItem('pomodoro-session');
    if (savedSession) {
      Object.assign(session, JSON.parse(savedSession));
    }
  }
  
  // --------------------- Timer Functions ---------------------
  
  // Toggle timer between start and pause
  function toggleTimer() {
    if (timer.isRunning) {
      // Pause timer
      clearInterval(timer.interval);
      timer.isRunning = false;
      startPauseButton.textContent = 'Start';
    } else {
      // Start timer
      timer.isRunning = true;
      startPauseButton.textContent = 'Pause';
      
      timer.interval = setInterval(function() {
        updateTimer();
      }, 1000);
    }
  }
  
  // Update timer countdown
  function updateTimer() {
    // Decrease seconds
    if (timer.seconds > 0) {
      timer.seconds--;
    } else {
      // If seconds are 0, decrease minutes if possible
      if (timer.minutes > 0) {
        timer.minutes--;
        timer.seconds = 59;
      } else {
        // Timer is complete
        timerComplete();
        return;
      }
    }
    
    // Update display
    updateTimerDisplay();
    
    // Update progress for time
    updateTimeProgress();
  }
  
  // Handle timer completion
  function timerComplete() {
    clearInterval(timer.interval);
    playTimerCompleteSound();
    
    if (timer.mode === 'work') {
      // Completed a work session (pomodoro)
      session.completedPomodoros++;
      saveSessionState();
      
      // Check if session is complete
      if (session.completedPomodoros >= session.expectedPomodoros) {
        alert('Congratulations! You have completed your study session.');
        endSession();
        return;
      }
      
      // Switch to break mode
      timer.mode = 'break';
      timer.minutes = BREAK_TIME;
      timer.seconds = 0;
      alert('Good job! Take a 5-minute break.');
    } else {
      // Completed a break
      timer.mode = 'work';
      timer.minutes = WORK_TIME;
      timer.seconds = 0;
      alert('Break is over. Ready to work again?');
    }
    
    updateTimerDisplay();
    timer.isRunning = false;
    startPauseButton.textContent = 'Start';
    
    // Update progress
    updateSessionProgress();
  }
  
  // Update session progress
  function updateSessionProgress() {
    // Update progress bar to show completed / total pomodoros
    updateTimeProgress();
  }
  
  // Play sound when timer completes
  function playTimerCompleteSound() {
    try {
      // Create an audio element for notification
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869.wav');
      audio.volume = 0.5; // Set to 50% volume
      audio.play().catch(e => {
        console.log('Audio play failed, fallback to alert only:', e);
      });
    } catch (error) {
      console.log('Audio creation failed:', error);
      // Fallback is just the alert that's already implemented
    }
  }
  
  // Reset timer to initial state
  function resetTimer() {
    clearInterval(timer.interval);
    timer.mode = 'work';
    timer.minutes = WORK_TIME;
    timer.seconds = 0;
    timer.isRunning = false;
    startPauseButton.textContent = 'Start';
    updateTimerDisplay();
    updateTimeProgress();
  }
  
  // Update timer display
  function updateTimerDisplay() {
    minutesElement.textContent = String(timer.minutes).padStart(2, '0');
    secondsElement.textContent = String(timer.seconds).padStart(2, '0');
  }
  
  // --------------------- Topic Functions ---------------------
  
  // Load topics from localStorage if available
  function loadTopics() {
    const savedTopics = localStorage.getItem('pomodoro-topics');
    if (savedTopics) {
      const parsedTopics = JSON.parse(savedTopics);
      
      // Clear existing DOM topics
      topicsList.innerHTML = '';
      
      // Add saved topics to DOM
      parsedTopics.forEach(topic => {
        addTopicToDOM(topic);
      });
    }
    
    // Load stats
    const savedStats = localStorage.getItem('pomodoro-stats');
    if (savedStats) {
      Object.assign(stats, JSON.parse(savedStats));
    } else {
      // Initialize stats based on existing completed topics in the DOM
      stats.completedTopics = document.querySelectorAll('.topic.completed').length;
      localStorage.setItem('pomodoro-stats', JSON.stringify(stats));
    }
    
    updateTopicsProgress();
  }
  
  // Save existing topics from the HTML
  function saveExistingTopics() {
    const existingTopics = [];
    document.querySelectorAll('.topic').forEach(topicElement => {
      const topicData = {
        name: topicElement.querySelector('.topic-name').textContent,
        completed: topicElement.classList.contains('completed'),
        subtopics: []
      };
      
      // Get subtopics
      topicElement.querySelectorAll('.subtopic:not(.add-subtopic-row)').forEach(subtopicElement => {
        topicData.subtopics.push({
          name: subtopicElement.querySelector('.subtopic-name').textContent,
          completed: subtopicElement.classList.contains('completed')
        });
      });
      
      existingTopics.push(topicData);
    });
    
    // Only save if there's no existing data
    if (!localStorage.getItem('pomodoro-topics')) {
      localStorage.setItem('pomodoro-topics', JSON.stringify(existingTopics));
    }
  }
  
  // Save topics to localStorage
  function saveTopics() {
    // Get current topics from DOM
    const currentTopics = [];
    document.querySelectorAll('.topic').forEach(topicElement => {
      const topicData = {
        name: topicElement.querySelector('.topic-name').textContent,
        completed: topicElement.classList.contains('completed'),
        subtopics: []
      };
      
      // Get subtopics
      topicElement.querySelectorAll('.subtopic:not(.add-subtopic-row)').forEach(subtopicElement => {
        topicData.subtopics.push({
          name: subtopicElement.querySelector('.subtopic-name').textContent,
          completed: subtopicElement.classList.contains('completed')
        });
      });
      
      currentTopics.push(topicData);
    });
    
    localStorage.setItem('pomodoro-topics', JSON.stringify(currentTopics));
  }
  
  // Save stats to localStorage
  function saveStats() {
    localStorage.setItem('pomodoro-stats', JSON.stringify(stats));
    updateTopicsProgress();
  }

  // Add a new topic
  function addNewTopic() {
    const topicName = topicInput.value.trim();
    if (topicName) {
      const newTopic = {
        name: topicName,
        completed: false,
        subtopics: []
      };
      
      addTopicToDOM(newTopic);
      topicInput.value = '';
      saveTopics();
    }
  }
  
  // Add a topic to the DOM
  function addTopicToDOM(topic) {
    const topicElement = document.createElement('li');
    topicElement.className = 'topic' + (topic.completed ? ' completed' : '');
    
    const topicHeader = document.createElement('div');
    topicHeader.className = 'topic-header';
    
    const topicToggle = document.createElement('span');
    topicToggle.className = 'topic-toggle';
    topicToggle.textContent = '▶';
    
    const topicName = document.createElement('span');
    topicName.className = 'topic-name';
    topicName.textContent = topic.name;
    
    const topicCompleteCheck = document.createElement('span');
    topicCompleteCheck.className = 'topic-complete-check';
    topicCompleteCheck.textContent = topic.completed ? '☑' : '☐';
    
    topicHeader.appendChild(topicToggle);
    topicHeader.appendChild(topicName);
    topicHeader.appendChild(topicCompleteCheck);
    
    topicElement.appendChild(topicHeader);
    
    // Create subtopics list
    const subtopicsList = document.createElement('ul');
    subtopicsList.className = 'subtopics';
    
    if (topic.subtopics && topic.subtopics.length > 0) {
      topic.subtopics.forEach(subtopic => {
        const subtopicElement = document.createElement('li');
        subtopicElement.className = 'subtopic' + (subtopic.completed ? ' completed' : '');
        
        const subtopicName = document.createElement('span');
        subtopicName.className = 'subtopic-name';
        subtopicName.textContent = subtopic.name;
        
        const subtopicCompleteCheck = document.createElement('span');
        subtopicCompleteCheck.className = 'subtopic-complete-check';
        subtopicCompleteCheck.textContent = subtopic.completed ? '☑' : '☐';
        
        subtopicElement.appendChild(subtopicName);
        subtopicElement.appendChild(subtopicCompleteCheck);
        
        // Add click handler for subtopic completion
        subtopicCompleteCheck.addEventListener('click', function() {
          subtopicElement.classList.toggle('completed');
          subtopicCompleteCheck.textContent = subtopicElement.classList.contains('completed') ? '☑' : '☐';
          
          // Check if all subtopics are completed
          checkTopicCompletion(topicElement);
          
          saveTopics();
          updateTopicsProgress();
        });
        
        subtopicsList.appendChild(subtopicElement);
      });
    }
    
    // Add option to add subtopics
    const addSubtopicRow = document.createElement('li');
    addSubtopicRow.className = 'subtopic add-subtopic-row';
    
    const subtopicInput = document.createElement('input');
    subtopicInput.type = 'text';
    subtopicInput.placeholder = 'Add subtopic...';
    
    const addSubtopicBtn = document.createElement('button');
    addSubtopicBtn.textContent = '+';
    
    addSubtopicRow.appendChild(subtopicInput);
    addSubtopicRow.appendChild(addSubtopicBtn);
    
    // Add subtopic functionality
    addSubtopicBtn.addEventListener('click', function() {
      addSubtopic(subtopicsList, subtopicInput);
    });
    
    subtopicInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addSubtopic(subtopicsList, subtopicInput);
      }
    });
    
    subtopicsList.appendChild(addSubtopicRow);
    topicElement.appendChild(subtopicsList);
    
    // Add click handlers
    topicToggle.addEventListener('click', function() {
      subtopicsList.classList.toggle('open');
      topicToggle.classList.toggle('open');
      topicToggle.textContent = topicToggle.classList.contains('open') ? '▼' : '▶';
    });
    
    topicCompleteCheck.addEventListener('click', function() {
      topicElement.classList.toggle('completed');
      
      if (topicElement.classList.contains('completed')) {
        topicCompleteCheck.textContent = '☑';
        // Mark all subtopics as completed
        subtopicsList.querySelectorAll('.subtopic:not(.add-subtopic-row)').forEach(subtopic => {
          subtopic.classList.add('completed');
          subtopic.querySelector('.subtopic-complete-check').textContent = '☑';
        });
        
        stats.completedTopics++;
      } else {
        topicCompleteCheck.textContent = '☐';
        stats.completedTopics = Math.max(0, stats.completedTopics - 1);
      }
      
      saveTopics();
      saveStats();
      updateTopicsProgress();
    });
    
    topicsList.appendChild(topicElement);
  }
  
  // Add a subtopic to a topic
  function addSubtopic(subtopicsList, subtopicInput) {
    const subtopicName = subtopicInput.value.trim();
    if (subtopicName) {
      const subtopicElement = document.createElement('li');
      subtopicElement.className = 'subtopic';
      
      const subtopicNameSpan = document.createElement('span');
      subtopicNameSpan.className = 'subtopic-name';
      subtopicNameSpan.textContent = subtopicName;
      
      const subtopicCompleteCheck = document.createElement('span');
      subtopicCompleteCheck.className = 'subtopic-complete-check';
      subtopicCompleteCheck.textContent = '☐';
      
      subtopicElement.appendChild(subtopicNameSpan);
      subtopicElement.appendChild(subtopicCompleteCheck);
      
      // Add click handler
      subtopicCompleteCheck.addEventListener('click', function() {
        subtopicElement.classList.toggle('completed');
        subtopicCompleteCheck.textContent = subtopicElement.classList.contains('completed') ? '☑' : '☐';
        
        // Check if all subtopics are completed
        const topicElement = subtopicsList.closest('.topic');
        checkTopicCompletion(topicElement);
        
        saveTopics();
        updateTopicsProgress();
      });
      
      // Insert before the add row
      subtopicsList.insertBefore(subtopicElement, subtopicsList.querySelector('.add-subtopic-row'));
      subtopicInput.value = '';
      saveTopics();
    }
  }
  
  // Check if all subtopics are completed and update topic status accordingly
  function checkTopicCompletion(topicElement) {
    const subtopics = topicElement.querySelectorAll('.subtopic:not(.add-subtopic-row)');
    const allCompleted = Array.from(subtopics).every(subtopic => subtopic.classList.contains('completed'));
    
    const wasCompleted = topicElement.classList.contains('completed');
    const topicCheck = topicElement.querySelector('.topic-complete-check');
    
    if (allCompleted && subtopics.length > 0) {
      topicElement.classList.add('completed');
      topicCheck.textContent = '☑';
      
      if (!wasCompleted) {
        stats.completedTopics++;
        saveStats();
      }
    } else if (wasCompleted) {
      topicElement.classList.remove('completed');
      topicCheck.textContent = '☐';
      stats.completedTopics = Math.max(0, stats.completedTopics - 1);
      saveStats();
    }
  }
  
  // Setup toggling for existing topics
  function setupExistingTopics() {
    // Remove any existing event listeners first (to prevent duplicates)
    const cloneTopicToggles = Array.from(document.querySelectorAll('.topic-toggle')).map(el => {
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      return clone;
    });
    
    const cloneTopicChecks = Array.from(document.querySelectorAll('.topic-complete-check')).map(el => {
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      return clone;
    });
    
    const cloneSubtopicChecks = Array.from(document.querySelectorAll('.subtopic-complete-check')).map(el => {
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      return clone;
    });
    
    // Add new event listeners
    cloneTopicToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const subtopics = this.closest('.topic').querySelector('.subtopics');
        subtopics.classList.toggle('open');
        this.classList.toggle('open');
        this.textContent = this.classList.contains('open') ? '▼' : '▶';
      });
    });
    
    cloneTopicChecks.forEach(check => {
      check.addEventListener('click', function() {
        const topic = this.closest('.topic');
        topic.classList.toggle('completed');
        
        if (topic.classList.contains('completed')) {
          this.textContent = '☑';
          // Mark all subtopics as completed
          topic.querySelectorAll('.subtopic:not(.add-subtopic-row)').forEach(subtopic => {
            subtopic.classList.add('completed');
            const checkBox = subtopic.querySelector('.subtopic-complete-check');
            if (checkBox) checkBox.textContent = '☑';
          });
          
          stats.completedTopics++;
        } else {
          this.textContent = '☐';
          stats.completedTopics = Math.max(0, stats.completedTopics - 1);
        }
        
        saveTopics();
        saveStats();
        updateTopicsProgress();
      });
    });
    
    cloneSubtopicChecks.forEach(check => {
      check.addEventListener('click', function() {
        const subtopic = this.closest('.subtopic');
        subtopic.classList.toggle('completed');
        this.textContent = subtopic.classList.contains('completed') ? '☑' : '☐';
        
        // Check if all subtopics are completed
        const topicElement = subtopic.closest('.topic');
        checkTopicCompletion(topicElement);
        
        saveTopics();
        updateTopicsProgress();
      });
    });
  }

  // --------------------- Progress Functions ---------------------
  
  // Generate progress blocks for both columns
  function generateProgressBlocks() {
    // Check if blocks already exist in the HTML
    if (topicsProgress.querySelectorAll('.progress-block').length === 0) {
      // Generate the blocks if they don't exist
      for (let i = 0; i < PROGRESS_BLOCKS; i++) {
        const topicBlock = document.createElement('div');
        topicBlock.className = 'progress-block';
        topicsProgress.appendChild(topicBlock);
        
        const timeBlock = document.createElement('div');
        timeBlock.className = 'progress-block';
        timeProgress.appendChild(timeBlock);
      }
    }
    
    updateTopicsProgress();
    updateTimeProgress();
  }
  
  // Update progress for topics
  function updateTopicsProgress() {
    // Update stats based on current DOM state
    stats.completedTopics = document.querySelectorAll('.topic.completed').length;
    
    const totalTopics = document.querySelectorAll('.topic').length;
    const completedTopics = stats.completedTopics;
    
    // Calculate the number of blocks to highlight
    let blocksToHighlight = 0;
    if (totalTopics > 0) {
      blocksToHighlight = Math.round((completedTopics / totalTopics) * PROGRESS_BLOCKS);
    }
    
    // Update the blocks
    const blocks = topicsProgress.querySelectorAll('.progress-block');
    blocks.forEach((block, index) => {
      if (index < blocksToHighlight) {
        block.classList.add('active');
      } else {
        block.classList.remove('active');
      }
    });
  }
  
  // Update progress for time/pomodoros
  function updateTimeProgress() {
    if (!session.isActive) {
      // When not in a session, no blocks are highlighted
      const blocks = timeProgress.querySelectorAll('.progress-block');
      blocks.forEach(block => block.classList.remove('active'));
      return;
    }
    
    // In session mode, show progress based on completed pomodoros
    const totalPomodoros = session.expectedPomodoros;
    const completedPomodoros = session.completedPomodoros;
    
    // For current pomodoro, calculate progress
    let currentPomodoroPct = 0;
    if (timer.mode === 'work') {
      const totalWorkSeconds = WORK_TIME * 60;
      const elapsedWorkSeconds = (WORK_TIME * 60) - ((timer.minutes * 60) + timer.seconds);
      currentPomodoroPct = elapsedWorkSeconds / totalWorkSeconds;
    }
    
    // Calculate overall progress including current pomodoro
    const overallPct = (completedPomodoros + (timer.mode === 'work' ? currentPomodoroPct : 0)) / totalPomodoros;
    const blocksToHighlight = Math.round(overallPct * PROGRESS_BLOCKS);
    
    // Update the blocks
    const blocks = timeProgress.querySelectorAll('.progress-block');
    blocks.forEach((block, index) => {
      if (index < blocksToHighlight) {
        block.classList.add('active');
      } else {
        block.classList.remove('active');
      }
    });
  }
});
