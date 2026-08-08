# Booking & Enquiry Email Notifications — What's Sent

*A record of every automatic email the website sends, kept up to date as of the last fix below.*

## Full list — what's working today

| Event | Who gets emailed | Email |
|---|---|---|
| Customer books online and pays | Customer + Admin | "Booking confirmed" to customer, "New booking" to admin |
| Booking cancelled (by customer, admin, or provider) | Customer + assigned driver (if any) + Admin | "Booking cancelled" to all three |
| Admin edits an existing booking | Passenger (or account holder if no passenger email given) | "Your booking has been updated" |
| Admin deletes a booking | Passenger/account holder + assigned driver (if any) | "Booking cancelled" (same email used for /cancel) |
| Driver marks a ride "completed" | Customer | "Ride Complete — Receipt" (the thank-you/receipt email) |
| Driver gets assigned to a ride | Driver only | "New ride assigned" |
| New enquiry submitted (Contact page / homepage "Get in Touch") | Admin + the person who submitted it | "New enquiry from [name]" to admin, "We've received your enquiry" to them |
| Provider (travel agent) books on a client's behalf | Admin (skipped if an admin books it themselves) + the passenger | "New booking" to admin, "Booking confirmed" to the passenger's email |

## Fixed — previously missing (resolved)

The four gaps originally found here have all been wired up:
1. Admin edits a booking → customer now gets "Your booking has been updated."
2. Admin deletes a booking → customer (and driver, if assigned) now gets a cancellation email.
3. Enquiry submissions → the submitter now gets a confirmation email, not just the admin.
4. Provider/agent bookings → the actual passenger now gets a "Booking confirmed" email, not just the admin.

No new setup was needed (Brevo, domain, etc.) — these reuse the mailer that was already working.
