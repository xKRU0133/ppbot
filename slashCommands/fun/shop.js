const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// JSONファイルからshopItemsを読み込む
const shopItemsFilePath = path.resolve(__dirname, 'shopItems.json');
const shopItems = JSON.parse(fs.readFileSync(shopItemsFilePath, 'utf8'));

const dataFilePath = path.resolve(__dirname, 'data.json');
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

// 在庫データの保存関数
function saveStockData(stockData) {
  try {
    fs.writeFileSync(stockFilePath, JSON.stringify(stockData, null, 2), 'utf8');
    console.log('Stock data saved successfully');
  } catch (error) {
    console.error('Error saving stock data:', error);
  }
}

// ユーザーデータの読み込み関数
function loadUserData() {
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
    console.error('Error parsing JSON user data:', error);
    return {};
  }
}

// ユーザーデータの保存関数
function saveUserData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

// ランダムな3桁の番号を生成する関数
function generateBadgeId(data) {
  let badgeId;
  do {
    badgeId = Math.floor(Math.random() * 900) + 100; // 100から999までのランダムな数値
  } while (Object.values(data).some(user => user.badges && user.badges.some(badge => badge.id === badgeId)));

  return badgeId;
}

module.exports = {
  name: 'shop',
  description: 'ポイントでロール、アイテム、バッジを購入',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'item',
      type: ApplicationCommandOptionType.String,
      description: '購入するロール、アイテム、またはバッジ',
      required: true,
      choices: Object.entries(shopItems).map(([key, { displayName, price, type }]) => ({
        name: `${displayName} - ${price}ポイント (${type === 'role' ? 'ロール' : type === 'item' ? 'アイテム' : 'バッジ'})`,
        value: key,
      })),
    },
  ],
  cooldown: 3000,
  run: async (client, interaction) => {
    const itemId = interaction.options.getString('item');
    const itemInfo = shopItems[itemId];
    const stockData = loadStockData();

    if (!itemInfo) {
      return interaction.reply({ content: '無効なアイテムです。', ephemeral: true });
    }

    const stock = stockData[itemId];
    if (stock !== undefined && stock !== -1 && stock <= 0) {
      return interaction.reply({ content: `在庫が不足しています。現在の在庫: ${stock}`, ephemeral: true });
    }

    let userData = loadUserData();
    const userId = interaction.user.id;

    if (!userData[userId]) {
      userData[userId] = { points: 0, badges: [] };
    } else if (!userData[userId].badges) {
      userData[userId].badges = [];
    }

    const userPoints = userData[userId].points;
    const totalCost = itemInfo.price;

    if (userPoints < totalCost) {
      return interaction.reply({ content: `ポイントが足りません。必要なポイント: ${totalCost}、現在のポイント: ${userPoints}`, ephemeral: true });
    }

    try {
      if (itemInfo.type === 'role') {
        // ユーザーが既にロールを持っているか確認
        const member = await interaction.guild.members.fetch(userId);
        if (member.roles.cache.has(itemInfo.id)) {
          return interaction.reply({ content: '既にこのロールを所有しています。', ephemeral: true });
        }

        // ロールを付与
        const role = interaction.guild.roles.cache.get(itemInfo.id);
        if (!role) {
          return interaction.reply({ content: '指定されたロールは存在しません。', ephemeral: true });
        }

        await member.roles.add(role);
      } else if (itemInfo.type === 'item') {
        // アイテム購入時に特別なチャンネルを作成
        const guild = interaction.guild;
        const itemChannel = await guild.channels.create({
          name: `${interaction.user.username}-${itemInfo.name}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id, // Default permissions (deny everyone)
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: userId, // Allow the purchaser
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            {
              id: client.user.id, // Allow the bot
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            {
              id: guild.roles.everyone.id, // Deny @everyone
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: guild.roles.cache.find(role => role.permissions.has(PermissionsBitField.Flags.Administrator)).id, // Allow administrators
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
          ],
        });

        // Embed メッセージと削除ボタンの作成
        const embed = new EmbedBuilder()
          .setTitle('アイテム購入')
          .setDescription(`おめでとうございます！${interaction.user.username} が ${totalCost} ポイントで **${itemInfo.name}** を購入しました。`)
          .setColor(0x00FF00);

        const deleteButton = new ButtonBuilder()
          .setCustomId('delete_channel')
          .setLabel('チャンネルを削除')
          .setStyle(ButtonStyle.Danger);

        const components = [new ActionRowBuilder().addComponents(deleteButton)];

        // チャンネルにメッセージを送信
        const message = await itemChannel.send({ embeds: [embed], components });

        // ボタンのインタラクションを待機
        const filter = i => i.customId === 'delete_channel' && i.user.id === userId;
        const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
          if (i.customId === 'delete_channel') {
            await itemChannel.delete();
            await i.reply({ content: 'チャンネルが削除されました。', ephemeral: true });
          }
        });

        collector.on('end', async collected => {
          if (collected.size === 0) {
            await message.edit({ components: [new ActionRowBuilder().addComponents(deleteButton)] });
          }
        });
      } else if (itemInfo.type === 'badge') {
        // ユーザーが既にバッジを持っているか確認
        if (userData[userId].badges.some(badge => badge.name === itemInfo.name)) {
          return interaction.reply({ content: '既にこのバッジを所有しています。', ephemeral: true });
        }

        // バッジを付与
        const badgeId = generateBadgeId(userData);
        const badge = { id: badgeId, name: itemInfo.name };
        userData[userId].badges.push(badge);
      }

      // ポイントの減算と在庫の減少
      userData[userId].points -= totalCost;
      if (stock !== undefined && stock !== -1) {
        stockData[itemId] -= 1; // 在庫を減らす
      }
      saveUserData(userData); // ユーザーデータの保存
      saveStockData(stockData); // 在庫データの保存

      await interaction.reply({ content: `おめでとうございます！ ${itemInfo.displayName} を1つ、合計 ${totalCost} ポイントで購入しました。`, ephemeral: true });
    } catch (error) {
      console.error('Error processing purchase:', error);
      interaction.reply({ content: '購入処理中にエラーが発生しました。', ephemeral: true });
    }
  },
};
