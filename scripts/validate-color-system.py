#!/usr/bin/env python3
"""Static contract checks for the merchant section/block color system."""
from __future__ import annotations
import collections
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = ROOT / "sections"
SNIPPET = (ROOT / "snippets/custom-color-scope.liquid").read_text()
CSS = (ROOT / "assets/base.css").read_text()
errors: list[str] = []

def fail(message: str) -> None:
    errors.append(message)

def schema(path: Path) -> dict:
    matches = re.findall(r"{% schema %}\s*(.*?)\s*{% endschema %}", path.read_text(), re.S)
    if len(matches) != 1:
        fail(f"{path.name}: expected one schema, found {len(matches)}")
        return {}
    try:
        return json.loads(matches[0])
    except json.JSONDecodeError as error:
        fail(f"{path.name}: invalid schema JSON: {error}")
        return {}

# The shared snippet must be entirely opt-in and the base stylesheet must not
# globally restyle Shopify section wrappers.
for forbidden in (
    r"\.shopify-section\s*\{",
    r"\.shopify-section\s+h[1-6]",
    r"\.shopify-section\s+a",
    r"\.shopify-section\s+input",
    r"\.shopify-section\s+\[class\*=['\"]__card",
):
    if re.search(forbidden, CSS):
        fail(f"unconditional section consumer remains: {forbidden}")
if SNIPPET.find("<style>") < SNIPPET.find("if section.settings.use_custom_colors"):
    fail("section styles are emitted before the section opt-in guard")
block_guard = SNIPPET.find("if color_block.settings.use_custom_block_colors")
if block_guard < 0 or SNIPPET.find("<style>", block_guard) < block_guard:
    fail("block styles are not inside the block opt-in guard")

section_count = 0
all_custom_settings: dict[str, list[str]] = collections.defaultdict(list)
for path in sorted(SECTIONS.glob("*.liquid")):
    data = schema(path)
    if not data:
        continue
    section_count += 1
    settings = data.get("settings", [])
    ids = [item.get("id") for item in settings if item.get("id")]
    if len(ids) != len(set(ids)):
        fail(f"{path.name}: duplicate section setting ID")
    if len(settings) > 50:
        fail(f"{path.name}: section has {len(settings)} settings")
    toggle = next((item for item in settings if item.get("id") == "use_custom_colors"), None)
    if not toggle or toggle.get("default") is not False:
        fail(f"{path.name}: section colors are not disabled by default")
    if "render 'custom-color-scope', section: section" not in path.read_text():
        fail(f"{path.name}: shared scope render is missing")
    for item in settings:
        setting_id = item.get("id", "")
        if item.get("type") == "color" and setting_id.startswith("custom_"):
            all_custom_settings[setting_id].append(path.name)
            if setting_id not in SNIPPET:
                fail(f"{path.name}: {setting_id} has no shared producer/reference")
    for block in data.get("blocks", []):
        block_settings = block.get("settings", [])
        block_ids = [item.get("id") for item in block_settings if item.get("id")]
        if len(block_ids) != len(set(block_ids)):
            fail(f"{path.name}/{block.get('type')}: duplicate block setting ID")
        if len(block_settings) > 50:
            fail(f"{path.name}/{block.get('type')}: block has {len(block_settings)} settings")
        block_toggle = next((item for item in block_settings if item.get("id") == "use_custom_block_colors"), None)
        if block_toggle and block_toggle.get("default") is not False:
            fail(f"{path.name}/{block.get('type')}: block colors are not disabled by default")
        for item in block_settings:
            setting_id = item.get("id", "")
            if item.get("type") == "color" and setting_id.startswith("block_"):
                if setting_id not in SNIPPET:
                    fail(f"{path.name}/{block.get('type')}: {setting_id} has no consumer")

if section_count != 47:
    fail(f"expected 47 Liquid section schemas, found {section_count}")

# Exact important producer/consumer mappings.
expected = {
    "custom_badge_background": "--color-badge-bg",
    "custom_badge_text": "--color-badge-text",
    "custom_sale": "--color-sale",
    "custom_sold_out": "--color-sold-out",
    "custom_card_background": "--card-background",
    "custom_card_border": "--card-border-color",
    "custom_input_background": "--color-input-background",
    "custom_input_text": "--color-input-text",
    "custom_input_border": "--color-input-border",
    "custom_focus": "--color-focus",
}
for setting_id, token in expected.items():
    if setting_id in all_custom_settings and not re.search(rf"{re.escape(token)}:\s*{{{{ section\.settings\.{setting_id} }}}}", SNIPPET):
        fail(f"{setting_id} does not produce {token}")
if "--color-badge-background" in SNIPPET + CSS:
    fail("obsolete --color-badge-background token is present")

