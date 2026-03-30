# Shopflow Frontend Overview

Last refreshed: 2026-03-30

This document describes the expected frontend surface for the first buyer and
seller apps only. It is based on the current backend state on `stage`.

It is intentionally product-facing:
- what pages exist
- what each page should show
- which backend endpoints feed the page
- what data the frontend should expect
- what is still missing or should be handled as a known limitation

## Scope

Included:
- buyer experience
- seller experience
- shared auth and public pages

Not included:
- admin dashboard
- final finance reporting UI
- advanced moderation tooling

## Shared Frontend Foundations

### App shell

The frontend should have 2 main authenticated experiences:
- buyer app
- seller portal

Shared public pages can be reused across both:
- landing / home
- product discovery
- seller storefront
- auth pages

### Session and bootstrap data

The frontend should fetch these early:

1. Public platform config
- endpoint: `GET /api/v1/platform-config/public`
- use for:
  - platform name
  - market identity
  - country / currency defaults
  - public runtime flags

2. Auth session
- login: `POST /api/v1/auth/login`
- refresh: `POST /api/v1/auth/refresh`
- logout: `POST /api/v1/auth/logout`

3. Current role-aware app state
- buyer and seller share auth, but their dashboards should branch by `role`
- seller app should also fetch onboarding status before enabling product flows

### Media flow

Frontend media uploads should use:

1. `POST /api/v1/media/upload-url`
2. direct upload to S3 using the returned presigned URL
3. save returned/public CloudFront URL in the next catalog or feed request

The frontend should treat image upload as first-class.
Video support exists in the data model, but processing automation is not yet
finished.

## Buyer Experience

### 1. Landing / Home

Purpose:
- brand introduction
- featured products
- seller discovery
- entry point into feed and catalog

Primary data:
- public config
- catalog product list
- feed explore list

Useful endpoints:
- `GET /api/v1/platform-config/public`
- `GET /api/v1/catalog/products?page=1&limit=20`
- `GET /api/v1/feed/explore`

Expected UI blocks:
- hero / value proposition
- featured products carousel or grid
- trending feed posts
- featured sellers
- sign in / sign up CTA

### 2. Buyer Sign Up / Sign In

Pages:
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

Endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/verify-email/resend`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Expected register fields:
- `email`
- `password`
- `firstName`
- `lastName`
- optional `role`

Expected login fields:
- `email`
- `password`
- optional `expectedRole`

### 3. Product Discovery / Catalog Listing

Page:
- `/shop`

Purpose:
- browse active products
- filter by category later
- open a product detail page

Endpoint:
- `GET /api/v1/catalog/products?page=1&limit=20`
- `GET /api/v1/catalog/categories`

Expected product card data:
- product id
- title
- base price / effective price
- currency
- primary image
- seller/store name
- discount state if applicable
- tags

Recommended UI:
- product grid
- category tabs or dropdown
- sort/filter shell even if backend filtering is still light

### 4. Product Detail

Page:
- `/products/:id`

Endpoint:
- `GET /api/v1/catalog/products/:id`

Expected data:
- title
- description
- base price
- effective price
- currency
- media gallery
- variants
- stock
- handling days
- seller profile summary
- tags
- related product CTA later

Primary actions:
- add to cart
- message seller
- view seller storefront

### 5. Seller Storefront

Page:
- `/store/:slug`

Endpoint:
- `GET /api/v1/sellers/:slug/storefront`

Expected data:
- store name
- store slug
- bio
- logo
- banner
- support email / phone
- seller status
- seller products

Primary actions:
- browse seller products
- follow seller
- message seller

### 6. Feed / Social Discovery

Pages:
- `/feed`
- `/feed/post/:id`

Endpoints:
- `GET /api/v1/feed`
- `GET /api/v1/feed/explore`
- `GET /api/v1/feed/posts/:id`
- `POST /api/v1/feed/posts/:id/like`
- `GET /api/v1/feed/posts/:id/comments`
- `POST /api/v1/feed/posts/:id/comments`
- `POST /api/v1/feed/follow/:sellerProfileId`
- `DELETE /api/v1/feed/follow/:sellerProfileId`
- `GET /api/v1/feed/following`

Expected post data:
- post id
- content
- media array
- product tag if present
- seller/store info
- like count
- comment count
- created at

Frontend notes:
- only published posts are interactive
- video posts require thumbnail metadata
- tagged product should link back to product detail

### 7. Cart

Page:
- `/cart`

Endpoint:
- `GET /api/v1/cart`

Cart model:
- cart is grouped by seller
- buyer can shop across sellers
- checkout still happens per seller group

Endpoints:
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:id`
- `DELETE /api/v1/cart/items/:id`
- `DELETE /api/v1/cart/sellers/:sellerProfileId`

