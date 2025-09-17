# Stripe Payment Integration PRD

## Product Requirements Document: Stripe Payment Integration

### 1. Executive Summary
Integrate Stripe payment processing to enable users to upgrade from FREE to paid plans (INDIVIDUAL, FAMILY) during onboarding and account management.

### 2. Business Objectives
- **Revenue Generation**: Convert free users to paid subscribers
- **User Experience**: Seamless payment flow during onboarding
- **Plan Management**: Allow users to upgrade/downgrade plans
- **Compliance**: PCI DSS compliance through Stripe

### 3. User Stories

#### Primary User Stories
- As a new user, I want to select a paid plan during onboarding and pay immediately
- As an existing user, I want to upgrade my plan from FREE to a paid tier
- As a paid user, I want to manage my subscription and billing
- As a user, I want to see my current plan and usage limits

#### Secondary User Stories
- As a user, I want to receive email receipts for payments
- As a user, I want to update my payment method
- As a user, I want to cancel my subscription
- As a user, I want to see my billing history

### 4. Technical Requirements

#### 4.1 Stripe Integration
- **Payment Methods**: Credit/debit cards, ACH transfers (US)
- **Subscription Management**: Monthly recurring billing
- **Webhook Handling**: Real-time payment status updates
- **Customer Management**: Stripe customer profiles for each user

#### 4.2 Database Schema Updates
```sql
-- New tables needed
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  stripeCustomerId VARCHAR(255),
  stripeSubscriptionId VARCHAR(255),
  planType VARCHAR(50),
  status VARCHAR(50),
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  cancelAtPeriodEnd BOOLEAN,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE billing_events (
  id UUID PRIMARY KEY,
  subscriptionId UUID REFERENCES subscriptions(id),
  stripeEventId VARCHAR(255),
  eventType VARCHAR(100),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50),
  occurredAt TIMESTAMP,
  metadata JSONB
);

-- Discount code tables
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discountType VARCHAR(20) NOT NULL CHECK (discountType IN ('percentage', 'fixed_amount')),
  discountValue DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  maxUses INTEGER,
  currentUses INTEGER DEFAULT 0,
  validFrom TIMESTAMP NOT NULL,
  validUntil TIMESTAMP,
  applicablePlans TEXT[], -- Array of plan types this code applies to
  minimumAmount DECIMAL(10,2), -- Minimum subscription amount required
  isActive BOOLEAN DEFAULT true,
  createdBy UUID REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discount_code_usage (
  id UUID PRIMARY KEY,
  discountCodeId UUID REFERENCES discount_codes(id),
  userId UUID REFERENCES users(id),
  subscriptionId UUID REFERENCES subscriptions(id),
  appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  discountAmount DECIMAL(10,2) NOT NULL,
  originalAmount DECIMAL(10,2) NOT NULL,
  finalAmount DECIMAL(10,2) NOT NULL,
  metadata JSONB -- Store Stripe coupon ID, etc.
);

-- Add discount code reference to subscriptions
ALTER TABLE subscriptions ADD COLUMN discountCodeId UUID REFERENCES discount_codes(id);
ALTER TABLE subscriptions ADD COLUMN originalAmount DECIMAL(10,2);
ALTER TABLE subscriptions ADD COLUMN discountAmount DECIMAL(10,2);
ALTER TABLE subscriptions ADD COLUMN finalAmount DECIMAL(10,2);
```

#### 4.3 Discount Code Management
- **Code Types**: Percentage-based (e.g., "SAVE20" for 20% off) or fixed amount (e.g., "WELCOME10" for $10 off)
- **Validation Rules**:
  - Expiration dates
  - Usage limits (max uses, per-user limits)
  - Plan restrictions (which plans the code applies to)
  - Minimum amount requirements
- **Stripe Integration**:
  - Create Stripe coupons when discount codes are created
  - Apply coupons during subscription creation
  - Track usage in both systems

#### 4.4 API Endpoints
- **POST /api/payments/create-subscription**: Create Stripe subscription
- **POST /api/payments/update-subscription**: Change plan or payment method
- **POST /api/payments/cancel-subscription**: Cancel subscription
- **GET /api/payments/subscription**: Get current subscription status
- **POST /api/payments/webhook**: Handle Stripe webhooks

