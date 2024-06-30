const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const fs = require("fs")
const yaml = require("js-yaml")
const settings = yaml.load(fs.readFileSync("./data/settings.yml", "utf8"))
const utils = require("../../utils")

module.exports = {

    name: "kick",
    description: "Kick a user from the server.",
    options: [

        {
            name: 'user',
            description: 'The user to kick.',
            type: 6,
            required: true
        },
        {
            name: 'reason',
            description: 'The reason for the kick.',
            type: 3,
            required: false
        }

    ],

    run: async (client, interaction, args) => {

        try {

            const { options } = interaction;

            const user = options.getUser('user') || interaction.user
            const user2 = await options.getUser('user').fetch();
            const reason = options.getString('reason') || "No reason provided."

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });

            if (user.id === interaction.user.id) return interaction.reply({ content: "You cannot kick yourself.", ephemeral: true });

            if (user.id === client.user.id) return interaction.reply({ content: "Why do you want to get rid of me ;(?", ephemeral: true });

            if (user.id === interaction.guild.ownerId) return interaction.reply({ content: "You cannot kick the server owner.", ephemeral: true });

            const member = await interaction.guild.members.fetch(user.id);
            await member.kick({ reason: reason }).catch(err => {

                return interaction.reply({ content: "I was unable to kick that user.", ephemeral: true });

            });

            const existingUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
                include: {
                    punishments: true,
                },
            });



            const newPunishment = {
                type: "KICK",
                staff: interaction.user.username,
                reason: reason,
                date: utils.currentDateFormatted(),
            };

            if (existingUser) {
                const updatedPunishments = [...existingUser.punishments, newPunishment];

                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        punishments: {
                            set: updatedPunishments,
                        },
                    },
                });
            } else {
                await prisma.user.create({
                    data: {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128` : 'https://cdn.discordapp.com/embed/avatars/0.png',
                        banner: user.banner ? `https://cdn.discordapp.com/banners/${user2.id}/${user2.banner}?size=1024` : 'https://i.imgur.com/WgnjrpZ.png',
                        punishments: {
                            set: [newPunishment],
                        },
                    },
                });
            }

            const kickEmbed = new EmbedBuilder()
                .setTitle(settings.kick.title)
                .setDescription(settings.kick.description
                    .replace("{user}", user.username)
                    .replace("{user_id}", user.id)
                    .replace("{reason}", reason)
                    .replace("{staff_username}", interaction.user.username)
                    .replace("{staff_id}", interaction.user.id))
                .setColor(settings.kick.color)
                .setFooter({ text: "Hex Studios", iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();


            interaction.reply({ embeds: [kickEmbed] });

        } catch (error) {

            console.log(error);
            return interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }

    }

}