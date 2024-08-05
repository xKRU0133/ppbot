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

// ランダムな3桁の番号を生成する関数
function generateBadgeId(data) {
  let badgeId;
  do {
    badgeId = Math.floor(Math.random() * 900) + 100; // 100から999までのランダムな数値
  } while (Object.values(data).some(user => user.badges && user.badges.some(badge => badge.id === badgeId)));

  return badgeId;
}

module.exports = {
  name: 'badge',
  description: '指定したユーザーにバッジや称号を付与します。',
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: 'Administrator',
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'バッジを付与するユーザー',
      required: true,
    },
    {
      name: 'badge',
      type: ApplicationCommandOptionType.String,
      description: '付与するバッジや称号の名前',
      required: true,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const targetUser = interaction.options.getUser('user');
    const badgeName = interaction.options.getString('badge');
    let data = loadData();
    const userId = targetUser.id;

    // ユーザーデータが存在しない場合の初期設定
    if (!data[userId]) {
      data[userId] = { points: 0, totalPointsEarned: 0, totalPointsUsed: 0, badges: [], lastClaimed: 0 };
    } else {
      // badgesが未定義の場合に初期化
      if (!data[userId].badges) {
        data[userId].badges = [];
      }
    }

    // 被らないランダムな3桁のバッジIDを生成
    const badgeId = generateBadgeId(data);
    const badge = { id: badgeId, name: badgeName };

    // バッジの付与
    data[userId].badges.push(badge);
    saveData(data);

    // バッジ付与の確認メッセージ
    const embed = new EmbedBuilder()
      .setTitle('バッジ付与')
      .setColor(0x00FF00)
      .setDescription(`${targetUser.username} に「${badgeName}」バッジ（ID: ${badgeId}）が付与されました。`);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
