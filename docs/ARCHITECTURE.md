# Architecture

## Architectural Goals
Create an original, accessible, Shopify Online Store 2.0 foundation for future Diesel Designs theme development.

## Design Philosophy
The theme starts neutral, merchant-customizable, mobile-first, and physical-product-friendly without forcing niche visual styling.

## Online Store 2.0
The theme uses JSON templates, section groups, configurable sections, snippets, assets, locales, and global settings.

## Rendering Model
Shopify renders Liquid on its platform. The repository contains theme source only and no application server.

## Layout Architecture
`layout/theme.liquid` owns document structure, metadata, global assets, skip link, header group, main content, and footer group.

## Template Architecture
JSON templates define section order. Phase 1 implements homepage and 404 templates only.

## Section Group Architecture
Header and footer section groups are used because Shopify expects shared site regions to be globally managed and editable.

## Section Architecture
Sections are independent and rearrangeable. Banners are separate sections so merchants can place welcome, promotional, and divider graphics independently.

## Block Architecture
Footer blocks support menu and text content. Product and merchandising blocks are deferred.

## Snippet Architecture
Icon snippets are reusable to avoid duplicated SVG code and keep header markup consistent.

## Asset Architecture
Global CSS and JavaScript are loaded once from Shopify assets. No external CSS or JavaScript is used.

## Settings Architecture
Global settings define shared branding, colors, typography, layout widths, horizontal padding, reusable component styling, forms, cards, images, animation behavior, social URLs, contact fallback values, and utility visibility that gates header rendering in Liquid. Phase 4 exposes these settings through documented CSS variables in `layout/theme.liquid` and reusable classes in `assets/base.css`; banner-specific settings remain in banner sections.

## Locale Architecture
Locale files hold reusable interface and Theme Editor text.

## Banner Architecture
Welcome, image, and divider banners support desktop and mobile images, fallback behavior, and optional links without requiring text or overlays.

## Header Architecture
The header includes logo/store name, main menu, search, account, cart, and mobile drawer foundations. Mega menus and predictive search are planned.

## Footer Architecture
The footer includes optional logo, store description, menu blocks, text blocks, copyright, and permanent attribution.

## Attribution Architecture
The Diesel Designs attribution is hardcoded into footer output, outside optional blocks, and is not a merchant setting because every completed installation must display it.

## Product Architecture
Full product architecture is deferred so it can be designed around physical products, variants, swatches, personalization, and app blocks in later phases.

## Cart Architecture
Cart architecture is deferred. Phase 1 includes only a cart link and cart count.

## Metafield and Metaobject Strategy
Future metafields and metaobjects will provide structured product and content data when the related features are implemented.

## Accessibility Architecture
The foundation includes landmarks, skip link, focus-visible states using the configured focus color, keyboard mobile navigation, ARIA state updates, alt handling, 44-pixel interactive targets, and reduced-motion support that disables global animation effects.

## Performance Architecture
The foundation avoids frameworks, external scripts, oversized JavaScript, and unnecessary global features.

## Security Boundaries
Shopify owns commerce data and rendering. Theme code must escape merchant-controlled plain text and contain no secrets.

## Future Expansion
Future phases add product, collection, cart, search, account, mega menu, swatch, personalization, and app block systems.
