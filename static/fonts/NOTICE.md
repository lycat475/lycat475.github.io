# 字体来源与许可

本站自托管四个 woff2 子集，全部为 SIL Open Font License 1.1（OFL）字体，允许嵌入与再分发。
子集由 `scripts/build-fonts.py` 生成；字符集见该脚本。

| 文件 | 字体 | 作者 / 来源 | 许可 |
|---|---|---|---|
| `jetbrains-mono-400.woff2`<br>`jetbrains-mono-600.woff2` | JetBrains Mono | JetBrains — https://www.jetbrains.com/lp/mono/ | OFL 1.1 |
| `noto-sans-sc-400.woff2` | Noto Sans SC（思源黑体） | Google / Adobe — https://fonts.google.com/noto/specimen/Noto+Sans+SC | OFL 1.1 |
| `rhr-meow-400.woff2` | 资源圆体 Resource Han Rounded | Cyano Hao — https://github.com/CyanoHao/Resource-Han-Rounded | OFL 1.1 |

说明：

- 「喵句」只在站点界面出现：维护页标题与说明、404 两句、两处空态。共 5 处，字符集固定。
- 中文正文子集 = GB2312 一级汉字（3755）+ 站点当前实际出现的汉字。新增生僻字时重跑 `scripts/build-fonts.py`。
- 本目录不含完整字体文件，只含子集；完整字体请向上述来源下载。
