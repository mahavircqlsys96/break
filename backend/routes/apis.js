var express = require('express');
var router = express.Router();
const authenticateHeader = require('../middleware/authMiddleware').authenticateHeader;
const authenticateJWT = require('../middleware/authMiddleware').authenticateJWT;
const optionalAuthenticateJWT = require('../middleware/authMiddleware').optionalAuthenticateJWT;

const authController = require('../controllers/apis/authController');
const userController = require('../controllers/apis/userController');
const hostController = require('../controllers/apis/hostController');
const propertiesController = require('../controllers/apis/propertiesController');
const bookingController = require('../controllers/apis/bookingController');

module.exports = (io) => {
  // ─── Public Routes (No Auth Needed) ───
  router.get('/encryption', authController.encryption);
  router.post('/fileUpload', authController.fileUpload);
  router.get('/getCms', authController.getCms);
  router.get('/resetPasswordPage', authController.resetPasswordPage);
  router.post('/resetPassword', authController.resetPassword);

  // Catalogs (Public & Authenticated access)
  router.get('/getPropertyTypes', authController.getPropertyTypes);
  router.get('/propertyTypes', authController.getPropertyTypes);
  router.get('/getAmenities', authController.getAmenities);
  router.get('/amenities', authController.getAmenities);
  router.get('/getAnimals', authController.getAnimals);
  router.get('/animals', authController.getAnimals);
  router.get('/friendlyAnimals', authController.getAnimals);
  router.get('/getFaqs', userController.getFaqs);
  router.get('/faqs', userController.getFaqs);

  // Public Property Discovery & Availability
  router.get('/home', optionalAuthenticateJWT, userController.home);
  router.get('/getProperties', optionalAuthenticateJWT, propertiesController.getProperties);
  router.get('/properties', optionalAuthenticateJWT, propertiesController.getProperties);
  router.get('/propertyDetail/:propertyId', optionalAuthenticateJWT, propertiesController.propertyDetail);
  router.get('/getPropertyReviews/:propertyId', optionalAuthenticateJWT, propertiesController.getPropertyReviews);
  router.get('/propertyAvailability/:propertyId', optionalAuthenticateJWT, bookingController.getPropertyAvailability);

  // ─── Header Auth (secret_key & publish_key) ───
  router.use(authenticateHeader);
  router.post('/sendOtp', authController.sendOtp);
  router.post('/verifyOtp', authController.verifyOtp);
  router.post('/socialLogin', authController.socialLogin);
  router.post('/guestLogin', authController.guestLogin);
  router.post('/forgotPassword', authController.forgotPassword);

  // ─── JWT Authenticated Routes ───
  router.use(authenticateJWT);

  // User Profile & Settings
  router.post('/logout', authController.logout);
  router.delete('/accountDeleted', authController.accountDeleted);
  router.patch('/notificationOnOff', authController.notificationOnOff);
  router.put('/completeProfile', authController.completeProfile);
  router.get('/getProfile', authController.getProfile);
  router.put('/editProfile', authController.editProfile);
  router.put('/setAccountType', authController.setAccountType);
  router.put('/updatePermissions', authController.updatePermissions);
  router.post('/contactUs', authController.contactUs);
  router.get('/notificationList', authController.notificationList);
  router.delete('/clearNotification', authController.clearNotification);
  router.post('/reportUser', userController.reportUser);

  // Wishlists / Saved Properties
  router.post('/toggleWishlist', userController.toggleWishlist);
  router.post('/addWishlist', userController.addWishlist);
  router.get('/getWishlist', userController.getWishlist);
  router.get('/wishlist', userController.getWishlist);
  router.delete('/removeWishlist', userController.removeWishlist);
  router.post('/removeWishlist', userController.removeWishlist);

  // Host Onboarding & Compliance
  router.get('/hostHome', hostController.hostHome);
  router.post('/host/submitVerification', hostController.submitVerification);
  router.post('/host/submitPayoutAccount', hostController.submitPayoutAccount);
  router.post('/host/submitHolidayHomePermit', hostController.submitHolidayHomePermit);
  router.get('/host/onboardingProgress', hostController.getOnboardingProgress);
  router.get('/host/uaeBanks', hostController.getUaeBanks);
  router.get('/host/support', hostController.getHostSupport);

  // Host Property Management (Add, Edit, Delete)
  router.post('/addProperty', propertiesController.addProperties);
  router.post('/addProperties', propertiesController.addProperties);
  router.put('/editProperty', propertiesController.editProperties);
  router.put('/editProperties', propertiesController.editProperties);
  router.delete('/deleteProperty/:propertyId', propertiesController.deleteProperty);

  // Checkout, Promos & Bookings
  router.post('/validatePromo', bookingController.validatePromo);
  router.post('/applyPromoCode', bookingController.validatePromo);
  router.post('/createBooking', bookingController.createBooking);
  router.post('/payBooking', bookingController.payBooking);
  router.get('/getUserBookings', bookingController.getUserBookings);
  router.get('/getProviderBookings', bookingController.getProviderBookings);
  router.get('/getBookingDetail/:id', bookingController.getBookingDetail);
  router.post('/cancelBooking', bookingController.cancelBooking);
  router.post('/acceptRejectRequest', bookingController.acceptRejectRequest);
  router.post('/giveRating', bookingController.giveRating);
  router.post('/addReview', bookingController.giveRating);

  return router;
};
