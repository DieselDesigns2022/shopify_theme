# Previous Diesel Designs Theme — Audit Reference

This is a read-only structural and visual-startup reference extracted from the user-provided `Theme by Diesel Designs.zip`. Do not copy its code. Use it to understand the expected level of premade homepage assembly and merchant-ready defaults.

## Homepage Assembly

The reference homepage contains **25 configured sections** in this exact order:

1. `custom-liquid` — 0 configured block(s)
2. `marquee-section` — 4 configured block(s)
3. `custom-liquid` — 0 configured block(s)
4. `image-banner` — 0 configured block(s)
5. `image-banner` — 0 configured block(s)
6. `featured-collection` — Featured collection — 0 configured block(s)
7. `image-banner` — 0 configured block(s)
8. `collection-list` — Collection list — 15 configured block(s)
9. `image-banner` — 0 configured block(s)
10. `collection-list` — Collection list — 15 configured block(s)
11. `image-banner` — 0 configured block(s)
12. `custom-liquid` — 0 configured block(s)
13. `image-banner` — 0 configured block(s)
14. `apps` — 0 configured block(s)
15. `apps` — 1 configured block(s)
16. `apps` — 1 configured block(s)
17. `image-banner` — 0 configured block(s)
18. `custom-liquid` — 0 configured block(s)
19. `image-banner` — 0 configured block(s)
20. `newsletter` — 2 configured block(s)
21. `image-banner` — 0 configured block(s)
22. `contact-form` — 0 configured block(s)
23. `custom-liquid` — 0 configured block(s)
24. `custom-liquid` — 0 configured block(s)
25. `marquee-section` — 4 configured block(s)

### Practical Homepage Pattern

- Custom welcome content directly at the top.
- A four-message promotional/payment marquee.
- Additional custom introductory content.
- Multiple full-width clickable image banners used as welcome, category, service, promotional, social, and divider graphics.
- A configured featured collection showing products.
- Two separate collection-list sections, each preloaded with 15 collection blocks.
- App/review/trust sections already placed in the page flow.
- Newsletter signup with configured content blocks.
- Contact form already included.
- Final custom content and closing marquee.
- The merchant starts by replacing graphics, choosing collections, and removing unnecessary sections—not by building a page from zero.

## Header and Footer Defaults

- Header logo position: top center.
- Desktop navigation: dropdown menu.
- Mobile logo position: center.
- Custom configured color schemes.
- Footer contains a menu column, a long brand/about message, a business-hours image, social icons, payment icons, and an app block.
- Footer content is already populated and branded rather than empty.

## Visual Defaults

- Heading font: `abel_n4`
- Body font: `open_sans_condensed_n3`
- Page width: `1600`
- Section spacing: `0`
- Button radius: `0`
- Variant pill radius: `40`
- Card style: `standard`
- Card corner radius: `0`
- Card text alignment: `center`
- Cart behavior: `notification`
- The page relies heavily on fully designed custom graphics, which create a visually complete storefront even before a client replaces them.
- The reference is branded and content-rich. It is not a neutral empty starter canvas.
- The audit should compare whether the new theme provides an equally complete starting structure while remaining original and broadly customizable.

## Reference Theme Template Coverage

- `templates/404.json`
- `templates/article.json`
- `templates/blog.blog-sal.json`
- `templates/blog.json`
- `templates/cart.json`
- `templates/collection.json`
- `templates/customers/account.json`
- `templates/customers/activate_account.json`
- `templates/customers/addresses.json`
- `templates/customers/login.json`
- `templates/customers/order.json`
- `templates/customers/register.json`
- `templates/customers/reset_password.json`
- `templates/gift_card.liquid`
- `templates/index.json`
- `templates/list-collections.json`
- `templates/page.contact.json`
- `templates/page.faqs-page.json`
- `templates/page.gallery-page.json`
- `templates/page.json`
- `templates/password.json`
- `templates/product.json`
- `templates/search.json`

## Key Reference Section Files

- `sections/announcement-bar.liquid`
- `sections/header.liquid`
- `sections/marquee-section.liquid`
- `sections/image-banner.liquid`
- `sections/featured-collection.liquid`
- `sections/collection-list.liquid`
- `sections/featured-product.liquid`
- `sections/image-with-text.liquid`
- `sections/multicolumn.liquid`
- `sections/collapsible-content.liquid`
- `sections/email-signup-banner.liquid`
- `sections/newsletter.liquid`
- `sections/contact-form.liquid`
- `sections/footer.liquid`
- `sections/main-product.liquid`
- `sections/main-collection-product-grid.liquid`
- `sections/main-list-collections.liquid`

## Audit Rule

Do not treat the reference theme as code to copy. Treat it as evidence that the expected deliverable is a complete, populated, visually intentional starting storefront. The new theme may use different sections and original styling, but it should provide comparable setup speed and visible completeness.
