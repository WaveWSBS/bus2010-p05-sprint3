#!/usr/bin/env python3
"""Builds the P05 prototype into single self-contained HTML files.

  dist/index.html      standalone page: double-click to open in any browser
  dist/artifact.html   the same page as a fragment, for publishing as a hosted link
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700'
         '&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">')


def read(name):
    return (SRC / name).read_text(encoding="utf-8")


def fragment():
    css = read("styles.css")
    scripts = "".join(
        f"<script>\n{read(n)}\n</script>\n"
        for n in ["data.js", "ai-signals.js", "config.js", "engine.js", "chatbot.js", "supabase-source.js", "eval.js", "tests.js", "app.js"]
    )
    return (
        "<title>IPP Co-op Portal · P05 Opportunity Matcher &amp; AI Assistant</title>\n"
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        f"{FONTS}\n<style>\n{css}\n</style>\n{read('app.html')}\n{scripts}"
    )


if __name__ == "__main__":
    DIST.mkdir(exist_ok=True)
    frag = fragment()
    (DIST / "artifact.html").write_text(frag, encoding="utf-8")
    # In the standalone file the markup must sit in <body>; split head bits from body bits.
    head_part, body_part = frag.split("<header", 1)
    body_part = "<header" + body_part
    css_reset = (":root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
                 "body{margin:0}img{max-width:100%}[hidden]{display:none!important}")
    page = (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f"<style>{css_reset}</style>\n{head_part}</head>\n<body>\n{body_part}</body>\n</html>\n"
    )
    (DIST / "index.html").write_text(page, encoding="utf-8")
    print("built", DIST / "index.html", (DIST / "index.html").stat().st_size, "bytes")
    print("built", DIST / "artifact.html", (DIST / "artifact.html").stat().st_size, "bytes")
