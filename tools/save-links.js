/**
 * 用法：
 *   1. 把链接粘贴到 links.txt（一行一个剧）
 *   2. 双击 一键处理.bat
 *   3. 浏览器打开 → 登录网盘 → 按回车
 *   4. 脚本自动转存 → 打开网盘 → 你创建分享链接 Ctrl+C
 *   5. 按回车 → 输出 data.js JSON → 同时写入 output.txt
 */

const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const today = new Date().toLocaleDateString('zh-CN').replace(/\//g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ──── 解析 links.txt ────

function loadInput() {
  const txt = fs.readFileSync(path.join(__dirname, 'links.txt'), 'utf-8');
  const shows = [];
  for (const line of txt.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('↓') || trimmed.startsWith('格式:')) continue;
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts.length < 2 || !parts[0]) continue;

    shows.push({
      title: parts[0],
      quality: parts[1] || 'HD4K',
      ep: parts[2] || '',
      bdUrl: parts[3] || '',
      bdPwd: parts[4] || '8888',
      kkUrl: parts[5] || '',
    });
  }
  return shows;
}

// ──── 剪贴板 ────

function readClipboard() {
  try {
    return execSync('powershell -command "Get-Clipboard"', {
      encoding: 'utf-8', timeout: 3000, windowsHide: true,
    }).trim();
  } catch { return ''; }
}

let lastClip = '';

function getNewLinks() {
  const clip = readClipboard();
  if (!clip || clip === lastClip) return [];
  lastClip = clip;
  const links = [];
  for (const line of clip.split(/[\r\n]+/)) {
    const t = line.trim();
    if ((t.includes('pan.baidu.com/s/') || t.includes('pan.quark.cn/s/')) && !links.includes(t)) {
      links.push(t);
    }
  }
  if (links.length === 0 && (clip.includes('pan.baidu.com/s/') || clip.includes('pan.quark.cn/s/'))) {
    links.push(clip);
  }
  return links;
}

// ──── STEP 1 ────

async function saveBaidu(page, url, pwd) {
  console.log(`  [百度] ${url.slice(0, 50)}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  const pwdEl = page.locator('#accessCode, input[name="pwd"], input[placeholder*="提取码"]');
  if (await pwdEl.count() > 0 && pwd) {
    await pwdEl.first().fill(pwd);
    await sleep(500);
    const submit = page.locator('a.submit, button:has-text("提取文件"), .pickpw-btn');
    if (await submit.count() > 0) { await submit.first().click(); await sleep(2500); }
  }

  try {
    await page.locator(
      'a:has-text("保存到网盘"), span:has-text("保存到网盘"), button:has-text("保存到"), div:has-text("保存到网盘")'
    ).first().click({ timeout: 5000 });
    console.log('  [百度] ✓ 已保存');
    await sleep(1500);
    return true;
  } catch {
    console.log('  [百度] ✗ 没找到保存按钮');
    return false;
  }
}

async function saveQuark(page, url) {
  console.log(`  [夸克] ${url.slice(0, 50)}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  try {
    await page.locator(
      'span:has-text("保存到网盘"), button:has-text("保存到网盘"), div:has-text("保存到网盘"), a:has-text("保存到网盘")'
    ).first().click({ timeout: 5000 });
    console.log('  [夸克] ✓ 已保存');
    await sleep(1500);
    return true;
  } catch {
    console.log('  [夸克] ✗ 没找到保存按钮');
    return false;
  }
}

function waitForEnter(msg) {
  if (msg) process.stdout.write(msg);
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.once('data', () => { process.stdin.pause(); resolve(); });
  });
}

// ═══════════════════════════════════════════

