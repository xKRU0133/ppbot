const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
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
  name: 'coinflip',
  description: 'Flip a coin and predict heads or tails!',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'guess',
      type: ApplicationCommandOptionType.String,
      description: 'Your guess: 表 (heads) or 裏 (tails)',
      required: true,
      choices: [
        { name: '表', value: 'heads' },
        { name: '裏', value: 'tails' },
      ],
    },
    {
      name: 'bet',
      type: ApplicationCommandOptionType.Integer,
      description: '賭けるポイント数',
      required: true,
      minValue: 1, // 賭けるポイントの最小値
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const guess = interaction.options.getString('guess');
    const bet = interaction.options.getInteger('bet');

    // 賭けの金額が正の値であることを確認
    if (bet <= 0) {
      return interaction.reply({ content: '賭けるポイントは1以上でなければなりません。', ephemeral: true });
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    let data = loadData();
    const userId = interaction.user.id;

    if (!data[userId]) {
      data[userId] = { points: 0, totalPointsEarned: 0, totalPointsUsed: 0, lastClaimed: 0 }; // 初期設定
    }

    const userPoints = data[userId].points;

    if (bet > userPoints) {
      return interaction.reply({ content: '賭けるポイントが足りません。', ephemeral: true });
    }

    const isCorrect = guess === result;
    let pointsChange;

    if (isCorrect) {
      pointsChange = bet;
      data[userId].points += pointsChange;
      data[userId].totalPointsEarned += pointsChange; // 獲得ポイントを追加
    } else {
      pointsChange = -bet;
      data[userId].points += pointsChange; // 負の値を加算してポイントを減らす
      data[userId].totalPointsUsed += bet; // 使用ポイントを追加
    }

    saveData(data);

    // 結果の表示をEmbedで行う
    const embed = new EmbedBuilder()
      .setTitle('コインフリップ結果')
      .setColor(isCorrect ? 0x00FF00 : 0xFF0000)
      .setDescription(`予想: ${guess === 'heads' ? '表' : '裏'}\n結果: ${result === 'heads' ? '表' : '裏'}`)
      .addFields(
        { name: '結果', value: isCorrect ? `🎉 正解です！${bet} ポイント獲得！` : `😞 残念、不正解です。${bet} ポイント失いました。`, inline: false },
        { name: '現在のポイント', value: `${data[userId].points} ポイント`, inline: false }
      );

    await interaction.reply({ embeds: [embed] });
  },
};

