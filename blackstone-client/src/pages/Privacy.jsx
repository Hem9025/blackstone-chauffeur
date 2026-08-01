import LegalPageLayout from '../components/LegalPageLayout'

const sections = [
  {
    heading: 'Information We Collect',
    blocks: [
      {
        type: 'p',
        text: 'We may collect personal information that is reasonably necessary to provide our services, including but not limited to:',
      },
      { type: 'h3', text: 'Personal Information' },
      {
        type: 'ul',
        items: [
          'Full Name',
          'Email Address',
          'Telephone Number',
          'Residential or Business Address (where required)',
          'Pickup and Drop-off Locations',
          'Flight Details',
          'Booking Information',
          'Passenger Details',
          'Company Name (for corporate accounts)',
          'Payment and Billing Information',
          'Vehicle Preferences',
          'Special Requests',
          'Any other information voluntarily provided by you.',
        ],
      },
      { type: 'h3', text: 'Automatically Collected Information' },
      { type: 'p', text: 'When you access our website, certain information may be collected automatically, including:' },
      {
        type: 'ul',
        items: [
          'IP Address',
          'Browser Type and Version',
          'Device Information',
          'Operating System',
          'Pages Viewed',
          'Date and Time of Visit',
          'Referring Website',
          'Session Duration',
          'Cookies and Website Analytics Data.',
        ],
      },
    ],
  },
  {
    heading: 'Purpose of Collection',
    blocks: [
      { type: 'p', text: 'Blackstone Chauffeur Ltd collects and uses personal information for legitimate business purposes, including to:' },
      {
        type: 'ul',
        items: [
          'Process quotations and bookings.',
          'Provide chauffeur and transportation services.',
          'Verify booking details.',
          'Arrange airport transfers and monitor flight arrivals where applicable.',
          'Communicate with customers regarding bookings.',
          'Process payments and issue invoices.',
          'Respond to enquiries and customer support requests.',
          'Improve our services and website.',
          'Conduct internal administration and record keeping.',
          'Meet legal and regulatory obligations.',
          'Detect fraudulent or unlawful activity.',
          'Protect the security and integrity of our website and business.',
        ],
      },
      { type: 'p', text: 'We do not sell, rent or trade your personal information to third parties.' },
    ],
  },
  {
    heading: 'Cookies',
    blocks: [
      { type: 'p', text: 'Our website uses cookies and similar technologies to improve functionality and enhance your browsing experience.' },
      { type: 'p', text: 'Cookies may be used to:' },
      {
        type: 'ul',
        items: [
          'Remember user preferences.',
          'Improve website performance.',
          'Analyse visitor traffic.',
          'Enhance website security.',
          'Assist with future website improvements.',
        ],
      },
      { type: 'p', text: 'You may disable cookies through your browser settings. Doing so may affect certain functions of our website.' },
    ],
  },
  {
    heading: 'Website Analytics',
    blocks: [
      { type: 'p', text: 'We may use Google Analytics or similar website analytics services to better understand how visitors interact with our website.' },
      { type: 'p', text: 'Information collected may include:' },
      {
        type: 'ul',
        items: ['Pages viewed', 'Device type', 'Browser information', 'Approximate geographic location', 'Website usage patterns'],
      },
      { type: 'p', text: 'This information is generally aggregated and does not personally identify individual users.' },
      {
        type: 'p',
        text: "For further information regarding Google's privacy practices, please visit: https://policies.google.com/privacy",
      },
    ],
  },
  {
    heading: 'Disclosure of Personal Information',
    blocks: [
      { type: 'p', text: 'We may disclose personal information where reasonably necessary for the operation of our business, including to:' },
      {
        type: 'ul',
        items: [
          'Payment processing providers.',
          'Professional advisers.',
          'Website hosting and IT service providers.',
          'Chauffeurs, subcontracted drivers or transport partners involved in providing your booking.',
          'Government authorities, regulators or law enforcement agencies where required by law.',
        ],
      },
      {
        type: 'p',
        text: 'We require third-party service providers to take appropriate measures to protect personal information and use it only for authorised purposes.',
      },
    ],
  },
  {
    heading: 'Overseas Disclosure',
    blocks: [
      {
        type: 'p',
        text: 'Some service providers engaged by Blackstone Chauffeur Ltd, including cloud storage, website hosting or payment processing providers, may store or process information outside New Zealand.',
      },
      {
        type: 'p',
        text: 'Where personal information is transferred overseas, we take reasonable steps to ensure it receives a level of protection comparable to that required under the Privacy Act 2020.',
      },
    ],
  },
  {
    heading: 'Security of Personal Information',
    blocks: [
      {
        type: 'p',
        text: 'Blackstone Chauffeur Ltd takes reasonable administrative, technical and physical safeguards to protect the personal information we hold against unauthorised access, loss, misuse, alteration or disclosure.',
      },
      {
        type: 'p',
        text: 'While we implement industry-standard security measures, no method of electronic transmission over the internet or electronic storage is completely secure. Accordingly, Blackstone Chauffeur Ltd cannot guarantee the absolute security of information transmitted electronically and accepts no liability for any unauthorised access, loss or disclosure arising from circumstances beyond our reasonable control.',
      },
      { type: 'p', text: 'Nothing in this Privacy Policy limits any rights or remedies available under applicable New Zealand law.' },
    ],
  },
  {
    heading: 'Retention of Personal Information',
    blocks: [
      { type: 'p', text: 'We retain personal information only for as long as reasonably necessary to:' },
      {
        type: 'ul',
        items: [
          'Provide our services.',
          'Meet legal and regulatory obligations.',
          'Resolve disputes.',
          'Maintain business and accounting records.',
          'Enforce our contractual rights.',
        ],
      },
      { type: 'p', text: 'Information that is no longer required will be securely destroyed or permanently anonymised.' },
    ],
  },
  {
    heading: 'Access and Correction',
    blocks: [
      { type: 'p', text: 'You may request access to, or correction of, your personal information in accordance with the Privacy Act 2020.' },
      { type: 'p', text: 'Requests should be made using the contact details provided below. We may require reasonable proof of identity before processing any request.' },
    ],
  },
  {
    heading: 'Third-Party Websites',
    blocks: [
      { type: 'p', text: 'Our website may contain links to external websites operated by third parties.' },
      { type: 'p', text: 'These websites operate independently of Blackstone Chauffeur Ltd and have their own privacy policies.' },
      {
        type: 'p',
        text: 'Blackstone Chauffeur Ltd does not control, endorse or accept responsibility for the privacy practices, security or content of third-party websites. You access those websites entirely at your own discretion and should review their respective privacy policies before providing any personal information.',
      },
    ],
  },
  {
    heading: "Children's Privacy",
    blocks: [
      { type: 'p', text: 'Our services are intended for persons aged 18 years or older.' },
      {
        type: 'p',
        text: 'We do not knowingly collect personal information from children without appropriate consent. Where we become aware that such information has been collected inadvertently, reasonable steps will be taken to delete it.',
      },
    ],
  },
  {
    heading: 'Changes to this Privacy Policy',
    blocks: [
      {
        type: 'p',
        text: 'Blackstone Chauffeur Ltd reserves the right to amend this Privacy Policy at any time to reflect changes in legislation, technology or business practices.',
      },
      {
        type: 'p',
        text: 'Any updated version will be published on our website and will become effective from the date of publication unless otherwise stated.',
      },
    ],
  },
  {
    heading: 'Contact Us',
    blocks: [
      {
        type: 'p',
        text: 'If you have any questions regarding this Privacy Policy or wish to request access to or correction of your personal information, please contact:',
      },
      { type: 'p', text: 'Blackstone Chauffeur Ltd' },
      { type: 'p', text: 'Email: info@blackstonechauffeur.co.nz' },
      { type: 'p', text: 'Website: www.blackstonechauffeur.co.nz' },
      { type: 'p', text: 'Contact Form: Available through our website.' },
      {
        type: 'p',
        text: 'By accessing our website or using our services, you acknowledge that you have read, understood and accepted this Privacy Policy.',
      },
      {
        type: 'p',
        text: "To the maximum extent permitted by applicable law, Blackstone Chauffeur Ltd's liability in relation to the collection, storage, use or disclosure of personal information is limited to circumstances where any loss or damage results directly from our negligence, wilful misconduct or breach of applicable privacy legislation.",
      },
      {
        type: 'p',
        text: 'Nothing in this Privacy Policy excludes or limits any rights that cannot lawfully be excluded under New Zealand law.',
      },
    ],
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate="17 November 2025"
      description="Blackstone Chauffeur Ltd's Privacy Policy — how we collect, use, disclose, store and protect your personal information."
      intro={[
        'Blackstone Chauffeur Ltd ("Blackstone Chauffeur", "we", "our", or "us") respects your privacy and is committed to protecting your personal information in accordance with the Privacy Act 2020 (New Zealand) and other applicable laws.',
        'This Privacy Policy explains how we collect, use, disclose, store and protect your personal information when you visit our website, request a quotation, make a booking, or use any of our chauffeur and transportation services.',
        'By accessing our website or using our services, you acknowledge that you have read and understood this Privacy Policy.',
      ]}
      sections={sections}
    />
  )
}
