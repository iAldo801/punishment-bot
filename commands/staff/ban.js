const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const prisma = require("../../prisma/client");
const fs = require("fs")
const yaml = require("js-yaml")
const settings = yaml.load(fs.readFileSync("./data/settings.yml", "utf8"))
const utils = require("../../utils")

module.exports = {
    name: "ban",
    description: "Bans a user from the server.",
    options: [
        {
            name: 'user',
            description: 'The user to ban.',
            type: 6,
            required: true
        },
        {
            name: 'delete_messages',
            description: 'The amount of days to delete the messages.',
            required: true,
            type: 3,
            choices: [
                {
                    name: "Don't Delete Any",
                    value: '0'
                },
                {
                    name: "Previous 24 Hours",
                    value: '1'
                },
                {
                    name: "Previous 7 Days",
                    value: '7'
                },
            ]
        },
        {
            name: 'reason',
            description: 'The reason for the ban.',
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
            const amount = options.getString('delete_messages') || '0';

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                const noperms = new EmbedBuilder()
                    .setTitle(settings.no_permission.title)
                    .setDescription(settings.no_permission.description)
                    .setColor(settings.no_permission.color)
                    .setFooter({ text: "Hex Studios", iconURL: client.user.displayAvatarURL({ dynamic: true }) })

                return interaction.reply({ embeds: [noperms] }).then((sentMessage) => {
                    setTimeout(() => {
                        sentMessage.delete()
                    }, settings.no_permission.embed_timeout * 1000);
                });
            }

            if (user.id === interaction.user.id) return interaction.reply({ content: "Hmmm, if you want to ban yourself so bad why not leave the server instead?", ephemeral: true });

            if (user.id === client.user.id) return interaction.reply({ content: "Do you seriously hate me that much?", ephemeral: true });

            if (user.id === interaction.guild.ownerId) return interaction.reply({ content: "Why you trying to ban the server owner? He should ban you instead you know 👀", ephemeral: true });

            const member = await interaction.guild.members.fetch(user.id);
            await member.ban({ days: amount, reason: reason }).catch(err => {
                if (err === 50013) return console.log({ content: 'I do not have permission to ban people you stupid human!', ephemeral: true });
            });

            // const existingUser = await prisma.user.findUnique({
            //     where: {
            //         id: user.id,
            //     },
            //     include: {
            //         punishments: true,
            //     },
            // });

            const newPunishment = {
                type: "BAN",
                staff: interaction.user.username,
                reason: reason,
                date: utils.currentDateFormatted(),
            };

            const existingUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
                include: {
                    punishments: true,
                },
            });

            if (existingUser) {
                // User record exists in the database
                // Perform actions related to an existing user
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
                // User record doesn't exist in the database
                // Perform actions related to a new user
                await prisma.user.create({
                    data: {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar
                            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`
                            : 'https://cdn.discordapp.com/embed/avatars/0.png',
                        banner: user.banner
                            ? `https://cdn.discordapp.com/banners/${user2.id}/${user2.banner}?size=1024`
                            : 'https://i.imgur.com/WgnjrpZ.png',
                        punishments: {
                            set: [newPunishment],
                        },
                    },
                });
            }

            const banEmbed = new EmbedBuilder()
                .setTitle(settings.ban.title)
                .setDescription(settings.ban.description
                    .replace("{user}", user.username)
                    .replace("{user_id}", user.id)
                    .replace("{reason}", reason)
                    .replace("{staff_username}", interaction.user.username)
                    .replace("{staff_id}", interaction.user.id))
                .setColor(settings.ban.color);


            banEmbed.setTimestamp();

            interaction.reply({ embeds: [banEmbed] });

        } catch (error) {

            console.log(error)

            if (settings.error.enabled) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle(settings.error.title)
                    .setDescription(settings.error.description
                        .replace("{error}", error)
                    )
                    .setColor(settings.error.color)
                    .setFooter({ text: "Hex Studios", iconURL: client.user.displayAvatarURL({ dynamic: true }) })

                interaction.reply({ embeds: [errorEmbed] }).then((sentMessage) => {

                    setTimeout(() => {
                        sentMessage.delete()
                    }, settings.error.embed_timeout * 1000);

                });
            } else {
                interaction.reply({ content: "An error occured while running this command.", ephemeral: true });
            }

        }

    }

}