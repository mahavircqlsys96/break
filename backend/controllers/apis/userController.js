const envfile = process.env;
const helper = require('../../helpers/helper');
const { Validator } = require('node-input-validator');
const { Op } = require('sequelize');
const db = require('../../models');

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
  propertiesAnimals,
  faqs,
} = db;

module.exports = {
  /**
   * Home Screen Data (Break Mobile App)
   * Returns categories, popular destinations, featured properties, and recent listings.
   */
  home: async (req, res) => {
    try {
      const currentUserId = req.auth ? req.auth.id : 0;

      // 1. Property Categories (Farms, Vacation homes, Resorts, Desert camps)
      const categories = await propertyTypes.findAll({
        where: { status: 'Active' },
        attributes: ['id', 'title', 'icon'],
        order: [['id', 'ASC']],
      });

      // 2. Popular Destinations in UAE
      const destinations = [
        {
          id: 'auh',
          name: 'Abu Dhabi',
          area: 'Al Wathba, Yas Island & Saadiyat',
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'dxb',
          name: 'Dubai',
          area: 'Palm Jumeirah, Downtown & Desert',
          image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'aln',
          name: 'Al Ain',
          area: 'Jebel Hafeet & Oasis Farms',
          image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'rak',
          name: 'Ras Al Khaimah',
          area: 'Jebel Jais & Al Wadi Desert',
          image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
        },
        {
          id: 'shj',
          name: 'Sharjah',
          area: 'Mleiha Desert & Heritage Area',
          image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&auto=format&fit=crop&q=80',
        },
      ];

      // 3. Featured Properties
      const featuredProperties = await properties.findAll({
        where: { deletedAt: null },
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
                SELECT IFNULL(ROUND(AVG(rating), 1), 0)
                FROM reviews
                WHERE reviews.propertyId = properties.id
              )`),
              'avgRating',
            ],
            [
              db.sequelize.literal(`(
                SELECT COUNT(*)
                FROM reviews
                WHERE reviews.propertyId = properties.id
              )`),
              'ratingCount',
            ],
            [
              db.sequelize.literal(`(
                SELECT COUNT(*)
                FROM wishlists
                WHERE wishlists.propertyId = properties.id
                AND wishlists.userId = ${currentUserId}
              )`),
              'isWishlisted',
            ],
          ],
        },
        include: [
          {
            model: propertyTypes,
            as: 'propertyType',
            attributes: ['id', 'title', 'icon'],
            required: false,
          },
          {
            model: users,
            as: 'host',
            attributes: ['id', 'name', 'image'],
            required: false,
          },
          {
            model: propertiesPhotos,
            as: 'propertiesPhotos',
            attributes: ['id', 'image'],
            required: false,
          },
        ],
        order: [['id', 'DESC']],
        limit: 10,
      });

      // Format properties for client
      const formattedProperties = featuredProperties.map((p) => {
        const item = p.toJSON();
        return {
          ...item,
          name: item.basicInfo || '—',
          avgRating: Number(item.avgRating) || 0,
          ratingCount: Number(item.ratingCount) || 0,
          isWishlisted: Number(item.isWishlisted) > 0,
        };
      });

      return helper.success(res, 'Home data fetched successfully', {
        banners: [
          {
            id: 1,
            title: 'Discover Luxury Farms & Desert Retreats',
            subtitle: 'Book unique farm stays, chalets, and private desert lodges across the UAE.',
            code: 'BREAK2026',
            discount: '15% OFF',
          },
        ],
        categories,
        destinations,
        featuredProperties: formattedProperties,
      });
    } catch (error) {
      console.log('HOME ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Toggle Wishlist (Heart button)
   * Adds property if not present, removes if already wishlisted.
   */
  toggleWishlist: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        propertyId: 'required|integer',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const propertyId = Number(req.body.propertyId);

      const property = await properties.findOne({
        where: { id: propertyId, deletedAt: null },
      });
      if (!property) return helper.failed(res, 'Property not found');

      const existing = await wishlists.findOne({
        where: { userId, propertyId },
      });

      if (existing) {
        await existing.destroy();
        return helper.success(res, 'Removed from wishlist', {
          propertyId,
          isWishlisted: false,
        });
      } else {
        const created = await wishlists.create({
          userId,
          propertyId,
          wishlistName: req.body.wishlistName || property.basicInfo || 'Favorites',
          notes: req.body.notes || null,
        });
        return helper.success(res, 'Added to wishlist', {
          wishlistId: created.id,
          propertyId,
          isWishlisted: true,
        });
      }
    } catch (error) {
      console.log('toggleWishlist error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Add to Wishlist
   */
  addWishlist: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        propertyId: 'required|integer',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const propertyId = Number(req.body.propertyId);
      const { wishlistName = 'My Wishlist', notes = '' } = req.body;

      const property = await properties.findOne({
        where: { id: propertyId, deletedAt: null },
      });
      if (!property) return helper.failed(res, 'Property not found');

      const alreadyWishlist = await wishlists.findOne({
        where: { userId, propertyId },
      });
      if (alreadyWishlist) {
        return helper.failed(res, 'Property is already in wishlist');
      }

      const wishlist = await wishlists.create({
        userId,
        propertyId,
        wishlistName,
        notes,
      });

      return helper.success(res, 'Property added to wishlist successfully', {
        ...wishlist.toJSON(),
        isWishlisted: true,
      });
    } catch (error) {
      console.log('addWishlist error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Get User Wishlist
   */
  getWishlist: async (req, res) => {
    try {
      const userId = req.auth.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const { count, rows } = await wishlists.findAndCountAll({
        where: { userId },
        include: [
          {
            model: properties,
            as: 'property',
            required: true,
            attributes: {
              include: [
                [
                  db.sequelize.literal(`(
                    SELECT IFNULL(ROUND(AVG(rating), 1), 0)
                    FROM reviews
                    WHERE reviews.propertyId = property.id
                  )`),
                  'avgRating',
                ],
                [
                  db.sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM reviews
                    WHERE reviews.propertyId = property.id
                  )`),
                  'ratingCount',
                ],
              ],
            },
            include: [
              {
                model: propertyTypes,
                as: 'propertyType',
                attributes: ['id', 'title', 'icon'],
                required: false,
              },
              {
                model: propertiesPhotos,
                as: 'propertiesPhotos',
                attributes: ['id', 'image'],
                required: false,
              },
              {
                model: users,
                as: 'host',
                attributes: ['id', 'name', 'image'],
                required: false,
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      const formatted = rows.map((w) => {
        const item = w.toJSON();
        const p = item.property || {};
        return {
          wishlistId: item.id,
          wishlistName: item.wishlistName,
          notes: item.notes,
          propertyId: p.id,
          name: p.basicInfo,
          basicInfo: p.basicInfo,
          location: p.location,
          price: p.price,
          avgRating: Number(p.avgRating) || 0,
          ratingCount: Number(p.ratingCount) || 0,
          photos: p.propertiesPhotos || [],
          propertyType: p.propertyType,
          host: p.host,
          isWishlisted: true,
        };
      });

      const totalPages = Math.ceil(count / limit);

      return helper.success(res, 'Wishlist fetched successfully', {
        list: formatted,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
        },
      });
    } catch (error) {
      console.log('getWishlist error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Remove from Wishlist
   */
  removeWishlist: async (req, res) => {
    try {
      const userId = req.auth.id;
      const wishlistId = req.body.wishlistId || req.params.wishlistId;
      const propertyId = req.body.propertyId || req.params.propertyId;

      let whereClause = { userId };
      if (wishlistId) {
        whereClause.id = wishlistId;
      } else if (propertyId) {
        whereClause.propertyId = propertyId;
      } else {
        return helper.failed(res, 'wishlistId or propertyId is required');
      }

      const deleted = await wishlists.destroy({ where: whereClause });
      if (!deleted) {
        return helper.failed(res, 'Wishlist item not found');
      }

      return helper.success(res, 'Removed from wishlist successfully', {
        isWishlisted: false,
      });
    } catch (error) {
      console.log('removeWishlist error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * FAQs (Help & Support Screen)
   */
  getFaqs: async (req, res) => {
    try {
      const list = await faqs.findAll({
        where: { status: 'Active' },
        order: [['order', 'ASC'], ['id', 'ASC']],
      });

      return helper.success(res, 'FAQs fetched successfully', list);
    } catch (error) {
      console.log('getFaqs error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Report User or Property
   */
  reportUser: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        reason: 'required|string',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const reportedUserId = req.body.reportedUserId || req.body.userId || null;
      const propertyId = req.body.propertyId || null;
      const reason = req.body.reason;
      const description = req.body.description || '';

      const report = await reportUser.create({
        userId,
        reportedUserId,
        propertyId,
        reason,
        description,
      });

      return helper.success(res, 'Report submitted successfully. Our team will review it.', report);
    } catch (error) {
      console.log('reportUser error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },
};
