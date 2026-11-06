const db = require('../models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();

    console.log('Syncing promoCodes table...');
    await db.promoCodes.sync({ alter: true });
    console.log('✓ promoCodes table ready.');

    console.log('Checking bookings table promo columns...');
    const [cols] = await db.sequelize.query("SHOW COLUMNS FROM `bookings` LIKE 'promoCode'");
    if (cols.length === 0) {
      await db.sequelize.query("ALTER TABLE `bookings` ADD COLUMN `promoCode` VARCHAR(50) NULL DEFAULT NULL AFTER `noOfDays`");
      await db.sequelize.query("ALTER TABLE `bookings` ADD COLUMN `promoDiscount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `promoCode`");
      await db.sequelize.query("ALTER TABLE `bookings` ADD COLUMN `originalAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `promoDiscount`");
      console.log('✓ Added promoCode, promoDiscount, originalAmount columns to bookings table.');
    } else {
      console.log('promoCode column already exists in bookings.');
    }

    // Seed default promo codes if none exist
    const count = await db.promoCodes.count();
    if (count === 0) {
      const seedPromos = [
        {
          code: 'WELCOME100',
          title: 'New User Welcome Gift',
          description: 'Flat AED 100 off on your first Break booking',
          discountType: 'fixed',
          discountValue: 100,
          minBookingAmount: 1000,
          maxDiscount: 100,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          usageLimit: 500,
          usedCount: 12,
          status: 'Active'
        },
        {
          code: 'BREAK20',
          title: 'Summer Vacation 20% Off',
          description: '20% discount on desert camps and vacation homes',
          discountType: 'percentage',
          discountValue: 20,
          minBookingAmount: 1500,
          maxDiscount: 500,
          startDate: new Date('2026-06-01'),
          endDate: new Date('2026-11-30'),
          usageLimit: 200,
          usedCount: 45,
          status: 'Active'
        },
        {
          code: 'WEEKEND15',
          title: 'Weekend Getaway Deal',
          description: '15% off for 2+ nights bookings',
          discountType: 'percentage',
          discountValue: 15,
          minBookingAmount: 800,
          maxDiscount: 350,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2026-12-31'),
          usageLimit: 150,
          usedCount: 28,
          status: 'Active'
        }
      ];
      await db.promoCodes.bulkCreate(seedPromos);
      console.log(`✓ Seeded ${seedPromos.length} initial promo codes.`);
    }

    console.log('--- Promo codes migration finished successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

