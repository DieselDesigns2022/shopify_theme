#!/usr/bin/env python3
"""Validate optional color settings against their real scoped consumers."""
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; errors=[]
SYNTHETIC_DEFAULTS={
'custom_background':'#ffffff','custom_background_secondary':'#f5f5f5','custom_text':'#222222','custom_muted_text':'#666666','custom_heading':'#111111','custom_link':'#222222','custom_link_hover':'#555555','custom_border':'#dddddd','custom_primary_button_background':'#222222','custom_primary_button_text':'#ffffff','custom_primary_button_hover_background':'#444444','custom_primary_button_hover_text':'#ffffff','custom_secondary_button_background':'#ffffff','custom_secondary_button_text':'#222222','custom_secondary_button_border':'#222222','custom_secondary_button_hover_background':'#eeeeee','custom_secondary_button_hover_text':'#111111','custom_input_background':'#ffffff','custom_input_text':'#222222','custom_input_border':'#777777','custom_focus':'#2463eb','custom_card_background':'#ffffff','custom_card_text':'#222222','custom_card_heading':'#111111','custom_card_border':'#dddddd','custom_card_link':'#222222','custom_card_link_hover':'#555555','custom_badge_background':'#222222','custom_badge_text':'#ffffff','custom_sale':'#b42318','custom_sold_out':'#666666','block_background_color':'#ffffff','block_border_color':'#dddddd','block_text_color':'#222222','block_heading_color':'#111111','block_link_color':'#222222','block_link_hover_color':'#555555'}
BUTTON_TOKENS={'custom_primary_button_background':'--color-button-primary-bg','custom_primary_button_text':'--color-button-primary-text','custom_primary_button_hover_background':'--color-button-primary-hover-bg','custom_primary_button_hover_text':'--color-button-primary-hover-text','custom_secondary_button_background':'--color-button-secondary-bg','custom_secondary_button_text':'--color-button-secondary-text','custom_secondary_button_border':'--color-button-secondary-border','custom_secondary_button_hover_background':'--color-button-secondary-hover-bg','custom_secondary_button_hover_text':'--color-button-secondary-hover-text'}
STATUS_TOKENS={'custom_badge_background':'--color-badge-bg','custom_badge_text':'--color-badge-text','custom_sale':'--color-sale','custom_sold_out':'--color-sold-out'}
snippet=(ROOT/'snippets/custom-color-scope.liquid').read_text(); css=(ROOT/'assets/base.css').read_text()
def fail(x): errors.append(x)
def schema(p):
 m=re.findall(r'{% schema %}\s*(.*?)\s*{% endschema %}',p.read_text(),re.S)
 if len(m)!=1: fail(f'{p.name}: expected one schema'); return {}
 try:return json.loads(m[0])
 except Exception as e: fail(f'{p.name}: invalid schema: {e}'); return {}
count=0
for p in sorted((ROOT/'sections').glob('*.liquid')):
 d=schema(p)
 if not d: continue
 count+=1
 if len(d.get('settings',[]))>50: fail(f'{p.name}: {len(d["settings"])} section settings exceeds 50')
 if "render 'custom-color-scope', section: section" not in p.read_text(): fail(f'{p.name}: missing shared scope')
 for owner,settings in [('section',d.get('settings',[]))]+[(b.get('type'),b.get('settings',[])) for b in d.get('blocks',[])]:
  if len(settings)>50: fail(f'{p.name}/{owner}: block settings exceeds 50')
  ids=[x.get('id') for x in settings if x.get('id')]
  if len(ids)!=len(set(ids)): fail(f'{p.name}/{owner}: duplicate IDs')
  for x in settings:
   i=x.get('id','')
   if i in ('use_custom_colors','use_custom_block_colors'): fail(f'{p.name}: obsolete toggle')
   if x.get('type')=='color' and i.startswith(('custom_','block_')):
    if 'default' in x: fail(f'{p.name}/{i}: optional color has default')
    if x.get('placeholder')!='Inherited from theme style': fail(f'{p.name}/{i}: missing inheritance placeholder')
    guard=(f'if section.settings.{i} != blank' if i.startswith('custom_') else f'if color_block.settings.{i} != blank')
    if guard not in snippet: fail(f'{p.name}/{i}: no independent nonblank consumer')
if re.search(r'use_custom_(?:block_)?colors', ''.join(p.read_text() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts and p.name != 'validate-color-system.py')): fail('obsolete toggle reference remains')
# Exact established token mappings; malformed generated names are forbidden.
for bad in ('primary-button','secondary-button','--color-button-primary-button-','--color-button-secondary-button-'):
 if bad in snippet: fail(f'malformed generated button token contains {bad}')
if 'button_roles' in snippet or 'for role in button_roles' in snippet: fail('dynamic button token generator remains')
for setting,token in {**BUTTON_TOKENS,**STATUS_TOKENS}.items():
 pattern=rf'{re.escape(token)}:\s*{{{{ section\.settings\.{setting} }}}}'
 if not re.search(pattern,snippet): fail(f'{setting}: missing exact token {token}')
for selector in ('.badge,','.product-card__badge','.price--sale','.product-price__sale','.sale-price','.badge--sold-out'):
 if selector not in snippet: fail(f'missing badge/price selector {selector}')
if '--color-badge-background' in snippet+css: fail('obsolete --color-badge-background token remains')

