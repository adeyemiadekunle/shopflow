/**
 * Feature capabilities and limits bundled in a subscription tier.
 * All values here are set by admin via the subscription tier CRUD API.
 */
export interface TierFeatures {
  /** Maximum active product listings (-1 = unlimited) */
  maxProducts: number;
  /** Maximum media items (images/videos) per product */
  maxMediaPerProduct: number;
  /** Access to social feed posts */
  feedPostsEnabled: boolean;
  /** Access to buyer-seller chat */
  chatEnabled: boolean;
  /** Access to detailed seller analytics dashboard */
  analyticsEnabled: boolean;
  /** Priority placement in feed and search results */
  priorityListing: boolean;
  /** Access to discount campaign tools */
  discountCampaignsEnabled: boolean;
  /** Number of payout requests allowed per month (-1 = unlimited) */
  monthlyPayoutRequests: number;
  /** Dedicated storefront custom domain support */
  customDomainEnabled: boolean;
  /**
   * Platform commission rate override for this tier (0–100).
   * null means the platform default PolicyRule applies.
   */
  commissionRatePercent: number | null;
}
