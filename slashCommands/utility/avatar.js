const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: "Display user's avatar",
    type: ApplicationCommandType.ChatInput,
    cooldown: 300000,
    options: [
        {
            name: 'user',
            description: 'The avatar of the user you want to display.',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async (client, interaction) => {
        try {
            const user = interaction.options.getUser('user') || interaction.user;

            const embed = new EmbedBuilder()
                .setTitle(`${user.tag}'s avatar`)
                .setImage(user.displayAvatarURL({ size: 4096 }))
                .setColor('Fuchsia')
                .setTimestamp();

            const formats = ['png', 'jpg', 'jpeg', 'gif'];
            const components = [];

            formats.forEach(format => {
                const imageOptions = { extension: format, forceStatic: format !== 'gif' };
                const avatarURL = user.displayAvatarURL(imageOptions);

                if (user.avatar === null && format !== 'png') return;
                if (user.avatar && !user.avatar.startsWith('a_') && format === 'gif') return;

                components.push(
                    new ButtonBuilder()
                        .setLabel(format.toUpperCase())
                        .setStyle('Link')
                        .setURL(avatarURL)
                );
            });

            const row = new ActionRowBuilder().addComponents(components);

            await interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'アバターの表示中にエラーが発生しました。', ephemeral: true });
        }
    }
};
