const { ApplicationCommandType, ApplicationCommandOptionType, PermissionsBitField, EmbedBuilder } = require('discord.js');
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
  name: 'modifypoints',
  description: 'ポイント増減コマンド (Admin Only)',
  type: ApplicationCommandType.ChatInput,
  default_member_permissions: 'Administrator',
  options: [
    {
      name: 'user',
      type: ApplicationCommandOptionType.User,
      description: 'ポイントを操作するユーザー',
      required: true,
    },
    {
      name: 'points',
      type: ApplicationCommandOptionType.Integer,
      description: '変更するポイント数 (正の数で付与、負の数で減額)',
      required: true,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    // コマンドを実行したユーザーが管理者であることを確認
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'このコマンドを使用する権限がありません。', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('user');
    const pointsChange = interaction.options.getInteger('points');

    let data = loadData();
    const userId = targetUser.id;

    if (!data[userId]) {
      data[userId] = { points: 0 };
    }

    data[userId].points += pointsChange;
    if (data[userId].points < 0) {
      data[userId].points = 0; // ポイントがマイナスにならないようにする
    }
    saveData(data);

    const embed = new EmbedBuilder()
      .setTitle('ポイント変更')
      .setColor(pointsChange >= 0 ? 0x00FF00 : 0xFF0000)
      .setDescription(`${targetUser.username} のポイントが ${pointsChange >= 0 ? '増加' : '減少'} しました。`)
      .addFields(
        { name: '変更されたポイント', value: `${pointsChange} ポイント`, inline: false },
        { name: '合計ポイント', value: `${data[userId].points} ポイント`, inline: false }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