async function main() {
  const INPUT = loadInput();
  if (INPUT.length === 0) {
    console.log('❌ links.txt 是空的，请先粘贴链接！');
    console.log('   格式: 剧名 | 画质 | 集数 | 百度链接 | 提取码 | 夸克链接');
    await waitForEnter('\n   按回车退出...');
    return;
  }

  console.log(`\n📋 从 links.txt 读取到 ${INPUT.length} 个剧集\n`);
  INPUT.forEach((s, i) => console.log(`  ${i + 1}. ${s.title}  ${s.ep}集`));

  const browser = await chromium.launchPersistentContext(path.join(__dirname, 'browser-data'), {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1280, height: 800 },
  });

  try {

  // ════ STEP 1 ════
  console.log('\n═══════════════════════════════════════════');
  console.log('  STEP 1/2 — 自动转存到你的网盘');
  console.log('═══════════════════════════════════════════');

  await waitForEnter('  👆 浏览器已打开，登录百度+夸克后按回车...\n');

  const results = [];
  let bdOk = 0, bdFail = 0, kkOk = 0, kkFail = 0;

  for (let i = 0; i < INPUT.length; i++) {
    const s = INPUT[i];
    console.log(`\n[${i + 1}/${INPUT.length}] ${s.title}`);

    let bd = false, kk = false;
    if (s.bdUrl) { bd = await saveBaidu(page, s.bdUrl, s.bdPwd || ''); bd ? bdOk++ : bdFail++; }
    if (s.kkUrl) { kk = await saveQuark(page, s.kkUrl); kk ? kkOk++ : kkFail++; }

    results.push({ ...s, _bdOk: bd, _kkOk: kk });
  }

  console.log(`\n  转存完成: 百度 ${bdOk}✓ ${bdFail}✗  |  夸克 ${kkOk}✓ ${kkFail}✗`);

  // ════ STEP 2 ════
  console.log('\n═══════════════════════════════════════════');
  console.log('  STEP 2/2 — 从网盘创建分享链接');
  console.log('═══════════════════════════════════════════');

  const bdResult = [], kkResult = [];
  const hasBd = results.some(r => r._bdOk);
  const hasKk = results.some(r => r._kkOk);

  if (hasBd) {
    console.log('\n  >>> 百度网盘 <<<');
    console.log('  右键文件 → 分享 → 创建链接 → Ctrl+C');
    await page.goto('https://pan.baidu.com/disk/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
    lastClip = readClipboard();
    await waitForEnter('  复制好了按回车...\n');
    bdResult.push(...getNewLinks().filter(l => l.includes('pan.baidu.com')));
  }

  if (hasKk) {
    console.log('\n  >>> 夸克网盘 <<<');
    console.log('  右键文件 → 分享 → Ctrl+C');
    await page.goto('https://pan.quark.cn/disk/main', { waitUntil: 'domcontentloaded', timeout: 30000 });
    lastClip = readClipboard();
    await waitForEnter('  复制好了按回车...\n');
    kkResult.push(...getNewLinks().filter(l => l.includes('pan.quark.cn')));
  }

  // ════ OUTPUT ════
  const output = [];
  output.push('');
  let bi = 0, ki = 0;
  results.forEach((s, i) => {
    const entry = JSON.stringify({
      id: 'mp' + Date.now().toString(36) + i,
      title: s.title,
      quality: s.quality || 'HD4K',
      episode: s.ep || '',
      bdLink: bdResult[bi] || s.bdUrl || '',
      bdCode: s.bdPwd || '8888',
      kkLink: kkResult[ki] || s.kkUrl || '',
      isNew: true,
      isPinned: s.isPinned || false,
      isCompleted: s.isCompleted || false,
      updatedDate: today,
    }, null, 2) + ',';
    output.push(entry);
    console.log(entry);
    if (bdResult[bi]) bi++;
    if (kkResult[ki]) ki++;
  });

  fs.writeFileSync(path.join(__dirname, 'output.txt'), output.join('\n'), 'utf-8');

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ 完成！JSON 已写入 output.txt');
  console.log('  复制 output.txt 内容粘贴到 data.js');
  console.log('═══════════════════════════════════════════');

  } finally {
    await browser.close();
  }
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error('\n❌ 出错:', e.message);
  }
  await waitForEnter('\n按回车退出...');
})();
