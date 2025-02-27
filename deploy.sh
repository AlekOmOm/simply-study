#!/bin/bash

# Study App Deployment Script

echo "Setting up study app deployment..."

# 1. Create directory structure
mkdir -p public

# 2. Check if files need to be moved
if [ -f "index.html" ] && [ ! -f "public/index.html" ]; then
  echo "Moving index.html to public directory..."
  cp index.html public/
fi

if [ -f "app.js" ] && [ ! -f "public/app.js" ]; then
  echo "Moving app.js to public directory..."
  cp app.js public/
fi

# 3. Check if server is already running
if [ -f "app.pid" ] && ps -p $(cat app.pid) > /dev/null; then
  echo "App is already running with PID $(cat app.pid)"
  
  read -p "Do you want to restart it? (y/n): " choice
  case "$choice" in 
    y|Y ) 
      echo "Stopping existing process..."
      kill $(cat app.pid)
      ;;
    * ) 
      echo "Exiting without restarting"
      exit 0
      ;;
  esac
fi

# 4. Start the server with nohup
echo "Starting server with nohup..."
nohup node server.js > app.log 2>&1 &
echo $! > app.pid

echo "Server started with PID $(cat app.pid)"
echo "You can check the logs with: tail -f app.log"
echo "Your app should be available at http://localhost:3000"
