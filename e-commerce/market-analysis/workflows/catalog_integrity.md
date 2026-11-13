# Workflow: Storefront Catalog Integrity & Pricing QA SOP

## Purpose

Verify product feed accuracy, minimum margin floors, GTIN/shipping weight completeness, and policy compliance prior to storefront publication.

## Step 1: Audit Feed Completeness & Identifier Parity

- Read supplier feed exports and active SKU catalogs via `read_file` to catch duplicate SKUs, missing UPC/GTIN identifiers, zero weights, or broken variant parent links.

## Step 2: Enforce Price Floor & Promo Conflict Checks

- Cross-reference sale prices and coupon stacks against the approved minimum margin floor sheet; immediately quarantine any $0.00 or below-cost SKU anomaly.

## Step 3: Screen Regulated Listing Claims

- Check titles and bullet copy for unsupported safety, medical, or IP-infringing claims and document corrective copy recommendations.

## Step 4: Merchandising Release Gate

- Write a catalog anomaly manifest and require Merchandising Manager sign-off before publishing price updates or un-quarantining flagged listings.
