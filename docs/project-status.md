# DineDo Project Status

## Current Status

DineDo now has a working local full-stack foundation for the Tinoc branch.

## Completed Modules

### Customer Module

- Register and login
- Browse Tinoc menu
- Cart management
- Checkout for dine-in, take-out, reservation-related flow, and delivery
- Address selection for delivery
- Manual GCash proof upload
- Order history
- Customer notifications
- Customer cancellation while order is still pending
- Customer delivery fee acceptance or rejection

### Admin Module

- Admin dashboard summary
- Order approval and status management
- Additional delivery fee setting
- Rider assignment and reassignment support
- Payment proof review
- Reservation management
- Inventory management
- Audit log viewing
- Refund management
- Customer strike/ban control

### Kitchen Module

- Kitchen order queue
- Cooking status update
- Ready-for-pickup status update
- Customer notification on kitchen status changes

### Rider Module

- Rider delivery list
- Accept delivery
- Reject delivery
- Out-for-delivery status
- Arrived status
- Proof of delivery
- Delivered status
- Delivery issue reporting

## Business Rules Implemented

- Tinoc branch is the main working branch
- Ordering hours are enforced
- Beyond 1 km delivery requires staff review
- Customer must accept or reject additional delivery fee
- Rejected additional fee cancels the order
- Customer cancellation is allowed only while order is pending
- Manual GCash proof upload and admin review are supported
- Refund records are created for cancelled paid GCash orders
- Customer strike/ban rule is supported
- Rider status updates are used instead of customer-facing live GPS tracking

## Main Smoke Tests

- scripts/read-smoke.sh
- scripts/order-lifecycle-smoke.sh
- scripts/customer-cancel-smoke.sh
- scripts/delivery-fee-smoke.sh
- scripts/rider-full-delivery-smoke.sh

## Latest Regression Result

All final smoke tests passed with:

Failures: 0

## Next Major Phase

Deployment preparation.
