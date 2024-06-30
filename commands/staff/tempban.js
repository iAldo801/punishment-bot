const { EmbedBuilder } = require('discord.js');
const prisma = require("../../prisma/client");
const { PermissionsBitField } = require('discord.js');
const fs = require("fs")
const yaml = require("js-yaml")
const settings = yaml.load(fs.readFileSync("./data/settings.yml", "utf8"))
const utils = require("../../utils")
const ms = require("ms");

module.exports = {
    name: 'tempban',
    description: 'Bans a user from the server.',
    options: [
        {
            name: 'user',
            description: 'The user to ban.',
            type: 6,
            required: true
        },
        {
            name: 'time',
            description: 'The duration of the ban.',
            type: 3,
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
                }
            ]
        },
        {
            name: 'reason',
            description: 'The reason for the ban.',
            type: 3,
            required: false
        }
    ],

    run: async (client, interaction) => {

        const { options, guild } = interaction;

        const user = options.getUser('user') || interaction.user;
        const reason = options.getString('reason') || "No reason provided.";
        const time = options.getString('time') || '0';
        const amount = options.getString('delete_messages') || '0';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply({
                content: 'You do not have permission to ban members!',
                ephemeral: true
            });

        if (user.id === interaction.user.id)
            return interaction.reply({ content: 'You cannot ban yourself!', ephemeral: true });
        if (user.id === client.user.id)
            return interaction.reply({ content: 'You cannot ban me!', ephemeral: true });
        if (user.id === interaction.guild.ownerId)
            return interaction.reply({ content: 'You cannot ban the server owner!', ephemeral: true });

        const member = await interaction.guild.members.fetch(user.id).catch(console.error);
        await member.ban({ days: amount, reason: reason }).catch(err => {
            if (err === 50013)
                return console.log({ content: 'I do not have permission to ban members!', ephemeral: true });
        });

        const durationMs = ms(time);
        const banTime = durationMs ? Math.floor(durationMs / 1000) : 0;

        const existingUser = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
            include: {
                punishments: true,
            },
        });

        const newPunishment = {
            type: "TEMPBAN",
            staff: interaction.user.username,
            reason: reason,
            date: utils.currentDateFormatted(),
            duration: banTime,
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
                    avatar: user.avatar
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=128`
                        : 'https://cdn.discordapp.com/embed/avatars/0.png',
                    banner: user.banner
                        ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}?size=1024`
                        : 'https://i.imgur.com/WgnjrpZ.png',
                    punishments: {
                        set: [newPunishment],
                    },
                },
            });
        }

        const tempBanEmbed = new EmbedBuilder()
            .setTitle(settings.tempban.title)
            .setDescription(settings.tempban.description
                .replace('{user}', user.username)
                .replace('{user_id}', user.id)
                .replace('{reason}', reason)
                .replace('{staff_username}', interaction.user.username)
                .replace('{staff_id}', interaction.user.id)
                .replace('{duration}', banTime)
            )
            .setColor(settings.tempban.color)
            .setTimestamp();

        await interaction.reply({ embeds: [tempBanEmbed] });

        if (banTime > 0) {
            setTimeout(async () => {
                const usertounban = await interaction.guild.members;
                await usertounban.unban(user);
            }, durationMs);
        }
    },
};
