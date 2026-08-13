import { layout } from './layout.js'

// Sent to a driver when a ride they were previously assigned to is taken
// off their schedule — whether it's handed to another driver or simply
// unassigned. Deliberately framed as a routine scheduling change, not a
// cancellation or anything reflecting on the driver — this is the client's
// explicit intent, so it should never read as "you've been pulled off this"
// or otherwise make the driver feel like they did something wrong.
export function driverReassignedTemplate({ driverName, pickup, dropoff, date, time }) {
  return layout({
    preheader: 'A ride on your schedule has been updated',
    bodyHtml: `
      <h2 style="margin:0 0 16px;color:#0a0a0a;">Schedule Update</h2>
      <p>Hi ${driverName},</p>
      <p>Just a quick heads-up — the ride below is no longer on your schedule. This is a routine scheduling change and doesn't reflect anything about you or your service — there's nothing you need to do.</p>
      <table role="presentation" style="width:100%;margin-top:12px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b6b6b;">Pickup</td><td style="padding:6px 0;">${pickup}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Drop-off</td><td style="padding:6px 0;">${dropoff}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Date</td><td style="padding:6px 0;">${date}</td></tr>
        <tr><td style="padding:6px 0;color:#6b6b6b;">Time</td><td style="padding:6px 0;">${time}</td></tr>
      </table>
      <p style="margin-top:16px;">Thanks for your flexibility — check your driver dashboard for your current schedule.</p>
    `,
  })
}
