const { EmbedBuilder } = require('discord.js');
const prisma = require("../../prisma/client");
const { PermissionsBitField } = require('discord.js');
const fs = require("fs")
const yaml = require("js-yaml")
const settings = yaml.load(fs.readFileSync("./data/settings.yml", "utf8"))
const utils = require("../../utils")

module.exports = {
    name: 'mute',
    description: 'Mute a user from the server.',
    options: [
        {
            name: 'user',
            description: 'The user to mute.',
            type: 6,
            required: true
        },
        {
            name: 'reason',
            description: 'The reason for the mute.',
            type: 3,
            required: false
        },
    ],

    run: async (client, interaction) => {

        const { guild, options } = interaction;

        const user = options.getUser('user') || interaction.user
        const user2 = await options.getUser('user').fetch();
        const target = guild.members.cache.get(user.id);
        const reason = options.getString('reason') || "No reason provided."
        const mutedRole = guild.roles.cache.get(settings.roles.muted);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) return interaction.reply({ content: 'You do not have permission to muite members!', ephemeral: true });

        if (user.id === interaction.user.id) return interaction.reply({ content: 'You cannot mute yourself!', ephemeral: true });
        if (user.id === client.user.id) return interaction.reply({ content: 'You cannot mute me!', ephemeral: true });
        if (user.id === interaction.guild.ownerId) return interaction.reply({ content: 'You cannot mute the server owner!', ephemeral: true });
        if (target.roles.cache.has(settings.roles.muted)) return interaction.reply({ content: 'This user is already muted!', ephemeral: true });

        target.roles.add(mutedRole);

        const existingUser = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
            include: {
                punishments: true,
            },
        });

        const newPunishment = {
            type: "MUTE",
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

        const embed = new EmbedBuilder()
            .setTitle(settings.mute.title)
            .setDescription(settings.mute.description
                .replace("{user}", user.username)
                .replace("{user_id}", user.id).replace("{reason}", reason)
                .replace("{staff_username}", interaction.user.username)
                .replace("{staff_id}", interaction.user.id))
            .setColor(settings.mute.color)
            .setFooter({ text: "Hex Studios", iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] })

    }
}