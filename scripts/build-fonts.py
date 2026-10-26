#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""重建 static/fonts/ 下的字体子集。

站点只用四个字体文件：
  jetbrains-mono-400/600.woff2  拉丁（正文、标题、日期、代码）
  noto-sans-sc-400.woff2        中文（GB2312 一级 3755 字 + 站点实际用字）
  rhr-meow-400.woff2            喵句（资源圆体，只含站点界面那 5 句的字）

为什么是子集：完整中文字体 14–25 MB，子集后 0.5 MB 量级；静态站零运维，
不引 CDN，所以字体必须自托管+子集。

用法（在仓库根目录）：
  pip install fonttools brotli
  python scripts/build-fonts.py

依赖的源字体（不放仓库，按需下载）：
  Noto Sans SC   https://github.com/google/fonts/tree/main/ofl/notosanssc
                 （Windows 上已装的话可直接用 C:/Windows/Fonts/NotoSansSC-VF.ttf）
  JetBrains Mono https://github.com/google/fonts/tree/main/ofl/jetbrainsmono
  资源圆体        https://github.com/CyanoHao/Resource-Han-Rounded
"""
import glob
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = os.path.join(REPO, 'static', 'fonts')
SRC = os.environ.get('FONT_SRC_DIR', os.path.join(REPO, '..', '.tmp', 'fonttest'))

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

PUNCT = 'U+3000-303F,U+FF01-FF60,U+2013-2014,U+2018-201D,U+2026,U+00B7'
LATIN = 'U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026'


def gb2312_level1():
    """GB2312 一级汉字 3755 个 —— 比「Unicode 连续 3500 码位」靠谱得多。"""
    out = set()
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            try:
                out.add(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    return out


def site_chars():
    chars = set()
    pats = ['content/**/*.md', 'layouts/**/*.html', 'hugo.toml']
    for pat in pats:
        for f in glob.glob(os.path.join(REPO, pat), recursive=True):
            chars |= {c for c in open(f, encoding='utf-8').read() if 0x3400 <= ord(c) <= 0x9FFF}
    return chars


def subset(src, unicodes, out):
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, f'--unicodes={unicodes}',
                    '--flavor=woff2', f'--output-file={out}', '--layout-features=*',
                    '--no-hinting', '--desubroutinize'], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f'{os.path.basename(out)}: {os.path.getsize(out) / 1024:.0f} KB')


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    cjk = gb2312_level1() | site_chars()
    uni_cjk = ','.join('U+%04X' % ord(c) for c in sorted(cjk)) + ',' + PUNCT
    print(f'中文子集：{len(cjk)} 字')

    # 中文
    noto_src = os.environ.get('NOTO_SANS_SC', r'C:\Windows\Fonts\NotoSansSC-VF.ttf')
    ttf = TTFont(noto_src)
    instantiateVariableFont(ttf, {'wght': 400}, inplace=True)
    tmp = os.path.join(OUTDIR, '.noto-tmp.ttf')
    ttf.save(tmp)
    subset(tmp, uni_cjk, os.path.join(OUTDIR, 'noto-sans-sc-400.woff2'))
    os.remove(tmp)

    # 拉丁
    jb_src = os.path.join(SRC, 'latin', 'jetbrainsmono.ttf')
    for wt in (400, 600):
        f = TTFont(jb_src)
        instantiateVariableFont(f, {'wght': wt}, inplace=True)
        tmp = os.path.join(OUTDIR, f'.jb-{wt}.ttf')
        f.save(tmp)
        subset(tmp, LATIN, os.path.join(OUTDIR, f'jetbrains-mono-{wt}.woff2'))
        os.remove(tmp)

    # 喵句：字符集固定，只含界面那 5 句
    meow = '还没准备好喵摸鱼好爽噫补药电窝了本马上就干活泥走错路了这里什么都没有空空如也~！。'
    uni_meow = ','.join('U+%04X' % ord(c) for c in set(meow)) + ',' + LATIN
    rhr = os.path.join(SRC, 'cjk', 'rhr', 'ResourceHanRoundedHC-Normal.ttf')
    subset(rhr, uni_meow, os.path.join(OUTDIR, 'rhr-meow-400.woff2'))

    total = sum(os.path.getsize(os.path.join(OUTDIR, f))
                for f in os.listdir(OUTDIR) if f.endswith('.woff2'))
    print(f'合计 {total / 1024:.0f} KB')


if __name__ == '__main__':
    main()