Expected data:
- seller group header
- seller info
- grouped items
- product summary
- variant summary
- quantity
- line totals

Primary actions:
- edit quantity
- remove item
- clear seller group
- checkout seller group

### 8. Checkout

Page:
- `/checkout/:sellerProfileId`

Primary endpoint:
- `POST /api/v1/cart/sellers/:sellerProfileId/checkout`

Supporting endpoints:
- `GET /api/v1/addresses`
- `GET /api/v1/addresses/defaults`

Expected checkout inputs:
- `deliveryAddressId` or raw `deliveryAddress`
- optional `billingAddressId`
- `useDeliveryAddressForBilling`
- optional `buyerNote`

Raw delivery address fields:
- `addressLine1`
- `addressLine2`
- `state`
- `lga`
- `postcode`
- `country`
- `recipientName`
- `recipientPhone`

Known limitation:
- first-time buyers can send raw `deliveryAddress`
- separate raw `billingAddress` is not yet implemented
- if billing differs and the buyer has no saved billing address, that is still a
  backend gap

### 9. Saved Addresses

Pages:
- `/account/addresses`
- modal or inline selector during checkout

Endpoints:
- `GET /api/v1/addresses`
- `GET /api/v1/addresses/defaults`
- `POST /api/v1/addresses`
- `PATCH /api/v1/addresses/:id`
- `POST /api/v1/addresses/:id/defaults`
- `DELETE /api/v1/addresses/:id`

Expected fields:
- `label`
- `addressLine1`
- `addressLine2`
- `state`
- `lga`
- `postcode`
- `country`
- `recipientName`
- `recipientPhone`
- `useForDelivery`
- `useForBilling`
- `isDefaultDelivery`
- `isDefaultBilling`

### 10. Order Waiting for Quote

Page:
- `/orders/:id`

Order flow:
- buyer creates order
- seller sends delivery quote
- buyer accepts or declines
- buyer pays only after quote acceptance

Endpoints:
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/quote-response`
- `POST /api/v1/orders/:id/cancel`

Expected data:
- order reference
- grouped items
- items total
- delivery quote history
- latest quote
- seller note
- buyer note
- delivery address
- current status

Statuses buyer should recognize:
- `awaiting_delivery_quote`
- `quote_sent`
- `quote_accepted`
- `payment_pending`
- `paid`
- fulfilment statuses after payment
- `cancelled`
- dispute / refund statuses

### 11. Payment / Checkout Redirect

Page:
- `/checkout/:orderId/payment`

Endpoints:
- `POST /api/v1/payments/checkout/:orderId`
- `POST /api/v1/payments/verify`

Expected init response:
- `reference`
- `provider`
- `authorizationUrl`
- `accessCode` when relevant
- provider response payload

Frontend behavior:
- initialize checkout after quote acceptance
- redirect to provider checkout URL
- on return, call verify with `reference`
- transition order UI from pending to paid state

### 12. Orders List and Order Detail

Pages:
- `/account/orders`
- `/account/orders/:id`

Endpoints:
- `GET /api/v1/orders/my`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/confirm-delivery`
- `POST /api/v1/orders/:id/disputes`

