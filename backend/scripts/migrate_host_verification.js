const db = require('../models');

async function migrate() {
  console.log('--- Migrating Host Verification & Payout Columns ---');

  // Check columns on users table
  const [userCols] = await db.sequelize.query('DESCRIBE users');
  const userFieldNames = userCols.map(c => c.Field);

  const userColumnsToAdd = [
    {
      name: 'idDocumentType',
      sql: "ALTER TABLE users ADD COLUMN idDocumentType ENUM('Emirates ID', 'Passport', 'UAE Pass') NULL AFTER onboardingStep"
    },
    {
      name: 'idDocumentNumber',
      sql: "ALTER TABLE users ADD COLUMN idDocumentNumber VARCHAR(100) NULL AFTER idDocumentType"
    },
    {
      name: 'idDocumentFront',
      sql: "ALTER TABLE users ADD COLUMN idDocumentFront VARCHAR(500) NULL AFTER idDocumentNumber"
    },
    {
      name: 'idDocumentBack',
      sql: "ALTER TABLE users ADD COLUMN idDocumentBack VARCHAR(500) NULL AFTER idDocumentFront"
    },
    {
      name: 'verificationStatus',
      sql: "ALTER TABLE users ADD COLUMN verificationStatus ENUM('Unverified', 'Pending', 'Verified', 'Rejected') NOT NULL DEFAULT 'Unverified' AFTER idDocumentBack"
    },
    {
      name: 'verificationNotes',
      sql: "ALTER TABLE users ADD COLUMN verificationNotes TEXT NULL AFTER verificationStatus"
    },
    {
      name: 'verifiedAt',
      sql: "ALTER TABLE users ADD COLUMN verifiedAt DATETIME NULL AFTER verificationNotes"
    },
    {
      name: 'holidayHomePermitDoc',
      sql: "ALTER TABLE users ADD COLUMN holidayHomePermitDoc VARCHAR(500) NULL AFTER verifiedAt"
    },
    {
      name: 'holidayHomePermitNumber',
      sql: "ALTER TABLE users ADD COLUMN holidayHomePermitNumber VARCHAR(100) NULL AFTER holidayHomePermitDoc"
    },
    {
      name: 'holidayHomePermitStatus',
      sql: "ALTER TABLE users ADD COLUMN holidayHomePermitStatus ENUM('Not_Uploaded', 'Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Not_Uploaded' AFTER holidayHomePermitNumber"
    },
    {
      name: 'holidayHomePermitExpiry',
      sql: "ALTER TABLE users ADD COLUMN holidayHomePermitExpiry DATE NULL AFTER holidayHomePermitStatus"
    },
    {
      name: 'accountHolderName',
      sql: "ALTER TABLE users ADD COLUMN accountHolderName VARCHAR(255) NULL AFTER holidayHomePermitExpiry"
    },
    {
      name: 'bankName',
      sql: "ALTER TABLE users ADD COLUMN bankName VARCHAR(255) NULL AFTER accountHolderName"
    },
    {
      name: 'iban',
      sql: "ALTER TABLE users ADD COLUMN iban VARCHAR(50) NULL AFTER bankName"
    },
    {
      name: 'trn',
      sql: "ALTER TABLE users ADD COLUMN trn VARCHAR(50) NULL AFTER iban"
    },
    {
      name: 'payoutStatus',
      sql: "ALTER TABLE users ADD COLUMN payoutStatus ENUM('Not_Added', 'Pending', 'Verified', 'Rejected') NOT NULL DEFAULT 'Not_Added' AFTER trn"
    }
  ];

  for (const col of userColumnsToAdd) {
    if (!userFieldNames.includes(col.name)) {
      console.log(`Adding ${col.name} to users...`);
      await db.sequelize.query(col.sql);
      console.log(`✓ Added ${col.name}`);
    } else {
      console.log(`Column ${col.name} already exists on users.`);
    }
  }

  // Check columns on properties table
  const [propCols] = await db.sequelize.query('DESCRIBE properties');
  const propFieldNames = propCols.map(c => c.Field);

  const propColumnsToAdd = [
    {
      name: 'holidayHomePermitNumber',
      sql: "ALTER TABLE properties ADD COLUMN holidayHomePermitNumber VARCHAR(100) NULL AFTER status"
    },
    {
      name: 'holidayHomePermitDoc',
      sql: "ALTER TABLE properties ADD COLUMN holidayHomePermitDoc VARCHAR(500) NULL AFTER holidayHomePermitNumber"
    },
    {
      name: 'permitStatus',
      sql: "ALTER TABLE properties ADD COLUMN permitStatus ENUM('Not_Uploaded', 'Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Not_Uploaded' AFTER holidayHomePermitDoc"
    }
  ];

  for (const col of propColumnsToAdd) {
    if (!propFieldNames.includes(col.name)) {
      console.log(`Adding ${col.name} to properties...`);
      await db.sequelize.query(col.sql);
      console.log(`✓ Added ${col.name}`);
    } else {
      console.log(`Column ${col.name} already exists on properties.`);
    }
  }

  // Add index on users.verificationStatus if not present
  try {
    await db.sequelize.query('CREATE INDEX idx_users_verificationStatus ON users(verificationStatus)');
    console.log('✓ Added index idx_users_verificationStatus');
  } catch (e) {
    // Index might already exist
  }

  // Populate sample verification & payout data for existing hosts so test data is realistic
  console.log('Populating sample verification & payout data for existing hosts...');
  
  // Host 9 (Oliver Brown): Verified Emirates ID & Payout
  await db.users.update({
    idDocumentType: 'Emirates ID',
    idDocumentNumber: '784-1988-1092837-1',
    idDocumentFront: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
    idDocumentBack: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    verificationStatus: 'Verified',
    verifiedAt: new Date(),
    accountHolderName: 'Oliver Brown',
    bankName: 'Emirates NBD',
    iban: 'AE07 0331 2345 6789 0123 456',
    trn: '100234567800003',
    payoutStatus: 'Verified',
    holidayHomePermitNumber: 'DTCM-HHP-98421',
    holidayHomePermitDoc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    holidayHomePermitStatus: 'Approved',
    holidayHomePermitExpiry: '2027-12-31'
  }, { where: { id: 9 } });

  // Host 11 (Liam Taylor): Pending Verification with Passport
  await db.users.update({
    idDocumentType: 'Passport',
    idDocumentNumber: 'GB19284756',
    idDocumentFront: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    idDocumentBack: null,
    verificationStatus: 'Pending',
    accountHolderName: 'Liam Taylor',
    bankName: 'Abu Dhabi Commercial Bank (ADCB)',
    iban: 'AE52 0030 1928 3746 5928 102',
    trn: null,
    payoutStatus: 'Pending',
    holidayHomePermitNumber: 'DET-DXB-2026-4412',
    holidayHomePermitDoc: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    holidayHomePermitStatus: 'Pending',
    holidayHomePermitExpiry: '2027-06-30'
  }, { where: { id: 11 } });

  // Host 13 (Noah Anderson): Verified with UAE Pass
  await db.users.update({
    idDocumentType: 'UAE Pass',
    idDocumentNumber: 'UAE-PASS-784-1992-883712',
    idDocumentFront: null,
    idDocumentBack: null,
    verificationStatus: 'Verified',
    verifiedAt: new Date(),
    accountHolderName: 'Noah Anderson',
    bankName: 'First Abu Dhabi Bank (FAB)',
    iban: 'AE33 0020 9948 2716 3524 190',
    trn: '100987654300003',
    payoutStatus: 'Verified',
    holidayHomePermitNumber: 'DTCM-2026-90812',
    holidayHomePermitDoc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    holidayHomePermitStatus: 'Approved',
    holidayHomePermitExpiry: '2028-01-15'
  }, { where: { id: 13 } });

  // Host 15 (Ethan Jackson): Rejected with reason
  await db.users.update({
    idDocumentType: 'Emirates ID',
    idDocumentNumber: '784-1995-9988112-2',
    idDocumentFront: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
    idDocumentBack: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    verificationStatus: 'Rejected',
    verificationNotes: 'The submitted Emirates ID is expired. Please upload a clear photo of your renewed Emirates ID (front & back).',
    accountHolderName: 'Ethan Jackson',
    bankName: 'Dubai Islamic Bank (DIB)',
    iban: 'AE12 0240 1234 5678 9012 345',
    trn: null,
    payoutStatus: 'Rejected',
    holidayHomePermitStatus: 'Not_Uploaded'
  }, { where: { id: 15 } });

  // Update properties with sample holiday home permit
  await db.properties.update({
    holidayHomePermitNumber: 'DTCM-HHP-98421',
    holidayHomePermitDoc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    permitStatus: 'Approved'
  }, { where: { hostId: 9 } });

  console.log('✓ Migration and sample host verification seeding complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
