#!/usr/bin/env python3
"""Builds static pages from src/*.body.html with a shared header/footer."""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [
 ("index","דף הבית","השוואת רכבי 7 מקומות בישראל — 2026","השוואה ציבורית של 8 רכבי 7+ מקומות הנמכרים בישראל: מפרט, מחירון, Euro NCAP, השוואת תמונות בקנה מידה ומודלים בתלת־ממד."),
 ("specs","טבלת מפרט","טבלת מפרט והשוואה — רכבי 7 מקומות","טבלה ניתנת למיון וסינון: מידות, מושבים, הנעה, הספק, טווח וצריכה, תא מטען, מחיר מחירון, Euro NCAP וביקורות — עם מקורות."),
 ("photos","תמונות בקנה מידה","השוואת תמונות בקנה מידה אחיד — רכבי 7 מקומות","תמונות צד רשמיות בקנה מידה אחיד לפי אורך הרכב: שורה, שכבת חפיפה, מבט חזית סכמטי ועמודות מידות."),
 ("viewer3d","תלת־ממד","מודלים בתלת־ממד בקנה מידה — רכבי 7 מקומות","מודלים תלת־ממדיים (Sketchfab, CC BY 4.0) בקנה מידה לפי מידות היצרן."),
 ("credits","קרדיטים ומקורות","קרדיטים, רישיונות ומקורות","קרדיטים למודלים (CC BY 4.0), מקורות תמונות, מקורות נתונים ותאריך עדכון."),
]
def header(cur):
    items = "".join(
        f'<li><a href="{"./" if p=="index" else p+".html"}"{" aria-current=\"page\"" if p==cur else ""}>{label}</a></li>'
        for p,label,_,_ in PAGES)
    return f'''<a class="skip" href="#main">דילוג לתוכן</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="./">🚙 השוואת רכבי 7 מקומות</a>
<nav aria-label="ניווט ראשי"><ul class="nav">{items}</ul></nav>
</div></header>'''
FOOTER = '''<footer class="site-footer" id="site-footer"><div class="wrap">
<span>עודכן לאחרונה: <time datetime="2026-10-20">20.10.2026</time></span>
<span>נתונים ציבוריים בלבד (יבואנים, יצרנים, Euro NCAP, ביקורות מקושרות). המחירים עשויים להשתנות — יש לאמת מול היבואן.</span>
<span><a href="credits.html">קרדיטים, רישיונות ומקורות</a></span>
</div></footer>'''
for p,label,title,desc in PAGES:
    body = (ROOT/'src'/f'{p}.body.html').read_text(encoding='utf-8')
    head_extra = ''
    m = re.search(r'<!--HEAD(.*?)-->', body, re.S)
    if m: head_extra = m.group(1); body = body.replace(m.group(0),'')
    # inline small page scripts so content exists at first paint (no layout shift while external JS downloads)
    def _inline(m):
        js=(ROOT/'assets'/(m.group(1)+'.js')).read_text(encoding='utf-8')
        assert '</script' not in js.lower()
        return f'<script>/* assets/{m.group(1)}.js */\n{js}</script>'
    body = re.sub(r'<script src="assets/(data|media|specs|photos|viewer3d)\.js"></script>', _inline, body)
    head_extra = re.sub(r'<script src="assets/(data|media|specs|photos|viewer3d)\.js"></script>', _inline, head_extra)
    html = f'''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0f2338">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🚙%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="assets/style.css">
<link rel="expect" href="#site-footer" blocking="render">{head_extra}
</head>
<body>
{header(p)}
<main id="main" class="wrap" tabindex="-1">
{body.strip()}
</main>
{FOOTER}
</body>
</html>
'''
    (ROOT/f'{p}.html').write_text(html, encoding='utf-8')
    print('built', p)
