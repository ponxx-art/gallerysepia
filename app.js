const express = require("express");
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());

const publicDir = path.join(__dirname, 'public');
app.use("/public/", express.static(publicDir, {
  maxAge: '1d',
  etag: false
}));

const nodeModulesDir = path.join(__dirname, 'node_modules');
app.use('/node_modules/', express.static(nodeModulesDir, {
  maxAge: '1d',
  etag: false
}));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, function () {
  console.log(`Server running on http://localhost:${PORT}`);
});