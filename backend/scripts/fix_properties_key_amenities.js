const db = require('../models');

async function fix() {
  const [cols] = await db.sequelize.query("SHOW COLUMNS FROM `propertiesKeyAmenities` LIKE 'status'");
  if (cols.length === 0) {
    await db.sequelize.query("ALTER TABLE `propertiesKeyAmenities` ADD COLUMN `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' AFTER `amenitiesId`");
    console.log('Added status column to propertiesKeyAmenities successfully');
  } else {
    console.log('status column already exists');
  }
  process.exit(0);
}

fix().catch(e => {
  console.error(e);
  process.exit(1);
});
