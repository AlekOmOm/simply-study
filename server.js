const express = require("express");
const app = express();
const PORT = process.env.PORT || 8081;

// serve static files from public directory
    // app.js in public directory is the main entry point
app.use(express.static("public"));

// start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
