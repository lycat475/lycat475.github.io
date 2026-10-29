# 交接文档 · lycat475 博客（视觉/动效收尾）

> 写给接手的 Codex（或任何工程师）。
> 上一棒：DeepSeek Harness 会话，从「上线」一路做到「动效 + 品牌 + 后台」。
> 站点已上线、可访问、无已知阻断性 bug。下面的内容足以让你在不看历史对话的情况下继续干活。

---

## 0. TL;DR

- **站点**：<https://lycat475.com>（Cloudflare Pages，GitHub 仓库自动构建）
- **技术**：Hugo 0.168 extended + 自建主题，**零 npm 运行时依赖**，纯静态
- **现状**：1 篇文章（占位）、22 张照片、后台 CMS 可用、10 项动效全部上线
- **你要做的**：优先级见 [§9 任务清单](#9-剩余美化任务按优先级)；最值钱的两件事是 **CJK 字体瘦身** 和 **相册图片体积**，见 P0
- **最大的坑**：Windows 路径、`HUGO_CACHEDIR`、`?v=` 缓存哈希、后台 bundle 被手工打过补丁（别重新 minify）

---

## 1. 项目坐标

| 项 | 值 |
|---|---|
| 仓库 | `https://github.com/lycat475/lycat475.github.io`（分支 `main`） |
| 本地路径 | `C:\Users\OCEANCAT\Documents\deepseek-harness\default-workspace\blog` |
| 线上 | `https://lycat475.com` / `https://www.lycat475.com` / `https://lycat475.pages.dev` |
| Cloudflare Pages 项目名 | `lycat475-blog`（注意：项目名与 pages.dev 子域不一致，属正常） |
| 构建命令（CF 后台） | `hugo`，输出目录 `public`，环境变量 `HUGO_VERSION=0.168.0` |
| 后台 CMS | `https://lycat475.com/admin/`（Sveltia，GitHub 登录） |
| Hugo 二进制 | `..\tools\hugo\hugo.exe`（0.168.0 extended，**不在仓库里**，`.gitignore` 已挡） |
| 决策档案 | `..\docs\*.md`（**在仓库外**，含 decisions-beautify / font / favicon / personal-blog、copy-文案清单） |

---

## 2. 环境与命令

### 2.1 构建

```bash
cd blog
HUGO_CACHEDIR=$PWD/.hugo_cache ../tools/hugo/hugo.exe --gc --minify
```

> 不设 `HUGO_CACHEDIR` 会因系统 Temp 权限报 `Access is denied`。

### 2.2 本地预览

```bash
HUGO_CACHEDIR=$PWD/.hugo_cache ../tools/hugo/hugo.exe server \
  --port 1313 --bind 127.0.0.1 --disableFastRender
```

`--disableFastRender` 是必要的：开了 Fast Render 时 CSS/模板改动不会完整重建。

### 2.3 提交与推送

```bash
git -c user.name=lycat475 -c user.email=lycat475@users.noreply.github.com commit -m "前缀: 说明"
git -c http.version=HTTP/1.1 push origin main
```

- 仓库没配全局身份，缺 `-c user.*` 会直接失败（rebase 也会失败）。
- 这台机器上 HTTP/2 推送偶发挂起，**必须** 带 `http.version=HTTP/1.1`，并给 push 留 200s 以上。
- 提交信息用中文，「模块: 做了什么」格式，历史上一直如此。

### 2.4 上线验证

CF Pages 构建 + 全球传播约 **50–80 秒**。用内容哈希验证，别靠肉眼：

```bash
local=$(sha256sum blog/static/deer.png | cut -d' ' -f1)
curl -s https://lycat475.com/deer.png -o /tmp/l.png
[ "$(sha256sum /tmp/l.png | cut -d' ' -f1)" = "$local" ] && echo OK
```

### 2.5 回归测试（脚本在仓库外）

```bash
node ../.tmp/audit-bugs2.mjs https://lycat475.com 1440 900   # 32 条断言
node ../.tmp/audit-bugs2.mjs https://lycat475.com 390 780    # 手机尺寸
node ../.tmp/probe-extras.mjs http://127.0.0.1:1313          # 320px / 触屏 / 跳过链接 / 200% 字号
```

详见 [§11](#11-测试脚本workspacetmp)。

---

## 3. 目录地图

```
blog/
├── hugo.toml                 # 站点配置：baseURL、menu、holding 开关、Chroma 主题
├── README.md                 # 面向站长的运维说明（写文章/相册/部署）
├── HANDOFF.md                # 本文件
├── scripts/
│   └── build-fonts.py        # 生成 WOFF2 子集的脚本（见 §5.2）
├── assets/
│   ├── css/main.css          # 791 行，全站唯一样式表（分节注释见 §5.1）
│   ├── css/chroma*.css       # 代码高亮，main 里覆盖
│   └── img/masthead.webp     # 报头原图
├── content/
│   ├── about/index.md
│   ├── posts/_index.md       # 「归档」列表页
│   ├── posts/hello-world/    # 唯一一篇（page bundle）
│   └── gallery/              # 22 张 p01..p22.jpg + _index.md
├── layouts/
│   ├── _default/baseof.html  # 外壳：header + #swup(main) + footer + 5 个 script
│   ├── _default/list.html    # 列表（归档/分类通用）
│   ├── _default/single.html  # 文章
│   ├── index.html            # 首页（报头 + 文章列表 + 相册缩略图行）
│   ├── 404.html
│   ├── gallery/list.html     # 相册瀑布流
│   └── partials/
│       ├── head.html         # meta / OG / favicon / CSS bundle
│       ├── brand.html        # 鹿 or 企鹅（见 §13）
│       ├── asset-v.html      # 静态资源内容哈希 → ?v=
│       ├── figure.html       # 图片管线（WebP + srcset + 灯箱数据）
│       └── sign.html         # 文章尾部署名
├── static/
│   ├── js/site.js            # 357 行，全部交互
│   ├── vendor/
│   │   ├── photoswipe.esm.js / photoswipe-lightbox.esm.js / photoswipe.css
│   │   └── swup/{swup,preload,scroll,progress}-umd.js
│   ├── fonts/                # 4 个自托管 WOFF2 子集 + NOTICE.md
│   ├── admin/                # Sveltia CMS（bundle 2.5MB + config.yml + fonts/）
│   ├── deer*.png/svg         # 鹿标一套
│   ├── peng*.png/ico         # 企鹅标一套
│   ├── og-card.jpg / og-card-peng.jpg
│   ├── favicon*.png/ico, apple-touch-icon.png
│   └── _headers              # CF Pages 缓存头（后台不缓存、字体强缓存）
└── public/                   # 构建产物（gitignore）
```

---

## 4. 技术栈与构建管线

### 4.1 HTML

- Hugo page bundle：`content/posts/<slug>/index.md`，文章图片放同目录。
- 无主题、无 shortcode 依赖；模板全部手写。
- `hugo.toml` 关了 taxonomy：`disableKinds = ['taxonomy', 'term']`（见 §9 P1-1）。

### 4.2 CSS

`head.html:55` 把 `chroma.css + chroma-dark.css + main.css` 用 `resources.Concat` 合成一个 bundle，再 `minify` + `fingerprint`（带 `integrity` 属性）：

```go-html-template
{{ $css := slice (resources.Get "css/chroma.css") (resources.Get "css/chroma-dark.css") (resources.Get "css/main.css")
   | resources.Concat "css/bundle.css" | minify | fingerprint }}
<link rel="stylesheet" href="{{ $css.RelPermalink }}" integrity="{{ $css.Data.Integrity }}">
```

→ **改 CSS 后不需要手动清缓存**，文件名里的指纹会变。

### 4.3 图片

`partials/figure.html`：

- 相册图：`Resize "600x webp q80"` 与 `"1200x webp q80"` 两档 srcset；灯箱另出 `2000x webp q82`。
- 原片已在导入时压到长边 2000、剥除 EXIF、q88（流程写在 README）。
- 首页缩略图行是另一种（固定 46px 高）。

### 4.4 JS

`baseof.html` 底部按序加载（全部 `defer`）：

```
vendor/swup/swup.umd.js → preload → scroll → progress → js/site.js
```

`site.js` 结构：

| 行 | 内容 |
|---|---|
| 1–21 | `MOTION` 开关表 + `motion(flag)`（受 `prefers-reduced-motion` 约束） |
| 24–66 | 主题切换（`startViewTransition` 圆形扩散，含降级） |
| 68–113 | 单条 rAF 滚动循环：报头视差、吸附、进度线 |
| 115–145 | `ensureHeadGlass` / `watchHead`（ResizeObserver 跟随页头高度） |
| 147–207 | 进度线、滚动显影 `initReveal`、图片渐显 `initImageFade` |
| 209–273 | 代码复制按钮、剪贴板降级、灯箱 `initLightbox` |
| 274–310 | `syncHead`（换页同步 title/description）、`markNav`、`syncBodyClass` |
| 311–357 | `enhance()` 统一入口 + swup 事件绑定 |

**约定**：所有「换页后要重新生效」的行为都挂在 `enhance()` 里，由 swup 的 `page:view` 调用；`<script>` 写在被替换的 DOM 里不会执行。

### 4.5 第三方

| 库 | 版本 | 许可 | 位置 |
|---|---|---|---|
| swup | 4.10.0 | MIT | `static/vendor/swup/` |
| preload-plugin | 3.2.12 | MIT | 同上 |
| scroll-plugin | 4.0.0 | MIT | 同上 |
| progress-plugin | 3.2.0 | MIT | 同上 |
| PhotoSwipe | 5.4.4 | MIT | `static/vendor/` |
| Sveltia CMS | 0.252.0 | MIT | `static/admin/sveltia-cms.js` |
| 字体 | — | OFL | `static/fonts/NOTICE.md` |

全部**本地托管，零 CDN**（历史原因：jsdelivr 在国内 502，见 §8）。

---

## 5. 设计基线

### 5.1 色彩与排版（`assets/css/main.css`）

| 变量 | 亮色 | 暗色 |
|---|---|---|
| `--paper` | `#faf5ec` | `#14110f` |
| `--ink` | `#1d1a17` | `#e9e3d9` |
| `--accent` | `#a13c2c` | `#d97460` |

- 版式：`--page: 40rem`（文字页）/ `--wide: 62rem`（首页、相册）/ `--measure: 34rem`（正文行长）/ `--gutter: 1.35rem`（左右留白）。
- 正文：`font-size: 17.5px`，`line-height: 1.9`，字体栈 `"JBMono", "NotoSansSC", "PingFang SC", "Microsoft YaHei"`（拉丁先用等宽，中文回落 Noto）。
- 断点：720px / 900px 为主；320px 有专门的导航换行处理。
- 圆角几乎不用；分隔用 1px 发丝线（`--rule`）。
- 动效时长统一 240–280ms，缓动 `cubic-bezier(.22,1,.36,1)`。

CSS 分节注释（改样式前先 README 这 27 节，别重复造轮子）：

```
1  自托管字体        74  头部吸附+毛玻璃      144 报头
247 区块标题          269 条目索引            290 相册网格
324 文章              395 签名位              408 归档
444 404/按钮/准备中   467 页脚                482 响应式
505 喵句             529 暗色主题            557 相册瀑布流
594 首页摘要          602 首页相册缩略图行     612 报头下半虚化
625 页面切换过渡       649 swup 过渡           664 swup 进度条
676 主题圆形扩散       701 动效 A 报头入场      723 动效 C 显影
741 阅读进度           758 动效 F 图片渐显      769 动效 G 微交互
779 动效 I 标题帘子
```

### 5.2 字体（自托管子集）

| 文件 | 用途 | 大小 |
|---|---|---|
| `noto-sans-sc-400.woff2` | 正文中文 | **564 KB** ← 最大性能负担 |
| `jetbrains-mono-400/600.woff2` | 等宽（站点标题、数字、代码） | 20 KB ×2 |
| `rhr-meow-400.woff2` | 只有「喵」句用它（资源圆体） | 43 KB |

生成脚本 `scripts/build-fonts.py`（pyftsubset）。**若要瘦身，从这里改。**

### 5.3 双品牌

见 `partials/brand.html`：页面标题/描述/正文里出现「喵」→ 企鹅；404 页永远是企鹅；其余是鹿。

---

## 6. 已完成功能（按模块，附 commit）

| # | 功能 | 关键实现 | commit |
|---|---|---|---|
| A | 报头入场 + 滚动视差 | `.masthead-media` 缩放 + 文字上浮淡出，`html.js-motion` 门控 | `39709f5` |
| B | 页头吸附 + 满幅毛玻璃 | JS 造 `.head-glass`（fixed，高=页头高），`backdrop-filter: blur(14px)` | `cdd8f88` |
| C | 滚动显影 + 相册悬停推近 | IntersectionObserver 加 `.reveal`；`@media(hover:hover)` 缩放 1.028 | `86bba45` |
| D | 灯箱缩放展开 | `showHideAnimationType: 'zoom'`（PhotoSwipe 原生） | `86bba45` |
| E | 阅读进度线 | 顶部 2px，`transform: scaleX(--rp)`，短文隐藏 | `86bba45` |
| F | 图片载入渐显 | `.is-loading` / `.is-loaded`，已缓存图片跳过 | `b00c700` |
| G | 微交互 | 导航下划线左→右长出、当前栏目常亮 | `a10995e` |
| H | swup 页面过渡 | `#swup` 淡出/淡入，页头不动；进度线 | `39709f5`~ |
| I | 标题帘子 | `clip-path` 揭开 + 轻微位移 | `b00c700` |
| — | 宽窄版式跟随换页 | `body.wide` 由 `syncBodyClass()` 从目标文档同步 | `548b6d1` |
| — | 主题圆形扩散 | View Transitions API 手动调用，降级为直接切换 | 早期 |
| — | 鹿标替换 + 喵页保企鹅 | `brand.html` + 两套资产 + `?v=` | `81e109d` |
| — | SEO/OG 修复 | `baseURL` 从死链 `lycat475-github-io.pages.dev` 改为 `lycat475.com`；加 OG/Twitter | `754361c` |
| — | 缓存破除 | `asset-v.html` 内容哈希 → `?v=` | `f4d3f12` |
| — | 后台字体本地化 | Sveltia 的三个 CDN 字体下载到 `static/admin/fonts/` 并改写 bundle | `aac0851` |

**踩过的坑（别重踩）**：

1. `progress-plugin` 用的是 `--progress` + `transform: scaleX()`，写 `width` 无效。
2. `.masthead img{filter:...}` 会盖掉 `.masthead-blur{filter:blur()}`——选择器要写 `.masthead img.masthead-blur` 并合并 filter。
3. `mask-image` 的百分比是相对**元素宽度**，不是高度，虚化带要用 `linear-gradient(180deg, …)`。
4. swup 的 `skipPopStateHandling` 必须是函数，传 boolean 会在每次后退时抛异常。
5. 指向 `.webp` 的 `<a>`、RSS/Sitemap 链接都要加 `data-no-swup`，否则被 swup 接管。
6. PhotoSwipe 的根层 `z-index` 默认 100000，比页头(60)高，这是对的——别去压。
7. 视差公式原来用「视口高度」，桌面短页面永远不动；改成「报头自身高度 × 0.62」。

---

## 7. 硬约束（违反即返工）

1. **零预算、零运维**：不引入需要常驻进程/数据库/付费服务的东西。
2. **成品站不加 npm 运行时依赖**：可以本地用脚本（Python/Node）生成资源，但产物必须是静态文件。
3. **不代写用户内容**：文章正文、关于页、喵句文案都是作者本人写的。你可以改样式和结构，**不要改写文字**（除非用户明确要求改错字）。
4. **只裁图，不调色**：这条被用户明确否决过一次（历史事故）。任何「自动对比度/提亮/降噪」都不要做。
5. **拒绝 SaaS/组件库味道**：用户明确否决过 shadcn 式侧栏、卡片堆叠、「看起来挺专业」的折叠动效。审美口径是「克制的纸质排版」。
6. **无 JS 必须可读**：所有动效都要能被 `prefers-reduced-motion` 全关，且不加 JS 时内容完整可见。
7. **动效克制**：时长 240–280ms、缓动统一；不要加弹跳、不要加多个并发动画。
8. **中文字体是最大成本**：任何新增字体都要先算体积。

---

## 8. 已知未修 / 明确不做

| 项 | 状态 | 说明 |
|---|---|---|
| swup 软 404 | 不修 | 导航到不存在路径时，内容会变成 404 页但不刷新，可接受 |
| 微信分享卡片 | 不修 | 微信不解析 OG，走自家抓取；只能控制页面首图 |
| Firefox 跨文档 View Transitions | 不修 | Firefox 未实现，swup 过渡不受影响 |
| 16px favicon | 不修 | 线稿在 16px 必然糊；32/180 正常 |
| Material Symbols 2.7MB | 待优化 | 只在 `/admin/` 加载，可做子集（见 P2-3） |
| taxonomy 被关 | 待决策 | 见 P1-1 |
| 无站内搜索 | 待决策 | 见 P1-2 |
| 鹿标未定稿 | **待用户拍板** | 用户对现有鹿标仍不满意，来回改过 6 轮（见 §14） |

---

## 9. 剩余美化任务（按优先级）

### P0 · 性能（收益最大，先做）

**P0-1 CJK 字体瘦身（最大单项）**

- 现状：`noto-sans-sc-400.woff2` 564 KB，**占首页冷加载的 70%+**（首页总计约 705–800 KB）。
- 做法二选一：
  - **A** 按 `unicode-range` 切片：用 `pyftsubset --unicodes=` 把常用 3500 字 + 标点切出来，剩余字用系统字体兜底（`font-family: 'Noto Sans SC', system-ui, sans-serif`）。预计降到 120–180 KB。
  - **B** 直接放弃自托管中文，正文用系统字体栈（`-apple-system, "PingFang SC", "Microsoft YaHei"`），只在标题保留 JetBrains Mono。体积归零，但不同系统观感有差异。
- 落点：`scripts/build-fonts.py`、`main.css` 顶部 `@font-face`、`head.html` 若无 preload 可加 `<link rel=preload as=font crossorigin>`。
- 验收：首页冷加载 < 400 KB；中文正文无豆腐块；`prefers-reduced-motion` 与无 JS 不受影响。

**P0-2 相册图片体积**

- 现状：22 张，移动端 600w 变体单个 40–155 KB（`p14` 155 KB、`p13` 103 KB），瀑布流首屏加载偏重。
- 做法：`figure.html` 的 `q80` → `q72~75`；移动端加一档 400w；`sizes` 用真实栅格宽度（现在写死 `46vw / 360px`，与 CSS columns 实际列宽有偏差）。
- 验收：相册页总重下降 ≥35%，肉眼看不出画质劣化（放大对比 100% 截图）。

**P0-3 报头 LCP**

- 现状：报头图 65 KB（手机）/211 KB（桌面），无 `preload`、无 `fetchpriority`。
- 做法：首页 `<link rel=preload as=image imagesrcset=...>`；`<img fetchpriority="high">`；加一档 800w。
- 验收：Lighthouse 移动端 LCP < 2.0s（当前 1.5–2.7s 波动）。

**P0-4 暗色首屏闪白**

- 现状：`head.html:29` 只读 `localStorage`，首次访问（无记录）不读 `prefers-color-scheme`。
- 做法：`if (!t && matchMedia('(prefers-color-scheme: dark)').matches) setAttribute('data-theme','dark')`。
- 验收：系统深色 + 清空 localStorage → 首屏不闪白。

### P1 · 内容能力

**P1-1 标签/分类（需用户确认）**

- 现状：`hugo.toml` 关了 taxonomy；`single.html:9` 只把 tags 当纯文本；后台表单只有「标签」没有「分类」。
- 做法：去掉 `disableKinds` 里的 taxonomy/term → 加 `layouts/_default/terms.html` + `taxonomy.html`（或让 `list.html` 兜底）→ `single.html` 把 tags 变成链接 → 可选「相关文章」。
- 验收：`/tags/` 有列表页；文章页标签可点；`sitemap.xml` 收录。

**P1-2 站内搜索（可选）**

- 静态站首选 Pagefind（构建后生成索引，运行时纯 JS，无服务端）。
- 落点：`baseof.html` 或页头加搜索入口；`package.json` 只作为构建期依赖（不违反 §7.2，因为产物是静态文件）。

**P1-3 长文排版**

- 现状：`single.html` 有 `.prose`，但没有 h2/h3 锚点、目录、脚注、引用样式、图注。
- 做法：CSS 补 `.prose h2{scroll-margin-top: calc(var(--head-h) + 1rem)}`、`h2 > a.anchor`、`blockquote`、`figcaption`；可选右侧 TOC（桌面 ≥1100px 才显示）。

**P1-4 SEO 补全**

- JSON-LD（`BlogPosting` / `Person` / `WebSite` + `SearchAction`）。
- RSS 输出全文（`outputFormats` 配置）。
- 文章级 OG 图（用 Hugo 生成标题卡片，可选，工作量大）。

### P2 · 打磨

1. **404 页**：现在是静态文案 + 回首页链接，可加「随机喵句」或搜索框。
2. **空状态**：文章为空/相册为空时的版式。
3. **admin 图标字体子集**：2.7 MB → 几十 KB（`pyftsubset --text=` 或按用到的图标名筛）。
4. **`print.css`**：正文黑白、隐藏页头页脚。
5. **相册**：灯箱手势提示、键盘左右键提示、`data-caption` 显示为图注。
6. **跨文档过渡**：`@view-transition` 已有，Firefox 回退可加一层 fade。
7. **品牌定稿**：鹿标仍未定（见 §14）。

---

## 10. 工作协议

1. **改之前先读**：`assets/css/main.css` 分节注释 + `static/js/site.js` 的 `enhance()` 结构，别另起炉灶。
2. **小步提交**：一个改动一个 commit，中文「模块: 说明」。
3. **每次改完必须跑**：
   - `node --check static/js/site.js`
   - 本地构建（见 §2.1）
   - `node ../.tmp/audit-bugs2.mjs http://127.0.0.1:1313 1440 900`（32 条应全绿）
   - 无 JS 与 reduced-motion 抽查（脚本里已包含）
4. **推上去后**：等 50–80 秒，用哈希/内容串验证，再跑一次线上审计。
5. **回滚**：`git revert <sha>` 后重推；不要 force push（CF 会按 main 构建）。
6. **别动**：`static/admin/sveltia-cms.js` 里被替换成本地路径的三处字体 URL；重新 minify 会把补丁弄丢。
7. **别碰**用户文案与 `docs/` 里的决策档案（后者在仓库外，但请保持同步更新）。

---

## 11. 测试脚本（workspace/.tmp）

> 这些脚本**不在仓库里**，在 `..\.tmp\`（工作区根）。需要 Node 18+ 与本机 Chrome（路径写死在脚本顶部）。

| 脚本 | 用法 | 覆盖 |
|---|---|---|
| `audit-bugs2.mjs` | `node audit-bugs2.mjs <base> [W] [H]` | 32 条：玻璃条高度、吸附、视差、无横向溢出、灯箱层级、焦点环、SPA 换页、宽窄版式、主题、404 |
| `probe-extras.mjs` | `node probe-extras.mjs <base>` | 320px 窄屏、触屏滑动、跳过链接、200% 字号 |
| `motion-a.mjs` | `node motion-a.mjs <url> <W> <H> <tag>` | 报头视差数值 + 截图 |
| `admin-fonts.mjs` | `node admin-fonts.mjs <url> <out.png>` | 后台字体加载 / 连字是否成图标 |
| `shot_viewport.mjs` | `node shot_viewport.mjs <url> <out.png> <W>` | 整页截图（不触发重排） |

---

## 12. 发布前验收清单

- [ ] `node --check static/js/site.js` 通过
- [ ] 本地构建无 warning
- [ ] 桌面 1440×900 审计 32/32
- [ ] 手机 390×780 审计 32/32
- [ ] 320px 宽无横向滚动、导航不折行错乱
- [ ] 无 JS：内容完整、灯箱链接可点（退化）
- [ ] reduced-motion：动画全关、内容可见
- [ ] 暗色：文字对比度正常、玻璃条颜色正确
- [ ] 控制台无报错
- [ ] 推后 80 秒，线上 HTML/CSS/图片哈希与本地一致
- [ ] 线上再跑一次审计

---

## 13. 术语与暗号

| 词 | 含义 |
|---|---|
| **喵句** | 文案里带「喵」的句子，用资源圆体，且该页品牌切回企鹅 |
| **双品牌** | `partials/brand.html`：鹿（默认）/ 企鹅（喵页 + 404） |
| **报头** | 首页顶部的满幅大图 + 压字区（`.masthead`） |
| **宽版** | `body.wide`，首页与相册用，62rem |
| **显影** | `.reveal` 滚动进入视口时淡入上浮 |
| **帘子** | 页面标题 `clip-path` 自上而下揭开 |
| **玻璃条** | 吸附时页头下方那层满幅毛玻璃 `.head-glass` |
| **`?v=`** | `asset-v.html` 生成的内容哈希，专治 favicon/标记图缓存 |

---

## 14. 待决问题（请先问用户，不要自己拍板）

1. **鹿标定稿**：用户对现有鹿（侧脸线稿，眼睛 r=2.5）仍不满意，曾要求「有棱有角」「一笔画」「结合 ly 字母」「不要像品牌标签」。多轮尝试后**暂时保留初版**。重做前先确认方向，别直接改线上。
2. **是否开标签/分类**：用户问过「分类和标签是什么意思」，我建议文章到 10 篇再开。开启需他确认。
3. **性能 vs 观感**：CJK 字体瘦身方案 A/B 会改变不同系统上的字形，需他选。
4. **是否需要搜索**：站点目前只有 1 篇，搜索暂时无意义。

---

## 15. 交接时的状态快照

```
git HEAD      aac0851 后台: Sveltia 字体本地化（图标字体走 jsdelivr 被墙，界面变成一排英文单词）
线上          与本地一致（/admin/fonts/*.woff2 200，?v=cfb83850）
文章          1 篇（hello-world，tags 为空）
照片          22 张（p01–p22，长边 2000，已剥 EXIF）
动效          10 项全部上线（A–I + 主题扩散）
审计          1440×900 与 390×780 各 32/32 通过
后台          Sveltia 可用，字体已本地化，`_headers` 已配
阻塞项        无
```

---

## 附：相关文档

| 文档 | 位置 | 内容 |
|---|---|---|
| `README.md` | 仓库根 | 站长视角：写文章、导照片、上下线、部署 |
| `decisions-personal-blog.md` | `..\docs\` | D1–D47，早期所有产品/技术决策 |
| `decisions-beautify.md` | `..\docs\` | Md1–Md38，第一二轮美化 + 动效 + 审计的决策与教训 |
| `decisions-font.md` | `..\docs\` | 字体选型与子集化过程 |
| `decisions-favicon.md` | `..\docs\` | favicon 迭代史 |
| `copy-文案清单.md` | `..\docs\` | 全站文案的出处与作者 |
