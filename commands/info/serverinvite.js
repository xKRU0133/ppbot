const { MessageEmbed, MessageActionRow, MessageButton, MessageButtonStyle } = require('discord.js');

module.exports = {
	name: 'ServerInvite',
	description: "show server invite link",
	cooldown: 3000,
	userPerms: ['ADMINISTRATOR'], // 権限名を大文字で記述する必要があります
	botPerms: ['ADMINISTRATOR'], // 権限名を大文字で記述する必要があります
	run: async (client, message, args) => {
		const inviteUrl = `https://discord.gg/ppj`;
		const embed = new MessageEmbed()
			.setTitle('ServerInvite link')
			.setDescription(`Copy invite link and please share with your friends [Click here](${inviteUrl})`)
			.setColor('#FFD700')
			.setTimestamp()
			.setThumbnail(client.user.displayAvatarURL())
			.setFooter(client.user.tag); // 直接文字列を設定

		const actionRow = new MessageActionRow()
			.addComponents([
				new MessageButton()
					.setLabel('Invite')
					.setURL(inviteUrl)
					.setStyle(MessageButtonStyle.LINK) // MessageButtonStyle の列挙型を使用
			]);

		message.reply({ embeds: [embed], components: [actionRow] });
	}
};
