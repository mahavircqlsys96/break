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
  propertyFriendlyAnimals } = db;

module.exports = {

  home: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 1000;
      const offset = (page - 1) * limit;

      const searchKey = req.query.searchKey || "";
      const categoryId = req.query.categoryId;

      let whereCondition = {
        status: 'active',
        type: 'publish',
      };

      if (req.auth) {
        whereCondition.userId = { [Op.ne]: req.auth.id };
      }

      if (categoryId) {
        whereCondition.categoryId = categoryId;
      }

      // ✅ Add search filter
      if (searchKey.trim()) {
        whereCondition = {
          ...whereCondition,
          [db.Sequelize.Op.or]: [
            {
              caption: {
                [db.Sequelize.Op.like]: `%${searchKey}%`
              }
            },
            {
              hashtags: {
                [db.Sequelize.Op.like]: `%${searchKey}%`
              }
            }
          ]
        };
      }

      let findPosts = await posts.findAll({
        where: whereCondition,
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM post_likes
              WHERE post_likes.postId = posts.id
            )`),
              "likeCount",
            ],
            [
              db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM post_comments
              WHERE post_comments.postId = posts.id
            )`),
              "commentCount",
            ],
            [
              db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM post_likes
              WHERE post_likes.postId = posts.id
              AND post_likes.userId = ${req.auth ? req.auth.id : 0}
            )`),
              "isLiked",
            ],
            [
              db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM bookmarks
              WHERE bookmarks.postId = posts.id
              AND bookmarks.userId = ${req.auth ? req.auth.id : 0}
            )`),
              "isBookmarked",
            ],

          ]
        },
        include: [
          {
            model: users,
            as: 'user',
            where: { isProvider: 1 },
            attributes: [
              'id', 'name', 'profileImage',
              [
                db.sequelize.literal(`(
                SELECT IFNULL(ROUND(AVG(rating),1),0)
                FROM rating
                WHERE rating.providerId = user.id
              )`),
                "providerAvgRating"
              ],
              [
                db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM rating
              WHERE rating.providerId = user.id
            )`),
                "totalReview",
              ],
            ]
          },
          {
            model: post_media,
            as: "postMedia",
            attributes: ["id", "mediaUrl", "type"],
            required: false,
          },
          {
            model: services_categories,
            as: 'category',
            attributes: ["id", "categoryName", "image"],
            required: false,
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return helper.success(res, 'Home', {
        posts: findPosts,
        pagination: {
          page,
          limit,
          searchKey,
          hasNextPage: findPosts.length === limit
        }
      });

    } catch (error) {
      console.log(error);
      return helper.error(res, 'Something went wrong');
    }
  },

  addWishlist: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        wishlistName: "required|minLength:3|maxLength:255",
        propertyId: "required|integer",
        notes: "required|maxLength:500",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }

      const user = req.auth;

      const { wishlistName, propertyId, notes } = req.body;

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

      // Check if property is already in wishlist
      const alreadyWishlist = await wishlists.findOne({
        where: {
          userId: user.id,
          propertyId: propertyId,
        },
      });

      if (alreadyWishlist) {
        return helper.failed(res, "Property is already added to wishlist");
      }

      // Create wishlist
      const wishlist = await wishlists.create({
        userId: user.id,
        propertyId: propertyId,
        wishlistName: wishlistName,
        notes: notes,
      });

      return helper.success(res, "Property added to wishlist successfully", wishlist);

    } catch (error) {
      console.log("addWishlist error:", error);
      return helper.error(res, "Something went wrong");
    }
  },
  getWishlist: async (req, res) => {
    try {
      const user = req.auth;

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await wishlists.findAndCountAll({
        where: {
          userId: user.id,
        },

        include: [
          {
            model: properties,
            as: "property",
            required: false,

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
            ],
          },
        ],

        order: [["createdAt", "DESC"]],

        limit: limit,
        offset: offset,
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);

      const obj = {
        wishlist: rows,
        pagination: {
          total: count,
          page: page,
          limit: limit,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };

      return helper.success(
        res,
        "Wishlist fetched successfully",
        obj
      );

    } catch (error) {
      console.log("getWishlist error:", error);
      return helper.error(res, "Something went wrong");
    }
  },
  removeWishlist: async (req, res) => {
    try {
      const user = req.auth;

      const v = new Validator(req.body, {
        wishlistId: "required|integer",
      });

      const errors = await helper.checkValidation(v);

      if (errors) {
        return helper.failed(res, errors);
      }

      const { wishlistId } = req.body;

      // Check wishlist belongs to logged-in user
      const wishlist = await wishlists.findOne({
        where: {
          id: wishlistId,
          userId: user.id,
        },
      });

      if (!wishlist) {
        return helper.failed(res, "Wishlist not found");
      }

      // Remove from wishlist
      await wishlists.destroy({
        where: {
          id: wishlistId,
          userId: user.id,
        },
      });

      return helper.success(
        res,
        "Property removed from wishlist successfully",
        {}
      );

    } catch (error) {
      console.log("removeWishlist error:", error);
      return helper.error(res, "Something went wrong");
    }
  },

};
