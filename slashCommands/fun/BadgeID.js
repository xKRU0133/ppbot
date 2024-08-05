const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, 'data.json');

// ユーザーデータの読み込み関数
function loadData() {
  if (!fs.existsSync(dataFilePath)) {
    return {};
  }

  const data = fs.readFileSync(dataFilePath, 'utf8');
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    return {};
  }
}

module.exports = {
  name: 'badgeid',
  description: '指定したユーザーのバッジIDを確認します。',
  type: ApplicationCommandType.ChatInput,
  　　　　default_member_permissions: 'Administrator',
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'バッジIDを確認するユーザー',
      required: true,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    let data = loadData();
    const userId = targetUser.id;

    if (!data[userId] || !data[userId].badges || data[userId].badges.length === 0) {
      return interaction.reply({ content: `${targetUser.username} はバッジを持っていません。`, ephemeral: true });
    }

    const badges = data[userId].badges.map(badge => `ID: ${badge.id} - ${badge.name}`).join('\n');

    // バッジIDの表示
    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}のバッジ一覧`)
      .setColor(0x00FF00)
      .setDescription(badges);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
