/**
 * 完整流程：别人的链接 → 存到自己网盘 → 分享链接 → data.js 格式
 *
 * 用法:
 *   1. 编辑脚本末尾的 showInput() 函数，填入剧集信息
 *   2. 运行: node save-links.js
 *   3. 浏览器打开 → 扫码登录百度+夸克 → 回到终端按回车
 *   4. 脚本自动转存每个链接
 *   5. 转存完后打开网盘 → 手动创建分享链接 → Ctrl+C 复制
 *   6. 按回车，脚本读剪贴板输出 data.js JSON
 */

const { chromium } = require('playwright');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════
//  在这里填数据 ↓
// ═══════════════════════════════════════════
function showInput() {
  return [
    // 格式: { title, quality, ep, bdUrl?, bdPwd?, kkUrl?, isPinned? }
    // 删掉示例，粘贴你的:
  ];
}

// ═══════════════════════════════════════════

const today = new Date().toLocaleDateString('zh-CN').replace(/\//g, '/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  const lines = clip.split(/[\r\n]+/);
  for (const line of lines) {
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

// ──── STEP 1: 转存 ────

async function saveBaidu(page, url, pwd) {
  console.log(`  [百度] ${url.slice(0, 50)}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // 输入提取码
  const pwdEl = page.locator('#accessCode, input[name="pwd"], input[placeholder*="提取码"]');
  if (await pwdEl.count() > 0 && pwd) {
    await pwdEl.first().fill(pwd);
    await sleep(500);
    const submit = page.locator('a.submit, button:has-text("提取文件"), .pickpw-btn');
    if (await submit.count() > 0) { await submit.first().click(); await sleep(2500); }
  }

  // 点击保存
  const saveBtn = page.locator(
    'a:has-text("保存到网盘"), span:has-text("保存到网盘"), button:has-text("保存到"), div:has-text("保存到网盘")'
  ).first();
  try {
    await saveBtn.click({ timeout: 5000 });
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

  const saveBtn = page.locator(
    'span:has-text("保存到网盘"), button:has-text("保存到网盘"), div:has-text("保存到网盘"), a:has-text("保存到网盘")'
  ).first();
  try {
    await saveBtn.click({ timeout: 5000 });
    console.log('  [夸克] ✓ 已保存');
    await sleep(1500);
    return true;
  } catch {
    console.log('  [夸克] ✗ 没找到保存按钮');
    return false;
  }
}

// ──── 工具 ────

function waitForEnter(msg) {
  if (msg) process.stdout.write(msg);
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.once('data', () => { process.stdin.pause(); resolve(); });
  });
}

// ═══════════════════════════════════════════

async function main() {
  const INPUT = showInput();
  if (INPUT.length === 0 || !INPUT[0].title) {
    console.log('❌ 请先在 showInput() 函数里填写剧集数据！');
    return;
  }

  console.log(`\n📋 ${INPUT.length} 个剧集\n`);

  const browser = await chromium.launchPersistentContext('./browser-data', {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1280, height: 800 },
  });
  const page = await browser.newPage();

  // ════ STEP 1: 转存 ════
  console.log('═══════════════════════════════════════════');
  console.log('  STEP 1/2 — 自动转存');
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

  // ════ STEP 2: 分享 ════
  console.log('\n═══════════════════════════════════════════');
  console.log('  STEP 2/2 — 从网盘创建分享链接');
  console.log('═══════════════════════════════════════════');

  const bdResult = [], kkResult = [];
  const hasBd = results.some(r => r._bdOk);
  const hasKk = results.some(r => r._kkOk);

  if (hasBd) {
    console.log('\n  >>> 百度网盘 <<<');
    console.log('  ① 浏览器中打开 https://pan.baidu.com/disk/home');
    console.log('  ② 对刚保存的文件 右键→分享→创建链接');
    console.log('  ③ 复制链接 (Ctrl+C)');
    await page.goto('https://pan.baidu.com/disk/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 重置剪贴板基准
    lastClip = readClipboard();
    await waitForEnter('  ④ 复制好了按回车...\n');
    bdResult.push(...getNewLinks().filter(l => l.includes('pan.baidu.com')));
  }

  if (hasKk) {
    console.log('\n  >>> 夸克网盘 <<<');
    console.log('  ① 对刚保存的文件 右键→分享→复制链接 (Ctrl+C)');
    await page.goto('https://pan.quark.cn/disk/main', { waitUntil: 'domcontentloaded', timeout: 30000 });
    lastClip = readClipboard();
    await waitForEnter('  ② 复制好了按回车...\n');
    kkResult.push(...getNewLinks().filter(l => l.includes('pan.quark.cn')));
  }

  // ════ OUTPUT ════
  console.log('\n═══════════════════════════════════════════');
  console.log('  ↓ 复制到 data.js ↓');
  console.log('═══════════════════════════════════════════\n');

  let bi = 0, ki = 0;
  results.forEach((s, i) => {
    console.log(JSON.stringify({
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
    }, null, 2) + ',');
    if (bdResult[bi]) bi++;
    if (kkResult[ki]) ki++;
  });

  console.log('\n─────────────── 复制结束 ───────────────');
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
