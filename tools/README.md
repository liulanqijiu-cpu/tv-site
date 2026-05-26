# TV Site Tools

两个脚本帮助你处理网盘链接。

## 安装

```bash
cd tools
npm install
npx playwright install chromium
```

## 1. 自动转存链接 → save-links.js

浏览器自动打开，帮你点击"保存到网盘"。

```bash
npm run save-links
```

**使用步骤:**
1. 编辑 `save-links.js` 末尾的 `INPUT` 数组，粘贴要转存的链接
2. 运行 `npm run save-links`
3. 浏览器打开后，手动登录百度网盘 + 夸克网盘
4. 回到终端按回车，脚本自动逐个保存
5. 转存完成后，去网盘创建分享链接，替换到 data.js

## 2. 快速格式化 → format-links.js

交互式输入链接，自动输出 data.js JSON 格式。

```bash
npm run format-links
```
