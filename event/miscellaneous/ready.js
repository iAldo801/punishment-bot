const client = require("../../index.js");
const eventLoader = require('../../loaders/events.js')

const chalk = require('chalk');
const aqua = chalk.hex('#33FFFE')
const purple = chalk.hex('#5a67d8')

const log = console.log;

client.on("ready", () => {
    log(aqua('│ 🤖 Hex Bot ↴'))
    log("")
    log(chalk.green(` │ 💻 Commands Loaded ⤵`))
    client.application.commands.set(client.slash.map(x => x))
    log(`    └─ 🔃 ${client.slash.size} commands loaded`)
    log("")
    log(chalk.green(` │ 📁 Events Loaded ⤵`))
    eventLoader(client)
    log(`    └─ 🔃 ${eventLoader.length} events loaded`)
    log("")
})