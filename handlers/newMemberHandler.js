const { PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs');

const dataFilePath = path.resolve(__dirname, '../slashCommands/fun/data.json');

// ユーザーデータの読み込み関数
function loadData() {
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
    console.error('Error parsing JSON data:', error);
    return {};
  }
}

// ユーザーデータの保存関数
function saveData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

module.exports = (client) => {
  client.on('guildMemberAdd', async member => {
    const welcomeRoleId = '1052493784321110087'; // 付与するロールのID
    let data = loadData();
    const userId = member.user.id;

    // 新規メンバーのデータが存在しない場合、初期化
    if (!data[userId]) {
      data[userId] = { points: 0 };
    }

    // ポイントを追加
    data[userId].points += 1;

    try {
      // ロールの付与
      const welcomeRole = member.guild.roles.cache.get(welcomeRoleId);
      if (welcomeRole) {
        await member.roles.add(welcomeRole);
        console.log(`ロール「${welcomeRole.name}」が ${member.user.tag} に付与されました。`);
      } else {
        console.error('指定されたロールが見つかりません。');
      }

      saveData(data);
    } catch (error) {
      console.error('Error assigning role or points:', error);
    }
  });
};
