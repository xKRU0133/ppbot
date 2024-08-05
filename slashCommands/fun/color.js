const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, ComponentType, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'color',
    description: 'Choose a color!',
    type: ApplicationCommandType.ChatInput,
    cooldown: 300000,
    run: async (client, interaction) => {
        /**
         * Get the buttons
         * @param {Boolean} toggle - Toggle disable buttons
         * @param {string} [choice = null] choice - The color user chose
         */
        const getButtons = (toggle = false, choice) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Green')
                    .setCustomId('green')
                    .setStyle(toggle && choice === 'green' ? ButtonStyle.Secondary : ButtonStyle.Success)
                    .setDisabled(toggle),

                new ButtonBuilder()
                    .setLabel('Red')
                    .setCustomId('red')
                    .setStyle(toggle && choice === 'red' ? ButtonStyle.Secondary : ButtonStyle.Danger)
                    .setDisabled(toggle),

                new ButtonBuilder()
                    .setLabel('Blue')
                    .setCustomId('blue')
                    .setStyle(toggle && choice === 'blue' ? ButtonStyle.Secondary : ButtonStyle.Primary)
                    .setDisabled(toggle),

                new ButtonBuilder()
                    .setLabel(toggle && choice === 'exit' ? 'Exited' : 'Exit')
                    .setEmoji(toggle && choice === 'exit' ? '✅' : '❌')
                    .setCustomId('exit')
                    .setStyle(toggle && choice === 'exit' ? ButtonStyle.Danger : ButtonStyle.Secondary)
                    .setDisabled(toggle)
            );

            return row;
        };

        const embed = new EmbedBuilder()
            .setTitle('Choose a color')
            .setDescription("Choose green, red or blue.\nIf you don't want to choose, press exit.")
            .setColor('Aqua')
            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed], components: [getButtons()] });

        const message = await interaction.fetchReply();
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: `These buttons aren't for you!`, ephemeral: true });
                return;
            }

            await i.deferUpdate();
            await interaction.editReply({ components: [getButtons(true, i.customId)] });

            if (i.customId === 'exit') {
                collector.stop('user');
                return;
            }

            const roleName = `${i.customId.charAt(0).toUpperCase() + i.customId.slice(1)} Role`;
            const roleColor = i.customId === 'green' ? 0x00FF00 : i.customId === 'red' ? 0xFF0000 : 0x0000FF; // 16進数カラーコード

            // ロールが存在するか確認し、存在しない場合は作成
            let role = interaction.guild.roles.cache.find(r => r.name === roleName);
            if (!role) {
                role = await interaction.guild.roles.create({
                    name: roleName,
                    color: roleColor,
                    permissions: []
                });
            }

            // 既存の色のロールを削除
            const colorRoles = ['Green Role', 'Red Role', 'Blue Role'];
            for (const colorRole of colorRoles) {
                if (colorRole !== roleName) {
                    const existingRole = interaction.guild.roles.cache.find(r => r.name === colorRole);
                    if (existingRole && interaction.member.roles.cache.has(existingRole.id)) {
                        await interaction.member.roles.remove(existingRole);
                    }
                }
            }

            // ユーザーに新しいロールを付与
            await interaction.member.roles.add(role);
            await i.followUp({ content: `${i.user}, You chose **${i.customId.charAt(0).toUpperCase() + i.customId.slice(1)} :${i.customId}_circle:**!`, ephemeral: true });
            collector.stop('colorChosen'); // コレクターを停止し、理由を指定
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'user' || reason === 'colorChosen') {
                return interaction.followUp({ content: 'Ended the collector.', ephemeral: true });
            }
            if (reason === 'time') {
                interaction.editReply({ components: [getButtons(true)] });
                return interaction.followUp({ content: 'Time is up! No color was chosen.', ephemeral: true });
            }
        });
    }
};
