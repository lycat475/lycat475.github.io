# lycat475

Hugo 静态博客。无主题依赖，模板全部在 `layouts/`。

## AI 参与声明

| 部分 | 谁做的 |
|---|---|
| 模板、CSS、构建配置、图片管线、后台配置 | AI 生成，我提需求、做判断、验收 |
| 文章正文、关于页 | 我自己写；AI 只在要求时改错字 |
| 照片 | 我自己拍；导入时统一压缩并剥除 EXIF |
| Sveltia CMS、Hugo | 第三方开源软件，未修改 |

不代写文章、不搬运他人内容、不把未脱敏的原片放进仓库。AI 生成的内容会在文末注明。

## 上下线

`hugo.toml` 里 `holding = true` 时，全站只渲染「准备中」页并带 `noindex`；改成 `false` 推一次即上线。

## 本地预览

```bash
HUGO_CACHEDIR=$PWD/.hugo_cache ../tools/hugo/hugo.exe server --port 1313
```

不设 `HUGO_CACHEDIR` 会因系统 Temp 目录权限报 `Access is denied`。

## 写文章

```bash
../tools/hugo/hugo.exe new content/posts/标题/index.md
```

图片放同一目录，用 `![](shot.jpg)` 引用。坑：`date` 写成未来时间，Hugo 不会构建这一页。

## 相册

导入时统一处理：长边 2000、整块剥除 EXIF、质量 88。构建时 `figure.html` 再转 WebP（640 / 1440）并输出 srcset。

**原片不进仓库**——`.gitignore` 已挡住 DNG / RAW / HEIC。

## 部署

Cloudflare Pages 接 GitHub 仓库，构建命令 `hugo`，输出目录 `public`，环境变量 `HUGO_VERSION=0.168.0`。地址变更后改 `hugo.toml` 的 `baseURL` 再推一次。
