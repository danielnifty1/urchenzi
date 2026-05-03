## Integration Scenarios

### Initialize payment success
- Given an unpaid order
- When `POST /payments/initialize` returns `authorization_url`
- Then FE redirects browser to the gateway URL

### Initialize payment failure
- Given an already-paid order
- When `POST /payments/initialize` returns `409`
- Then FE shows error toast and keeps user on order page

### Callback verification flow
- Given user lands on `/payment/callback?reference=...`
- When FE calls `GET /payments/callback`
- Then FE displays "Verifying payment..." and backend-derived status
- And FE links user to order details page

### Polling to paid state
- Given callback returns pending
- When FE polls `GET /payments/orders/:orderId/status` every 3s
- Then FE stops polling on `isPaid === true` or after 60s timeout
