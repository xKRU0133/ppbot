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
  name: 'givepoints',
  description: '自分のポイントを他のユーザーに分けます。',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'ポイントを送りたいユーザー',
      required: true,
    },
    {
      name: 'amount',
      type: ApplicationCommandOptionType.Integer,
      description: '送るポイント数',
      required: true,
      minValue: 1, // 送金するポイントの最小値
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const senderId = interaction.user.id;
    const recipient = interaction.options.getUser('user');
    const recipientId = recipient.id;
    const amount = interaction.options.getInteger('amount');

    if (amount <= 0) {
      return interaction.reply({ content: '送るポイント数は1以上でなければなりません。', ephemeral: true });
    }

    let data = loadData();

    // 送信者と受信者のデータが存在しない場合、初期化
    if (!data[senderId]) {
      data[senderId] = { points: 0, lastClaimed: 0, totalPointsSent: 0, totalPointsReceived: 0 };
    }
    if (!data[recipientId]) {
      data[recipientId] = { points: 0, lastClaimed: 0, totalPointsSent: 0, totalPointsReceived: 0 };
    }

    // 送信者のポイントが十分にあるか確認
    if (data[senderId].points < amount) {
      return interaction.reply({ content: 'ポイントが不足しています。', ephemeral: true });
    }

    // ポイントの移動
    data[senderId].points -= amount;
    data[recipientId].points += amount;
    data[senderId].totalPointsSent += amount;
    data[recipientId].totalPointsReceived += amount;
    saveData(data);

    // 確認メッセージを送信
    const embed = new EmbedBuilder()
      .setTitle('ポイント送金')
      .setColor(0x00FF00)
      .setDescription(`${interaction.user.username} さんが ${recipient.username} さんに ${amount} ポイントを送りました。`)
      .addFields(
        { name: `${interaction.user.username} の新しいポイント`, value: `${data[senderId].points} ポイント`, inline: false },
        { name: `${recipient.username} の新しいポイント`, value: `${data[recipientId].points} ポイント`, inline: false }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
