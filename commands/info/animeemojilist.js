const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'aemojilist',
  description: "サーバーのアニメーション絵文字一覧を表示",
  cooldown: 3000,
  userPerms: ['Administrator'],
	botPerms: ['Administrator'],
  run: async (client, message, args) => {
    try {
      const emojis = await message.guild.emojis.fetch();
      const animatedEmojis = emojis.filter(emoji => emoji.animated);

      // 一度に送信する絵文字の数の制限
      const emojisPerMessage = 20;

      // メッセージの文字数制限
      const maxMessageLength = 2000;

      // animatedEmojisを配列に変換
      const emojiArray = Array.from(animatedEmojis.values());
      
      let messageContent = '';

      for (let i = 0; i < emojiArray.length; i++) {
        if (i % emojisPerMessage === 0 && messageContent) {
          message.channel.send(messageContent);
          messageContent = '';
        }

        const emoji = emojiArray[i];
        const newMessage = `${messageContent} ${emoji}`;
        if (newMessage.length > maxMessageLength) {
          message.channel.send(messageContent);
          messageContent = `${emoji}`;
        } else {
          messageContent = newMessage;
        }
      }

      if (messageContent) {
        message.channel.send(messageContent);
      }
    } catch (error) {
      console.error('アニメーション絵文字の取得中にエラーが発生しました:', error);
      message.channel.send('アニメーション絵文字の取得に失敗しました。');
    }
  },
};
