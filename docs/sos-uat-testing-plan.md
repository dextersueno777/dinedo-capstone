# DineDo SOS / UAT Testing Plan

## Purpose

This document will guide the System Operational Suitability testing and User Acceptance Testing of DineDo for Dindo's Restaurant - Tinoc Branch.

## Test Participants

- Project proponents
- Dindo's Restaurant owner or representative
- Admin user
- Kitchen staff
- Rider
- Sample customer

## Test Environment

- Deployed Web/PWA link
- Deployed API
- PostgreSQL database
- Browser on laptop or mobile phone

## Test Accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer.demo@dinedo.local | Customer123! |
| Admin | admin@dinedo.local | ChangeMe123! |
| Kitchen | kitchen@dinedo.local | ChangeMe123! |
| Rider | rider@dinedo.local | ChangeMe123! |

## Customer Module Test Cases

| Test Case | Expected Result | Status | Remarks |
| --- | --- | --- | --- |
| Login as customer | Customer features are accessible | Pending | |
| Browse menu | Menu items are displayed | Pending | |
| Add item to cart | Item appears in cart | Pending | |
| Checkout order | Order is submitted as Pending | Pending | |
| Upload GCash proof | Proof is submitted for review | Pending | |
| View order history | Orders are displayed | Pending | |
| Cancel Pending order | Order becomes Cancelled | Pending | |
| Accept extra delivery fee | Fee status becomes Accepted | Pending | |
| Reject extra delivery fee | Order becomes Cancelled | Pending | |
| View notifications | Status updates are shown | Pending | |

## Admin Module Test Cases

| Test Case | Expected Result | Status | Remarks |
| --- | --- | --- | --- |
| Login as admin | Admin dashboard opens | Pending | |
| View orders | Order list is displayed | Pending | |
| Approve order | Order status becomes Approved | Pending | |
| Reject order | Order status becomes Rejected | Pending | |
| Set extra delivery fee | Customer is asked to accept fee | Pending | |
| Assign rider | Delivery appears in rider module | Pending | |
| Verify GCash proof | Payment state updates correctly | Pending | |
| Manage refunds | Refund record updates | Pending | |
| Manage customer strikes | Customer status updates | Pending | |
| View reports | Report data is displayed | Pending | |
| View audit logs | System actions are recorded | Pending | |

## Kitchen Module Test Cases

| Test Case | Expected Result | Status | Remarks |
| --- | --- | --- | --- |
| Login as kitchen | Kitchen queue opens | Pending | |
| View approved orders | Approved orders are visible | Pending | |
| Mark order as Cooking | Order status updates to Cooking | Pending | |
| Mark order as Ready for Pickup | Order status updates correctly | Pending | |
| Customer receives update | Notification is created | Pending | |

## Rider Module Test Cases

| Test Case | Expected Result | Status | Remarks |
| --- | --- | --- | --- |
| Login as rider | Delivery list opens | Pending | |
| View assigned delivery | Assigned order appears | Pending | |
| Accept delivery | Delivery status becomes Accepted | Pending | |
| Reject delivery with reason | Admin can reassign rider | Pending | |
| Mark Out for Delivery | Status updates correctly | Pending | |
| Mark Arrived | Status updates correctly | Pending | |
| Upload proof of delivery | Proof is saved | Pending | |
| Mark Delivered | Order becomes Delivered | Pending | |
| Report delivery issue | Issue is recorded | Pending | |

## Business Rule Test Cases

| Rule | Expected Result | Status | Remarks |
| --- | --- | --- | --- |
| Order outside 8 AM to 6 PM | Immediate order is blocked | Pending | |
| Delivery within 1 km | No extra fee required | Pending | |
| Delivery beyond 1 km | Admin must set extra fee | Pending | |
| Customer rejects extra fee | Order is cancelled | Pending | |
| Customer cancels Pending order | Cancellation is allowed | Pending | |
| Customer cancels Approved order | Cancellation is blocked | Pending | |
| GCash paid order cancelled by valid case | Refund record is created | Pending | |
| Customer-facing live GPS tracking | Not shown to customer | Pending | |

## Acceptance Criteria

The system is acceptable for client testing if:

- All four user roles can log in.
- Customer checkout works.
- Admin order approval works.
- Kitchen status updates work.
- Rider delivery flow works.
- Payment proof review works.
- Extra delivery fee review works.
- Customer cancellation rule works.
- No critical error appears during testing.

## Final Result Summary

| Result | Count |
| --- | --- |
| Passed | |
| Failed | |
| Needs Revision | |

## Client Remarks

Write client comments here after testing.

## Tester Information

Tester Name:

Role:

Date:

Signature:
