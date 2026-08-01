import LegalPageLayout from '../components/LegalPageLayout'

const sections = [
  {
    heading: 'Reservations and Booking Confirmation',
    blocks: [
      {
        type: 'p',
        text: 'A booking request submitted by telephone, email, online booking system, or any other method is not confirmed until BlackStone issues a booking confirmation or otherwise expressly accepts the booking.',
      },
      {
        type: 'p',
        text: 'BlackStone reserves the right to accept or decline any booking at its discretion, including where incorrect or incomplete information has been supplied, payment details cannot be verified, a suitable vehicle is unavailable, or the requested service cannot reasonably be provided.',
      },
      {
        type: 'p',
        text: 'The Customer is responsible for checking all information contained in the booking confirmation, including the pickup date, time, address, flight details, passenger numbers, destination, vehicle requirements, and contact details.',
      },
      {
        type: 'p',
        text: 'Unless the Customer advises BlackStone of an error or required amendment, BlackStone is entitled to rely on the information provided by the Customer. BlackStone will not be responsible for any loss, delay, missed flight, missed appointment, additional expense, or other consequence arising from incorrect, incomplete, or outdated information supplied by the Customer or their representative.',
      },
    ],
  },
  {
    heading: 'Pricing and Payment',
    blocks: [
      { type: 'p', text: 'All prices and scheduled rates are subject to availability and may change without notice until a booking is confirmed.' },
      {
        type: 'p',
        text: 'A valid credit or debit card may be required to guarantee a booking. BlackStone may accept payment by credit card, bank transfer, cash, approved account, or another agreed payment method.',
      },
      { type: 'p', text: 'Approved account customers must make payment within 7 days of the invoice date unless otherwise agreed in writing.' },
      {
        type: 'p',
        text: 'Additional charges may apply for waiting time, additional stops, route changes, parking, road tolls, airport charges, VIP pickup services, cleaning, vehicle damage, additional luggage transportation, and other costs incurred in providing the service.',
      },
      { type: 'p', text: 'Where applicable, GST will be charged in accordance with New Zealand law.' },
      {
        type: 'p',
        text: 'A 15% surcharge may apply to services operating between 12:00 am and 6:00 am. A surcharge may also apply on New Zealand public holidays.',
      },
      {
        type: 'p',
        text: 'BlackStone may charge the quoted or estimated transfer amount before the journey. Any additional charges incurred during or after the service may be charged separately following completion of the journey.',
      },
    ],
  },
  {
    heading: 'Airport Transfers and Flight Delays',
    blocks: [
      { type: 'p', text: 'Customers are responsible for providing accurate airline, flight number, arrival time, and terminal information.' },
      {
        type: 'p',
        text: 'BlackStone will make reasonable efforts to monitor flight arrival information where available. However, BlackStone does not guarantee the accuracy of information supplied by airlines, airports, third-party systems, or flight tracking services.',
      },
      {
        type: 'p',
        text: 'BlackStone is not responsible for flight delays, cancellations, diversions, immigration or customs delays, baggage delays, airport congestion, security restrictions, road closures, or other circumstances outside its reasonable control.',
      },
    ],
  },
  {
    heading: 'Waiting Time',
    blocks: [
      { type: 'p', text: 'For non-airport pickups, a complimentary 10-minute grace period applies from the confirmed pickup time.' },
      { type: 'p', text: 'For domestic airport arrivals, a complimentary waiting period of up to 30 minutes may apply from the actual aircraft landing time.' },
      { type: 'p', text: 'For international airport arrivals, a complimentary waiting period of up to 60 minutes may apply from the actual aircraft landing time.' },
      { type: 'p', text: 'After the applicable grace period, waiting time charges may apply in 15-minute increments or at the applicable hourly rate.' },
      {
        type: 'p',
        text: 'The chauffeur and/or BlackStone will make reasonable attempts to contact the Customer or booking agent. If the passenger cannot be located or contacted after a reasonable period, the booking may be treated as a no-show, and the full booking charge plus any waiting, parking, or other costs may apply.',
      },
    ],
  },
  {
    heading: 'Cancellations and No-Shows',
    blocks: [
      { type: 'p', text: 'Unless different cancellation terms are specified in the quotation or booking confirmation:' },
      {
        type: 'p',
        text: 'General and Airport Transfers: Cancellations received within 48 hours of the scheduled pickup time may be charged up to 100% of the confirmed booking price.',
      },
      {
        type: 'p',
        text: 'Tours, Weddings, Special Events, Group Transport and Extended Hire: Cancellations made within 15 days of the scheduled service may be charged up to 100% of the confirmed booking price.',
      },
      {
        type: 'p',
        text: 'A no-show may result in the Customer being charged 100% of the booking price, together with any applicable waiting time, parking, tolls, or other expenses already incurred.',
      },
      { type: 'p', text: 'Any non-refundable third-party costs incurred by BlackStone in connection with a booking may also be payable by the Customer.' },
    ],
  },
  {
    heading: 'Booking Changes and Variations',
    blocks: [
      {
        type: 'p',
        text: 'Any change to a confirmed booking, including changes to pickup times, destinations, routes, passenger numbers, vehicle requirements, additional stops, or waiting requirements, is subject to availability and may incur additional charges.',
      },
      {
        type: 'p',
        text: 'Where reasonably practicable, the Customer will be advised of significant additional charges before the requested variation is provided.',
      },
    ],
  },
  {
    heading: 'Vehicles and Substitute Services',
    blocks: [
      {
        type: 'p',
        text: 'BlackStone will make reasonable efforts to provide the requested vehicle or vehicle class. However, specific vehicle models cannot be guaranteed unless expressly agreed in writing.',
      },
      {
        type: 'p',
        text: "Where necessary due to operational requirements, breakdowns, accidents, availability, safety concerns, or circumstances outside BlackStone's reasonable control, BlackStone may provide a suitable substitute vehicle or arrange transportation through an approved third-party or subcontracted transportation provider.",
      },
      {
        type: 'p',
        text: 'To the maximum extent permitted by law, BlackStone will not be liable solely because a different vehicle or service provider is used, provided reasonable alternative transportation is supplied.',
      },
    ],
  },
  {
    heading: 'Delays and Circumstances Beyond Our Control',
    blocks: [
      { type: 'p', text: 'BlackStone will use reasonable efforts to provide punctual and reliable transportation.' },
      { type: 'p', text: 'However, travel times and arrival times are estimates and cannot be guaranteed.' },
      {
        type: 'p',
        text: "To the maximum extent permitted by law, BlackStone will not be responsible or liable for delays, missed flights, missed connections, missed appointments, loss of business, loss of income, accommodation costs, alternative transportation costs, or any other direct or indirect loss resulting from circumstances outside BlackStone's reasonable control.",
      },
      {
        type: 'p',
        text: "Such circumstances may include, without limitation, traffic congestion, accidents, road closures, roadworks, severe weather, flooding, natural disasters, mechanical breakdowns, airport congestion, flight changes, police activity, government restrictions, public events, civil disturbances, or other events beyond BlackStone's reasonable control.",
      },
      {
        type: 'p',
        text: 'Customers are responsible for allowing sufficient travel time when booking transportation for flights, appointments, events, and other time-sensitive commitments.',
      },
    ],
  },
  {
    heading: 'Passenger Conduct',
    blocks: [
      {
        type: 'p',
        text: 'Smoking, vaping, illegal drug use, unlawful conduct, abusive behaviour, violence, threats, harassment, and deliberate damage are strictly prohibited in all vehicles.',
      },
      { type: 'p', text: "Alcohol consumption may be permitted only with the chauffeur's approval and where permitted by law." },
      {
        type: 'p',
        text: "BlackStone and its chauffeurs reserve the right to refuse or immediately terminate a service where a passenger's behaviour is unsafe, unlawful, abusive, threatening, excessively intoxicated, disruptive, or may cause damage to the vehicle or place the chauffeur or any other person at risk.",
      },
      {
        type: 'p',
        text: 'Where a service is terminated due to passenger conduct, no refund will be provided to the extent permitted by law, and the Customer remains responsible for applicable booking charges and any resulting costs.',
      },
    ],
  },
  {
    heading: 'Damage, Cleaning and Financial Responsibility',
    blocks: [
      {
        type: 'p',
        text: 'The Customer is financially responsible for damage, excessive mess, staining, vomiting, breakage, or other damage caused to a vehicle by the Customer or any member of their travelling party.',
      },
      {
        type: 'p',
        text: 'The Customer agrees to pay reasonable repair, replacement, specialist cleaning, loss-of-use, and associated costs resulting from such damage.',
      },
    ],
  },
  {
    heading: 'Luggage and Personal Property',
    blocks: [
      { type: 'p', text: 'Customers must advise BlackStone in advance if they are travelling with excessive, oversized, or unusual luggage.' },
      {
        type: 'p',
        text: 'BlackStone will make reasonable efforts to accommodate luggage but does not guarantee that all luggage will fit in the selected vehicle. Where additional transportation is required, the additional cost will be payable by the Customer.',
      },
      { type: 'p', text: 'Passengers are responsible for their own luggage and personal belongings at all times.' },
      {
        type: 'p',
        text: 'BlackStone accepts no responsibility for property lost, forgotten, stolen, or damaged during or after transportation except to the extent that liability cannot legally be excluded.',
      },
      {
        type: 'p',
        text: 'BlackStone will make reasonable efforts to return items found in a vehicle. Any reasonable courier, delivery, chauffeur, or transportation costs associated with returning lost property may be charged to the Customer.',
      },
    ],
  },
  {
    heading: 'Additional Costs',
    blocks: [
      {
        type: 'p',
        text: 'Unless expressly included in the quotation, all admission fees, attraction tickets, accommodation, meals, refreshments, ferry charges, special parking, event access fees, and other third-party expenses are the responsibility of the Customer.',
      },
    ],
  },
  {
    heading: 'Limitation of Liability',
    blocks: [
      {
        type: 'p',
        text: 'To the maximum extent permitted by New Zealand law, BlackStone Chauffeur Ltd, its directors, employees, chauffeurs, contractors, and agents will not be liable for any indirect, incidental, consequential, or economic loss arising from the provision, delay, cancellation, interruption, or inability to provide transportation services.',
      },
      {
        type: 'p',
        text: "BlackStone will not be liable for any event, loss, delay, damage, expense, or inconvenience caused by circumstances outside its reasonable control or by the acts or omissions of the Customer, passengers, airlines, airports, third parties, subcontractors, or other transportation providers, except where BlackStone is legally responsible and such liability cannot lawfully be excluded.",
      },
      {
        type: 'p',
        text: 'Nothing in these Terms and Conditions excludes, restricts, or modifies any right or remedy that cannot legally be excluded under applicable New Zealand law.',
      },
    ],
  },
  {
    heading: 'Customer Responsibility',
    blocks: [
      { type: 'p', text: 'The Customer is responsible for ensuring that all passengers comply with these Terms and Conditions.' },
      {
        type: 'p',
        text: 'Where a booking is made by an agent, company, hotel, travel provider, or another person on behalf of a passenger, the person or organisation making the booking is responsible for communicating all relevant booking information and these Terms and Conditions to the passenger.',
      },
    ],
  },
  {
    heading: 'Indemnity',
    blocks: [
      {
        type: 'p',
        text: "To the maximum extent permitted by law, the Customer agrees to indemnify BlackStone Chauffeur Ltd against reasonable losses, costs, claims, expenses, or liabilities arising from the Customer's or passenger's unlawful conduct, breach of these Terms and Conditions, damage to property, or provision of materially incorrect booking information, except to the extent caused by BlackStone's own legally established liability.",
      },
    ],
  },
  {
    heading: 'Governing Law',
    blocks: [
      {
        type: 'p',
        text: 'These Terms and Conditions are governed by the laws of New Zealand. Any dispute arising in connection with a booking or service will be subject to the jurisdiction of the New Zealand courts or tribunals with authority to determine the dispute.',
      },
    ],
  },
  {
    heading: 'Acceptance of Terms',
    blocks: [
      {
        type: 'p',
        text: "By confirming a booking, making payment, entering a BlackStone vehicle, or otherwise using BlackStone Chauffeur Ltd's services, the Customer acknowledges that they have read, understood, and accepted these Terms and Conditions.",
      },
    ],
  },
]

export default function TermsConditions() {
  return (
    <LegalPageLayout
      title="Terms and Conditions of Service"
      effectiveDate="17 November 2025"
      description="Terms and Conditions applying to all bookings and transportation services provided by Blackstone Chauffeur Ltd."
      intro={[
        'These Terms and Conditions apply to all bookings and transportation services provided by BlackStone Chauffeur Ltd ("BlackStone", "we", "us", or "the Company"). By making, confirming, or accepting a booking or using our services, the customer, passenger, booking agent, or authorised representative ("Customer") agrees to be bound by these Terms and Conditions.',
        'BlackStone reserves the right to amend these Terms and Conditions from time to time. Any booking may also be subject to additional terms stated in the relevant quotation or booking confirmation.',
      ]}
      sections={sections}
    />
  )
}
