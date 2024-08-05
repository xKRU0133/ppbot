const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');
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
  name: 'gp',
  description: 'Botから任意のユーザーにポイントをプレゼントします（管理者専用）。',
  type: ApplicationCommandType.ChatInput,
        default_member_permissions: 'Administrator',
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'ポイントをプレゼントするユーザー',
      required: true,
    },
    {
      name: 'amount',
      type: ApplicationCommandOptionType.Integer,
      description: 'プレゼントするポイント数',
      required: true,
      minValue: 1, // 最小ポイント数
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const giver = interaction.member;
    const recipient = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const botName = client.user.username; // Botの名前を取得

    // 管理者権限チェック
    if (!giver.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'このコマンドを使用する権限がありません。', ephemeral: true });
    }

    let data = loadData();
    const recipientId = recipient.id;

    // 受信者のデータが存在しない場合、初期化
    if (!data[recipientId]) {
      data[recipientId] = { points: 0, lastClaimed: 0 };
    }

    // ポイントの付与
    data[recipientId].points += amount;
    saveData(data);

    // 確認メッセージを送信
    const embed = new EmbedBuilder()
      .setTitle('🎁 ポイントプレゼント！！ 🎁')
      .setColor(0x00FF00)
      .setDescription(`${botName}から ${recipient.username} さんに ${amount} ポイントがプレゼントされました！`)
      .addFields(
        { name: `${recipient.username}さんの現在のポイントは`, value: `${data[recipientId].points} ポイントです！`, inline: false }
      );

    await interaction.reply({ embeds: [embed]});
  },
};
