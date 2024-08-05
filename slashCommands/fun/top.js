const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
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
  name: 'rank',
  description: 'サーバー内のポイントランキングを表示します。',
  type: ApplicationCommandType.ChatInput,
  cooldown: 3000,
  run: async (client, interaction) => {
    let data = loadData();
    
    // ポイント順にソートし、上位10ユーザーを取得
    const sortedUsers = Object.entries(data)
      .filter(([userId, userData]) => {
        const user = client.users.cache.get(userId);
        return userData.points > 0 && user && !user.bot;
      })
      .sort(([, aData], [, bData]) => bData.points - aData.points)
      .slice(0, 10);

    if (sortedUsers.length === 0) {
      return interaction.reply({ content: 'ポイントデータがありません。', ephemeral: true });
    }

    // ランキングのテキストを作成
    const rankingText = sortedUsers.map(([userId, userData], index) => {
      const user = client.users.cache.get(userId);
      const badges = userData.badges && userData.badges.length > 0
        ? `${userData.badges.map(badge => badge.name).join(', ')}`
        : '';
      let rankText;
      
      switch(index) {
        case 0:
          rankText = `🏆 **1位**: ${badges}${user ? user.username : 'Unknown User'} : ${userData.points} ポイント`;
          break;
        case 1:
          rankText = `🥈 **2位**: ${badges}${user ? user.username : 'Unknown User'} : ${userData.points} ポイント`;
          break;
        case 2:
          rankText = `🥉 **3位**: ${badges}${user ? user.username : 'Unknown User'} : ${userData.points} ポイント`;
          break;
        default:
          rankText = `${index + 1}. ${badges}${user ? user.username : 'Unknown User'} : ${userData.points} ポイント`;
      }

      return rankText;
    }).join('\n\n');

    // Embed メッセージでランキングを表示
    const embed = new EmbedBuilder()
      .setTitle('🌟 ポイントランキング 🌟')
      .setColor(0xFFD700) // ゴールドカラー
      .setDescription(rankingText)
      .setFooter({ text: 'トッププレイヤーの皆さん、おめでとうございます！' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