# Every property produced by the snippet must have a var() consumer in the
# actual theme CSS or an enabled-instance rule in the snippet.
emitted = {
    token for token in re.findall(r"(--[a-z0-9-]+)\s*:", SNIPPET)
    if token.startswith(("--color-", "--card-", "--section-", "--announcement-", "--marquee-", "--hero-", "--promo-"))
}
consumers = set(re.findall(r"var\((--[a-z0-9-]+)", CSS + SNIPPET))
for token in sorted(emitted - consumers):
    fail(f"emitted token has no CSS consumer: {token}")

welcome = schema(SECTIONS / "welcome-banner.liquid")
welcome_ids = [item.get("id") for item in welcome.get("settings", [])]
if sum(item in {"background_color", "custom_background"} for item in welcome_ids) != 1:
    fail("Welcome banner must expose exactly one surrounding-background picker")
welcome_source = (SECTIONS / "welcome-banner.liquid").read_text()
for path in (".banner__content { color: var(--color-text)", "h1", "a:not(.button):hover", ".button"):
    if path not in SNIPPET:
        fail(f"Welcome/banner enabled consumer missing: {path}")
if "background-color: {{ section.settings.background_color }}" not in welcome_source:
    fail("Welcome banner no longer preserves its saved background_color value")

promo = schema(SECTIONS / "promo-banner.liquid")
promo_ids = [item.get("id") for item in promo.get("settings", [])]
if sum(item in {"fallback_background", "custom_background"} for item in promo_ids) != 1:
    fail("Promo banner must expose exactly one fallback/background picker")
promo_source = (SECTIONS / "promo-banner.liquid").read_text()
for required in ("if section.settings.use_custom_colors", "assign promo_text = section.settings.custom_text", "--promo-fallback:{{ section.settings.fallback_background }}"):
    if required not in promo_source:
        fail(f"Promo banner custom/legacy contract missing: {required}")

for required in (
    "var(--color-footer-heading, var(--color-footer-text))",
    "var(--color-footer-link, var(--color-footer-text))",
    ".site-footer a:not(.button):hover",
    ".site-footer__localization .localization-form",
    "min-height: 44px",
):
    if required not in CSS:
        fail(f"footer contract missing: {required}")
if "body[data-link-hover" in SNIPPET:
    fail("custom link-hover consumers incorrectly depend on the animation toggle")
if '[data-color-block-id="{{ color_block.id }}"] a:not(.button):hover' not in SNIPPET:
    fail("block-specific link hover consumer is missing")

# Text-style buttons are links, not secondary filled buttons. Keep their
# contract independent even when a section has custom button colors enabled.
if re.search(r"\.button--secondary\s*,[^{}]*\.button--text|\.button--text\s*,[^{}]*\.button--secondary", SNIPPET):
    fail(".button--text is grouped with .button--secondary")
text_button_rule = re.search(r"\.button--text\s*\{([^}]*)\}", SNIPPET)
text_button_hover_rule = re.search(r"\.button--text:hover\s*\{([^}]*)\}", SNIPPET)
for label, rule, required_values in (
    ("normal", text_button_rule, ("background: transparent", "color: var(--color-link)", "border-color: transparent", "padding-inline: 0", "text-decoration: underline")),
    ("hover", text_button_hover_rule, ("background: transparent", "color: var(--color-link-hover)", "border-color: transparent")),
):
    if not rule or any(value not in rule.group(1) for value in required_values):
        fail(f"enabled .button--text {label} contract is incomplete")

hero_source = (SECTIONS / "hero-slideshow.liquid").read_text()
for required in (
    "assign hero_fallback = block.settings.background",
    "if block.settings.use_custom_block_colors",
    "assign hero_fallback = block.settings.block_background_color",
    "--hero-fallback:{{ hero_fallback }}",
):
    if required not in hero_source:
        fail(f"Hero effective block background contract missing: {required}")
if "--hero-fallback:{{ block.settings.background }}" in hero_source:
    fail("Hero inline fallback still defeats the custom block background")

# Hero is the only colored-block section with local inline color values; its
# text values deliberately use the effective --color-text variable. No other
# colored block may directly inline a block color setting.
for path in sorted(SECTIONS.glob("*.liquid")):
    data = schema(path)
    if not any(any(item.get("id") == "use_custom_block_colors" for item in block.get("settings", [])) for block in data.get("blocks", [])):
        continue
    body = path.read_text().split("{% schema %}", 1)[0]
    inline_colors = re.findall(r'style="[^"]*block\.settings\.(?:background|text_color)[^"]*"', body)
    if inline_colors and path.name != "hero-slideshow.liquid":
        fail(f"{path.name}: inline block color defeats its scoped override")
    if path.name == "hero-slideshow.liquid" and any("var(--color-text" not in value for value in inline_colors):
        fail("Hero inline block text does not consume the effective text token")

