const { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'banusers',
    description: 'Ban multiple users',
    type: ApplicationCommandType.ChatInput,
          default_member_permissions: 'Administrator',
    options: [
        {
            name: 'reason',
            description: 'Reason for the ban',
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    cooldown: 3000,
    run: async (client, interaction) => {
        const filePath = path.join(__dirname, '.', 'userIds.json');
        let userIdsData;

        try {
            console.log('Reading user IDs from file...');
            userIdsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log('User IDs read successfully.');
        } catch (error) {
            console.error('Error reading userIds.json:', error);
            return interaction.reply({ content: 'ユーザーIDファイルの読み込み中にエラーが発生しました。', ephemeral: true });
        }

        const userIds = userIdsData.userIds;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const banPromises = userIds.map(async (userId) => {
            try {
                const user = await client.users.fetch(userId);
                
                // 既にBanされているかどうかを確認
                const isBanned = await interaction.guild.bans.fetch(userId).catch(() => null);
                if (isBanned) {
                    return { userId, status: 'AlreadyBanned', reason: 'Already banned' };
                }

                await interaction.guild.members.ban(user, { reason });
                return { userId, status: 'Success', reason: '' };
            } catch (error) {
                return { userId, status: 'Failed', reason: error.message };
            }
        });

        const banResults = await Promise.all(banPromises);
        const successBans = banResults.filter(result => result.status === 'Success').map(result => result.userId).join(', ');
        const failedBans = banResults.filter(result => result.status === 'Failed').map(result => `${result.userId} (${result.reason})`).join(', ');
        const alreadyBanned = banResults.filter(result => result.status === 'AlreadyBanned').map(result => result.userId).join(', ');

        let responseMessage = 'Ban Results:\n';
        if (successBans) {
            responseMessage += `Successfully banned: ${successBans}\n`;
        }
        if (alreadyBanned) {
            responseMessage += `Already banned: ${alreadyBanned}\n`;
        }
        if (failedBans) {
            responseMessage += `Failed to ban: ${failedBans}\n`;
        }

        // メッセージを分割して送信
        const messages = splitMessage(responseMessage, 2000);
        for (const message of messages) {
            await interaction.followUp({ content: message, ephemeral: true });
        }
    }
};

// メッセージを分割する関数
function splitMessage(message, maxLength) {
    const messages = [];
    let start = 0;

    while (start < message.length) {
        let end = start + maxLength;
        if (end > message.length) end = message.length;

        const segment = message.slice(start, end);
        messages.push(segment);

        start = end;
    }

    return messages;
}
