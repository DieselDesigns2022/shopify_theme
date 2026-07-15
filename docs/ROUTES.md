# Routes

| Method | Route | Shopify template | Authentication | Current status | Purpose |
| --- | --- | --- | --- | --- | --- |
| GET | `/` | `index.json` | Public | Implemented | Homepage foundation. |
| GET | `/products/{handle}` | Planned product template | Public | Planned | Product detail pages. |
| GET | `/collections/{handle}` | Planned collection template | Public | Planned | Collection pages. |
| GET | `/collections/all` | Planned collection template | Public | Planned | All products collection. |
| GET | `/cart` | Planned cart template | Public | Planned | Cart page. |
| POST | `/cart/add` | Shopify cart endpoint | Public | Planned | Add items to cart. |
| POST | `/cart/change` | Shopify cart endpoint | Public | Planned | Change a cart line. |
| POST | `/cart/update` | Shopify cart endpoint | Public | Planned | Update cart quantities. |
| GET | `/search` | Planned search template | Public | Planned | Search results. |
| GET | `/pages/{handle}` | Planned page template | Public | Planned | Merchant pages. |
| GET | `/blogs/{blog}` | Planned blog template | Public | Planned | Blog listing. |
| GET | `/blogs/{blog}/{article}` | Planned article template | Public | Planned | Article page. |
| GET | `/404` | `404.json` | Public | Implemented | Not-found page. |
| GET/POST | Customer account routes | Shopify-managed | Customer authentication | Planned | Customer account pages managed by Shopify. |
