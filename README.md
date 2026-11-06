# HNT / HazeNoTea · 项目索引

HazeNoTea 的个人作品索引，收录手环 RPG、小游戏与纯前端工具。

无框架、无第三方依赖、无构建步骤。

## 灰烬誓约 / Ashen Oath

- 作品页：`post/ashen-oath.html`
- 独立激活教程：`post/ashen-oath-activation.html`
- 激活入口：`pages/activate/activate.html?game=com.hazenotea.ashenoath.watch`
- 素材目录：`common/post/灰烬誓约/`
- 游戏 ID：`com.hazenotea.ashenoath.watch`

注意事项：

- 前端激活白名单已加入该 ID，后端也需要支持这个游戏 ID。
- 教程截图暂时复用《植物大战僵尸重制版》的版本，流程文字已经改成《灰烬誓约》；后续只需替换 `common/post/灰烬誓约/guide/` 下的 `01-no-custom.png` 到 `06-input.png`。
- 封面、宣传图、游戏画面和图标均来自桌面素材目录；`标题废稿` 没有使用。
- 教程页和作品页中的激活按钮都指向个人网站的激活页，并带正确参数。

## 天空消消乐 / Sky Match

- 作品页：`post/sky-match.html`
- 素材目录：`common/post/天空消消乐/`
- 定位：天空系列免费三消，无需购买或激活
- 页面已保留宣传图中的声明：素材及 IP 与 AstroBox、小米及其他设备厂商无关，本作是非商业免费游戏，仅供交流学习使用

## 本地预览

直接双击 `index.html`，或在该目录运行：

```bash
python -m http.server 8000
```

访问 `http://localhost:8000`。

## 项目入口

- 首页：`index.html`
- 作品页：`post/hnt-gamebox.html`、`post/sokoban.html`、`post/sky-chess.html`、`post/sky-cards.html`、`post/sky-match.html`、`post/ashen-oath.html`
- 激活教程：`post/ashen-oath-activation.html`
- 激活页：`pages/activate/activate.html`（不放入站内导航，已设置 `noindex`）
- 图片素材：`common/post/`

## 维护要点

- 作品卡片在 `index.html` 的 `#project-grid` 中，分类使用 `data-category`。
- 卡片封面建议保持 3:2，作品页的大图也沿用这一比例。
- 项目筛选数量由 `assets/js/main.js` 自动统计。
- 主题默认跟随系统，可用 `?theme=light` 或 `?theme=dark` 预览。
- 新增作品页时，参考 `post/ashen-oath.html` 和 `post/ashen-oath-activation.html` 的结构。
- 部署到 GitHub Pages 后，激活页完整地址为：
  `https://<用户名>.github.io/HNT-PW/pages/activate/activate.html?game=com.hazenotea.ashenoath.watch`
