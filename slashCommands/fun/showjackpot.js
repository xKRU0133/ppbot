const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const jackpotFilePath = path.resolve(__dirname, 'jackpot.json');

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

module.exports = {
  name: 'showjackpot',
  description: '現在のジャックポットのポイントを表示',
  type: ApplicationCommandType.ChatInput,
  cooldown: 3000,
  run: async (client, interaction) => {
    const jackpotData = loadJackpotData();
    const totalJackpot = jackpotData.total;

    const jackpotEmbed = new EmbedBuilder()
      .setTitle('💰 ジャックポット 💰')
      .setDescription(`現在のジャックポットポイントは **${totalJackpot} ポイント** です！\n次に当てるのはあなたかもしれません！`)
      .setColor(0xFFD700)
      .setFooter({ text: 'jackpot info' })
      .setTimestamp();

    await interaction.reply({ embeds: [jackpotEmbed] });
  },
};
