# Venue Boost Feature (B2B Revenue)

## Overview

Venue Boost allows organizers to promote their events for increased visibility in the marketplace. This is a B2B revenue feature with monthly recurring billing via Stripe.

## Pricing Tiers

| Tier | Price | Boost Weight | Features |
|------|-------|--------------|----------|
| **Basic** | 199 kr/mo | +10% | Priority placement, Boosted badge |
| **Pro** | 499 kr/mo | +25% | Top priority, Premium badge, Analytics, Email digest highlight |

## How It Works

### 1. Purchase Flow
1. Organizer clicks "Boost" button on event in Organizer Panel
2. Modal shows tier options with benefits
3. Stripe checkout session created with monthly recurring subscription
4. On successful payment, boost activates immediately

### 2. Marketplace Behavior
- Boosted events get priority placement in `/events` feed
- Events with active boosts show "Boosted" or "Featured" badge
- Boost weight applied to matching algorithm ranking:
  - Basic: 1.10x multiplier
  - Pro: 1.25x multiplier

### 3. Billing
- Monthly recurring via Stripe Subscriptions
- Cancel anytime - boost remains active until end of billing period
- Payment failure → boost deactivates

## Database Schema

```sql
CREATE TABLE venue_boosts (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id),
  event_id UUID REFERENCES events(id),
  level TEXT ('basic' | 'pro'),
  status TEXT ('pending' | 'active' | 'expired' | 'canceled'),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  price_amount INTEGER, -- in øre
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## API Endpoints

### Create Boost Checkout
```
POST /functions/v1/create-boost-checkout
Authorization: Bearer <jwt>

Body:
{
  "orgId": "uuid",
  "eventId": "uuid", 
  "level": "basic" | "pro"
}

Response:
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### Webhook Events Handled
- `invoice.payment_succeeded` → Activate boost
- `customer.subscription.deleted` → Expire boost

## Feature Flag

```typescript
// Enable venue boost feature
window.featureFlags.set('VENUE_BOOST', true)
```

## Analytics Events

| Event | When |
|-------|------|
| `boost_clicked` | User clicks Boost button |
| `boost_tier_selected` | User selects a tier |
| `boost_checkout_started` | Checkout session created |
| `boost_activated` | Payment succeeded |
| `boost_canceled` | Subscription canceled |

## Testing

### Test Mode
1. Enable feature flag: `window.featureFlags.set('VENUE_BOOST', true)`
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify boost appears in organizer dashboard
4. Check event shows "Boosted" badge in feed

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`
