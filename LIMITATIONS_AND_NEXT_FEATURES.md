# Known Limitations & Next Features

## Current Limitations (MVP)

### 1. **Rate Limiting**
- **Current**: In-memory rate limiting (resets on server restart)
- **Limitation**: Not distributed, doesn't work across multiple instances
- **Impact**: Low for MVP, but needs Redis for production scale

### 2. **Logging**
- **Current**: Console logging only
- **Limitation**: No centralized logging, no log aggregation
- **Impact**: Difficult to debug production issues at scale

### 3. **Error Tracking**
- **Current**: Basic error boundaries, console errors
- **Limitation**: No error tracking service (Sentry, etc.)
- **Impact**: Production errors may go unnoticed

### 4. **Image Upload**
- **Current**: Placeholder URLs only
- **Limitation**: No actual image upload/storage
- **Impact**: Products need external image hosting

### 5. **Email Notifications**
- **Current**: None
- **Limitation**: No order confirmations, payment receipts, etc.
- **Impact**: Poor customer experience

### 6. **Inventory Management**
- **Current**: Simple stock quantity
- **Limitation**: No variants (size, color), no low stock alerts
- **Impact**: Limited product catalog flexibility

### 7. **Order Management**
- **Current**: Basic order status tracking
- **Limitation**: No shipping integration, no tracking numbers
- **Impact**: Manual order fulfillment

### 8. **Payouts**
- **Current**: Ledger tracking only
- **Limitation**: No automated bank payouts
- **Impact**: Manual payout processing required

### 9. **Multi-user Support**
- **Current**: One user per merchant (ADMIN role)
- **Limitation**: No staff accounts, no role-based permissions
- **Impact**: Can't delegate store management

### 10. **Analytics**
- **Current**: Basic order counts
- **Limitation**: No sales reports, no revenue analytics
- **Impact**: Limited business insights

### 11. **Search & Filtering**
- **Current**: Basic product search
- **Limitation**: No advanced filters, no faceted search
- **Impact**: Poor product discovery

### 12. **Cart Persistence**
- **Current**: localStorage only
- **Limitation**: Cart lost on device change, no cart recovery
- **Impact**: Poor user experience

### 13. **Customer Accounts**
- **Current**: No customer accounts
- **Limitation**: No order history, no saved addresses
- **Impact**: Poor customer retention

### 14. **Discounts & Coupons**
- **Current**: None
- **Limitation**: No promotional codes, no discounts
- **Impact**: Limited marketing capabilities

### 15. **Tax Calculation**
- **Current**: None
- **Limitation**: No GST/VAT calculation
- **Impact**: Manual tax handling required

## Next Features (Priority Order)

### Phase 1: Core Improvements

1. **Image Upload & Storage**
   - Integrate with S3/Cloudinary
   - Image optimization
   - Multiple product images

2. **Email Notifications**
   - Order confirmation emails
   - Payment receipts
   - Order status updates
   - Use SendGrid/Resend

3. **Error Tracking**
   - Integrate Sentry
   - Error monitoring and alerts
   - Performance monitoring

4. **Centralized Logging**
   - Integrate with LogRocket/Datadog
   - Structured logging
   - Log aggregation

5. **Redis Rate Limiting**
   - Distributed rate limiting
   - Works across multiple instances
   - Better performance

### Phase 2: Enhanced Features

6. **Product Variants**
   - Size, color, material options
   - Variant-specific pricing
   - Variant inventory

7. **Advanced Inventory**
   - Low stock alerts
   - Stock history
   - Bulk import/export

8. **Shipping Integration**
   - Shipping providers (Shiprocket, etc.)
   - Tracking numbers
   - Shipping labels

9. **Customer Accounts**
   - Customer registration
   - Order history
   - Saved addresses
   - Wishlist

10. **Cart Improvements**
    - Server-side cart storage
    - Cart recovery emails
    - Abandoned cart tracking

### Phase 3: Business Features

11. **Analytics Dashboard**
    - Sales reports
    - Revenue analytics
    - Product performance
    - Customer insights

12. **Discounts & Coupons**
    - Promotional codes
    - Percentage/fixed discounts
    - Usage limits
    - Expiry dates

13. **Tax Calculation**
    - GST/VAT calculation
    - Tax by location
    - Tax reports

14. **Multi-user Support**
    - Staff accounts
    - Role-based permissions
    - Activity logs

15. **Automated Payouts**
    - Scheduled payouts
    - Razorpay payout integration
    - Payout reports

### Phase 4: Advanced Features

16. **Advanced Search**
    - Full-text search (Algolia/Meilisearch)
    - Faceted filtering
    - Search analytics

17. **Marketing Tools**
    - Email campaigns
    - Abandoned cart recovery
    - Customer segmentation

18. **Mobile App**
    - React Native app
    - Push notifications
    - Mobile-optimized checkout

19. **Multi-currency**
    - Currency conversion
    - Multi-currency pricing
    - Payment in multiple currencies

20. **Subscription Plans**
    - Monthly/yearly plans
    - Feature tiers
    - Usage-based pricing

## Technical Debt

1. **Database Migrations**
   - Need proper migration strategy
   - Migration rollback support
   - Production migration testing

2. **API Documentation**
   - OpenAPI/Swagger docs
   - API versioning
   - Rate limit documentation

3. **Testing Coverage**
   - Increase test coverage
   - E2E tests
   - Integration tests

4. **Performance Optimization**
   - Database query optimization
   - Caching strategy
   - CDN for static assets

5. **Security Hardening**
   - Security audit
   - Penetration testing
   - OWASP compliance

6. **Monitoring & Alerts**
   - Uptime monitoring
   - Performance alerts
   - Error rate alerts

## Migration Path

### From MVP to Production

1. **Immediate (Week 1)**
   - Add error tracking (Sentry)
   - Add centralized logging
   - Set up monitoring

2. **Short-term (Month 1)**
   - Image upload integration
   - Email notifications
   - Redis rate limiting

3. **Medium-term (Quarter 1)**
   - Product variants
   - Customer accounts
   - Analytics dashboard

4. **Long-term (Year 1)**
   - Advanced features
   - Mobile app
   - International expansion

## Notes

- All features should maintain multi-tenant isolation
- Security should be prioritized in all new features
- Performance should be considered from the start
- User experience should be improved incrementally
