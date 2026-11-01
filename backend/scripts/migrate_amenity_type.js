const db = require('../models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();

    console.log('Checking amenities columns...');
    const [cols] = await db.sequelize.query("SHOW COLUMNS FROM `amenities` LIKE 'type'");
    if (cols.length === 0) {
      console.log('Adding type column to amenities...');
      await db.sequelize.query("ALTER TABLE `amenities` ADD COLUMN `type` VARCHAR(100) DEFAULT 'Essentials' AFTER `icon`");
      await db.sequelize.query("ALTER TABLE `amenities` ADD INDEX `idx_amenities_type` (`type`)");
      console.log('type column and index added successfully.');
    } else {
      console.log('type column already exists.');
    }

    // Update existing initial amenities
    const updates = [
      { id: 1, type: 'Pool & wellness' },
      { id: 2, type: 'Essentials' },
      { id: 3, type: 'Access & parking' },
      { id: 4, type: 'Essentials' },
      { id: 5, type: 'Pool & wellness' },
      { id: 6, type: 'Kitchen & dining' },
      { id: 7, type: 'Entertainment' },
      { id: 8, type: 'Essentials' },
      { id: 9, type: 'Pool & wellness' },
      { id: 10, type: 'Outdoor & view' },
    ];

    for (const u of updates) {
      await db.sequelize.query(
        "UPDATE `amenities` SET `type` = :type WHERE `id` = :id",
        { replacements: { type: u.type, id: u.id } }
      );
    }
    console.log('Existing amenities updated with types.');

    // Seed comprehensive list of amenities from the new design
    const seedAmenities = [
      // Essentials
      { title: 'Dedicated workspace', type: 'Essentials', icon: 'amenities/workspace.png' },
      { title: 'Heating', type: 'Essentials', icon: 'amenities/heating.png' },
      { title: 'Iron', type: 'Essentials', icon: 'amenities/iron.png' },
      { title: 'Private bathroom', type: 'Essentials', icon: 'amenities/bathroom.png' },
      { title: 'Free parking', type: 'Essentials', icon: 'amenities/parking.png' },
      { title: 'Smoking allowed', type: 'Essentials', icon: 'amenities/smoking.png' },
      { title: 'Pets allowed', type: 'Essentials', icon: 'amenities/pets.png' },

      // Kitchen & dining
      { title: 'Microwave', type: 'Kitchen & dining', icon: 'amenities/microwave.png' },
      { title: 'Coffee maker', type: 'Kitchen & dining', icon: 'amenities/coffee.png' },
      { title: 'Dishwasher', type: 'Kitchen & dining', icon: 'amenities/dishwasher.png' },
      { title: 'Refrigerator', type: 'Kitchen & dining', icon: 'amenities/fridge.png' },
      { title: 'Cooking basics', type: 'Kitchen & dining', icon: 'amenities/cooking.png' },
      { title: 'Dishes and silverware', type: 'Kitchen & dining', icon: 'amenities/dishes.png' },
      { title: 'Outdoor kitchen', type: 'Kitchen & dining', icon: 'amenities/outdoor-kitchen.png' },

      // Bathroom
      { title: 'Bathtub', type: 'Bathroom', icon: 'amenities/bathtub.png' },
      { title: 'Hair dryer', type: 'Bathroom', icon: 'amenities/hairdryer.png' },
      { title: 'Shampoo', type: 'Bathroom', icon: 'amenities/shampoo.png' },
      { title: 'Hot water', type: 'Bathroom', icon: 'amenities/hot-water.png' },
      { title: 'Bed linens', type: 'Bathroom', icon: 'amenities/linens.png' },

      // Entertainment
      { title: 'Smart TV', type: 'Entertainment', icon: 'amenities/smart-tv.png' },
      { title: 'Sound system', type: 'Entertainment', icon: 'amenities/sound-system.png' },
      { title: 'Books', type: 'Entertainment', icon: 'amenities/books.png' },
      { title: 'Game console', type: 'Entertainment', icon: 'amenities/game-console.png' },
      { title: 'Pool table', type: 'Entertainment', icon: 'amenities/pool-table.png' },
      { title: 'Ping pong table', type: 'Entertainment', icon: 'amenities/ping-pong.png' },
      { title: 'Piano', type: 'Entertainment', icon: 'amenities/piano.png' },

      // Pool & wellness
      { title: 'Private pool', type: 'Pool & wellness', icon: 'amenities/private-pool.png' },
      { title: 'Shared pool', type: 'Pool & wellness', icon: 'amenities/shared-pool.png' },
      { title: 'Heated pool', type: 'Pool & wellness', icon: 'amenities/heated-pool.png' },
      { title: 'Hot tub', type: 'Pool & wellness', icon: 'amenities/hot-tub.png' },
      { title: 'Sauna', type: 'Pool & wellness', icon: 'amenities/sauna.png' },
      { title: 'Steam room', type: 'Pool & wellness', icon: 'amenities/steam-room.png' },

      // Outdoor & view
      { title: 'Patio', type: 'Outdoor & view', icon: 'amenities/patio.png' },
      { title: 'Balcony', type: 'Outdoor & view', icon: 'amenities/balcony.png' },
      { title: 'BBQ grill', type: 'Outdoor & view', icon: 'amenities/bbq.png' },
      { title: 'Fire pit', type: 'Outdoor & view', icon: 'amenities/fire-pit.png' },
      { title: 'Outdoor dining', type: 'Outdoor & view', icon: 'amenities/outdoor-dining.png' },
      { title: 'Desert view', type: 'Outdoor & view', icon: 'amenities/desert-view.png' },
      { title: 'Mountain view', type: 'Outdoor & view', icon: 'amenities/mountain-view.png' },

      // Farm & desert
      { title: 'Farm animals', type: 'Farm & desert', icon: 'amenities/farm-animals.png' },
      { title: 'Horse riding', type: 'Farm & desert', icon: 'amenities/horse-riding.png' },
      { title: 'Stargazing area', type: 'Farm & desert', icon: 'amenities/stargazing.png' },
      { title: 'Campfire area', type: 'Farm & desert', icon: 'amenities/campfire.png' },
      { title: 'Desert camp', type: 'Farm & desert', icon: 'amenities/desert-camp.png' },

      // Sports & activities
      { title: 'Tennis court', type: 'Sports & activities', icon: 'amenities/tennis.png' },
      { title: 'Basketball court', type: 'Sports & activities', icon: 'amenities/basketball.png' },
      { title: 'Football pitch', type: 'Sports & activities', icon: 'amenities/football.png' },
      { title: 'Volleyball court', type: 'Sports & activities', icon: 'amenities/volleyball.png' },
      { title: 'Yoga deck', type: 'Sports & activities', icon: 'amenities/yoga.png' },

      // Family & kids
      { title: 'Crib', type: 'Family & kids', icon: 'amenities/crib.png' },
      { title: 'High chair', type: 'Family & kids', icon: 'amenities/high-chair.png' },
      { title: 'Baby safety gates', type: 'Family & kids', icon: 'amenities/safety-gate.png' },
      { title: 'Children books and toys', type: 'Family & kids', icon: 'amenities/toys.png' },
      { title: 'Board games', type: 'Family & kids', icon: 'amenities/board-games.png' },

      // Privacy & safety
      { title: 'Smoke alarm', type: 'Privacy & safety', icon: 'amenities/smoke-alarm.png' },
      { title: 'Carbon monoxide detector', type: 'Privacy & safety', icon: 'amenities/carbon-monoxide.png' },
      { title: 'Fire extinguisher', type: 'Privacy & safety', icon: 'amenities/fire-extinguisher.png' },
      { title: 'First aid kit', type: 'Privacy & safety', icon: 'amenities/first-aid.png' },
      { title: 'Security cameras', type: 'Privacy & safety', icon: 'amenities/cctv.png' },

      // Access & parking
      { title: 'EV charger', type: 'Access & parking', icon: 'amenities/ev-charger.png' },
      { title: 'Wheelchair accessible', type: 'Access & parking', icon: 'amenities/wheelchair.png' },
      { title: 'Elevator', type: 'Access & parking', icon: 'amenities/elevator.png' },
      { title: 'Single level home', type: 'Access & parking', icon: 'amenities/single-level.png' },

      // Services & location
      { title: 'Luggage dropoff allowed', type: 'Services & location', icon: 'amenities/luggage.png' },
      { title: 'Long term stays allowed', type: 'Services & location', icon: 'amenities/long-term.png' },
      { title: 'Cleaning available', type: 'Services & location', icon: 'amenities/cleaning.png' },
      { title: 'Host greeting', type: 'Services & location', icon: 'amenities/host-greeting.png' },
    ];

    for (const a of seedAmenities) {
      const existing = await db.amenities.findOne({ where: { title: a.title } });
      if (!existing) {
        await db.amenities.create({
          title: a.title,
          type: a.type,
          icon: a.icon,
          status: 'Active',
        });
      } else {
        await existing.update({ type: a.type });
      }
    }
    console.log('Seeded design amenities successfully!');

    // Show result
    const [finalList] = await db.sequelize.query("SELECT id, title, type, status FROM amenities ORDER BY id ASC");
    console.log(`Total amenities now: ${finalList.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
