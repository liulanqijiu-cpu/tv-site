/**
 * 快速格式化链接 — 粘贴链接，输出 data.js 格式
 * 用法: npm run format-links
 * 粘贴一行或多行，Ctrl+D 结束，直接输出 JSON
 *
 * 每行格式: 剧名 | 画质 | 集数 | [百度链接] | [提取码] | [夸克链接]
 * 也可以用简化的交互模式
 */

const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const today = new Date().toLocaleDateString('zh-CN').replace(/\//g, '/');

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

function genId() {
  return 'mp' + Date.now().toString(36);
}

async function main() {
  const shows = [];
  console.log('═══════════════════════════════════════════');
  console.log('  链接格式化工具 — Ctrl+C 退出');
  console.log('  每个链接填完会自动输出 JSON');
  console.log('═══════════════════════════════════════════\n');

  while (true) {
    const title = await ask('剧名: ');
    if (!title.trim()) break;

    const quality = (await ask('画质 (HD4K): ') || 'HD4K');
    const episode = await ask('集数: ');
    const bdLink = await ask('百度链接 (空=跳过): ');
    let bdCode = '';
    if (bdLink.trim()) {
      bdCode = (await ask('  提取码: ') || '8888');
    }
    const kkLink = await ask('夸克链接 (空=跳过): ');

    const entry = {
      id: genId() + shows.length,
      title: title.trim(),
      quality: quality.trim() || 'HD4K',
      episode: episode.trim(),
      bdLink: bdLink.trim(),
      bdCode: bdCode.trim() || '8888',
      kkLink: kkLink.trim(),
      isNew: true,
      isPinned: false,
      isCompleted: false,
      updatedDate: today,
    };

    console.log('\n───────────────────────────────────────────');
    console.log(JSON.stringify(entry, null, 2) + ',');
    console.log('───────────────────────────────────────────\n');

    shows.push(entry);
  }

  if (shows.length > 0) {
    console.log(`\n共 ${shows.length} 条，上面每条分别粘贴到 data.js 即可`);
  }
  rl.close();
}

main().catch(() => rl.close());
