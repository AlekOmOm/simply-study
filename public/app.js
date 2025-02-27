document.addEventListener('DOMContentLoaded', function() {
  // Timer elements
  const minutesElement = document.getElementById('minutes');
  const secondsElement = document.getElementById('seconds');
  const startPauseButton = document.getElementById('start-pause');
  const resetButton = document.getElementById('reset');
  
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
  const PROGRESS_BLOCKS = 10; // Number of progress blocks to display
  
  // App state
  const timer = {
    minutes: WORK_TIME,
    seconds: 0,
    isRunning: false,
    interval: null,
    mode: 'work' // 'work' or 'break'
  };
  
  const topics = []; // Will store topic objects
  const stats = {
    completedPomodoros: 0,
    completedTopics: 0
  };
  
  // Initialize the app
  initApp();
  
  // Function to initialize the app
  function initApp() {
    setupEventListeners();
    loadTopics();
    resetTimer();
    generateProgressBlocks();
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Timer controls
    startPauseButton.addEventListener('click', toggleTimer);
    resetButton.addEventListener('click', resetTimer);
    
    // Topic controls
    addTopicButton.addEventListener('click', addNewTopic);
    topicInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addNewTopic();
      }
    });
    
    setupExistingTopics();
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
      stats.completedPomodoros++;
      saveStats();
      
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
  }
  
  // Play sound when timer completes
  function playTimerCompleteSound() {
    // Create an audio element
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869.wav');
    audio.play().catch(e => console.log('Audio play failed:', e));
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
    }
    
    updateTopicsProgress();
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
      topicElement.querySelectorAll('.subtopic').forEach(subtopicElement => {
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
    updateTimeProgress();
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
    topicCompleteCheck.textContent = '☐';
    
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
        subtopicCompleteCheck.textContent = '☐';
        
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
    document.querySelectorAll('.topic-toggle').forEach(toggle => {
      toggle.addEventListener('click', function() {
        const subtopics = this.closest('.topic').querySelector('.subtopics');
        subtopics.classList.toggle('open');
        this.classList.toggle('open');
        this.textContent = this.classList.contains('open') ? '▼' : '▶';
      });
    });
    
    document.querySelectorAll('.topic-complete-check').forEach(check => {
      check.addEventListener('click', function() {
        const topic = this.closest('.topic');
        topic.classList.toggle('completed');
        
        if (topic.classList.contains('completed')) {
          this.textContent = '☑';
          // Mark all subtopics as completed
          topic.querySelectorAll('.subtopic').forEach(subtopic => {
            subtopic.classList.add('completed');
            subtopic.querySelector('.subtopic-complete-check').textContent = '☑';
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
    
    document.querySelectorAll('.subtopic-complete-check').forEach(check => {
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
    // Clear existing blocks
    topicsProgress.innerHTML = '';
    timeProgress.innerHTML = '';
    
    // Generate the blocks
    for (let i = 0; i < PROGRESS_BLOCKS; i++) {
      const topicBlock = document.createElement('div');
      topicBlock.className = 'progress-block';
      topicsProgress.appendChild(topicBlock);
      
      const timeBlock = document.createElement('div');
      timeBlock.className = 'progress-block';
      timeProgress.appendChild(timeBlock);
    }
    
    updateTopicsProgress();
    updateTimeProgress();
  }
  
  // Update progress for topics
  function updateTopicsProgress() {
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
  
  // Update progress for time
  function updateTimeProgress() {
    const totalTime = WORK_TIME * 60; // Total seconds for a pomodoro
    const remainingTime = (timer.minutes * 60) + timer.seconds;
    const elapsedTime = totalTime - remainingTime;
    
    // Calculate the number of blocks to highlight
    let blocksToHighlight = 0;
    if (timer.mode === 'work') {
      blocksToHighlight = Math.round((elapsedTime / totalTime) * PROGRESS_BLOCKS);
    }
    
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
