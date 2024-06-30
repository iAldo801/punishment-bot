const fs = require('fs');
const path = require('path');

const commandLoader = (client) => {
  const commandsPath = path.join(__dirname, "../commands");

  const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        loadCommands(filePath);
      } else {
        const command = require(filePath);
        client.slash.set(command.name, command);
      }
    }
  };

  loadCommands(commandsPath);
};

module.exports = commandLoader;
