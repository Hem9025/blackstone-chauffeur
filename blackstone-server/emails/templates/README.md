# Email Templates

HTML templates (black/gold brand, inline styles) go here, one file per template:

- enquiry-admin.js
- booking-confirmation.js
- booking-assigned.js
- driver-pending.js
- driver-approved.js
- ride-receipt.js

Each should export a function that takes template data and returns an HTML string,
for use with `sendMail()` in ../mailer.js.
