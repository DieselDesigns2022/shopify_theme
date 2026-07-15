# Security

## Platform Boundaries
Shopify hosts and renders the storefront. The theme is not an application server.

## Merchant-Controlled Content
Merchant text must be escaped unless intentionally rendered as rich text.

## Liquid Escaping
Use Liquid escaping filters for plain text values and safe URL helpers for links.

## Rich Text
Rich text settings are intentional and should be used only where formatted merchant content is required.

## Forms
Forms are planned for product and customer features.

## Line-Item Properties
Line-item properties are future functionality and must be validated by Shopify-supported behavior.

## File Uploads
File uploads are future functionality where Shopify supports them.

## Third-Party Apps
App code is outside the theme's direct control and must be reviewed before compatibility claims.

## Third-Party Scripts
No third-party scripts are included in Phase 1.

## Secrets
No secrets, tokens, passwords, private store data, or `.env` files belong in theme code.

## Local Environment
Keep local credentials outside the repository.

## Dependencies
No runtime dependencies are included in Phase 1.

## External Links
External links must be intentional and valid. The Diesel Designs attribution link is required.

## Attribution Integrity
The Diesel Designs attribution may not be hidden, removed, disabled, unlinked, or made optional.

## Reporting Security Issues
Report security concerns to the repository owner before public disclosure.
