const db = require('../models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();

    console.log('Syncing hostResources table...');
    await db.hostResources.sync({ alter: true });
    console.log('✓ hostResources table ready.');

    const count = await db.hostResources.count();
    if (count === 0) {
      console.log('Seeding initial host resources from design...');
      const seedItems = [
        {
          title: 'Pricing weekends and holidays',
          type: 'Hosting resources',
          subtitle: 'For Top Hosts · keep your busiest nights full',
          readTime: '3 min read',
          icon: 'DollarSign',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
          featured: true,
          content: 'Weekend nights (Friday and Saturday) and UAE holidays are your busiest nights.\n\n• Weekends: try 8–15% above your weekday price.\n• Holidays: open the dates early and price them a little higher.',
          status: 'Active'
        },
        {
          title: 'Getting your holiday home permit',
          type: 'Hosting resources',
          subtitle: 'Step by step for Abu Dhabi and Dubai',
          readTime: '5 min read',
          icon: 'FileText',
          featured: false,
          content: 'Step-by-step guidance on securing your DTCM or DCT tourism license. Ensure your deed, passport copy, and DEWA bills are ready before applying.',
          status: 'Active'
        },
        {
          title: 'Hosting safely with farm animals',
          type: 'Hosting resources',
          subtitle: 'Tips for families and kids',
          readTime: '4 min read',
          icon: 'PawPrint',
          featured: false,
          content: 'Guidelines for farm retreats: separate animal enclosures, provide safe hand-washing stations, and outline house rules for animal interaction.',
          status: 'Active'
        },
        {
          title: 'Taking great listing photos',
          type: 'Hosting resources',
          subtitle: 'Light, angles and what to show',
          readTime: '3 min read',
          icon: 'Camera',
          featured: false,
          content: 'Natural daylight, horizontal landscape shots, and clean uncluttered staging will give guests the confidence to book.',
          status: 'Active'
        },
        {
          title: 'Getting your first 5-star review',
          type: 'Hosting resources',
          subtitle: 'A checklist for every stay',
          readTime: '2 min read',
          icon: 'Star',
          featured: false,
          content: 'Cleanliness, responsive messaging, and simple welcome gestures go a long way in delighting first-time guests.',
          status: 'Active'
        },
        {
          title: 'How do booking requests work?',
          type: 'Bookings & guests',
          subtitle: 'Accepting and managing guest inquiries',
          readTime: '2 min read',
          icon: 'CalendarCheck',
          featured: false,
          content: 'When a guest sends a booking request, you have 24 hours to review their profile and dates before accepting or declining.',
          status: 'Active'
        },
        {
          title: 'What happens if I decline?',
          type: 'Bookings & guests',
          subtitle: 'Calendar impact and best practices',
          readTime: '2 min read',
          icon: 'XCircle',
          featured: false,
          content: 'Declining occasional inquiries is completely acceptable if your property is unavailable, but make sure to block the dates on your calendar.',
          status: 'Active'
        },
        {
          title: 'Should I turn on Instant Book?',
          type: 'Bookings & guests',
          subtitle: 'Boost listing conversion rate',
          readTime: '3 min read',
          icon: 'Zap',
          featured: false,
          content: 'Instant Book properties get up to 2x more reservations. You can still set requirements like government ID verification.',
          status: 'Active'
        },
        {
          title: 'How do guests get in?',
          type: 'Bookings & guests',
          subtitle: 'Smart locks, keypads, and host greeting',
          readTime: '3 min read',
          icon: 'Key',
          featured: false,
          content: 'Self check-in instructions are delivered automatically to guests 48 hours before check-in once payment is verified.',
          status: 'Active'
        },
        {
          title: 'What if a guest cancels?',
          type: 'Bookings & guests',
          subtitle: 'Understanding cancellation policies',
          readTime: '2 min read',
          icon: 'HelpCircle',
          featured: false,
          content: 'Your selected cancellation policy (Flexible, Moderate, or Strict) automatically determines refund amounts and host payouts.',
          status: 'Active'
        },
        {
          title: 'Payout schedule & IBAN setup',
          type: 'Payouts & fees',
          subtitle: 'When and how funds are transferred',
          readTime: '3 min read',
          icon: 'CreditCard',
          featured: false,
          content: 'Payouts are initiated 24 hours after guest check-in directly to your verified UAE bank account.',
          status: 'Active'
        },
        {
          title: 'Safety, emergencies & damage reports',
          type: 'Safety & incidents',
          subtitle: 'Support when unexpected issues arise',
          readTime: '4 min read',
          icon: 'ShieldCheck',
          featured: false,
          content: 'Access emergency numbers, file security deposit claims, and reach our 24/7 bilingual host escalation team.',
          status: 'Active'
        }
      ];

      await db.hostResources.bulkCreate(seedItems);
      console.log(`✓ Seeded ${seedItems.length} host resources.`);
    } else {
      console.log(`hostResources already contains ${count} records.`);
    }

    console.log('--- Migration completed successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
