module.exports = {
  name: 'DM',
  description: 'Send dm',
  cooldown: 3000,
  userPerms: [],
  botPerms: [],
  run: async (client, message, args) => {
    if (message.author.bot) return; // ボットからのメッセージは無視
    
    const user = message.mentions.users.first(); // メンションしたユーザーを取得

    if (!user) {
      return message.reply('ユーザーをメンションしてください。');
    }

    const content = args.slice(1).join(' '); // メッセージの内容を取得

    user.send(content)
      .then(() => message.reply(`ユーザーにDMを送信しました: ${content}`))
      .catch((error) => message.reply(`DMの送信に失敗しました: ${error}`));
  },
};

