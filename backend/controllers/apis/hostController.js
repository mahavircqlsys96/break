const envfile = process.env;
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { Op } = require('sequelize');
const db = require('../../models');
const sequelize = require("sequelize");

const {
  users,
  propertyTypes,
  friendlyAnimals,
  properties,
  amenities,
  propertiesKeyAmenities,
  propertiesPhotos,
  bookings,
  bookingDates,
  wishlists,
  chatRoom,
  messages,
  cms,
  notifications,
  contactUs,
  reviews,
  reportUser,
  propertiesAnimals
} = db;
module.exports = {
  hostHome: async (req, res) => {
    try {
      const user = req.auth;

      // --------------------------------------------------
      // Get Properties
      // --------------------------------------------------
      const propertiesList = await properties.findAll({
        where: {
          deletedAt: null,
        },
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
              SELECT IFNULL(ROUND(AVG(rating),1),0)
              FROM reviews
              WHERE reviews.propertyId = properties.id
            )`),
              "avgRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT COUNT(*)
        FROM reviews
        WHERE reviews.propertyId = properties.id
      )`),
              "ratingCount",
            ],

          ]


        },

        include: [
          {
            model: propertyTypes,
            as: "propertyType",
            attributes: [
              "id",
              "title",
              "icon",
              "status",
            ],
            required: false,
          },

          {
            model: propertiesPhotos,
            as: "propertiesPhotos",
            attributes: [
              "id",
              "image",
            ],
            required: false,
          },

          {
            model: propertiesKeyAmenities,
            as: "propertiesKeyAmenities",
            attributes: [
              "id",
              "amenitiesId",
            ],
            required: false,

            include: [
              {
                model: amenities,
                as: "amenity",
                attributes: [
                  "id",
                  "title",
                  "icon",
                  "status",
                ],
                required: false,
              },
            ],
          },

          {
            model: propertiesAnimals,
            as: "propertiesAnimals",
            attributes: [
              "id",
              "animalId",
            ],
            required: false,

            include: [
              {
                model: friendlyAnimals,
                as: "friendlyAnimals",
                attributes: [
                  "id",
                  "title",
                  "image",
                ],
                required: false,
              },
            ],
          },
        ],

        order: [
          ["id", "DESC"],
        ],
        limit: 10
      });

      return helper.success(
        res,
        "Properties fetched successfully",
        propertiesList
      );

    } catch (error) {
      console.log("GET PROPERTIES ERROR:", error);

      return helper.error(res, error);
    }
  },

  getProviderProfile: async (req, res) => {
    try {
      const providerId = req.query.providerId || req.auth.id;

      const provider = await users.findOne({
        where: {
          id: providerId,
          // isProvider: 1,
        },

        attributes: {
          exclude: [
            "password",
            "resetToken",
            "resetTokenExpiry",
            "fcmToken",
          ],
          include: [
            [
              sequelize.literal(`(
              SELECT COUNT(*)
              FROM posts
              WHERE posts.userId = users.id
            )`),
              "postCount",
            ],

            [
              sequelize.literal(`(
              SELECT COUNT(*)
              FROM followers
              WHERE followers.followingId = users.id
            )`),
              "followerCount",
            ],

            [
              sequelize.literal(`(
              SELECT COUNT(*)
              FROM followers
              WHERE followers.followerId = users.id
            )`),
              "followingCount",
            ],

            [
              sequelize.literal(`(
              SELECT COUNT(*)
              FROM followers
              WHERE followers.followingId = users.id
              AND followers.followerId = ${req.auth ? req.auth.id : 0}
            )`),
              "isFollow",
            ],
            [
              sequelize.literal(`(
              SELECT COUNT(*)
              FROM bookings
              WHERE bookings.providerId = users.id
            )`),
              "bookingCount",
            ],

            [
              sequelize.literal(`0`),
              "avgRating",
            ],
          ],
        },

        include: [
          {
            model: portfolio_images,
            as: "portfolioImages",
            attributes: ["id", "imageUrl"],
            required: false,
          },
          {
            model: provider_verifications,
            as: "verifications",
            attributes: [
              "id",
              "documentType",
              "documentImage",
              "verificationStatus",
            ],
            required: false,
          },
        ],
      });

      if (!provider) {
        return helper.failed(res, "Provider not found");
      }

      let categoryData = await user_categories.findAll({
        where: { userId: provider.id },
        attributes: ["id", "categoryId", "isPrimary"],
        include: [
          {
            model: services_categories,
            as: "categories",
            attributes: ["id", "categoryName", "image"]
          }
        ]
      });
      const userPosts = await posts.findAll({
        where: { userId: provider.id, status: 'active', type: 'publish' },
        // attributes: ['id'],
        include: [
          {
            model: post_media,
            as: "postMedia",
            attributes: ["id", "mediaUrl", "type", "thumbnail"],
            required: false,
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const obj = provider.toJSON();
      obj.categories = categoryData;
      obj.posts = userPosts;

      return helper.success(
        res,
        "Provider profile fetched successfully",
        obj
      );
    } catch (error) {
      console.log(error);
      return helper.error(res, "Something went wrong");
    }
  },
  getProvidersList: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const Op = db.Sequelize.Op;

      const {
        searchKey,
        minPrice,
        maxPrice,
        minRating,
        categoryIds,
        isAvailable,
        latitude,
        longitude,
        radius
      } = req.query;

      // =========================
      // BASE CONDITION
      // =========================
      let whereCondition = {
        status: 'active',
        role: 'user',
        isProvider: 1,
        providerStatus: "approved"
      };

      // =========================
      // SEARCH FILTER
      // =========================
      if (searchKey?.trim()) {
        whereCondition[Op.or] = [
          { name: { [Op.like]: `%${searchKey}%` } },
          { userName: { [Op.like]: `%${searchKey}%` } },
          { email: { [Op.like]: `%${searchKey}%` } }
        ];
      }

      // =========================
      // PRICE FILTER
      // =========================
      if (minPrice || maxPrice) {
        whereCondition.hourlyPrice = {};
        if (minPrice) whereCondition.hourlyPrice[Op.gte] = Number(minPrice);
        if (maxPrice) whereCondition.hourlyPrice[Op.lte] = Number(maxPrice);
      }

      // =========================
      // AVAILABILITY FILTER
      // =========================
      if (isAvailable === "1") {
        // whereCondition.isOnline = 1; // isOnline column does not exist in users table
      }

      // =========================
      // DISTANCE CALCULATION
      // =========================
      let distanceQuery = null;
      let havingCondition = null;

      if (latitude && longitude && radius) {
        distanceQuery = `
        (
          6371 * acos(
            cos(radians(${latitude}))
            * cos(radians(users.latitude))
            * cos(radians(users.longitude) - radians(${longitude}))
            + sin(radians(${latitude}))
            * sin(radians(users.latitude))
          )
        )
      `;

        havingCondition = db.sequelize.literal(`distance <= ${radius}`);
      }

      // =========================
      // CATEGORY FILTER
      // =========================
      let include = [];

      if (categoryIds) {
        include.push({
          model: db.user_categories,
          as: "userCategories",
          required: true,
          where: {
            categoryId: {
              [Op.in]: Array.isArray(categoryIds)
                ? categoryIds
                : categoryIds.split(',')
            }
          }
        });
      } else {
        include.push({
          model: db.user_categories,
          as: "userCategories",
          required: false
        });
      }

      // =========================
      // MAIN QUERY
      // =========================
      let findProviders = await users.findAll({
        where: whereCondition,

        attributes: [
          'id',
          'bio',
          'about',
          'hourlyPrice',
          'profileImageProvider',
          'name',
          'email',
          'userName',
          'countryCode',
          'phone',

          ...(distanceQuery ? [
            [db.sequelize.literal(distanceQuery), "distance"]
          ] : []),

          [
            db.sequelize.literal(`(
            SELECT IFNULL(ROUND(AVG(rating),1),0)
            FROM rating
            WHERE rating.providerId = users.id
          )`),
            "providerAvgRating"
          ]
        ],

        include,

        group: ['users.id'],

        having: havingCondition || undefined,

        order: distanceQuery
          ? [[db.sequelize.literal("distance"), "ASC"]]
          : [['id', 'DESC']],

        limit,
        offset
      });

      return helper.success(res, 'Providers list fetched successfully', {
        providers: findProviders,
        pagination: {
          page,
          limit,
          searchKey,
          hasNextPage: findProviders.length === limit
        }
      });

    } catch (error) {
      console.log("getProvidersList error:", error);
      return helper.error(res, 'Something went wrong');
    }
  },
  providerDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const findProvider = await users.findOne({
        where: { id, role: 'user', isProvider: 1, providerStatus: "approved" },

        attributes: {
          exclude: ['password', 'fcmToken', 'deviceType', 'socialId', 'loginType', 'resetToken', 'resetTokenExpiry', 'customerId', 'isNotification', 'walletAmount', 'totalEarning', 'pendingAmount', 'withdrawnAmount', 'isWalletFrozen', 'referralCode', 'referredBy', 'admin_commission', 'govt_tax', 'contact_email', 'contact_phone', 'withdrawal_fees', 'country_fees', 'promotional_fee_waivers', 'supported_currencies', 'tax_rules', 'payout_providers', 'otp', 'otpVerify', 'isProfileComplete', 'createdAt', 'updatedAt', 'deletedAt'],
          include: [
            [
              db.sequelize.literal(`(
              SELECT IFNULL(ROUND(AVG(rating),1),0)
              FROM rating
              WHERE rating.providerId = users.id
            )`),
              "avgRating",
            ],


          ],
        },
        include: [
          {
            model: db.user_categories,
            as: "userCategories",
            required: false,
            include: [
              {
                model: services_categories,
                as: "category",
                attributes: ["id", "categoryName", "image"],
              },
            ],
          },
          {
            model: portfolio_images,
            as: "portfolioImages",
            attributes: ["id", "imageUrl"],
            required: false,
          },
        ]
      });
      if (!findProvider) {
        return helper.failed(res, "Provider not found");
      }
      return helper.success(res, "Provider detail fetched successfully", findProvider);
    } catch (error) {
      console.log("providerDetail error:", error);
      return helper.error(res, 'Something went wrong');
    }
  },
  addProviderCategory: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        categoryName: 'required',
        // description: 'required',
      });
      const matched = await v.check();
      if (!matched) {
        return helper.failed(res, v.errors);
      }

      const { categoryName, description } = req.body;
      const userId = req.auth.id;

      let image = null;
      if (req.files && req.files.image) {
        image = await helper.fileUpload(req.files.image, 'categories');
      }

      const newCategory = await services_categories.create({
        categoryName,
        description: description || "",
        approvalStatus: 'pending',
        userId: userId,
        status: 0,
        image
      });

      // Category is created as pending. User will select it from the list after it is approved by the admin.

      return helper.success(res, "Category added successfully. Waiting for admin approval.", newCategory);
    } catch (error) {
      console.log("addProviderCategory error:", error);
      return helper.error(res, 'Something went wrong');
    }
  },

  submitVerification: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        idDocumentType: 'required|in:Emirates ID,Passport,UAE Pass',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const { idDocumentType, idDocumentNumber } = req.body;

      let idDocumentFront = req.body.idDocumentFront || null;
      let idDocumentBack = req.body.idDocumentBack || null;

      if (req.files && req.files.idDocumentFront) {
        idDocumentFront = await helper.fileUpload(req.files.idDocumentFront, 'verification');
      }
      if (req.files && req.files.idDocumentBack) {
        idDocumentBack = await helper.fileUpload(req.files.idDocumentBack, 'verification');
      }

      let updateData = {
        idDocumentType,
        idDocumentNumber: idDocumentNumber || null,
        idDocumentFront,
        idDocumentBack,
        verificationStatus: idDocumentType === 'UAE Pass' ? 'Verified' : 'Pending',
        verificationNotes: null,
      };

      if (idDocumentType === 'UAE Pass') {
        updateData.verifiedAt = new Date();
        updateData.idDocumentNumber = idDocumentNumber || `UAE-PASS-${userId}`;
      }

      await users.update(updateData, { where: { id: userId } });

      const updated = await users.findOne({
        where: { id: userId },
        attributes: [
          'id',
          'idDocumentType',
          'idDocumentNumber',
          'idDocumentFront',
          'idDocumentBack',
          'verificationStatus',
          'verifiedAt'
        ]
      });

      return helper.success(
        res,
        idDocumentType === 'UAE Pass' ? 'Identity verified with UAE Pass' : 'Identity verification submitted for review',
        updated
      );
    } catch (error) {
      console.log('submitVerification error:', error);
      return helper.error(res, error);
    }
  },

  submitPayoutAccount: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        accountHolderName: 'required|minLength:2|maxLength:100',
        bankName: 'required|minLength:2|maxLength:100',
        iban: 'required|minLength:15|maxLength:34',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const { accountHolderName, bankName, iban, trn } = req.body;

      // Clean and normalize IBAN
      const cleanIban = String(iban).replace(/\s+/g, '').toUpperCase();
      if (!cleanIban.startsWith('AE')) {
        return helper.failed(res, 'UAE IBAN must begin with AE');
      }

      const updateData = {
        accountHolderName,
        bankName,
        iban: cleanIban,
        trn: trn || null,
        payoutStatus: 'Pending',
      };

      await users.update(updateData, { where: { id: userId } });

      return helper.success(res, 'Payout account details submitted successfully', {
        accountHolderName,
        bankName,
        iban: cleanIban,
        trn: trn || null,
        payoutStatus: 'Pending',
      });
    } catch (error) {
      console.log('submitPayoutAccount error:', error);
      return helper.error(res, error);
    }
  },

  submitHolidayHomePermit: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        holidayHomePermitNumber: 'required|minLength:3|maxLength:50',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const { holidayHomePermitNumber, holidayHomePermitExpiry, propertyId } = req.body;

      let holidayHomePermitDoc = req.body.holidayHomePermitDoc || null;
      if (req.files && req.files.permitDoc) {
        holidayHomePermitDoc = await helper.fileUpload(req.files.permitDoc, 'permits');
      }

      await users.update({
        holidayHomePermitNumber,
        holidayHomePermitDoc,
        holidayHomePermitExpiry: holidayHomePermitExpiry || null,
        holidayHomePermitStatus: 'Pending',
      }, { where: { id: userId } });

      if (propertyId) {
        await properties.update({
          holidayHomePermitNumber,
          holidayHomePermitDoc,
          permitStatus: 'Pending',
        }, { where: { id: propertyId, hostId: userId } });
      }

      return helper.success(res, 'Holiday home permit submitted for review', {
        holidayHomePermitNumber,
        holidayHomePermitDoc,
        holidayHomePermitStatus: 'Pending',
      });
    } catch (error) {
      console.log('submitHolidayHomePermit error:', error);
      return helper.error(res, error);
    }
  },

  getOnboardingProgress: async (req, res) => {
    try {
      const userId = req.auth.id;
      const user = await users.findOne({ where: { id: userId } });
      if (!user) return helper.failed(res, 'User not found');

      const hostProps = await properties.findAll({
        where: { hostId: userId, deletedAt: null },
      });

      const hasListing = hostProps.length > 0;
      const hasActiveListing = hostProps.some(p => p.status === 'Active');
      const isIdentityVerified = user.verificationStatus === 'Verified';
      const isPayoutAdded = user.payoutStatus === 'Verified' || (user.payoutStatus === 'Pending' && !!user.iban);
      const isPermitUploaded = user.holidayHomePermitStatus === 'Approved' || (user.holidayHomePermitStatus === 'Pending' && !!user.holidayHomePermitNumber);
      const hasPricedProperty = hostProps.some(p => parseFloat(p.price) > 0);
      const hasCalendarSet = hasListing;

      const steps = [
        {
          step: 1,
          key: 'listing',
          title: 'Listing',
          description: hasActiveListing ? 'Listing approved & active' : (hasListing ? 'In review - usually within 2 working days' : 'Create your first listing'),
          status: hasActiveListing ? 'approved' : (hasListing ? 'in_review' : 'pending'),
          completed: hasActiveListing || hasListing,
          required: false,
        },
        {
          step: 2,
          key: 'identity',
          title: 'Verify your identity',
          description: user.idDocumentType ? `${user.idDocumentType} (${user.verificationStatus})` : 'Emirates ID or passport',
          status: user.verificationStatus,
          documentType: user.idDocumentType,
          completed: isIdentityVerified,
          required: true,
        },
        {
          step: 3,
          key: 'payout',
          title: 'Add payout account',
          description: user.bankName ? `${user.bankName} (${user.payoutStatus})` : 'Where we send your earnings',
          status: user.payoutStatus,
          bankName: user.bankName,
          completed: isPayoutAdded,
          required: true,
        },
        {
          step: 4,
          key: 'permit',
          title: 'Upload holiday home permit',
          description: user.holidayHomePermitNumber ? `Permit #${user.holidayHomePermitNumber}` : 'Needed to keep your listing live',
          status: user.holidayHomePermitStatus,
          permitNumber: user.holidayHomePermitNumber,
          completed: isPermitUploaded,
          required: true,
        },
        {
          step: 5,
          key: 'pricing',
          title: 'Pricing',
          description: hasPricedProperty ? 'Nightly price configured' : 'Set your nightly price',
          status: hasPricedProperty ? 'completed' : 'pending',
          completed: hasPricedProperty,
          required: true,
        },
        {
          step: 6,
          key: 'calendar',
          title: 'Calendar & check-in',
          description: hasCalendarSet ? 'Availability and arrival guide configured' : 'Availability and arrival guide',
          status: hasCalendarSet ? 'completed' : 'pending',
          completed: hasCalendarSet,
          required: true,
        },
      ];

      const completedCount = steps.filter(s => s.completed).length;

      return helper.success(res, 'Host onboarding progress fetched', {
        completedCount,
        totalCount: 6,
        progressLabel: `${completedCount} of 6 done`,
        summaryText: completedCount === 6 ? 'All steps completed! You are ready to host.' : 'Complete the required steps to receive payouts.',
        canReceivePayouts: isIdentityVerified && isPayoutAdded,
        canAcceptBookings: hasActiveListing && hasPricedProperty,
        steps,
      });
    } catch (error) {
      console.log('getOnboardingProgress error:', error);
      return helper.error(res, error);
    }
  },

  getUaeBanks: async (req, res) => {
    try {
      const banks = [
        { id: 'enbd', name: 'Emirates NBD', code: 'EBI' },
        { id: 'adcb', name: 'Abu Dhabi Commercial Bank (ADCB)', code: 'ADC' },
        { id: 'fab', name: 'First Abu Dhabi Bank (FAB)', code: 'FGB' },
        { id: 'dib', name: 'Dubai Islamic Bank (DIB)', code: 'DUI' },
        { id: 'mashreq', name: 'Mashreq Bank', code: 'MSQ' },
        { id: 'adib', name: 'Abu Dhabi Islamic Bank (ADIB)', code: 'ADI' },
        { id: 'rakbank', name: 'RAKBANK (National Bank of Ras Al-Khaimah)', code: 'RAK' },
        { id: 'cbd', name: 'Commercial Bank of Dubai (CBD)', code: 'CBD' },
        { id: 'ei', name: 'Emirates Islamic', code: 'EIB' },
        { id: 'sib', name: 'Sharjah Islamic Bank', code: 'NBS' }
      ];
      return helper.success(res, 'UAE Banks list', banks);
    } catch (error) {
      return helper.error(res, error);
    }
  },

  getHostSupport: async (req, res) => {
    try {
      const support = {
        title: 'Host support',
        searchPlaceholder: 'Search help for hosts',
        categories: [
          { id: 'bookings', title: 'Bookings & guests', icon: 'calendar' },
          { id: 'payouts', title: 'Payouts & fees', icon: 'credit-card' },
          { id: 'listings', title: 'Listing & calendar', icon: 'layout-grid' },
          { id: 'safety', title: 'Safety & incidents', icon: 'shield-check' },
        ],
        reportGuest: {
          title: 'Report a guest',
          subtitle: 'Damage, rule-breaking or safety issues'
        },
        contact: {
          title: 'Talk to the host team',
          hours: '24/7 in English and Arabic',
          phone: '+971 4 800 27325',
          email: 'support@break.ae',
          chatAvailable: true,
        }
      };
      return helper.success(res, 'Host support information', support);
    } catch (error) {
      return helper.error(res, error);
    }
  },

};
