# lycat475

Hugo 静态博客。A（文献极简）+ E（摄影画廊）两套密度，共用一套字体与间距。

- 文章区：`--paper` 暖白底、宋体标题、细线分割、单一强调色（朱红）
- 相册区：同一套字体，切到宽栏 + 大图
- 无主题依赖，模板全部在本仓库 `layouts/`

## 本地预览

```bash
# 在仓库根目录（blog/）执行
HUGO_CACHEDIR=$PWD/.hugo_cache ../tools/hugo/hugo.exe server --port 1313 --disableFastRender
```

打开 http://localhost:1313/ 。改文件会自动重载。

> 若 `HUGO_CACHEDIR` 不设，Hugo 会去写系统 Temp，某些环境下会报 `Access is denied`。

## 写一篇

```bash
../tools/hugo/hugo.exe new content/posts/我的标题/index.md
```

正文写在 `index.md` 里，图片放同一目录，用 `![](shot.jpg)` 引用。

**坑**：`date:` 写成未来时间，Hugo 默认不构建这一页，本站会静默消失。写完检查一下日期不是明天。

## 相册

素材放在 `~/Desktop/博客/相册/`，由 AI 挑图后导入。导入时统一处理：

- 长边缩到 2000px
- 转正 EXIF 方向后**整块剥掉 EXIF**（GPS / 设备 / 时间不进仓库，也不上网）
- 质量 88、渐进式，单张 150–1100KB

构建时 `layouts/partials/figure.html` 再转 WebP、生成 640 / 1440 两档、输出 srcset。

**别把原片放进仓库。** DNG 单张几十 MB，`.gitignore` 挡得住新文件，挡不住历史膨胀。

当前 12 张：`01-dusk-ridge` … `12-swans`，顺序由文件名决定，想调顺序就改前缀数字。

## 部署（Cloudflare Pages）

1. 推仓库到 GitHub（私有也行）
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
3. 构建设置：
   - Framework preset：**Hugo**
   - Build command：`hugo --minify`
   - Build output directory：`public`
   - 环境变量：`HUGO_VERSION = 0.168.0`
4. 部署完拿到 `*.pages.dev` 地址，把 `hugo.toml` 里的 `baseURL` 改成它，再推一次

## 占位与待办

- **形象图**：favicon、404、文章末尾的签名位现在都是「圆环 + ly」占位。图到位后替换 `.slot` 里的内容，尺寸别动。
- **衬线字体**：现在用系统栈（`Songti SC` / `SimSun`），Windows 和 mac 渲染不同。要统一需自托管思源宋体子集（约 1–2MB），定稿阶段再决定。
- **相册样例图**：`content/gallery/sample-0*.jpg` 是占位，去掉前别公开。

## 五个 2 小时的块

| 块 | 做什么 | 状态 |
|---|---|---|
| 1 | 骨架 + 本地跑通 | ✅ |
| 2 | 关于页 + 首页文案 | 待你写 |
| 3 | hello world 正文 + 404 定稿 | 待你写 |
| 4 | 相册：12 张照片 | 待你导 |
| 5 | 归档分页 + 字体 + 公开 | 部分已做 |

## 目录

```
content/
  posts/         文章（每篇一个文件夹，图片放里面）
  gallery/       相册（_index.md + 图片）
  about/         关于
layouts/
  _default/      baseof / single / list
  index.html     首页
  gallery/       相册页
  404.html
  partials/      head / figure / sign
assets/css/      main.css（全部样式，约 230 行）
```
