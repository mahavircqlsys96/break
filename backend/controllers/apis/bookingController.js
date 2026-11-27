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
  notifications,
  reviews,
  promoCodes,
  propertiesAnimals,
} = db;

const ADMIN_COMMISSION_PERCENT = parseFloat(process.env.ADMIN_COMMISSION || 15);

const sendBookingNotification = async (userId, senderId, title, message, referenceId) => {
  try {
    await notifications.create({
      userId,
      senderId,
      title,
      message,
      type: 'booking',
      referenceId,
    });
    const user = await users.findOne({ where: { id: userId } });
    if (user && user.fcmToken) {
      await helper.sendPushNotification({
        token: user.fcmToken,
        title,
        body: message,
        type: 'booking',
        sender_id: senderId,
        request_id: referenceId,
      });
    }
  } catch (err) {
    console.log('Notification error:', err.message);
  }
};

module.exports = {
  /**
   * Validate / Apply Promo Code (Checkout Screen)
   */
  validatePromo: async (req, res) => {
    try {
      const code = req.body.promoCode || req.body.code;
      const amount = parseFloat(req.body.bookingAmount || req.body.amount || 0);

      if (!code) return helper.failed(res, 'Promo code is required');

      const promo = await promoCodes.findOne({
        where: { code: String(code).trim().toUpperCase() },
      });

      if (!promo) return helper.failed(res, 'Invalid promo code');
      if (promo.status !== 'Active') return helper.failed(res, 'This promo code is currently inactive');

      const now = new Date();
      if (promo.startDate && new Date(promo.startDate) > now) {
        return helper.failed(res, 'This promo code is not active yet');
      }
      if (promo.endDate && new Date(promo.endDate) < now) {
        return helper.failed(res, 'This promo code has expired');
      }

      if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
        return helper.failed(res, 'This promo code usage limit has been reached');
      }

      if (promo.minBookingAmount > 0 && amount < parseFloat(promo.minBookingAmount)) {
        return helper.failed(
          res,
          `Minimum booking amount of AED ${promo.minBookingAmount} required for this promo code`
        );
      }

      let discount = 0;
      if (promo.discountType === 'percentage') {
        discount = (amount * parseFloat(promo.discountValue)) / 100;
        if (promo.maxDiscount && discount > parseFloat(promo.maxDiscount)) {
          discount = parseFloat(promo.maxDiscount);
        }
      } else {
        discount = parseFloat(promo.discountValue);
      }

      if (discount > amount) discount = amount;
      const finalAmount = Math.max(0, amount - discount);

      return helper.success(res, 'Promo code applied successfully', {
        promoCode: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: discount,
        originalAmount: amount,
        finalAmount: finalAmount,
      });
    } catch (error) {
      console.log('VALIDATE PROMO ERROR:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Get Property Availability / Booked Calendar Dates
   */
  getPropertyAvailability: async (req, res) => {
    try {
      const propertyId = req.params.propertyId || req.query.propertyId;
      if (!propertyId) return helper.failed(res, 'propertyId is required');

      // Fetch all booked dates where booking is not cancelled
      const activeBookings = await bookings.findAll({
        where: {
          propertyId,
          status: { [Op.in]: ['Pending', 'Confirmed'] },
        },
        attributes: ['id'],
      });

      const bookingIds = activeBookings.map((b) => b.id);
      let bookedDatesList = [];

      if (bookingIds.length > 0) {
        const datesRows = await bookingDates.findAll({
          where: { bookingId: bookingIds },
          attributes: ['date', 'checkIn', 'checkOut'],
          order: [['date', 'ASC']],
        });
        bookedDatesList = datesRows.map((d) => d.date);
      }

      return helper.success(res, 'Property availability fetched', {
        propertyId: Number(propertyId),
        bookedDates: [...new Set(bookedDatesList)],
      });
    } catch (error) {
      console.log('getPropertyAvailability error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Create Property Reservation / Booking (Guest Checkout Screen)
   */
  createBooking: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        propertyId: 'required|integer',
        checkIn: 'required|dateFormat:YYYY-MM-DD',
        checkOut: 'required|dateFormat:YYYY-MM-DD',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const propertyId = Number(req.body.propertyId);
      const checkInStr = req.body.checkIn;
      const checkOutStr = req.body.checkOut;

      const adults = Math.max(1, Number(req.body.adults || 1));
      const children = Math.max(0, Number(req.body.children || 0));
      const guestCount = adults + children;
      const bringPet = req.body.bringPet === 'yes' || req.body.pets > 0 ? 'yes' : 'no';

      // 1. Verify Property
      const property = await properties.findOne({
        where: { id: propertyId, deletedAt: null },
        include: [{ model: users, as: 'host', attributes: ['id', 'name', 'fcmToken'] }],
      });
      if (!property) return helper.failed(res, 'Property not found');

      // 2. Calculate Nights
      const inDate = new Date(checkInStr);
      const outDate = new Date(checkOutStr);
      const diffTime = outDate.getTime() - inDate.getTime();
      const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

      if (outDate <= inDate) {
        return helper.failed(res, 'Check-out date must be after check-in date');
      }

      // 3. Generate Calendar Stay Dates
      const stayDates = [];
      for (let i = 0; i < nights; i++) {
        const d = new Date(inDate.getFullYear(), inDate.getMonth(), inDate.getDate() + i, 12, 0, 0);
        stayDates.push(d.toISOString().slice(0, 10));
      }

      // 4. Check for Date Conflicts
      const conflictDates = await bookingDates.findAll({
        where: { date: stayDates },
        include: [
          {
            model: bookings,
            as: 'booking',
            where: {
              propertyId,
              status: { [Op.in]: ['Pending', 'Confirmed'] },
            },
            attributes: ['id', 'status'],
          },
        ],
      });

      if (conflictDates.length > 0) {
        return helper.failed(res, 'Selected dates are already booked. Please choose other dates.');
      }

      // 5. Pricing & Discounts
      const pricePerNight = Number(property.price || 0);
      const subtotal = pricePerNight * nights;
      let promoDiscount = 0;
      let appliedPromoCode = null;

      if (req.body.promoCode) {
        const promo = await promoCodes.findOne({
          where: { code: String(req.body.promoCode).trim().toUpperCase(), status: 'Active' },
        });
        if (promo) {
          if (promo.discountType === 'percentage') {
            promoDiscount = (subtotal * parseFloat(promo.discountValue)) / 100;
            if (promo.maxDiscount && promoDiscount > parseFloat(promo.maxDiscount)) {
              promoDiscount = parseFloat(promo.maxDiscount);
            }
          } else {
            promoDiscount = parseFloat(promo.discountValue);
          }
          if (promoDiscount > subtotal) promoDiscount = subtotal;
          appliedPromoCode = promo.code;
          await promo.increment('usedCount');
        }
      }

      const totalAmount = Math.max(0, subtotal - promoDiscount);
      const adminCommission = Math.round(totalAmount * (ADMIN_COMMISSION_PERCENT / 100));
      const hostAmount = totalAmount - adminCommission;

      const bookingNumber = 'BRK-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);

      // 6. Create Booking & Dates in Transaction
      const t = await bookings.sequelize.transaction();
      let createdBooking;

      try {
        createdBooking = await bookings.create(
          {
            userId,
            propertyId,
            adults,
            children,
            guestCount,
            bringPet,
            amount: totalAmount,
            hostAmount,
            adminCommission,
            noOfDays: nights,
            promoCode: appliedPromoCode,
            promoDiscount,
            originalAmount: subtotal,
            status: 'Confirmed', // Direct confirmation on checkout
          },
          { transaction: t }
        );

        // Bulk insert booking dates
        const dateRecords = stayDates.map((dateStr, idx) => ({
          bookingId: createdBooking.id,
          date: dateStr,
          checkIn: idx === 0 ? `${checkInStr} 15:00:00` : null,
          checkOut: idx === stayDates.length - 1 ? `${checkOutStr} 11:00:00` : null,
        }));

        await bookingDates.bulkCreate(dateRecords, { transaction: t });
        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }

      // 7. Notify Host
      if (property.hostId) {
        await sendBookingNotification(
          property.hostId,
          userId,
          'New Booking Confirmed',
          `You have a new reservation for ${property.basicInfo} for ${nights} night(s).`,
          createdBooking.id
        );
      }

      return helper.success(res, 'Booking created successfully', {
        ...createdBooking.toJSON(),
        bookingNumber,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights,
        stayDates,
        property: {
          id: property.id,
          name: property.basicInfo,
          location: property.location,
          pricePerNight,
        },
      });
    } catch (error) {
      console.log('createBooking error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Pay / Confirm Booking
   */
  payBooking: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        bookingId: 'required|integer',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { bookingId } = req.body;
      const booking = await bookings.findOne({ where: { id: bookingId } });
      if (!booking) return helper.failed(res, 'Booking not found');

      await booking.update({ status: 'Confirmed' });

      return helper.success(res, 'Payment processed and booking confirmed', {
        bookingId: booking.id,
        status: 'Confirmed',
        amount: booking.amount,
      });
    } catch (error) {
      console.log('payBooking error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Get User (Guest) Bookings (Trips screen)
   */
  getUserBookings: async (req, res) => {
    try {
      const userId = req.auth.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const filterType = req.query.type; // 'upcoming', 'past', or status
      const status = req.query.status;

      let whereClause = { userId };
      if (status) {
        whereClause.status = status;
      } else if (filterType === 'upcoming') {
        whereClause.status = { [Op.in]: ['Pending', 'Confirmed'] };
      } else if (filterType === 'past') {
        whereClause.status = { [Op.in]: ['Completed', 'Cancelled', 'Rejected'] };
      }

      const { count, rows } = await bookings.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: properties,
            as: 'property',
            attributes: ['id', 'basicInfo', 'location', 'price'],
            include: [
              { model: propertiesPhotos, as: 'propertiesPhotos', attributes: ['image'], limit: 1 },
              { model: users, as: 'host', attributes: ['id', 'name', 'image'] },
              { model: propertyTypes, as: 'propertyType', attributes: ['id', 'title'] },
            ],
          },
          {
            model: bookingDates,
            as: 'bookingDates',
            attributes: ['date', 'checkIn', 'checkOut'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

      const formatted = rows.map((b) => {
        const item = b.toJSON();
        const p = item.property || {};
        const datesList = item.bookingDates || [];
        const checkIn = datesList[0]?.checkIn || datesList[0]?.date || item.createdAt;
        const checkOut = datesList[datesList.length - 1]?.checkOut || datesList[datesList.length - 1]?.date;
        return {
          id: item.id,
          bookingNumber: `BRK-${String(item.id).padStart(6, '0')}`,
          status: item.status,
          totalAmount: item.amount,
          nights: item.noOfDays,
          guestCount: item.guestCount,
          adults: item.adults,
          children: item.children,
          bringPet: item.bringPet,
          checkIn,
          checkOut,
          dates: datesList.map((d) => d.date),
          property: {
            id: p.id,
            name: p.basicInfo,
            location: p.location,
            price: p.price,
            photo: p.propertiesPhotos?.[0]?.image || null,
            host: p.host,
            propertyType: p.propertyType,
          },
          createdAt: item.createdAt,
        };
      });

      return helper.success(res, 'User bookings fetched', {
        bookings: formatted,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      console.log('getUserBookings error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Get Host Reservations (Host Bookings Screen)
   */
  getProviderBookings: async (req, res) => {
    try {
      const hostId = req.auth.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      // Find properties owned by host
      const hostProperties = await properties.findAll({
        where: { hostId },
        attributes: ['id'],
      });
      const propertyIds = hostProperties.map((p) => p.id);

      if (propertyIds.length === 0) {
        return helper.success(res, 'No bookings found', { bookings: [], total: 0, page, limit });
      }

      let whereClause = { propertyId: propertyIds };
      if (status) whereClause.status = status;

      const { count, rows } = await bookings.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: users,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone', 'image'],
          },
          {
            model: properties,
            as: 'property',
            attributes: ['id', 'basicInfo', 'location'],
            include: [{ model: propertiesPhotos, as: 'propertiesPhotos', attributes: ['image'], limit: 1 }],
          },
          {
            model: bookingDates,
            as: 'bookingDates',
            attributes: ['date', 'checkIn', 'checkOut'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
      });

      const formatted = rows.map((b) => {
        const item = b.toJSON();
        const p = item.property || {};
        const datesList = item.bookingDates || [];
        return {
          id: item.id,
          bookingNumber: `BRK-${String(item.id).padStart(6, '0')}`,
          status: item.status,
          totalAmount: item.amount,
          hostEarnings: item.hostAmount,
          nights: item.noOfDays,
          guestCount: item.guestCount,
          guest: item.user,
          checkIn: datesList[0]?.checkIn || datesList[0]?.date,
          checkOut: datesList[datesList.length - 1]?.checkOut || datesList[datesList.length - 1]?.date,
          property: {
            id: p.id,
            name: p.basicInfo,
            location: p.location,
            photo: p.propertiesPhotos?.[0]?.image || null,
          },
          createdAt: item.createdAt,
        };
      });

      return helper.success(res, 'Host bookings fetched', {
        bookings: formatted,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      console.log('getProviderBookings error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Get Booking Detail & Receipt (Guest & Host)
   */
  getBookingDetail: async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.auth.id;

      const booking = await bookings.findOne({
        where: { id },
        include: [
          {
            model: users,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone', 'image'],
          },
          {
            model: properties,
            as: 'property',
            include: [
              { model: users, as: 'host', attributes: ['id', 'name', 'email', 'phone', 'image'] },
              { model: propertiesPhotos, as: 'propertiesPhotos', attributes: ['id', 'image'] },
              { model: propertyTypes, as: 'propertyType', attributes: ['id', 'title'] },
            ],
          },
          {
            model: bookingDates,
            as: 'bookingDates',
            attributes: ['id', 'date', 'checkIn', 'checkOut'],
          },
        ],
      });

      if (!booking) return helper.failed(res, 'Booking not found');

      const item = booking.toJSON();
      const p = item.property || {};
      const datesList = item.bookingDates || [];
      const checkIn = datesList[0]?.checkIn || datesList[0]?.date || item.createdAt;
      const checkOut = datesList[datesList.length - 1]?.checkOut || datesList[datesList.length - 1]?.date;

      return helper.success(res, 'Booking detail fetched', {
        id: item.id,
        bookingNumber: `BRK-${String(item.id).padStart(6, '0')}`,
        status: item.status,
        checkIn,
        checkOut,
        nights: item.noOfDays,
        guestCount: item.guestCount,
        adults: item.adults,
        children: item.children,
        bringPet: item.bringPet,
        pricing: {
          pricePerNight: p.price,
          nights: item.noOfDays,
          subtotal: item.originalAmount,
          promoCode: item.promoCode,
          promoDiscount: item.promoDiscount,
          totalAmount: item.amount,
          adminCommission: item.adminCommission,
          hostPayout: item.hostAmount,
        },
        guest: item.user,
        host: p.host,
        property: {
          id: p.id,
          name: p.basicInfo,
          location: p.location,
          latitude: p.latitude,
          longitude: p.longitude,
          holidayHomePermitNumber: p.holidayHomePermitNumber,
          photos: p.propertiesPhotos || [],
          propertyType: p.propertyType,
        },
        stayDates: datesList,
        createdAt: item.createdAt,
      });
    } catch (error) {
      console.log('getBookingDetail error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Cancel Booking
   */
  cancelBooking: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        bookingId: 'required|integer',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const { bookingId, reason = 'Cancelled by user' } = req.body;

      const booking = await bookings.findOne({ where: { id: bookingId } });
      if (!booking) return helper.failed(res, 'Booking not found');

      if (booking.status === 'Cancelled') {
        return helper.failed(res, 'Booking is already cancelled');
      }

      await booking.update({ status: 'Cancelled' });

      // Free up booking dates
      await bookingDates.destroy({ where: { bookingId } });

      return helper.success(res, 'Booking cancelled successfully', {
        bookingId: booking.id,
        status: 'Cancelled',
        reason,
      });
    } catch (error) {
      console.log('cancelBooking error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Accept or Reject Booking (Host Action)
   */
  acceptRejectRequest: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        bookingId: 'required|integer',
        status: 'required|in:Confirmed,Cancelled,Rejected,accepted,reject',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const { bookingId } = req.body;
      const rawStatus = req.body.status;
      const status =
        rawStatus === 'accepted' || rawStatus === 'Confirmed'
          ? 'Confirmed'
          : rawStatus === 'reject'
          ? 'Rejected'
          : rawStatus;

      const booking = await bookings.findOne({ where: { id: bookingId } });
      if (!booking) return helper.failed(res, 'Booking not found');

      await booking.update({ status });

      return helper.success(res, `Booking ${status} successfully`, {
        bookingId: booking.id,
        status,
      });
    } catch (error) {
      console.log('acceptRejectRequest error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },

  /**
   * Submit Review & Rating for Property
   */
  giveRating: async (req, res) => {
    try {
      const v = new Validator(req.body, {
        propertyId: 'required|integer',
        rating: 'required|numeric|min:1|max:5',
      });
      const errors = await helper.checkValidation(v);
      if (errors) return helper.failed(res, errors);

      const userId = req.auth.id;
      const propertyId = Number(req.body.propertyId);
      const rating = Math.round(Number(req.body.rating));
      const reviewText = req.body.review || req.body.comment || '';

      const property = await properties.findOne({ where: { id: propertyId } });
      if (!property) return helper.failed(res, 'Property not found');

      const newReview = await reviews.create({
        userId,
        propertyId,
        hostId: property.hostId,
        review: reviewText,
        rating,
        cleanness: Number(req.body.cleanness || rating),
        accuracy: Number(req.body.accuracy || rating),
        checkIn: Number(req.body.checkIn || rating),
        communication: Number(req.body.communication || rating),
        location: Number(req.body.location || rating),
        value: Number(req.body.value || rating),
      });

      return helper.success(res, 'Review submitted successfully', newReview);
    } catch (error) {
      console.log('giveRating error:', error);
      return helper.error(res, 'Something went wrong');
    }
  },
};
