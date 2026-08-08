import pathlib
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

root = pathlib.Path('.')
html_files = sorted(root.rglob('*.html'))
page_paths = {str(p.relative_to(root)).replace('\\', '/') for p in html_files}

sitemap = root / 'sitemap.xml'
errors = []

if not sitemap.exists():
    errors.append(('sitemap', 'missing sitemap.xml'))
else:
    try:
        tree = ET.parse(str(sitemap))
        urls = [el.text for el in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc') if el.text]
    except Exception as exc:
        errors.append(('sitemap', f'parse error {exc}'))
        urls = []

    sitemap_paths = []
    for url in urls:
        if not url.startswith('https://infravel.dev/'):
            errors.append(('sitemap', f'bad url {url}'))
            continue
        rel = url.replace('https://infravel.dev', '').lstrip('/')
        if rel == '':
            rel = 'index.html'
        elif rel.endswith('/'):
            rel = rel + 'index.html'
        sitemap_paths.append(rel)

    for path in sitemap_paths:
        if path not in page_paths:
            errors.append(('sitemap', f'url missing page {path}'))

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.h1_count = 0
        self.canonical = None
        self.og_url = None
        self.title = None
        self.meta_desc = None
        self.robots = None
        self.twitter = None
        self.styles = []
        self.scripts = []
        self.labels = []
        self.inputs = []
        self.selects = []
        self.textareas = []
        self.nav_links = []
        self.footer_links = []
        self.in_nav = False
        self.in_footer = False
        self._title_flag = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
            if self.in_nav:
                self.nav_links.append(attrs['href'])
            if self.in_footer:
                self.footer_links.append(attrs['href'])
        if tag == 'link':
            if attrs.get('rel') == 'canonical':
                self.canonical = attrs.get('href')
            if attrs.get('rel') == 'stylesheet':
                self.styles.append(attrs.get('href'))
        if tag == 'meta':
            if attrs.get('name') == 'description':
                self.meta_desc = attrs.get('content')
            if attrs.get('name') == 'robots':
                self.robots = attrs.get('content')
            if attrs.get('name') == 'twitter:card':
                self.twitter = attrs.get('content')
            if attrs.get('property') == 'og:url':
                self.og_url = attrs.get('content')
        if tag == 'title':
            self._title_flag = True
        if tag == 'h1':
            self.h1_count += 1
        if tag == 'script' and attrs.get('src'):
            self.scripts.append(attrs.get('src'))
        if tag == 'input':
            self.inputs.append(attrs)
        if tag == 'textarea':
            self.textareas.append(attrs)
        if tag == 'select':
            self.selects.append(attrs)
        if tag == 'label':
            self.labels.append(attrs.get('for'))
        if tag == 'nav':
            self.in_nav = True
        if tag == 'footer':
            self.in_footer = True

    def handle_endtag(self, tag):
        if tag == 'nav':
            self.in_nav = False
        if tag == 'footer':
            self.in_footer = False

    def handle_data(self, data):
        if self._title_flag:
            self.title = data.strip()
            self._title_flag = False

page_data = {}
all_titles = {}
all_desc = {}

for file in html_files:
    rel = str(file.relative_to(root)).replace('\\', '/')
    parser = LinkParser()
    content = file.read_text(encoding='utf-8')
    parser.feed(content)
    page_data[rel] = parser

    if parser.title:
        all_titles.setdefault(parser.title, []).append(rel)
    else:
        errors.append((rel, 'missing title'))

    if parser.meta_desc:
        all_desc.setdefault(parser.meta_desc, []).append(rel)
    else:
        errors.append((rel, 'missing meta description'))

    if not parser.canonical:
        errors.append((rel, 'missing canonical'))
    if not parser.robots:
        errors.append((rel, 'missing robots meta'))
    if not parser.twitter:
        errors.append((rel, 'missing twitter card'))
    if not parser.og_url:
        errors.append((rel, 'missing og:url'))
    if parser.h1_count != 1:
        errors.append((rel, f'h1 count {parser.h1_count}'))

    for bad in ['http://localhost', 'https://localhost', 'pages.dev']:
        if bad in content:
            errors.append((rel, f'bad ref {bad}'))

    for s in parser.scripts:
        if s.startswith('http://') or s.startswith('https://'):
            errors.append((rel, f'external script {s}'))
    for style in parser.styles:
        if style and (style.startswith('http://') or style.startswith('https://')):
            errors.append((rel, f'external stylesheet {style}'))

    if len(parser.inputs) + len(parser.selects) + len(parser.textareas) > 0 and len(parser.labels) == 0:
        errors.append((rel, 'form controls missing labels'))

for title, files in all_titles.items():
    if len(files) > 1:
        errors.append(('duplicate title', f'{title} -> {files}'))

for desc, files in all_desc.items():
    if len(files) > 1:
        errors.append(('duplicate description', f'{desc} -> {files}'))

for rel, parser in page_data.items():
    for href in parser.links:
        if any(href.startswith(x) for x in ['http://', 'https://', 'mailto:', 'tel:', 'javascript:']):
            continue
        if href.startswith('#'):
            continue
        if href.startswith('/'):
            target = href.lstrip('/')
            if target == '':
                target = 'index.html'
            if target.endswith('/'):
                target = target + 'index.html'
            if target not in page_paths and not (root / target).exists():
                errors.append((rel, f'broken absolute link {href}'))
        else:
            target = (pathlib.Path(rel).parent / href)
            target_norm = str(target).replace('\\', '/')
            if '?' in target_norm:
                target_norm = target_norm.split('?', 1)[0]
            if '#' in target_norm:
                target_norm = target_norm.split('#', 1)[0]
            if target_norm.endswith('/'):
                target_norm = target_norm + 'index.html'
            if target_norm and target_norm not in page_paths and not (root / target_norm).exists():
                errors.append((rel, f'broken relative link {href} -> {target_norm}'))

for rel, parser in page_data.items():
    expected = 'https://infravel.dev/' if rel == 'index.html' else 'https://infravel.dev/' + rel.replace('index.html', '')
    if parser.canonical != expected:
        errors.append((rel, f'canonical mismatch {parser.canonical} != {expected}'))
    if parser.og_url != expected:
        errors.append((rel, f'og:url mismatch {parser.og_url} != {expected}'))

reference_nav = None
reference_footer = None
for rel in sorted(page_data):
    parser = page_data[rel]
    if reference_nav is None:
        reference_nav = parser.nav_links
        reference_footer = parser.footer_links
        continue
    if parser.nav_links != reference_nav:
        errors.append((rel, f'nav mismatch {parser.nav_links}'))
    if parser.footer_links != reference_footer:
        errors.append((rel, f'footer mismatch {parser.footer_links}'))

print('pages:', sorted(page_paths))
print('sitemap paths:', sitemap_paths if sitemap.exists() else [])
print('errors count:', len(errors))
for e in errors:
    print(e)

if errors:
    sys.exit(1)
else:
    print('validation passed')