**Discount Code Endpoints:**
- **POST /api/discount-codes**: Create new discount code (admin only)
- **GET /api/discount-codes**: List all discount codes (admin only)
- **GET /api/discount-codes/:code**: Validate and get discount code details
- **PUT /api/discount-codes/:id**: Update discount code (admin only)
- **DELETE /api/discount-codes/:id**: Deactivate discount code (admin only)
- **POST /api/discount-codes/validate**: Validate discount code before payment
- **GET /api/discount-codes/usage/:codeId**: Get usage statistics for a discount code

### 5. User Experience Flow

#### 5.1 Onboarding Payment Flow
1. User selects INDIVIDUAL or FAMILY plan
2. Payment form appears with plan details
3. User enters payment information
4. Stripe processes payment
5. On success: Create tenant, accounts, redirect to dashboard
6. On failure: Show error, allow retry

#### 5.2 Discount Code Flow
1. User enters discount code in payment form
2. System validates code (expiry, usage limits, plan restrictions)
3. Show discount amount and final price
4. Apply discount during Stripe subscription creation
5. Track usage and update discount code statistics

#### 5.3 Plan Upgrade Flow
1. User navigates to upgrade page
2. Shows current plan vs. new plan comparison
3. Payment form for plan difference
4. Process upgrade and update limits
5. Send confirmation email

### 6. Security & Compliance
- **PCI Compliance**: All payment data handled by Stripe
- **Data Encryption**: Sensitive data encrypted in transit and at rest
- **Webhook Security**: Verify Stripe webhook signatures
- **Audit Logging**: Log all payment-related activities

### 7. Error Handling
- **Payment Failures**: Clear error messages, retry options
- **Network Issues**: Graceful degradation, offline indicators
- **Stripe API Errors**: Fallback to manual verification
- **Subscription Conflicts**: Handle edge cases (multiple subscriptions)

### 8. Testing Strategy
- **Unit Tests**: Payment logic, webhook handling
- **Integration Tests**: Stripe API integration
- **E2E Tests**: Complete payment flows
- **Stripe Test Mode**: Sandbox environment for development

### 9. Monitoring & Analytics
- **Payment Success Rates**: Track conversion metrics
- **Error Monitoring**: Alert on payment failures
- **Revenue Tracking**: Monthly recurring revenue (MRR)
- **User Behavior**: Plan selection patterns

### 10. Implementation Phases

#### Phase 1: Core Payment Integration
- Stripe account setup and configuration
- Basic subscription creation
- Payment form integration
- Webhook handling

#### Phase 2: Subscription Management
- Plan upgrades/downgrades
- Payment method updates
- Billing history
- Cancellation flow

#### Phase 3: Advanced Features
- Prorated billing
- Coupon codes
- Multiple payment methods
- Advanced analytics

### 11. Success Metrics
- **Payment Success Rate**: >95%
- **Onboarding Conversion**: >30% of users select paid plans
- **Subscription Retention**: >80% monthly retention
- **Support Tickets**: <5% related to payment issues

### 12. Risk Assessment
- **High Risk**: Payment processing failures, data breaches
- **Medium Risk**: Stripe API changes, compliance updates
- **Low Risk**: UI/UX changes, minor feature additions

### 13. Dependencies
- **Stripe Account**: Business verification and approval
- **Legal Review**: Terms of service, privacy policy updates
- **Financial Setup**: Bank account for payouts
- **Support Training**: Customer service for billing issues

### 14. Technical Implementation Details

#### 14.1 Stripe Configuration
```typescript
// Example Stripe configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});
```

#### 14.2 Webhook Handler
```typescript
// Example webhook handler
app.post('/api/payments/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

  switch (event.type) {
    case 'customer.subscription.created':
      // Handle subscription creation
      break;
    case 'customer.subscription.updated':
      // Handle subscription updates
      break;
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }

  res.json({ received: true });
});
```

#### 14.3 Payment Form Integration
```typescript
// Example payment form component
const PaymentForm = ({ plan, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (paymentMethod) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, paymentMethod }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        onError('Payment failed');
      }
    } catch (error) {
      onError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Payment form fields */}
    </form>
  );
};
```

