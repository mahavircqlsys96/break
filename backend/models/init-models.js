var DataTypes = require("sequelize").DataTypes;
var _amenities = require("./amenities");
var _bookingDates = require("./bookingDates");
var _bookings = require("./bookings");
var _chatRoom = require("./chatRoom");
var _cms = require("./cms");
var _contactUs = require("./contactUs");
var _friendlyAnimals = require("./friendlyAnimals");
var _messages = require("./messages");
var _notifications = require("./notifications");
var _properties = require("./properties");
var _propertiesKeyAmenities = require("./propertiesKeyAmenities");
var _propertiesPhotos = require("./propertiesPhotos");
var _propertyTypes = require("./propertyTypes");
var _reportUser = require("./reportUser");
var _reviews = require("./reviews");
var _users = require("./users");
var _wishlists = require("./wishlists");
var _propertiesAnimals = require("./propertiesAnimals");


function initModels(sequelize) {
  var amenities = _amenities(sequelize, DataTypes);
  var bookingDates = _bookingDates(sequelize, DataTypes);
  var bookings = _bookings(sequelize, DataTypes);
  var chatRoom = _chatRoom(sequelize, DataTypes);
  var cms = _cms(sequelize, DataTypes);
  var contactUs = _contactUs(sequelize, DataTypes);
  var friendlyAnimals = _friendlyAnimals(sequelize, DataTypes);
  var messages = _messages(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var properties = _properties(sequelize, DataTypes);
  var propertiesKeyAmenities = _propertiesKeyAmenities(sequelize, DataTypes);
  var propertiesPhotos = _propertiesPhotos(sequelize, DataTypes);
  var propertyTypes = _propertyTypes(sequelize, DataTypes);
  var propertiesAnimals = _propertiesAnimals(sequelize, DataTypes);
  var reportUser = _reportUser(sequelize, DataTypes);
  var reviews = _reviews(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var wishlists = _wishlists(sequelize, DataTypes);

  // model: propertyTypes,
  //         as: "propertyType",
  propertiesKeyAmenities.belongsTo(amenities, { as: "amenity", foreignKey: "amenitiesId" });
  amenities.hasMany(propertiesKeyAmenities, { as: "propertiesKeyAmenities", foreignKey: "amenitiesId" });
  bookingDates.belongsTo(bookings, { as: "booking", foreignKey: "bookingId" });
  bookings.hasMany(bookingDates, { as: "bookingDates", foreignKey: "bookingId" });
  chatRoom.belongsTo(bookings, { as: "booking", foreignKey: "bookingId" });
  bookings.hasMany(chatRoom, { as: "chatRooms", foreignKey: "bookingId" });
  messages.belongsTo(bookings, { as: "booking", foreignKey: "bookingId" });
  bookings.hasMany(messages, { as: "messages", foreignKey: "bookingId" });
  messages.belongsTo(chatRoom, { as: "room", foreignKey: "roomId" });
  chatRoom.hasMany(messages, { as: "messages", foreignKey: "roomId" });
  chatRoom.belongsTo(messages, { as: "lastMsg", foreignKey: "lastMsgId" });
  messages.hasMany(chatRoom, { as: "chatRooms", foreignKey: "lastMsgId" });
  bookings.belongsTo(properties, { as: "property", foreignKey: "propertyId" });
  properties.hasMany(bookings, { as: "bookings", foreignKey: "propertyId" });
  propertiesKeyAmenities.belongsTo(properties, { as: "property", foreignKey: "propertyId" });
  properties.hasMany(propertiesKeyAmenities, { as: "propertiesKeyAmenities", foreignKey: "propertyId" });
  propertiesPhotos.belongsTo(properties, { as: "property", foreignKey: "propertyId" });
  properties.hasMany(propertiesPhotos, { as: "propertiesPhotos", foreignKey: "propertyId" });
  reviews.belongsTo(properties, { as: "property", foreignKey: "propertyId" });
  properties.hasMany(reviews, { as: "reviews", foreignKey: "propertyId" });
  wishlists.belongsTo(properties, { as: "property", foreignKey: "propertyId" });
  properties.hasMany(wishlists, { as: "wishlists", foreignKey: "propertyId" });
  properties.hasMany(propertiesAnimals, { as: "propertiesAnimals", foreignKey: "propertyId" });
  propertiesAnimals.belongsTo(friendlyAnimals, { as: "friendlyAnimals", foreignKey: "animalId" });
  properties.belongsTo(propertyTypes, { as: "propertyType", foreignKey: "propertyTypeId" });
  propertyTypes.hasMany(properties, { as: "properties", foreignKey: "propertyTypeId" });
  bookings.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(bookings, { as: "bookings", foreignKey: "userId" });
  chatRoom.belongsTo(users, { as: "receiver", foreignKey: "receiverId" });
  users.hasMany(chatRoom, { as: "chatRooms", foreignKey: "receiverId" });
  chatRoom.belongsTo(users, { as: "sender", foreignKey: "senderId" });
  users.hasMany(chatRoom, { as: "sender_chatRooms", foreignKey: "senderId" });
  messages.belongsTo(users, { as: "receiver", foreignKey: "receiverId" });
  users.hasMany(messages, { as: "messages", foreignKey: "receiverId" });
  messages.belongsTo(users, { as: "sender", foreignKey: "senderId" });
  users.hasMany(messages, { as: "sender_messages", foreignKey: "senderId" });
  notifications.belongsTo(users, { as: "received", foreignKey: "receivedId" });
  users.hasMany(notifications, { as: "notifications", foreignKey: "receivedId" });
  notifications.belongsTo(users, { as: "sender", foreignKey: "senderId" });
  users.hasMany(notifications, { as: "sender_notifications", foreignKey: "senderId" });
  properties.belongsTo(users, { as: "host", foreignKey: "hostId" });
  users.hasMany(properties, { as: "properties", foreignKey: "hostId" });
  reportUser.belongsTo(users, { as: "reportedUser", foreignKey: "reportedUserId" });
  users.hasMany(reportUser, { as: "reportUsers", foreignKey: "reportedUserId" });
  reportUser.belongsTo(users, { as: "reporter", foreignKey: "reporterId" });
  users.hasMany(reportUser, { as: "reporter_reportUsers", foreignKey: "reporterId" });
  reviews.belongsTo(users, { as: "host", foreignKey: "hostId" });
  users.hasMany(reviews, { as: "reviews", foreignKey: "hostId" });
  reviews.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(reviews, { as: "user_reviews", foreignKey: "userId" });
  wishlists.belongsTo(users, { as: "user", foreignKey: "userId" });
  users.hasMany(wishlists, { as: "wishlists", foreignKey: "userId" });







  return {
    amenities,
    bookingDates,
    bookings,
    chatRoom,
    cms,
    contactUs,
    friendlyAnimals,
    messages,
    notifications,
    properties,
    propertiesKeyAmenities,
    propertiesPhotos,
    propertyTypes,
    reportUser,
    reviews,
    users,
    wishlists,
    propertiesAnimals
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
