const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.resolve(__dirname, 'data.json');
const jackpotFilePath = path.resolve(__dirname, 'jackpot.json');

// ユーザーデータの読み込み関数
function loadUserData() {
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
    console.error('Error parsing JSON user data:', error);
    return {};
  }
}

// ユーザーデータの保存関数
function saveUserData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// ジャックポットデータの読み込み関数
function loadJackpotData() {
  if (!fs.existsSync(jackpotFilePath)) {
    return { total: 0 };
  }

  const data = fs.readFileSync(jackpotFilePath, 'utf8');
  if (!data) {
    return { total: 0 };
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON jackpot data:', error);
    return { total: 0 };
  }
}

// ジャックポットデータの保存関数
function saveJackpotData(data) {
  try {
    fs.writeFileSync(jackpotFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Jackpot data saved successfully');
  } catch (error) {
    console.error('Error saving jackpot data:', error);
  }
}

module.exports = {
  name: 'jackpot',
  description: 'ジャックポットナンバーを当ててポイントを獲得しよう！',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'number',
      type: ApplicationCommandOptionType.Integer,
      description: '予想する1から100の数字',
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const chosenNumber = interaction.options.getInteger('number');
    const betAmount = 10; // 固定の掛け金

    // 予想数字の範囲チェック
    if (chosenNumber <= 0 || chosenNumber > 100) {
      return interaction.reply({ content: '予想数字は1から100の範囲である必要があります。', ephemeral: true });
    }

    const jackpotNumber = Math.floor(Math.random() * 100) + 1;

    let userData = loadUserData();
    const userId = interaction.user.id;

    if (!userData[userId]) {
      userData[userId] = { points: 0, totalPointsEarned: 0, totalPointsUsed: 0 }; // 初期化
    } else {
      // null チェックと初期化
      userData[userId].totalPointsEarned = userData[userId].totalPointsEarned || 0;
      userData[userId].totalPointsUsed = userData[userId].totalPointsUsed || 0;
    }

    if (userData[userId].points < betAmount) {
      return interaction.reply({ content: 'ポイントが不足しています。', ephemeral: true });
    }

    let jackpotData = loadJackpotData();

    if (chosenNumber === jackpotNumber) {
      const winAmount = jackpotData.total + betAmount;
      userData[userId].points += winAmount;
      userData[userId].totalPointsEarned += winAmount;
      jackpotData.total = 0;

      const winEmbed = new EmbedBuilder()
        .setTitle('🎉🎉 ジャックポット！ 🎉🎉')
        .setDescription(`✨おめでとうございます！✨\nジャックポットナンバーは **${jackpotNumber}** でした。\n**${winAmount} ポイント**を獲得しました！`)
        .setColor(0xFFD700)
        .addFields(
          { name: '獲得ポイント', value: `${winAmount} ポイント`, inline: true },
          { name: '次のジャックポットに挑戦！', value: '💰 次はあなたが勝者かも！' }
        )
        .setFooter({ text: 'private project' })
        .setTimestamp();

      saveUserData(userData);
      saveJackpotData(jackpotData);

      return interaction.reply({ embeds: [winEmbed] });
    } else {
      userData[userId].points -= betAmount;
      userData[userId].totalPointsUsed += betAmount;
      jackpotData.total += betAmount;

      const loseEmbed = new EmbedBuilder()
        .setTitle('😢 残念！')
        .setDescription(`ジャックポットナンバーは **${jackpotNumber}** でした。\n**${betAmount} ポイント**がジャックポットに追加されました。`)
        .setColor(0xFF0000)
        .addFields(
          { name: '現在のあなたのポイント', value: `${userData[userId].points} ポイント`, inline: false },
          { name: '現在のジャックポット', value: `${jackpotData.total} ポイント`, inline: false }
        );

      saveUserData(userData);
      saveJackpotData(jackpotData);

      return interaction.reply({ embeds: [loseEmbed] });
    }
  },
};
