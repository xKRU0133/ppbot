const { Client, Intents, MessageEmbed, CommandInteraction } = require('discord.js');


module.exports = {
  name: 'user',
  description: "test",
  cooldown: 3000,
  userPerms: [],
  botPerms: [],
  run: async (client, message, args) => {
    try {
        const selectCount = parseInt(args[0]);
        if (isNaN(selectCount) || selectCount <= 0) {
          return message.reply('選択数は正の整数で指定してください。');
        }

        const nonNitroUsers = message.guild.members.cache.filter(member => !member.user.bot && !member.premiumSince);

        if (nonNitroUsers.size < selectCount) {
          return message.reply('選択数がサーバー内の非ニトロユーザー数を超えています。');
        }

        const selectedUsers = nonNitroUsers.random(selectCount);

        const embed = new MessageEmbed() 
          .setTitle('選択された非ニトロユーザー:')
          .setDescription(selectedUsers.map(user => user.user.tag).join('\n'))
          .setColor('#00ff00');

        await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error(error);
    }
  },
};
