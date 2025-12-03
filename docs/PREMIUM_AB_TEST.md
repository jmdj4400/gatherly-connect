# Premium Subscription A/B Price Test

## Overview

Gatherly implements an A/B test to determine optimal pricing for premium subscriptions. Users are randomly assigned to one of two price groups when they first interact with the premium flow.

## Price Groups

| Group | Basic Plan | Plus Plan |
|-------|-----------|-----------|
| A (Control) | 29 kr/mo | 49 kr/mo |
| B (Variant) | 39 kr/mo | 59 kr/mo |

## Assignment Logic

1. When a user visits `/premium` or triggers checkout, they're assigned to a price group
2. Assignment is stored in `profiles.price_group` column
3. Assignment is permanent for the user's lifetime
4. 50/50 random split between groups

## Analytics Events

| Event | Description | Properties |
|-------|-------------|------------|
| `premium_offered` | User viewed premium page | `priceGroup`, `isLoggedIn` |
| `premium_clicked` | User clicked upgrade button | `plan` |
| `premium_checkout_started` | Checkout session created | `priceGroup` |
| `premium_converted` | Successful subscription | `priceGroup` |
| `trial_started` | 7-day trial began | `priceGroup` |

## Measuring Results

### Conversion Rate by Group

```sql
SELECT 
  p.price_group,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT s.user_id) as converted_users,
  ROUND(COUNT(DISTINCT s.user_id)::numeric / COUNT(DISTINCT p.id) * 100, 2) as conversion_rate
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status IN ('active', 'trialing')
WHERE p.price_group IS NOT NULL
GROUP BY p.price_group;
```

### Revenue by Group

```sql
SELECT 
  s.price_group,
  COUNT(*) as subscriptions,
  SUM(CASE WHEN plan = 'basic' THEN 
    CASE WHEN price_group = 'A' THEN 29 ELSE 39 END
  ELSE 
    CASE WHEN price_group = 'A' THEN 49 ELSE 59 END
  END) as monthly_revenue_dkk
FROM subscriptions s
WHERE status IN ('active', 'trialing')
GROUP BY s.price_group;
```

## Feature Flags

- `PREMIUM_FEATURES`: Controls visibility of premium page and upgrade CTAs (default: false)
- `PREMIUM_AB_TEST`: Controls A/B test assignment (default: true)

To enable premium features:
```js
window.featureFlags.set('PREMIUM_FEATURES', true)
```

## Stripe Configuration

### Test Mode
Currently using Stripe test mode. Products/prices are created dynamically during checkout.

### Webhook Events
The `stripe-webhook` function handles:
- `checkout.session.completed` → Create subscription
- `customer.subscription.updated` → Update status
- `customer.subscription.deleted` → Cancel subscription
- `invoice.payment_succeeded` → Activate subscription
- `invoice.payment_failed` → Mark as past_due

### Webhook Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yuabwnhulzhnoyvnvqrw.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
4. Add webhook secret to Supabase: `STRIPE_WEBHOOK_SECRET`

## Premium Benefits

### Basic Plan
- Priority matching (10-20% score boost)
- See who joined events
- Larger group preferences

### Plus Plan
- All Basic features
- Early access to new events
- Premium badge on profile

## Implementation Notes

1. **Non-blocking**: Free users can still browse and join events
2. **Trial**: All new subscribers get 7-day free trial
3. **Cancellation**: Users can cancel anytime during trial
4. **Upgrade path**: Basic users can upgrade to Plus

## Database Schema

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan TEXT CHECK (plan IN ('basic', 'plus')),
  status TEXT CHECK (status IN ('active', 'inactive', 'trialing', 'canceled', 'past_due')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  price_group TEXT CHECK (price_group IN ('A', 'B')),
  trial_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Testing Checklist

- [ ] Price group assignment works
- [ ] Checkout redirects to Stripe
- [ ] Webhook creates subscription
- [ ] Trial status shows correctly
- [ ] Premium benefits apply
- [ ] Analytics events fire
- [ ] Cancel flow works
