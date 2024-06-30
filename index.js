const { Client, Collection } = require('discord.js');
const fs = require("fs")
const yaml = require("js-yaml")
const settings = yaml.load(fs.readFileSync("./data/settings.yml", "utf8"))

const client = new Client({ intents: 3276799, partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "USER", "GUILD_MESSAGES"], components: true });


client.slash = new Collection();
module.exports = client;

["events", "commands"].forEach(handler => {
    require(`./loaders/${handler}`)(client);
});

client.login(settings.token);