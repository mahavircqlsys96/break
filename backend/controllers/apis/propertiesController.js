const envfile = process.env;
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { Op, fn, col } = require('sequelize');
const db = require('../../models');
const { users,
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
  propertiesAnimals } = db;
const { v4: uuidv4 } = require('uuid');

module.exports = {

  // addProperties: async (req, res) => {
  //   try {
  //     console.log(req.body, "ADD PROPERTY REQUEST");

  //     const v = new Validator(req.body, {
  //       basicInfo: "required|minLength:3|maxLength:255",
  //       propertyTypeId: "required|integer",
  //       description: "required|maxLength:500",
  //       location: "required|maxLength:500",
  //       latitude: "required|numeric",
  //       longitude: "required|numeric",
  //       price: "required|numeric|min:1",
  //       bedroom: "required|integer|min:0",
  //       bathroom: "required|integer|min:1",
  //       guest: "required|integer|min:1",
  //       keyAmenities: "required",
  //       photos: "required",

  //     });

  //     const errors = await helper.checkValidation(v);

  //     if (errors) {
  //       return helper.failed(res, errors);
  //     }

  //     // --------------------------------------------------
  //     // Check authenticated user
  //     // --------------------------------------------------
  //     const user = req.auth;

  //     if (!user) {
  //       return helper.failed(res, "Authentication required.");
  //     }

  //     // if (user.role !== "Host") {
  //     //   return helper.failed(res, "Only hosts can add properties.");
  //     // }

  //     // --------------------------------------------------
  //     // Parse keyAmenities
  //     // Supports:
  //     // [1, 2, 3]
  //     // "[1, 2, 3]"
  //     // --------------------------------------------------
  //     let amenityIds;

  //     try {
  //       amenityIds =
  //         Array.isArray(req.body.keyAmenities)
  //           ? req.body.keyAmenities
  //           : JSON.parse(req.body.keyAmenities);
  //     } catch (parseError) {
  //       return helper.failed(
  //         res,
  //         "keyAmenities must be a valid array."
  //       );
  //     }

  //     if (!Array.isArray(amenityIds)) {
  //       return helper.failed(
  //         res,
  //         "keyAmenities must be an array."
  //       );
  //     }


  //     // --------------------------------------------------
  //     // Parse photos
  //     // Supports:
  //     // ["image1.jpg", "image2.jpg"]
  //     // '["image1.jpg", "image2.jpg"]'
  //     // --------------------------------------------------
  //     let photoUrls;

  //     try {
  //       photoUrls =
  //         Array.isArray(req.body.photos)
  //           ? req.body.photos
  //           : JSON.parse(req.body.photos);
  //     } catch (parseError) {
  //       return helper.failed(
  //         res,
  //         "photos must be a valid array."
  //       );
  //     }

  //     if (!Array.isArray(photoUrls)) {
  //       return helper.failed(
  //         res,
  //         "photos must be an array."
  //       );
  //     }



  //     if (photoUrls.length > 10) {
  //       return helper.failed(
  //         res,
  //         "You can add a maximum of 10 photos."
  //       );
  //     }

  //     let animalIds;

  //     try {
  //       animalIds =
  //         Array.isArray(req.body.animalIds)
  //           ? req.body.animalIds
  //           : JSON.parse(req.body.animalIds);
  //     } catch (parseError) {
  //       return helper.failed(
  //         res,
  //         "animalIds must be a valid array."
  //       );
  //     }

  //     if (!Array.isArray(photoUrls)) {
  //       return helper.failed(
  //         res,
  //         "animalIds must be an array."
  //       );
  //     }


  //     // --------------------------------------------------
  //     // Create Property Transaction
  //     // --------------------------------------------------
  //     const t = await properties.sequelize.transaction();

  //     let property;

  //     try {
  //       property = await properties.create(
  //         {
  //           hostId: user.id,
  //           basicInfo: String(req.body.basicInfo).trim(),
  //           propertyTypeId: Number(req.body.propertyTypeId),
  //           description: String(req.body.description).trim(),
  //           location: String(req.body.location).trim(),
  //           latitude: Number(req.body.latitude),
  //           longitude: Number(req.body.longitude),
  //           price: Number(req.body.price),
  //           bedroom: Number(req.body.bedroom),
  //           bathroom: Number(req.body.bathroom),
  //           guest: Number(req.body.guest),
  //         },
  //         {
  //           transaction: t,
  //         }
  //       );

  //       // ------------------------------------------------
  //       // Save Amenities
  //       // ------------------------------------------------
  //       await propertiesKeyAmenities.bulkCreate(
  //         amenityIds.map((amenitiesId) => ({
  //           propertyId: property.id,
  //           amenitiesId,
  //         })),
  //         {
  //           transaction: t,
  //         }
  //       );

  //       // ------------------------------------------------
  //       // Save Photos
  //       // ------------------------------------------------
  //       await propertiesPhotos.bulkCreate(
  //         photoUrls.map((image) => ({
  //           propertyId: property.id,
  //           image,
  //         })),
  //         {
  //           transaction: t,
  //         }
  //       );

  //       // ------------------------------------------------
  //       // Save Animals
  //       // ------------------------------------------------
  //       await propertiesAnimals.bulkCreate(
  //         animalIds.map((image) => ({
  //           propertyId: property.id,
  //           animalId,
  //         })),
  //         {
  //           transaction: t,
  //         }
  //       );
  //       await t.commit();
  //     } catch (dbError) {
  //       await t.rollback();
  //       throw dbError;
  //     }


  //     // --------------------------------------------------
  //     // Get Saved Photos
  //     // --------------------------------------------------
  //     const savedPhotos = await propertiesPhotos.findAll({
  //       where: {
  //         propertyId: property.id,
  //       },
  //       attributes: ["id", "image"],
  //       order: [["id", "ASC"]],
  //     });

  //     // --------------------------------------------------
  //     // Success Response
  //     // --------------------------------------------------
  //     return helper.success(
  //       res,
  //       "Property added successfully",
  //       {
  //         ...property.toJSON(),
  //         keyAmenities: amenityIds,
  //         photos: savedPhotos,
  //       }
  //     );
  //   } catch (error) {
  //     console.log("ADD PROPERTY ERROR:", error);
  //     return helper.error(res, error);
  //   }
  // },
  addProperties: async (req, res) => {
    try {

      const v = new Validator(req.body, {
        basicInfo: "required|minLength:3|maxLength:255",
        propertyTypeId: "required|integer",
        description: "required|maxLength:500",
        location: "required|maxLength:500",
        latitude: "required|numeric",
        longitude: "required|numeric",
        price: "required|numeric|min:1",
        bedroom: "required|integer|min:0",
        bathroom: "required|integer|min:1",
        guest: "required|integer|min:1",
        keyAmenities: "required",
        photos: "required",
        // animalIds: "required",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }

      const user = req.auth;

      let amenityIds;

      try {
        amenityIds = Array.isArray(req.body.keyAmenities)
          ? req.body.keyAmenities
          : JSON.parse(req.body.keyAmenities);
      } catch (parseError) {
        return helper.failed(
          res,
          "keyAmenities must be a valid array."
        );
      }

      if (!Array.isArray(amenityIds)) {
        return helper.failed(
          res,
          "keyAmenities must be an array."
        );
      }

      amenityIds = [
        ...new Set(
          amenityIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        ),
      ];

      // --------------------------------------------------
      // Parse Photos
      // --------------------------------------------------
      let photoUrls;

      try {
        photoUrls = Array.isArray(req.body.photos)
          ? req.body.photos
          : JSON.parse(req.body.photos);
      } catch (parseError) {
        return helper.failed(
          res,
          "photos must be a valid array."
        );
      }

      if (!Array.isArray(photoUrls)) {
        return helper.failed(
          res,
          "photos must be an array."
        );
      }

      photoUrls = [
        ...new Set(
          photoUrls
            .map((photo) => String(photo).trim())
            .filter(Boolean)
        ),
      ];

      if (photoUrls.length < 1) {
        return helper.failed(
          res,
          "Please upload at least one photo."
        );
      }

      if (photoUrls.length > 10) {
        return helper.failed(
          res,
          "You can add a maximum of 10 photos."
        );
      }

      // --------------------------------------------------
      // Parse Animals
      // --------------------------------------------------
      let animalIds;

      try {
        animalIds = Array.isArray(req.body.animalIds)
          ? req.body.animalIds
          : JSON.parse(req.body.animalIds);
      } catch (parseError) {
        return helper.failed(
          res,
          "animalIds must be a valid array."
        );
      }

      if (!Array.isArray(animalIds)) {
        return helper.failed(
          res,
          "animalIds must be an array."
        );
      }

      animalIds = [
        ...new Set(
          animalIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        ),
      ];

      // --------------------------------------------------
      // Check Property Type
      // --------------------------------------------------
      const type = await propertyTypes.findOne({
        where: {
          id: Number(req.body.propertyTypeId),
          status: "Active",
        },
      });

      if (!type) {
        return helper.failed(
          res,
          "Property type not found or not available."
        );
      }

      // --------------------------------------------------
      // Create Property Transaction
      // --------------------------------------------------
      const t = await properties.sequelize.transaction();

      let property;

      try {
        // ------------------------------------------------
        // Create Property
        // ------------------------------------------------
        property = await properties.create(
          {
            hostId: user.id,
            basicInfo: String(req.body.basicInfo).trim(),
            propertyTypeId: Number(req.body.propertyTypeId),
            description: String(req.body.description).trim(),
            location: String(req.body.location).trim(),
            latitude: Number(req.body.latitude),
            longitude: Number(req.body.longitude),
            price: Number(req.body.price),
            bedroom: Number(req.body.bedroom),
            bathroom: Number(req.body.bathroom),
            guest: Number(req.body.guest),
          },
          {
            transaction: t,
          }
        );

        // ------------------------------------------------
        // Save Amenities
        // ------------------------------------------------
        if (amenityIds.length > 0) {
          await propertiesKeyAmenities.bulkCreate(
            amenityIds.map((amenitiesId) => ({
              propertyId: property.id,
              amenitiesId: amenitiesId,
            })),
            {
              transaction: t,
            }
          );
        }

        // ------------------------------------------------
        // Save Photos
        // ------------------------------------------------
        await propertiesPhotos.bulkCreate(
          photoUrls.map((image) => ({
            propertyId: property.id,
            image: image,
          })),
          {
            transaction: t,
          }
        );

        // ------------------------------------------------
        // Save Animals
        // ------------------------------------------------
        if (animalIds.length > 0) {
          await propertiesAnimals.bulkCreate(
            animalIds.map((animalId) => ({
              propertyId: property.id,
              animalId: animalId,
            })),
            {
              transaction: t,
            }
          );
        }

        await t.commit();

      } catch (dbError) {
        await t.rollback();
        throw dbError;
      }

      // --------------------------------------------------
      // Get Saved Photos
      // --------------------------------------------------
      const savedPhotos = await propertiesPhotos.findAll({
        where: {
          propertyId: property.id,
        },
        attributes: ["id", "image"],
        order: [["id", "ASC"]],
      });

      // --------------------------------------------------
      // Get Saved Photos
      // --------------------------------------------------
      const savedamenity = await propertiesKeyAmenities.findAll({
        where: {
          propertyId: property.id,
        },
        attributes: ["id", "propertyId", "amenitiesId"],
        order: [["id", "ASC"]],
      });


      // --------------------------------------------------
      // Get Saved Animals
      // --------------------------------------------------
      const savedAnimals = await propertiesAnimals.findAll({
        where: {
          propertyId: property.id,
        },
        attributes: ["id", "animalId"],
        order: [["id", "ASC"]],
      });

      // --------------------------------------------------
      // Success Response
      // --------------------------------------------------
      return helper.success(
        res,
        "Property added successfully",
        {
          ...property.toJSON(),
          amenities: savedamenity,
          photos: savedPhotos,
          animals: savedAnimals,
        }
      );

    } catch (error) {
      console.log("ADD PROPERTY ERROR:", error);

      return helper.error(res, error);
    }
  },

  getProperties: async (req, res) => {
    try {
      // Pagination
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 10, 1);

      const offset = (page - 1) * limit;

      const { count, rows: propertiesList } =
        await properties.findAndCountAll({
          where: {
            deletedAt: null,
            // hostId: req.auth.id
          },

          attributes: {
            include: [
              [
                db.sequelize.literal(`(
                SELECT IFNULL(ROUND(AVG(rating), 1), 0)
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
            ],
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

          limit: limit,
          offset: offset,
          distinct: true,
        });

      // Pagination calculation
      const totalRecords = count;
      const totalPages = Math.ceil(totalRecords / limit);

      return helper.success(
        res,
        "Properties fetched successfully",
        {
          properties: propertiesList,

          pagination: {
            currentPage: page,
            limit: limit,
            totalRecords: totalRecords,
            totalPages: totalPages,

          },
        }
      );

    } catch (error) {
      console.log("GET PROPERTIES ERROR:", error);

      return helper.error(res, error);
    }
  },
  propertyDetail: async (req, res) => {
    try {
      const { propertyTypeId } = req.params;

      const v = new Validator(req.params, {
        propertyTypeId: "required|integer",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }


      const propertyDetail = await properties.findOne({
        where: {
          id: propertyTypeId,
          deletedAt: null,
        },


        attributes: {
          include: [
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.rating), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "avgRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.cleanness), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "cleannessRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.accuracy), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "accuracyRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.checkIn), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "checkInRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.communication), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "communicationRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.location), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "locationRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT IFNULL(ROUND(AVG(r.value), 1), 0)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "valueRating",
            ],
            [
              db.sequelize.literal(`(
        SELECT COUNT(*)
        FROM reviews r
        WHERE r.propertyId = properties.id
      )`),
              "ratingCount",
            ],
          ],
        },


        include: [
          // Property Type
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

          // Property Photos
          {
            model: propertiesPhotos,
            as: "propertiesPhotos",
            attributes: [
              "id",
              "image",
            ],
            required: false,
          },

          // Amenities
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

          // Friendly Animals
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

          // Property Reviews
          {
            model: reviews,
            as: "reviews",
            required: false,
            separate: true,
            limit: 2,
            order: [["id", "DESC"]],
            include: [
              {
                model: users,
                as: 'user',
                attributes: ['id', 'name', 'image']
              }
            ]
          },
        ],
      });

      // Property not found
      if (!propertyDetail) {
        return helper.failed(res, "Property not found");
      }

      return helper.success(
        res,
        "Property detail fetched successfully",
        propertyDetail
      );

    } catch (error) {
      console.log("PROPERTY DETAIL ERROR:", error);

      return helper.error(res, error);
    }
  },

  getPropertyReviews: async (req, res) => {
    try {
      const { propertyId } = req.params;

      // Validate params
      const v = new Validator(req.params, {
        propertyId: "required|integer",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }

      // Pagination
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit) || 10, 1);

      const offset = (page - 1) * limit;

      // Check property exists
      const property = await properties.findOne({
        where: {
          id: propertyId,
          // deletedAt: null,
        },
        attributes: ["id"],
      });

      if (!property) {
        return helper.failed(res, "Property not found");
      }

      // Get reviews
      const { count, rows: reviewsList } =
        await reviews.findAndCountAll({
          where: {
            propertyId: propertyId,
            deletedAt: null,
          },

          attributes: [
            "id",
            "propertyId",
            "rating",
            "cleanness",
            "accuracy",
            "checkIn",
            "communication",
            "location",
            "value",
            "review",
            "createdAt",
          ],

          include: [
            {
              model: users,
              as: "user",
              attributes: [
                "id",
                "name",
                "image",
              ],
              required: false,
            },
          ],

          order: [
            ["id", "DESC"],
          ],

          limit: limit,
          offset: offset,

          distinct: true,
        });

      const totalRecords = count;
      const totalPages = Math.ceil(totalRecords / limit);

      return helper.success(
        res,
        "Property reviews fetched successfully",
        {
          reviews: reviewsList,

          pagination: {
            currentPage: page,
            limit: limit,
            totalRecords: totalRecords,
            totalPages: totalPages,
          },
        }
      );

    } catch (error) {
      console.log("GET PROPERTY REVIEWS ERROR:", error);

      return helper.error(res, error);
    }
  },
  deleteProperty: async (req, res) => {
    try {
      const { propertyId } = req.params;

      const v = new Validator(req.params, {
        propertyId: "required|integer",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }

      // Check property exists
      const property = await properties.findOne({
        where: {
          id: propertyId,
          deletedAt: null,
        },
      });

      if (!property) {
        return helper.failed(res, "Property not found");
      }

      // Soft delete property
      await properties.update(
        {
          deletedAt: new Date(),
        },
        {
          where: {
            id: propertyId,
            deletedAt: null,
          },
        }
      );

      return helper.success(
        res,
        "Property deleted successfully",
        {}
      );

    } catch (error) {
      console.log("DELETE PROPERTY ERROR:", error);

      return helper.error(res, error);
    }
  },

  editProperties: async (req, res) => {
    try {
      console.log("EDIT PROPERTY REQUEST:", req.body);

      const v = new Validator(req.body, {
        propertyId: "required|integer",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }

      const { propertyId } = req.body;

      // Helper: string JSON array -> actual array
      const parseArray = (value, fieldName) => {
        if (value === undefined || value === null || value === "") {
          return null;
        }

        // Already array
        if (Array.isArray(value)) {
          return value;
        }

        // JSON string
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);

            if (!Array.isArray(parsed)) {
              throw new Error(`${fieldName} must be an array`);
            }

            return parsed;
          } catch (error) {
            throw new Error(
              `${fieldName} must be a valid JSON array`
            );
          }
        }

        throw new Error(`${fieldName} must be an array`);
      };

      // Parse array fields
      const keyAmenities = parseArray(
        req.body.keyAmenities,
        "keyAmenities"
      );

      const photos = parseArray(
        req.body.photos,
        "photos"
      );

      const animalIds = parseArray(
        req.body.animalIds,
        "animalIds"
      );

      // Find property
      const property = await properties.findOne({
        where: {
          id: propertyId,
          deletedAt: null,
        },
      });

      if (!property) {
        return helper.failed(res, "Property not found");
      }

      // Transaction
      const t = await properties.sequelize.transaction();

      try {
        // Update property
        await property.update(
          {
            basicInfo: req.body.basicInfo,
            propertyTypeId: req.body.propertyTypeId,
            description: req.body.description,
            location: req.body.location,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            price: req.body.price,
            bedroom: req.body.bedroom,
            bathroom: req.body.bathroom,
            guest: req.body.guest,
          },
          {
            transaction: t,
          }
        );

        // ============================
        // KEY AMENITIES
        // ============================

        if (keyAmenities !== null) {
          await propertiesKeyAmenities.destroy({
            where: {
              propertyId: propertyId,
            },
            transaction: t,
          });

          if (keyAmenities.length > 0) {
            await propertiesKeyAmenities.bulkCreate(
              keyAmenities.map((amenitiesId) => ({
                propertyId: propertyId,
                amenitiesId: Number(amenitiesId),
              })),
              {
                transaction: t,
              }
            );
          }
        }

        // ============================
        // PHOTOS
        // ============================

        if (photos !== null) {
          await propertiesPhotos.destroy({
            where: {
              propertyId: propertyId,
            },
            transaction: t,
          });

          if (photos.length > 0) {
            await propertiesPhotos.bulkCreate(
              photos.map((image) => ({
                propertyId: propertyId,
                image: image,
              })),
              {
                transaction: t,
              }
            );
          }
        }

        // ============================
        // ANIMALS
        // ============================

        if (animalIds !== null) {
          await propertiesAnimals.destroy({
            where: {
              propertyId: propertyId,
            },
            transaction: t,
          });

          if (animalIds.length > 0) {
            await propertiesAnimals.bulkCreate(
              animalIds.map((animalId) => ({
                propertyId: propertyId,
                animalId: Number(animalId),
              })),
              {
                transaction: t,
              }
            );
          }
        }

        await t.commit();

      } catch (dbError) {
        await t.rollback();
        throw dbError;
      }

      // ============================
      // GET UPDATED DATA
      // ============================

      const updated = await properties.findOne({
        where: {
          id: propertyId,
        },
      });

      const savedPhotos = await propertiesPhotos.findAll({
        where: {
          propertyId: propertyId,
        },
        attributes: [
          "id",
          "image",
        ],
        order: [
          ["id", "ASC"],
        ],
      });

      const savedAmenities = await propertiesKeyAmenities.findAll({
        where: {
          propertyId: propertyId,
        },
        attributes: [
          "id",
          "amenitiesId",
        ],
        order: [
          ["id", "ASC"],
        ],
      });

      const savedAnimals = await propertiesAnimals.findAll({
        where: {
          propertyId: propertyId,
        },
        attributes: [
          "id",
          "animalId",
        ],
        order: [
          ["id", "ASC"],
        ],
      });

      return helper.success(
        res,
        "Property updated successfully",
        {
          ...updated.toJSON(),

          keyAmenities: savedAmenities.map(
            (item) => item.amenitiesId
          ),

          photos: savedPhotos,

          animalIds: savedAnimals.map(
            (item) => item.animalId
          ),
        }
      );

    } catch (error) {
      console.log(
        "EDIT PROPERTY ERROR:",
        error
      );

      return helper.error(res, error);
    }
  }
};