#### 14.4 Discount Code Implementation
```typescript
// Discount code validation service
interface DiscountCodeValidation {
  isValid: boolean;
  discountAmount: number;
  finalAmount: number;
  error?: string;
}

class DiscountCodeService {
  async validateCode(
    code: string,
    planType: string,
    originalAmount: number
  ): Promise<DiscountCodeValidation> {
    const discountCode = await this.getDiscountCode(code);

    if (!discountCode || !discountCode.isActive) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, error: 'Invalid code' };
    }

    // Check expiry
    if (discountCode.validUntil && new Date() > discountCode.validUntil) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, error: 'Code expired' };
    }

    // Check usage limits
    if (discountCode.maxUses && discountCode.currentUses >= discountCode.maxUses) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, error: 'Code usage limit reached' };
    }

    // Check plan restrictions
    if (discountCode.applicablePlans && !discountCode.applicablePlans.includes(planType)) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, error: 'Code not valid for this plan' };
    }

    // Check minimum amount
    if (discountCode.minimumAmount && originalAmount < discountCode.minimumAmount) {
      return { isValid: false, discountAmount: 0, finalAmount: originalAmount, error: `Minimum amount $${discountCode.minimumAmount} required` };
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountCode.discountType === 'percentage') {
      discountAmount = (originalAmount * discountCode.discountValue) / 100;
    } else {
      discountAmount = Math.min(discountCode.discountValue, originalAmount);
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return {
      isValid: true,
      discountAmount,
      finalAmount
    };
  }

  async applyDiscountCode(
    codeId: string,
    userId: string,
    subscriptionId: string,
    discountAmount: number,
    originalAmount: number,
    finalAmount: number
  ): Promise<void> {
    // Update usage count
    await this.incrementUsage(codeId);

    // Record usage
    await this.recordUsage(codeId, userId, subscriptionId, discountAmount, originalAmount, finalAmount);
  }
}
```

#### 14.5 Stripe Coupon Integration
```typescript
// Create Stripe coupon when discount code is created
async function createStripeCoupon(discountCode: DiscountCode): Promise<string> {
  const couponData: any = {
    name: discountCode.code,
    duration: 'once', // or 'repeating' for subscription discounts
  };

  if (discountCode.discountType === 'percentage') {
    couponData.percent_off = discountCode.discountValue;
  } else {
    couponData.amount_off = Math.round(discountCode.discountValue * 100); // Stripe uses cents
    couponData.currency = discountCode.currency.toLowerCase();
  }

  if (discountCode.maxUses) {
    couponData.max_redemptions = discountCode.maxUses;
  }

  const coupon = await stripe.coupons.create(couponData);
  return coupon.id;
}

// Apply coupon during subscription creation
async function createSubscriptionWithCoupon(
  customerId: string,
  priceId: string,
  couponId?: string
): Promise<Stripe.Subscription> {
  const subscriptionData: any = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  };

  if (couponId) {
    subscriptionData.coupon = couponId;
  }

  return await stripe.subscriptions.create(subscriptionData);
}
```

#### 14.6 Frontend Discount Code Component
```typescript
// Discount code input component
const DiscountCodeInput = ({ onCodeApplied, onCodeRemoved }) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const validateCode = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, planType: 'INDIVIDUAL', amount: 9.99 }),
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.isValid) {
        onCodeApplied(result);
      }
    } catch (error) {
      console.error('Error validating code:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="discount-code-section">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter discount code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1"
        />
        <Button
          onClick={validateCode}
          disabled={isValidating || !code.trim()}
        >
          {isValidating ? 'Validating...' : 'Apply'}
        </Button>
      </div>

      {validationResult && (
        <div className={`mt-2 p-2 rounded ${
          validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {validationResult.isValid ? (
            <div>
              <span className="font-medium">Code applied!</span>
              <span className="ml-2">
                Save ${validationResult.discountAmount.toFixed(2)}
              </span>
            </div>
          ) : (
            <span>{validationResult.error}</span>
          )}
        </div>
      )}
    </div>
  );
};
```

### 15. Future Considerations
- **International Expansion**: Multi-currency support
- **Enterprise Features**: Custom pricing, volume discounts
- **Mobile Apps**: Native payment integration
- **Analytics Dashboard**: Revenue insights for business users

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Owner**: Product Team
**Stakeholders**: Engineering, Design, Legal, Finance
