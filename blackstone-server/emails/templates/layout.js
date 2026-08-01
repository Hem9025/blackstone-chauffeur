/**
 * Shared HTML email shell — black header, gold accent, inline styles only
 * (required for reliable rendering across email clients).
 */
export function layout({ preheader = '', bodyHtml = '' }) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlackStone Chauffeur</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8f7f4;font-family:Arial, Helvetica, sans-serif;">
    <span style="display:none;font-size:1px;color:#f8f7f4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${preheader}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f7f4;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;max-width:600px;width:100%;">
            <tr>
              <td style="background-color:#0a0a0a;padding:24px 32px;">
                <span style="color:#c9a227;font-size:20px;font-weight:bold;letter-spacing:0.5px;">
                  BlackStone Chauffeur
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#0a0a0a;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#0a0a0a;padding:20px 32px;color:#f8f7f4;font-size:12px;">
                © ${new Date().getFullYear()} BlackStone Chauffeur. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function button(label, url) {
  return `<a href="${url}" style="display:inline-block;background-color:#c9a227;color:#0a0a0a;text-decoration:none;padding:12px 24px;font-weight:bold;margin-top:16px;">${label}</a>`
}
