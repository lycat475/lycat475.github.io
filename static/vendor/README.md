# 第三方前端资源（本地自带，不走 CDN）

| 文件 | 来源 | 版本 | 许可 |
|---|---|---|---|
| `photoswipe.esm.js` | https://unpkg.com/photoswipe@5.4.4/dist/photoswipe.esm.min.js | 5.4.4 | MIT |
| `photoswipe-lightbox.esm.js` | 同上 | 5.4.4 | MIT |
| `photoswipe.css` | 同上 | 5.4.4 | MIT |

为什么不走 CDN：本机实测 jsDelivr 502、unpkg 可用但仍是外部依赖；站点原则是零外部请求。
升级方式：换版本号重下这三个文件，改本表。
