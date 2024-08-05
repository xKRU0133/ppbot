const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const stockFilePath = path.resolve(__dirname, 'stock.json');

// 在庫データの読み込み関数
function loadStockData() {
  if (!fs.existsSync(stockFilePath)) {
    return {};
  }

  const data = fs.readFileSync(stockFilePath, 'utf8');
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON stock data:', error);
    return {};
  }
}

module.exports = {
  name: 'checkstock',
  description: 'アイテムやロールの在庫数を確認',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'item',
      type: ApplicationCommandOptionType.String,
      description: '在庫数を確認するロールまたはアイテム（省略すると全アイテムの在庫を表示）',
      required: false,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const itemId = interaction.options.getString('item');
    const stockData = loadStockData();
    
    let stockTable = '';
    
    if (itemId) {
      const stock = stockData[itemId];
      if (stock === undefined) {
        return interaction.reply({ content: '指定されたアイテムは存在しません。', ephemeral: true });
      }
      const stockMessage = stock === -1 ? '-1' : `${stock} 個`;
      stockTable = `アイテム/ロール: **${itemId}**\n在庫数: **${stockMessage}**`;
    } else {
      stockTable = '**アイテム/ロール** | **在庫数**\n';
      stockTable += '-----------------|----------\n';
      for (const [key, stock] of Object.entries(stockData)) {
        const stockMessage = stock === -1 ? '-1' : `${stock} 個`;
        stockTable += `${key} | ${stockMessage}\n`;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('在庫確認')
      .setDescription(stockTable)
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed] });
  },
};
