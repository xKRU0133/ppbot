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

// ユーザーデータの保存関数
function saveData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

module.exports = {
  name: 'removebadge',
  description: '指定したユーザーから特定のバッジを削除します。',
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: 'Administrator',
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'バッジを削除するユーザー',
      required: true,
    },
    {
      name: 'badgeid',
      type: ApplicationCommandOptionType.Integer,
      description: '削除するバッジのID',
      required: true,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const badgeId = interaction.options.getInteger('badgeid');
    let data = loadData();
    const userId = targetUser.id;

    if (!data[userId] || !data[userId].badges || data[userId].badges.length === 0) {
      return interaction.reply({ content: `${targetUser.username} はバッジを持っていません。`, ephemeral: true });
    }

    // バッジの削除
    const badgeIndex = data[userId].badges.findIndex(badge => badge.id === badgeId);

    if (badgeIndex === -1) {
      return interaction.reply({ content: `ID ${badgeId} のバッジが見つかりません。`, ephemeral: true });
    }

    const removedBadge = data[userId].badges.splice(badgeIndex, 1)[0];
    saveData(data);

    // バッジ削除の確認メッセージ
    const embed = new EmbedBuilder()
      .setTitle('バッジ削除')
      .setColor(0xFF0000)
      .setDescription(`${targetUser.username} から「${removedBadge.name}」バッジ（ID: ${badgeId}）が削除されました。`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
