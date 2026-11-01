const db = require('../models');

async function updateTypes() {
  const seeds = [
    // Essentials
    { title: 'WiFi', type: 'Essentials' },
    { title: 'Air Conditioning', type: 'Essentials' },
    { title: 'Washer', type: 'Essentials' },
    { title: 'Dedicated workspace', type: 'Essentials' },
    { title: 'Heating', type: 'Essentials' },
    { title: 'Iron', type: 'Essentials' },
    { title: 'Private bathroom', type: 'Essentials' },
    { title: 'Free parking', type: 'Essentials' },
    { title: 'Smoking allowed', type: 'Essentials' },
    { title: 'Pets allowed', type: 'Essentials' },

    // Kitchen & dining
    { title: 'Kitchen', type: 'Kitchen & dining' },
    { title: 'Microwave', type: 'Kitchen & dining' },
    { title: 'Coffee maker', type: 'Kitchen & dining' },
    { title: 'Dishwasher', type: 'Kitchen & dining' },
    { title: 'Refrigerator', type: 'Kitchen & dining' },
    { title: 'Cooking basics', type: 'Kitchen & dining' },
    { title: 'Dishes and silverware', type: 'Kitchen & dining' },
    { title: 'Outdoor kitchen', type: 'Kitchen & dining' },

    // Bathroom
    { title: 'Bathtub', type: 'Bathroom' },
    { title: 'Hair dryer', type: 'Bathroom' },
    { title: 'Shampoo', type: 'Bathroom' },
    { title: 'Hot water', type: 'Bathroom' },
    { title: 'Bed linens', type: 'Bathroom' },

    // Entertainment
    { title: 'TV', type: 'Entertainment' },
    { title: 'Smart TV', type: 'Entertainment' },
    { title: 'Sound system', type: 'Entertainment' },
    { title: 'Books', type: 'Entertainment' },
    { title: 'Game console', type: 'Entertainment' },
    { title: 'Pool table', type: 'Entertainment' },
    { title: 'Ping pong table', type: 'Entertainment' },
    { title: 'Piano', type: 'Entertainment' },

    // Pool & wellness
    { title: 'Swimming Pool', type: 'Pool & wellness' },
    { title: 'Private pool', type: 'Pool & wellness' },
    { title: 'Shared pool', type: 'Pool & wellness' },
    { title: 'Heated pool', type: 'Pool & wellness' },
    { title: 'Gym', type: 'Pool & wellness' },
    { title: 'Beach Access', type: 'Pool & wellness' },
    { title: 'Hot tub', type: 'Pool & wellness' },
    { title: 'Sauna', type: 'Pool & wellness' },
    { title: 'Steam room', type: 'Pool & wellness' },

    // Outdoor & view
    { title: 'Garden', type: 'Outdoor & view' },
    { title: 'Patio', type: 'Outdoor & view' },
    { title: 'Balcony', type: 'Outdoor & view' },
    { title: 'BBQ grill', type: 'Outdoor & view' },
    { title: 'Fire pit', type: 'Outdoor & view' },
    { title: 'Outdoor dining', type: 'Outdoor & view' },
    { title: 'Desert view', type: 'Outdoor & view' },
    { title: 'Mountain view', type: 'Outdoor & view' },

    // Farm & desert
    { title: 'Farm animals', type: 'Farm & desert' },
    { title: 'Horse riding', type: 'Farm & desert' },
    { title: 'Stargazing area', type: 'Farm & desert' },
    { title: 'Campfire area', type: 'Farm & desert' },
    { title: 'Desert camp', type: 'Farm & desert' },

    // Sports & activities
    { title: 'Tennis court', type: 'Sports & activities' },
    { title: 'Basketball court', type: 'Sports & activities' },
    { title: 'Football pitch', type: 'Sports & activities' },
    { title: 'Volleyball court', type: 'Sports & activities' },
    { title: 'Yoga deck', type: 'Sports & activities' },

    // Family & kids
    { title: 'Crib', type: 'Family & kids' },
    { title: 'High chair', type: 'Family & kids' },
    { title: 'Baby safety gates', type: 'Family & kids' },
    { title: 'Children books and toys', type: 'Family & kids' },
    { title: 'Board games', type: 'Family & kids' },

    // Privacy & safety
    { title: 'Smoke alarm', type: 'Privacy & safety' },
    { title: 'Carbon monoxide detector', type: 'Privacy & safety' },
    { title: 'Fire extinguisher', type: 'Privacy & safety' },
    { title: 'First aid kit', type: 'Privacy & safety' },
    { title: 'Security cameras', type: 'Privacy & safety' },

    // Access & parking
    { title: 'Parking', type: 'Access & parking' },
    { title: 'EV charger', type: 'Access & parking' },
    { title: 'Wheelchair accessible', type: 'Access & parking' },
    { title: 'Elevator', type: 'Access & parking' },
    { title: 'Single level home', type: 'Access & parking' },

    // Services & location
    { title: 'Luggage dropoff allowed', type: 'Services & location' },
    { title: 'Long term stays allowed', type: 'Services & location' },
    { title: 'Cleaning available', type: 'Services & location' },
    { title: 'Host greeting', type: 'Services & location' },
  ];

  for (const s of seeds) {
    await db.sequelize.query(
      "UPDATE `amenities` SET `type` = :type WHERE `title` = :title",
      { replacements: { type: s.type, title: s.title } }
    );
  }

  const [distincts] = await db.sequelize.query(
    "SELECT `type`, COUNT(*) as count FROM `amenities` GROUP BY `type`"
  );
  console.log('Grouped counts:', distincts);
  process.exit(0);
}

updateTypes().catch(e => {
  console.error(e);
  process.exit(1);
});