marquee_source = (SECTIONS / "marquee.liquid").read_text()
marquee_item = re.search(r'<span class="marquee__item"([^>]*)>', marquee_source)
if not marquee_item or 'data-color-block-id="{{ block.id }}"' not in marquee_item.group(1):
    fail("both Marquee copies do not receive the block color target")
if marquee_source.count("block.shopify_attributes") != 1 or "if copy_index == 1" not in marquee_item.group(1):
    fail("Marquee editor attributes must occur only on the canonical first copy")

desktop_mega = (ROOT / "snippets/header-mega-menu.liquid").read_text()
mobile_mega = (ROOT / "snippets/mobile-menu-links.liquid").read_text()
if 'data-color-block-id="{{ block.id }}"' not in desktop_mega:
    fail("desktop mega-menu block target is missing")
if 'data-color-block-id="{{ mobile_mega_block.id }}"' not in mobile_mega:
    fail("mobile mega-menu block target is missing")
if "if mobile_mega_block != blank" not in mobile_mega:
    fail("mobile mega-menu block target is not guarded against empty panels")
if desktop_mega.count("block.shopify_attributes") != 1 or mobile_mega.count("mobile_mega_block.shopify_attributes") != 1:
    fail("mega-menu editor attributes must occur once per visual representation")

expected_badge_sections = {"featured-collection.liquid", "main-collection-product-grid.liquid", "main-search.liquid"}
actual_badge_sections = set(all_custom_settings.get("custom_badge_background", []))
if actual_badge_sections != expected_badge_sections:
    fail(f"badge controls do not match real product-card badge sections: {sorted(actual_badge_sections)}")
for path in sorted(SECTIONS.glob("*.liquid")):
    data = schema(path)
    has_colored_block = any(
        any(item.get("id") == "use_custom_block_colors" for item in block.get("settings", []))
        for block in data.get("blocks", [])
    )
    if has_colored_block and "data-color-block-id" not in path.read_text():
        if path.name != "header.liquid" or "data-color-block-id" not in (ROOT / "snippets/header-mega-menu.liquid").read_text():
            fail(f"{path.name}: colored block has no exact visible block target")

# All Shopify forms continue using supported literal form types. Dynamic form
# names would bypass Shopify's parser and are forbidden by this theme contract.
supported_forms = {
    "activate_customer_password", "contact", "create_customer", "customer",
    "customer_address", "customer_login", "guest_login", "localization",
    "new_comment", "product", "recover_customer_password", "reset_customer_password",
}
for path in list(SECTIONS.glob("*.liquid")) + list((ROOT / "snippets").glob("*.liquid")):
    source = path.read_text()
    for form_tag in re.findall(r"{%[- ]*form\b.*?%}", source, re.S):
        if re.search(r"\bid\s*:\s*[^,%}]*\|", form_tag):
            fail(f"{path.relative_to(ROOT)}: filtered expression inside form id argument")
    for form_name in re.findall(r"{%[- ]*form\s+['\"]([^'\"]+)['\"]", source):
        if form_name not in supported_forms:
            fail(f"{path.relative_to(ROOT)}: unsupported form literal {form_name}")

# Generated Shopify JSON contains a leading comment; strip it before parsing.
for path in list((ROOT / "templates").rglob("*.json")) + list(SECTIONS.glob("*-group.json")):
    raw = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.S)
    try:
        json.loads(raw)
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)}: invalid JSON: {error}")

# Theme style payloads, merchant settings data, and templates are outside this batch.
result = subprocess.run(
    ["git", "diff", "HEAD^", "--", "config/settings_data.json", "config/settings_schema.json", "templates"],
    cwd=ROOT, capture_output=True, text=True, check=False,
)
if result.stdout:
    fail("theme presets, merchant settings data, or templates changed")

changed_files = subprocess.run(
    ["git", "diff", "--name-only", "HEAD^"], cwd=ROOT, capture_output=True, text=True, check=False,
).stdout.splitlines()
for changed_file in changed_files:
    allowed = (
        changed_file == "assets/base.css"
        or changed_file == "scripts/validate-color-system.py"
        or changed_file.startswith("sections/") and changed_file.endswith((".liquid", ".json"))
        or changed_file in {
            "snippets/custom-color-scope.liquid", "snippets/header-mega-menu.liquid", "snippets/mobile-menu-links.liquid"
        }
    )
    if not allowed:
        fail(f"unrelated file in cumulative color-system change set: {changed_file}")

if errors:
    print("COLOR SYSTEM VALIDATION FAILED")
    print("\n".join(f"- {error}" for error in errors))
    sys.exit(1)
print(f"PASS: {section_count} schemas; {sum(map(len, all_custom_settings.values()))} section color declarations; scoped consumers and token contract verified")
