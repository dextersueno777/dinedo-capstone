# DineDo Client Testing Guide

## Purpose

This guide will be used by the project proponents and Dindo's Restaurant representative during client testing.

The goal is to test if DineDo is usable, functional, and acceptable for actual restaurant operations.

## Testing Links

Fill these in after deployment:

| Item | Link |
| --- | --- |
| DineDo PWA Link | To be added after Vercel deployment |
| DineDo API Link | To be added after Railway deployment |
| API Documentation | To be added after Railway deployment |

## Test Accounts

| Role | Email | Password | Purpose |
| --- | --- | --- | --- |
| Customer | customer.demo@dinedo.local | Customer123! | Customer ordering test |
| Admin | admin@dinedo.local | ChangeMe123! | Order/payment/rider management |
| Kitchen | kitchen@dinedo.local | ChangeMe123! | Kitchen queue testing |
| Rider | rider@dinedo.local | ChangeMe123! | Delivery flow testing |

## Main Testing Scenario

Use this flow for the main client test:

1. Customer logs in.
2. Customer browses the menu.
3. Customer adds an item to the cart.
4. Customer checks out an order.
5. Admin reviews and approves the order.
6. Kitchen views the approved order.
7. Kitchen marks the order as Cooking.
8. Kitchen marks the order as Ready for Pickup.
9. Admin assigns a rider.
10. Rider accepts the delivery.
11. Rider marks the order as Out for Delivery.
12. Rider marks the order as Arrived.
13. Rider uploads proof of delivery.
14. Rider marks the order as Delivered.
15. Customer checks order history and notifications.

## Extra Delivery Fee Test

Use this to test the delivery distance rule:

1. Customer places a delivery order outside the normal 1 km coverage.
2. Admin sets an extra delivery fee.
3. Customer accepts the extra delivery fee.
4. Order continues normally.

Also test:

1. Customer places a delivery order outside the normal 1 km coverage.
2. Admin sets an extra delivery fee.
3. Customer rejects the extra delivery fee.
4. Order should become Cancelled.

## Cancellation Test

Use this to test the cancellation rule:

1. Customer creates a new order.
2. Customer cancels the order while it is still Pending.
3. System should allow cancellation.

Then test:

1. Customer creates a new order.
2. Admin approves the order.
3. Customer tries to cancel the order.
4. System should block cancellation.

## Payment Proof Test

Use this to test manual GCash payment:

1. Customer selects GCash payment.
2. Customer uploads a receipt image.
3. Admin checks the uploaded proof.
4. Admin approves or rejects the payment proof.

## Refund Test

Use this to test refund handling:

1. Customer has a GCash paid order.
2. Order is cancelled due to a valid case.
3. Admin checks refund management.
4. Admin updates refund status manually.

## Tracking Rule Test

Check that the customer does not see live rider GPS tracking.

The customer should only see:

- Order status updates
- Delivery status updates
- Notifications

The rider may use address/map navigation, but the customer should not see live GPS movement.

## Evidence Needed for Research Paper

During testing, take screenshots of:

- Login page
- Customer menu
- Cart
- Checkout
- Order history
- Admin dashboard
- Admin order approval
- Kitchen queue
- Rider delivery screen
- Payment proof review
- Refund management
- Notification screen
- SOS/UAT testing table with results
- Client remarks or signed evaluation form

## Testing Result

After testing, update the SOS/UAT Testing Plan:

- Mark each test as Passed, Failed, or Needs Revision.
- Write remarks for any issue found.
- Save screenshots as evidence.
- Use the results in the Results and Discussion section of the research paper.
