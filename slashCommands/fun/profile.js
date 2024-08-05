const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, 'data.json');
const cooldownTime = 1 * 60 * 60 * 1000; // 1時間をミリ秒で

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
  name: 'profile',
  description: '指定したユーザーのプロフィールを表示します。',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'プロフィールを確認するユーザー（指定しない場合は自分）',
      required: false,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    let data = loadData();
    const userId = targetUser.id;

    if (!data[userId]) {
      data[userId] = {
        points: 0,
        totalPointsEarned: 0,
        totalPointsUsed: 0,
        totalPointsSent: 0,
        totalPointsReceived: 0,
        badges: [],
        lastClaimed: 0
      }; // 初期設定
    } else {
      // totalPointsEarnedとtotalPointsUsed、totalPointsSent、totalPointsReceivedが存在しない場合に初期化
      if (data[userId].totalPointsEarned === undefined) data[userId].totalPointsEarned = 0;
      if (data[userId].totalPointsUsed === undefined) data[userId].totalPointsUsed = 0;
      if (data[userId].totalPointsSent === undefined) data[userId].totalPointsSent = 0;
      if (data[userId].totalPointsReceived === undefined) data[userId].totalPointsReceived = 0;
      if (data[userId].badges === undefined) data[userId].badges = [];
    }

    const userPoints = data[userId].points;
    const totalPointsEarned = data[userId].totalPointsEarned;
    const totalPointsUsed = data[userId].totalPointsUsed;
    const totalPointsSent = data[userId].totalPointsSent;
    const totalPointsReceived = data[userId].totalPointsReceived;
    const badges = data[userId].badges.length > 0
      ? data[userId].badges.map(badge => `${badge.name}`).join('\n')
      : 'なし';
    const now = Date.now();
    const lastClaimed = data[userId].lastClaimed;
    const nextClaimTime = lastClaimed + cooldownTime;
    const timeUntilNextClaim = nextClaimTime > now ? nextClaimTime - now : 0;

    let timeString = '今すぐ受け取れます！';
    if (timeUntilNextClaim > 0) {
      const hours = Math.floor(timeUntilNextClaim / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilNextClaim % (1000 * 60 * 60)) / (1000 * 60));
      timeString = `${hours}時間 ${minutes}分`;
    }

    // ユーザーのロール情報を取得
    const member = await interaction.guild.members.fetch(userId);
    const roles = member.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => role.name)
      .join(', ') || 'なし';

    // アカウント作成日とサーバー参加日
    const createdAt = targetUser.createdAt.toDateString();
    const joinedAt = member.joinedAt ? member.joinedAt.toDateString() : '不明';

    // Embed メッセージで表示
    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}のプロフィール`)
      .setColor(0x00FF00)
      .setDescription(`ユーザー名：${targetUser.username}\n 現在の所持ポイント： ${userPoints} ポイント`)
      .setFooter({ text: 'PROFILE' })
      .setTimestamp()
      .addFields(
        { name: '次のポイント受取までの時間', value: timeString, inline: false },
        { name: 'これまでに獲得した総ポイント', value: `${totalPointsEarned} ポイント`, inline: false },
        { name: 'これまでに使用した総ポイント', value: `${totalPointsUsed} ポイント`, inline: false },
        { name: '送った総ポイント', value: `${totalPointsSent} ポイント`, inline: false},
        { name: '受け取った総ポイント', value: `${totalPointsReceived} ポイント`, inline: false },
        { name: 'ロール', value: roles, inline: false },
        { name: 'アカウント作成日', value: createdAt, inline: true },
        { name: 'サーバー参加日', value: joinedAt, inline: true },
        { name: 'バッジ/称号', value: badges, inline: false }
      );

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
