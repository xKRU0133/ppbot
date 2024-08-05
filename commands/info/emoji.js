const { MessageEmbed } = require('discord.js');


module.exports = {
	name: 'emojicount',
	description: "Check server emojis",
	cooldown: 3000,
	userPerms: ['Administrator'],
	botPerms: ['Administrator'],
	run: async (client, message, args) => {
    const guildId = message.guild.id;
    const emojis = await message.guild.emojis.fetch();

    const staticEmojis = emojis.filter((emoji) => !emoji.animated);
    const animatedEmojis = emojis.filter((emoji) => emoji.animated);

    const output = `このサーバーには ${staticEmojis.size} 個の静止画絵文字が登録されています。`;
    const output1 = `このサーバーには ${animatedEmojis.size} 個のアニメーション絵文字が登録されています。`;
    const output2 = `合計：${emojis.size} 個の絵文字が利用可能です。`;
    message.channel.send('```\n' + output + '\n```');
    message.channel.send('```\n' + output1 + '\n```');
    message.channel.send('```\n' + output2 + '\n```');
	}
};