const { ApplicationCommandType, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'emoji',
  description: 'Send random emojis',
  type: ApplicationCommandType.ChatInput,
  cooldown: 300000,
  options: [
    {
      name: 'count',
      type: 4, // INTEGER type
      description: 'Number of random emojis to send (MAX:20)',
      required: false,
    },
    {
      name: 'max',
      type: 4, // INTEGER type
      description: 'Maximum number of random emojis to send (Admin only)',
      required: false,
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const guild = interaction.guild; // コマンドが実行されたサーバーを取得
    const emojis = guild.emojis.cache; // サーバーの絵文字キャッシュを取得

    if (emojis.size === 0) {
      await interaction.reply({ content: 'このサーバーには絵文字がありません。', ephemeral: true });
      return;
    }

    const count = interaction.options.getInteger('count') || 1; // デフォルトは1つ
    let maxCount = 20; // デフォルトの上限値を設定

    const maxOption = interaction.options.getInteger('max');
    if (maxOption) {
      if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        maxCount = maxOption; // 管理者が設定した場合はmaxオプションを反映
      } else {
        await interaction.reply({ content: 'このオプションを設定する権限がありません。', ephemeral: true });
        return;
      }
    }

    if (count > maxCount) {
      await interaction.reply({ content: `一度に送信できる絵文字の最大数は ${maxCount} です。`, ephemeral: true });
      return;
    }

    const randomEmojis = [];

    // ランダム絵文字の選択
    const availableEmojis = [...emojis.values()];
    for (let i = 0; i < count && availableEmojis.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableEmojis.length);
      randomEmojis.push(availableEmojis[randomIndex]);
      availableEmojis.splice(randomIndex, 1); // 選ばれた絵文字を除外
    }

    const chunkSize = 20; // 1回のメッセージで送信する絵文字の数の上限
    const firstChunk = randomEmojis.slice(0, chunkSize);

    await interaction.reply({ content: firstChunk.join(' ') });

    for (let i = chunkSize; i < randomEmojis.length; i += chunkSize) {
      const chunk = randomEmojis.slice(i, i + chunkSize);
      await interaction.followUp({ content: chunk.join(' ') });
    }
  },
};
