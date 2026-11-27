const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const { users, chatRoom, messages, bookings, reportUser } = require("../models");
const helper = require("../helpers/helper");
const middleware = require("../middleware/authMiddleware");

module.exports = function (io) {
  io.on("connection", function (socket) {
    console.log(`[Socket] New connection: ${socket.id}`);

    /**
     * 1. Connect & Register User Socket
     * Client emits: 'connectUser', { token: '<jwt_token>' }
     */
    socket.on("connectUser", async (data) => {
      try {
        if (!data || !data.token) {
          return socket.emit("connectUser", {
            code: 400,
            message: "Token is required",
            body: {},
          });
        }

        const isValidToken = await middleware.authenticateToken(data.token);

        if (!isValidToken.success || !isValidToken.user) {
          return socket.emit("connectUser", {
            code: 401,
            message: "Session Expired",
            body: {},
          });
        }

        const userId = isValidToken.user.id;
        const socketId = socket.id;

        await users.update(
          { socketId },
          { where: { id: userId } }
        );

        socket.join(`user_${userId}`);

        console.log(`[Socket] User ${userId} connected with socketId: ${socketId}`);

        socket.emit("connectUser", {
          code: 200,
          message: "User connected successfully",
          body: {
            userId,
            socketId,
          },
        });
      } catch (error) {
        console.error("[Socket] connectUser error:", error);
        socket.emit("connectUser", {
          code: 500,
          message: "Internal Server Error",
          body: {},
        });
      }
    });

    /**
     * 2. Handle Disconnection
     */
    socket.on("disconnect", async (reason) => {
      try {
        const socketId = socket.id;
        await users.update(
          { socketId: null },
          { where: { socketId } }
        );
        console.log(`[Socket] Disconnected socketId: ${socketId}, reason: ${reason}`);
      } catch (error) {
        console.error("[Socket] disconnect error:", error);
      }
    });

    /**
     * 3. Send Message
     * Client emits: 'sendMessage', {
     *   token: '<jwt_token>',
     *   receiverId: 5,
     *   message: 'Hello, I have a question about check-in',
     *   messageType: 'text', // 'text', 'image', 'audio', etc.
     *   bookingId: 10 // optional
     * }
     */
    socket.on("sendMessage", async (getData) => {
      try {
        if (!getData || !getData.token) {
          return socket.emit("sendMessage", {
            code: 400,
            message: "Token is required",
            body: {},
          });
        }

        const isValidToken = await middleware.authenticateToken(getData.token);

        if (!isValidToken.success || !isValidToken.user) {
          return socket.emit("sendMessage", {
            code: 401,
            message: "Session Expired",
            body: {},
          });
        }

        const senderId = isValidToken.user.id;
        const receiverId = parseInt(getData.receiverId);
        const bookingId = getData.bookingId ? parseInt(getData.bookingId) : null;
        const textMessage = getData.message ? String(getData.message).trim() : "";
        const messageType = getData.messageType || "text";

        if (!receiverId) {
          return socket.emit("sendMessage", {
            code: 400,
            message: "receiverId is required",
            body: {},
          });
        }

        if (!textMessage) {
          return socket.emit("sendMessage", {
            code: 400,
            message: "Message content cannot be empty",
            body: {},
          });
        }

        // Check or find existing chat room
        let room = await chatRoom.findOne({
          where: {
            [Op.or]: [
              { senderId: senderId, receiverId: receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
            ...(bookingId ? { bookingId } : {}),
          },
        });

        if (!room) {
          room = await chatRoom.create({
            senderId,
            receiverId,
            bookingId,
          });
        }

        // Create new message
        const createdMsg = await messages.create({
          senderId,
          receiverId,
          roomId: room.id,
          bookingId,
          message: textMessage,
          messageType,
        });

        // Update last message in chatRoom
        await chatRoom.update(
          { lastMsgId: createdMsg.id },
          { where: { id: room.id } }
        );

        // Fetch sender & receiver profile details
        const sender = await users.findByPk(senderId, {
          attributes: ["id", "name", "image", "role"],
          raw: true,
        });

        const receiver = await users.findByPk(receiverId, {
          attributes: ["id", "name", "image", "role", "socketId", "deviceToken", "isNotification"],
          raw: true,
        });

        const responsePayload = {
          code: 200,
          message: "Message sent successfully",
          body: {
            id: createdMsg.id,
            roomId: room.id,
            bookingId,
            senderId,
            receiverId,
            message: textMessage,
            messageType,
            createdAt: createdMsg.createdAt,
            sender: {
              id: sender?.id || senderId,
              name: sender?.name || "User",
              image: sender?.image || null,
              role: sender?.role || "User",
            },
            receiver: {
              id: receiver?.id || receiverId,
              name: receiver?.name || "User",
              image: receiver?.image || null,
              role: receiver?.role || "User",
            },
          },
        };

        // Emit back to sender
        socket.emit("sendMessage", responsePayload);

        // Emit to receiver if online via socket
        if (receiver && receiver.socketId) {
          io.to(receiver.socketId).emit("sendMessage", responsePayload);
          io.to(receiver.socketId).emit("message_alert", responsePayload);
        } else {
          // Alternatively emit to receiver user room
          io.to(`user_${receiverId}`).emit("sendMessage", responsePayload);
          io.to(`user_${receiverId}`).emit("message_alert", responsePayload);
        }

        // Push notification if receiver is not actively focused or notifications enabled
        if (receiver && receiver.deviceToken && receiver.isNotification !== "Off") {
          try {
            helper.sendPushNotification({
              token: receiver.deviceToken,
              title: `New message from ${sender?.name || "Break User"}`,
              body: textMessage,
              type: "chat_message",
              sender_id: senderId,
              sender_name: sender?.name || "",
              sender_image: sender?.image || "",
              request_id: bookingId || null,
            });
          } catch (notifErr) {
            console.error("[Socket] Push notification error:", notifErr);
          }
        }
      } catch (error) {
        console.error("[Socket] sendMessage error:", error);
        socket.emit("sendMessage", {
          code: 500,
          message: "Failed to send message",
          body: {},
        });
      }
    });

    /**
     * 4. Get Inbox (Chat list)
     * Client emits: 'inbox', {
     *   token: '<jwt_token>',
     *   page: 1,
     *   limit: 20
     * }
     */
    socket.on("inbox", async (getData) => {
      try {
        if (!getData || !getData.token) {
          return socket.emit("inbox", {
            code: 400,
            message: "Token is required",
            body: [],
          });
        }

        const isValidToken = await middleware.authenticateToken(getData.token);

        if (!isValidToken.success || !isValidToken.user) {
          return socket.emit("inbox", {
            code: 401,
            message: "Session Expired",
            body: [],
          });
        }

        const userId = isValidToken.user.id;
        const page = parseInt(getData.page) || 1;
        const limit = parseInt(getData.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await chatRoom.findAndCountAll({
          where: {
            [Op.or]: [{ senderId: userId }, { receiverId: userId }],
          },
          include: [
            {
              model: messages,
              as: "lastMsg",
              attributes: ["id", "message", "messageType", "createdAt", "senderId"],
              required: false,
            },
            {
              model: bookings,
              as: "booking",
              attributes: ["id", "propertyId", "status", "amount"],
              required: false,
            },
          ],
          order: [["updatedAt", "DESC"]],
          limit,
          offset,
        });

        // Collect other user IDs
        const otherUserIds = rows.map((r) =>
          r.senderId === userId ? r.receiverId : r.senderId
        );

        const otherUsers = await users.findAll({
          where: { id: otherUserIds },
          attributes: ["id", "name", "image", "role", "socketId"],
        });

        const userMap = new Map(otherUsers.map((u) => [u.id, u.toJSON()]));

        const formatted = rows.map((r) => {
          const item = r.toJSON();
          const otherId = item.senderId === userId ? item.receiverId : item.senderId;
          const participant = userMap.get(otherId) || {
            id: otherId,
            name: "User",
            image: null,
            role: "User",
            isOnline: false,
          };

          return {
            roomId: item.id,
            bookingId: item.bookingId,
            booking: item.booking || null,
            otherUser: {
              id: participant.id,
              name: participant.name,
              image: participant.image,
              role: participant.role,
              isOnline: Boolean(participant.socketId),
            },
            lastMessage: item.lastMsg ? item.lastMsg.message : "",
            lastMessageType: item.lastMsg ? item.lastMsg.messageType : "text",
            lastMessageTime: item.lastMsg ? item.lastMsg.createdAt : item.updatedAt,
            unreadCount: 0,
          };
        });

        socket.emit("inbox", {
          code: 200,
          message: "Inbox retrieved successfully",
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
          },
          body: formatted,
        });
      } catch (error) {
        console.error("[Socket] inbox error:", error);
        socket.emit("inbox", {
          code: 500,
          message: "Failed to fetch inbox",
          body: [],
        });
      }
    });

    /**
     * 5. Get Messages for a Conversation
     * Client emits: 'getMessages', {
     *   token: '<jwt_token>',
     *   receiverId: 5,
     *   roomId: 12, // optional if receiverId is given
     *   page: 1,
     *   limit: 30
     * }
     */
    socket.on("getMessages", async (getData) => {
      try {
        if (!getData || !getData.token) {
          return socket.emit("getMessages", {
            code: 400,
            message: "Token is required",
            body: [],
          });
        }

        const isValidToken = await middleware.authenticateToken(getData.token);

        if (!isValidToken.success || !isValidToken.user) {
          return socket.emit("getMessages", {
            code: 401,
            message: "Session Expired",
            body: [],
          });
        }

        const senderId = isValidToken.user.id;
        const receiverId = getData.receiverId ? parseInt(getData.receiverId) : null;
        let roomId = getData.roomId ? parseInt(getData.roomId) : null;
        const page = parseInt(getData.page) || 1;
        const limit = parseInt(getData.limit) || 30;
        const offset = (page - 1) * limit;

        if (!roomId && receiverId) {
          const room = await chatRoom.findOne({
            where: {
              [Op.or]: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId },
              ],
            },
          });
          if (room) {
            roomId = room.id;
          }
        }

        let whereCondition;
        if (roomId) {
          whereCondition = { roomId };
        } else if (receiverId) {
          whereCondition = {
            [Op.or]: [
              { senderId: senderId, receiverId: receiverId },
              { senderId: receiverId, receiverId: senderId },
            ],
          };
        } else {
          return socket.emit("getMessages", {
            code: 400,
            message: "Either receiverId or roomId is required",
            body: [],
          });
        }

        const { count, rows } = await messages.findAndCountAll({
          where: whereCondition,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });

        // Other participant info
        let otherUser = null;
        if (receiverId) {
          otherUser = await users.findByPk(receiverId, {
            attributes: ["id", "name", "image", "role", "socketId"],
            raw: true,
          });
        }

        const formatted = rows.map((m) => ({
          id: m.id,
          roomId: m.roomId,
          bookingId: m.bookingId,
          senderId: m.senderId,
          receiverId: m.receiverId,
          message: m.message,
          messageType: m.messageType || "text",
          createdAt: m.createdAt,
          isMine: m.senderId === senderId,
        }));

        socket.emit("getMessages", {
          code: 200,
          message: "Messages retrieved successfully",
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
          },
          otherUser: otherUser
            ? {
                id: otherUser.id,
                name: otherUser.name,
                image: otherUser.image,
                role: otherUser.role,
                isOnline: Boolean(otherUser.socketId),
              }
            : null,
          body: formatted,
        });
      } catch (error) {
        console.error("[Socket] getMessages error:", error);
        socket.emit("getMessages", {
          code: 500,
          message: "Failed to fetch messages",
          body: [],
        });
      }
    });

    /**
     * 6. Mark Message as Read
     * Client emits: 'readMsg', { token: '<jwt_token>', receiverId: 5, roomId: 12 }
     */
    socket.on("readMsg", async (getData) => {
      try {
        if (!getData || !getData.token) return;
        const isValidToken = await middleware.authenticateToken(getData.token);
        if (!isValidToken.success) return;

        socket.emit("readMsg", {
          code: 200,
          message: "Messages marked as read",
          body: {
            roomId: getData.roomId,
            receiverId: getData.receiverId,
          },
        });
      } catch (error) {
        console.error("[Socket] readMsg error:", error);
      }
    });

    /**
     * 7. Clear Chat
     * Client emits: 'clearChat', { token: '<jwt_token>', roomId: 12 }
     */
    socket.on("clearChat", async (getData) => {
      try {
        if (!getData || !getData.token) return;
        const isValidToken = await middleware.authenticateToken(getData.token);
        if (!isValidToken.success) {
          return socket.emit("clearChat", {
            code: 401,
            message: "Session Expired",
          });
        }

        socket.emit("clearChat", {
          code: 200,
          message: "Chat cleared successfully",
        });
      } catch (error) {
        console.error("[Socket] clearChat error:", error);
      }
    });
  });
};