Expected detail blocks:
- order timeline
- item summary
- delivery address
- quote history
- payment state
- fulfilment event history
- dispute state
- refund state when applicable

Buyer actions by state:
- cancel before payment success
- accept or decline quote
- confirm delivery
- open dispute

### 13. Buyer Chat

Pages:
- `/messages`
- `/messages/:conversationId`

Endpoints:
- `POST /api/v1/chat/conversations/:sellerProfileId`
- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/:id/messages`
- `PATCH /api/v1/chat/conversations/:id/read`
- WebSocket for realtime send/receive

Expected data:
- conversation id
- seller summary
- last message
- unread count
- message list
- created at / updated at

Important backend rule:
- user must be a conversation participant
- frontend should not assume arbitrary conversation IDs are valid

## Seller Experience

### 1. Seller Sign Up / Sign In

Pages:
- `/seller/register`
- `/seller/login`

Same auth endpoints as buyer, but seller signup can include:
- `storeName`
- `role: seller`

Login should pass:
- `expectedRole: seller`

### 2. Seller Dashboard

Page:
- `/seller`

Primary endpoint:
- `GET /api/v1/sellers/me/analytics`

Expected dashboard summary:
- total orders
- paid orders
- completed orders
- cancelled orders
- open disputes
- refunded orders
- gross sales
- total refunds
- total payouts
- pending funds
- available funds
- order status breakdown
- top products
- recent orders
- recent payouts
- recent refunds

This page should be the main seller home.

### 3. Seller Onboarding Status

Page:
- `/seller/onboarding`

Endpoints:
- `GET /api/v1/sellers/me`
- `GET /api/v1/sellers/me/onboarding-status`
- `PATCH /api/v1/sellers/me/kyc`
- `PATCH /api/v1/sellers/me/bank-account`

Purpose:
- tell seller if they are ready to create products
- collect business and payout details

Expected onboarding data:
- seller profile
- KYC completeness
- bank verification state
- missing required fields
- `canCreateProducts`

KYC form fields:
- `businessName`
- `businessType`
- `rcNumber`
- `bvn`
- `nin`
- `idDocumentUrl`
- `addressLine1`
- `addressLine2`
- `state`
- `lga`
- `postcode`
- `country`

Bank form fields:
- `bankName`
- `bankCode`
- `accountNumber`
- `accountName`
- `isPrimary`

### 4. Seller Store Profile

Page:
- `/seller/store`

Endpoints:
- `GET /api/v1/sellers/me`
- `PATCH /api/v1/sellers/me`

Expected editable fields:
- `storeName`
- `storeSlug`
- `bio`
- `logoUrl`
- `bannerUrl`
- `supportEmail`
- `supportPhone`

The frontend should also show the public storefront preview link:
- `/store/:slug`

### 5. Seller Product List

Page:
- `/seller/products`

Endpoint:
- `GET /api/v1/catalog/me/products`

Expected list data:
- title
- status
- base price
- effective price
- stock summary
- primary media
- created date
- updated date

Actions:
- create new product
- edit product
- archive product

### 6. Create / Edit Product

Pages:
- `/seller/products/new`
- `/seller/products/:id/edit`

Endpoints:
- `POST /api/v1/catalog/products`
- `PATCH /api/v1/catalog/products/:id`
- `GET /api/v1/catalog/categories`
- `POST /api/v1/media/upload-url`

Expected form sections:
- basic info
  - title
  - description
  - category
  - tags
- pricing
  - base price
  - currency
  - discount config
- logistics
  - weight
  - handling days
- variants
  - variant name
  - sku
  - stock quantity
  - price override
  - attributes
- media
  - image uploads first
  - optional one video only
  - thumbnail required for video
  - max 8 total media items

Important backend rules:
- active products must have at least one image
- duplicate media URLs are rejected
- one primary media is normalized automatically

### 7. Seller Orders

Pages:
- `/seller/orders`
- `/seller/orders/:id`

Endpoints:
- `GET /api/v1/orders/seller`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/quote`
- `POST /api/v1/orders/:id/prepare`
- `POST /api/v1/orders/:id/ship`
- `POST /api/v1/orders/:id/deliver`