# Configuration migration must be exactly removal of toggles and matching synthetic defaults.
def parse_json(raw): return json.loads(re.sub(r'/\*.*?\*/','',raw,count=1,flags=re.S))
def migrate(v):
 if isinstance(v,dict):
  for k in list(v):
   if k in ('use_custom_colors','use_custom_block_colors'): del v[k]
   elif k in SYNTHETIC_DEFAULTS and isinstance(v[k],str) and v[k]==SYNTHETIC_DEFAULTS[k]: del v[k]
   else: migrate(v[k])
 elif isinstance(v,list):
  for x in v: migrate(x)
for relative in ('templates/index.json','sections/footer-group.json'):
 current=parse_json((ROOT/relative).read_text())
 baseline_raw=subprocess.run(['git','show',f'HEAD^:{relative}'],cwd=ROOT,text=True,capture_output=True,check=True).stdout
 expected=parse_json(baseline_raw); migrate(expected)
 if current!=expected: fail(f'{relative}: migration changed content, resources, IDs, order, or unrelated settings')
 def stale(v,path=''):
  if isinstance(v,dict):
   for k,x in v.items():
    if k in SYNTHETIC_DEFAULTS and isinstance(x,str) and x==SYNTHETIC_DEFAULTS[k]: fail(f'{relative}: synthetic default remains at {path}/{k}')
    stale(x,f'{path}/{k}')
  elif isinstance(v,list):
   for n,x in enumerate(v): stale(x,f'{path}/{n}')
 stale(current)
# Known merchant selections guard against an over-broad migration.
index=parse_json((ROOT/'templates/index.json').read_text()); footer=parse_json((ROOT/'sections/footer-group.json').read_text())
serialized=json.dumps(index); footer_serialized=json.dumps(footer)
for value in ('#B42C92','#F0D1D1','#3EB793','#7C3AC8'):
 if value not in serialized: fail(f'merchant selection {value} was removed from index')
if '#F0D1D1' not in footer_serialized: fail('merchant footer menu heading selection was removed')

# Independent guards and exact visible card/footer routes.
for setting in ('custom_background','custom_text','custom_link_hover','custom_card_background','custom_card_text','custom_card_heading','custom_card_border','custom_card_link','custom_card_link_hover'):
 if f'if section.settings.{setting} != blank' not in snippet: fail(f'{setting}: missing independent blank guard')
for selector in ('.collection-showcase__card','.collection-showcase__content h3','.collection-showcase__link:hover','.product-card__content','.product-card__title a','.product-card a:not(.button):hover'):
 if selector not in snippet: fail(f'missing visible card selector {selector}')
for selector in ('.site-footer__description','.site-footer__block','.site-footer__localization label','.site-footer__bottom'):
 if selector not in snippet: fail(f'missing footer text selector {selector}')
for p in (ROOT/'sections/collection-showcase.liquid',ROOT/'sections/featured-collection.liquid'):
 ids={x.get('id') for x in schema(p).get('settings',[])}
 required={'custom_card_background','custom_card_text','custom_card_heading','custom_card_border','custom_card_link','custom_card_link_hover'}
 if not required<=ids: fail(f'{p.name}: missing card controls {sorted(required-ids)}')
# No arbitrary background fallback or unconditional scoped declarations.
if 'section.settings.background' in snippet or 'scope_background' in snippet: fail('unsafe generic background fallback remains')
# Compact localization and text-link contract.
for token in ('height: 34px','min-height: 34px','font-size: 12px','width: auto','justify-self: start'):
 if token not in css: fail(f'compact footer localization missing {token}')
for token in ('background: transparent','border-color: transparent','padding-inline: 0','text-decoration: underline','color: var(--color-link-hover)'):
 if token not in css: fail(f'text button contract missing {token}')
# Preservation: literal supported forms, JSON templates/groups, hero/marquee/mega-menu targets.
supported={'activate_customer_password','contact','create_customer','customer','customer_address','customer_login','guest_login','localization','new_comment','product','recover_customer_password','reset_customer_password'}
for p in list((ROOT/'sections').glob('*.liquid'))+list((ROOT/'snippets').glob('*.liquid')):
 if re.search(r"{%[- ]*form[^%]*\bid\s*:\s*[^,%}]*\|",p.read_text(),re.S): fail(f'{p.name}: filtered expression inside form id')
 for name in re.findall(r"{%[- ]*form\s+['\"]([^'\"]+)",p.read_text()):
  if name not in supported: fail(f'{p.name}: unsupported form {name}')
for p in list((ROOT/'templates').rglob('*.json'))+list((ROOT/'sections').glob('*-group.json')):
 try: json.loads(re.sub(r'/\*.*?\*/','',p.read_text(),flags=re.S))
 except Exception as e: fail(f'{p}: invalid JSON {e}')
hero=(ROOT/'sections/hero-slideshow.liquid').read_text(); marquee=(ROOT/'sections/marquee.liquid').read_text()
for token in ('block.settings.block_background_color | default: block.settings.background','--hero-fallback:{{ hero_fallback }}'):
 if token not in hero: fail(f'hero preservation missing {token}')
if 'if copy_index == 1' not in marquee or 'data-color-block-id="{{ block.id }}"' not in marquee or marquee.count('block.shopify_attributes') != 1: fail('marquee copies/editor-attributes contract missing')
if 'data-color-block-id="{{ block.id }}"' not in (ROOT/'snippets/header-mega-menu.liquid').read_text(): fail('desktop mega-menu target missing')
if 'data-color-block-id="{{ mobile_mega_block.id }}"' not in (ROOT/'snippets/mobile-menu-links.liquid').read_text(): fail('mobile mega-menu target missing')
if errors: print('COLOR SYSTEM VALIDATION FAILED\n'+'\n'.join('- '+x for x in errors));sys.exit(1)
print(f'PASS: {count} schemas; optional independent colors and visible selector routes verified')
