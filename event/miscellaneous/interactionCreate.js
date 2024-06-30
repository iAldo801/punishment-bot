const client = require('../../index.js');

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.slash.get(interaction.commandName);
        if (!command) return;
        const args = [];

        for (let option of interaction.options.data) {
            if (option.type === 1) {
                if (option.name) args.push(option.name);
                option.options?.forEach(x => {
                    if (x.value) args.push(x.value);
                });
            } else if (option.value) args.push(option.value);
        }

        try {
            command.run(client, interaction, args);
        } catch (error) {
            console.log(error)
            interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
        }
    }
});