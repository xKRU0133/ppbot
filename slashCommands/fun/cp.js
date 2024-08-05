const { ApplicationCommandType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, 'data.json');
const minPoints = 10; // 最小ポイント
const maxPoints = 30; // 最大ポイント
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
  name: 'claimpoints',
  description: 'プレゼントとして一時間に一度10～30ポイントを受け取ります。',
  type: ApplicationCommandType.ChatInput,
  run: async (client, interaction) => {
    let data = loadData();
    const userId = interaction.user.id;

    if (!data[userId]) {
      data[userId] = { points: 0, totalPointsEarned: 0, totalPointsUsed: 0, lastClaimed: 0 }; // 初期設定
    }

    const now = Date.now();
    const lastClaimed = data[userId].lastClaimed;

    if (now - lastClaimed < cooldownTime) {
      const remainingTime = new Date(lastClaimed + cooldownTime - now);
      return interaction.reply({
        content: `まだポイントを受け取ることはできません。次に受け取れるまでの残り時間: ${remainingTime.getUTCHours()}時間 ${remainingTime.getUTCMinutes()}分`,
        ephemeral: true
      });
    }

    const randomPoints = Math.floor(Math.random() * (maxPoints - minPoints + 1)) + minPoints;
    data[userId].points += randomPoints;
    data[userId].totalPointsEarned += randomPoints;
    data[userId].lastClaimed = now;
    saveData(data);

    await interaction.reply({
      content: `プレゼントとして ${randomPoints} ポイントが付与されました。現在のポイント: ${data[userId].points}`,
      ephemeral: true
    });
  },
};
