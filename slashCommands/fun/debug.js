const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'debugwinembed',
  description: 'デバッグ用にwinEmbedを表示',
  type: ApplicationCommandType.ChatInput,
        default_member_permissions: 'Administrator',
  options: [
    {
      name: 'points',
      type: ApplicationCommandOptionType.Integer,
      description: '獲得ポイント',
      required: true,
      minValue: 0,
    },
    {
      name: 'jackpot_number',
      type: ApplicationCommandOptionType.Integer,
      description: 'ジャックポットナンバー',
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const points = interaction.options.getInteger('points');
    const jackpotNumber = interaction.options.getInteger('jackpot_number');

    const winEmbed = new EmbedBuilder()
      .setTitle('🎉🎉 ジャックポット！ 🎉🎉')
      .setDescription(`✨おめでとうございます！✨\nジャックポットナンバーは **${jackpotNumber}** でした。\n**${points} ポイント**を獲得しました！`)
      .setColor(0xFFD700)
      .addFields(
        { name: '獲得ポイント', value: `${points} ポイント`, inline: true },
        { name: '次のジャックポットに挑戦！', value: '💰 次はあなたが勝者かも！' }
      )
      .setFooter({ text: 'private project' })
      .setTimestamp();

    await interaction.reply({ embeds: [winEmbed] });
  },
};
