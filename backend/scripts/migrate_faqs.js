const db = require('../models');
const { faqs, sequelize } = db;

async function run() {
  try {
    console.log('--- Migrating faqs table ---');
    await faqs.sync({ alter: true });
    console.log('faqs table synced successfully.');

    const count = await faqs.count();
    console.log('Current faqs count:', count);

    if (count === 0) {
      console.log('Seeding initial FAQs...');
      const seeds = [
        // Bookings & guests - Requests
        {
          question: 'How do booking requests work?',
          answer: 'When a guest sends a booking request, you have 24 hours to accept or decline before it expires. You can review their profile, past reviews, and trip details beforehand.',
          category: 'Bookings & guests',
          section: 'Requests',
          targetAudience: 'Host',
          sortOrder: 1,
          status: 'Active'
        },
        {
          question: 'What happens if I decline?',
          answer: 'Declining occasional requests won\'t penalize your ranking, but maintaining a high acceptance rate keeps your listing visible and eligible for Top Host status.',
          category: 'Bookings & guests',
          section: 'Requests',
          targetAudience: 'Host',
          sortOrder: 2,
          status: 'Active'
        },
        {
          question: 'Should I turn on Instant Book?',
          answer: 'Instant Book allows eligible guests to book available dates immediately without waiting for host confirmation. It can increase your booking conversion by up to 30%.',
          category: 'Bookings & guests',
          section: 'Requests',
          targetAudience: 'Host',
          sortOrder: 3,
          status: 'Active'
        },
        // Bookings & guests - Guests
        {
          question: 'How do guests get in?',
          answer: 'Provide self check-in details, keypad codes, or key handoff instructions in your listing. Guests receive access instructions automatically 48 hours prior to check-in.',
          category: 'Bookings & guests',
          section: 'Guests',
          targetAudience: 'Host',
          sortOrder: 4,
          status: 'Active'
        },
        {
          question: 'What if a guest cancels?',
          answer: 'Your listing\'s cancellation policy (Flexible, Moderate, or Strict) determines the refund amount and payout retained when a reservation is cancelled.',
          category: 'Bookings & guests',
          section: 'Guests',
          targetAudience: 'Host',
          sortOrder: 5,
          status: 'Active'
        },
        // Payouts & fees
        {
          question: 'When do I receive payouts?',
          answer: 'Payouts are released 24 hours after the guest\'s scheduled check-in time. Depending on your bank, funds typically appear within 1-3 business days.',
          category: 'Payouts & fees',
          section: 'Payouts',
          targetAudience: 'Host',
          sortOrder: 6,
          status: 'Active'
        },
        {
          question: 'What host service fees are deducted?',
          answer: 'A standard service fee of 3% is deducted from the booking subtotal to cover platform maintenance, payment gateway processing, and 24/7 host support.',
          category: 'Payouts & fees',
          section: 'Fees',
          targetAudience: 'Host',
          sortOrder: 7,
          status: 'Active'
        },
        // Listing & calendar
        {
          question: 'How do I block or unblock dates on my calendar?',
          answer: 'Navigate to your Listing Calendar, select the dates you want to adjust, and choose \'Block Dates\' or \'Unblock Dates\'. Changes take effect immediately.',
          category: 'Listing & calendar',
          section: 'Calendar',
          targetAudience: 'Host',
          sortOrder: 8,
          status: 'Active'
        },
        {
          question: 'Can I set different pricing for weekends and holidays?',
          answer: 'Yes! Under your property\'s Pricing settings, you can define weekend premiums as well as seasonal rates for holidays and peak travel periods.',
          category: 'Listing & calendar',
          section: 'Pricing',
          targetAudience: 'Host',
          sortOrder: 9,
          status: 'Active'
        },
        // Safety & incidents
        {
          question: 'What should I do if property damage occurs?',
          answer: 'Take clear photos of any damage, notify Break Host Support within 48 hours of checkout, and submit an incident report with repair estimates.',
          category: 'Safety & incidents',
          section: 'Incidents',
          targetAudience: 'Host',
          sortOrder: 10,
          status: 'Active'
        },
        {
          question: 'How are house rules enforced?',
          answer: 'Your house rules are agreed to by guests before booking. Any severe violation allows you to cancel the reservation or request security deposit compensation.',
          category: 'Safety & incidents',
          section: 'Rules',
          targetAudience: 'Host',
          sortOrder: 11,
          status: 'Active'
        }
      ];

      await faqs.bulkCreate(seeds);
      console.log(`Successfully seeded ${seeds.length} FAQs!`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