Expected list data:
- order reference
- buyer summary
- status
- item count
- total amount
- created at

Expected detail blocks:
- order timeline
- items
- buyer note
- delivery address
- quote state
- payment state
- dispute state

Seller actions by state:
- send delivery quote
- mark preparing
- mark shipped
- mark delivered

### 8. Seller Feed Posting

Pages:
- `/seller/feed`
- `/seller/feed/new`

Endpoints:
- `POST /api/v1/feed/posts`
- `DELETE /api/v1/feed/posts/:id`
- `GET /api/v1/feed`
- `POST /api/v1/media/upload-url`

Expected post form fields:
- `content`
- `media`
- optional `productId`

Feed media rules:
- max 4 media items
- max 1 video
- duplicate URLs rejected
- video requires thumbnail
- tagged product must belong to the seller and be active

Good UI blocks:
- create post composer
- post history / seller posts
- engagement summary later

### 9. Seller Chat Inbox

Pages:
- `/seller/messages`
- `/seller/messages/:conversationId`

Same chat endpoints as buyer.

Expected UX:
- inbox list
- buyer summary
- unread count
- realtime thread

### 10. Seller Finance Snapshot

Page:
- either part of dashboard or `/seller/finance`

Current backend-ready data source:
- `GET /api/v1/sellers/me/analytics`

Expected visible metrics:
- pending funds
- available funds
- total payouts
- refunds
- recent payouts

Important note:
- seller payout is not self-serve yet
- payouts are still admin-handled
- frontend should show finance visibility, not a withdraw button flow

## Shared UI States To Plan For

The frontend should consistently support:
- loading
- empty state
- error state
- unauthenticated state
- email-not-verified state
- onboarding-incomplete seller state
- quote waiting state
- payment pending state
- dispute / refund state

## Known Backend Gaps The Frontend Should Respect

1. Separate raw billing address at first-time checkout is still missing.

2. Video processing is not automated yet.
- uploads can be modeled
- but transcoding / poster generation pipeline is not finished

3. Seller payouts are admin-managed, not seller self-serve.

4. Admin moderation/reporting screens are outside this buyer/seller-only scope.

## Suggested Frontend Build Order

### Buyer-first

1. Auth
2. Catalog listing
3. Product detail
4. Cart
5. Checkout with saved/manual delivery address
6. Order detail and quote acceptance
7. Payment redirect and verify
8. Saved addresses
9. Feed and seller storefront
10. Chat

### Seller-first

1. Seller auth
2. Seller onboarding
3. Store profile
4. Product list
5. Create/edit product
6. Seller orders workflow
7. Seller dashboard analytics
8. Seller feed posting
9. Seller chat

## Recommended Frontend Route Skeleton

### Public

- `/`
- `/shop`
- `/products/:id`
- `/store/:slug`
- `/feed`
- `/feed/post/:id`
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

### Buyer

- `/account/orders`
- `/account/orders/:id`
- `/account/addresses`
- `/cart`
- `/checkout/:sellerProfileId`
- `/checkout/:orderId/payment`
- `/messages`
- `/messages/:conversationId`

### Seller

- `/seller`
- `/seller/onboarding`
- `/seller/store`
- `/seller/products`
- `/seller/products/new`
- `/seller/products/:id/edit`
- `/seller/orders`
- `/seller/orders/:id`
- `/seller/feed`
- `/seller/feed/new`
- `/seller/messages`
- `/seller/messages/:conversationId`

