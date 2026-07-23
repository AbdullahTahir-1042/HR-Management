const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const TypingStatus = require('../models/TypingStatus');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { messaging } = require('../config/firebaseAdmin');

const TYPING_TTL_MS = 6000;
const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_PAGE_SIZE = 50;

const isParticipant = (conversation, userId) =>
    conversation.participants.some(p => String(p._id || p) === String(userId));

const isAdmin = (conversation, userId) =>
    String(conversation.createdBy) === String(userId) ||
    (conversation.admins || []).some(a => String(a._id || a) === String(userId));

// Shape a Conversation document (with participants already populated) into
// the enriched form the frontend renders — used by every endpoint that
// returns a conversation, so newly created/updated conversations look the
// same as ones coming from the list endpoint.
const hydrateConversation = async (conv, userId) => {
    const lastMessage = await Message.findOne({ conversation: conv._id }).sort({ createdAt: -1 });
    const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readBy: { $ne: userId }
    });

    const otherParticipant = conv.type === 'dm'
        ? conv.participants.find(p => String(p._id) !== userId)
        : null;

    return {
        _id: conv._id,
        type: conv.type,
        name: conv.type === 'group' ? conv.name : (otherParticipant?.name || 'Unknown User'),
        photo: conv.type === 'dm' ? (otherParticipant?.photo || null) : null,
        participants: conv.participants,
        memberCount: conv.participants.length,
        adminIds: (conv.admins || []).map(a => String(a._id || a)),
        viewerIsAdmin: conv.type === 'group' ? isAdmin(conv, userId) : false,
        otherUser: otherParticipant ? {
            _id: otherParticipant._id,
            name: otherParticipant.name,
            lastSeenAt: otherParticipant.lastSeenAt
        } : null,
        lastMessage: lastMessage?.text || '',
        lastMessageAt: lastMessage?.createdAt || conv.createdAt,
        lastMessageFromMe: lastMessage ? String(lastMessage.sender) === userId : false,
        unreadCount
    };
};

// Shape raw Message documents for the client: turns delivered/read arrays
// into counts against the other participants (frontend derives ticks from this).
const shapeMessages = (messages, conversation, userId) => {
    const otherParticipantIds = conversation.participants
        .map(p => String(p._id || p))
        .filter(id => id !== String(userId));

    return messages.map(m => ({
        _id: m._id,
        text: m.text,
        createdAt: m.createdAt,
        sender: m.sender,
        replyTo: m.replyTo ? {
            _id: m.replyTo._id,
            text: m.replyTo.text,
            senderName: m.replyTo.sender?.name
        } : null,
        deliveredCount: m.deliveredTo.filter(id => otherParticipantIds.includes(String(id))).length,
        readCount: m.readBy.filter(id => otherParticipantIds.includes(String(id))).length,
        totalRecipients: otherParticipantIds.length
    }));
};

// @route   GET api/conversations
// @desc    List all conversations (DMs + groups) for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate('participants', 'name email photo role department lastSeenAt')
            .populate('admins', '_id');

        const results = await Promise.all(
            conversations.map(conv => hydrateConversation(conv, req.user.id))
        );

        results.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        res.json(results);
    } catch (err) {
        console.error('Error fetching conversations:', err.message);
        res.status(500).json({ msg: 'Server error fetching conversations' });
    }
});

// @route   POST api/conversations/dm
// @desc    Get the existing DM with a user, or create one
// @access  Private
router.post('/dm', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ msg: 'A valid userId is required' });
        }
        if (userId === req.user.id) {
            return res.status(400).json({ msg: 'Cannot start a conversation with yourself' });
        }

        const otherUser = await User.findById(userId);
        if (!otherUser || otherUser.isDeleted) {
            return res.status(404).json({ msg: 'User not found' });
        }

        let conversation = await Conversation.findOne({
            type: 'dm',
            participants: { $all: [req.user.id, userId], $size: 2 }
        }).populate('participants', 'name email photo role department lastSeenAt');

        if (!conversation) {
            conversation = await Conversation.create({
                type: 'dm',
                participants: [req.user.id, userId],
                createdBy: req.user.id
            });
            conversation = await conversation.populate('participants', 'name email photo role department lastSeenAt');
        }

        res.json(await hydrateConversation(conversation, req.user.id));
    } catch (err) {
        console.error('Error starting DM:', err.message);
        res.status(500).json({ msg: 'Server error starting conversation' });
    }
});

// @route   POST api/conversations/group
// @desc    Create a new group conversation
// @access  Private
router.post('/group', auth, async (req, res) => {
    try {
        const { name, participantIds } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ msg: 'Group name is required' });
        }

        const ids = Array.isArray(participantIds)
            ? participantIds.filter(id => mongoose.Types.ObjectId.isValid(id))
            : [];
        if (ids.length < 1) {
            return res.status(400).json({ msg: 'Select at least one other participant' });
        }

        const uniqueParticipants = Array.from(new Set([req.user.id, ...ids]));
        const users = await User.find({ _id: { $in: uniqueParticipants }, isDeleted: { $ne: true } });
        if (users.length !== uniqueParticipants.length) {
            return res.status(400).json({ msg: 'One or more selected users could not be found' });
        }

        let conversation = await Conversation.create({
            type: 'group',
            name: name.trim(),
            participants: uniqueParticipants,
            createdBy: req.user.id,
            admins: [req.user.id]
        });
        conversation = await conversation.populate('participants', 'name email photo role department lastSeenAt');

        res.status(201).json(await hydrateConversation(conversation, req.user.id));
    } catch (err) {
        console.error('Error creating group:', err.message);
        res.status(500).json({ msg: 'Server error creating group' });
    }
});

// @route   PUT api/conversations/:id
// @desc    Rename a group
// @access  Private (group admins only)
router.put('/:id', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (conversation.type !== 'group') return res.status(400).json({ msg: 'Only groups can be renamed' });
        if (!isAdmin(conversation, req.user.id)) return res.status(403).json({ msg: 'Only group admins can rename the group' });

        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ msg: 'Group name is required' });

        conversation.name = name.trim();
        await conversation.save();

        const populated = await conversation.populate('participants', 'name email photo role department lastSeenAt');
        res.json(await hydrateConversation(populated, req.user.id));
    } catch (err) {
        console.error('Error renaming group:', err.message);
        res.status(500).json({ msg: 'Server error renaming group' });
    }
});

// @route   PUT api/conversations/:id/participants
// @desc    Add members to a group
// @access  Private (must already be a participant)
router.put('/:id/participants', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (conversation.type !== 'group') return res.status(400).json({ msg: 'Only groups support adding members' });
        if (!isParticipant(conversation, req.user.id)) return res.status(403).json({ msg: 'Access denied' });

        const ids = Array.isArray(req.body.participantIds)
            ? req.body.participantIds.filter(id => mongoose.Types.ObjectId.isValid(id))
            : [];
        if (ids.length === 0) return res.status(400).json({ msg: 'No participants provided' });

        const users = await User.find({ _id: { $in: ids }, isDeleted: { $ne: true } });
        if (users.length !== ids.length) return res.status(400).json({ msg: 'One or more users could not be found' });

        const merged = new Set(conversation.participants.map(String));
        ids.forEach(id => merged.add(String(id)));
        conversation.participants = Array.from(merged);
        await conversation.save();

        const populated = await conversation.populate('participants', 'name email photo role department lastSeenAt');
        res.json(await hydrateConversation(populated, req.user.id));
    } catch (err) {
        console.error('Error adding participants:', err.message);
        res.status(500).json({ msg: 'Server error adding participants' });
    }
});

// @route   PUT api/conversations/:id/participants/:userId/promote
// @desc    Toggle a member's admin status
// @access  Private (group admins only)
router.put('/:id/participants/:userId/promote', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (conversation.type !== 'group') return res.status(400).json({ msg: 'Only groups have admins' });
        if (!isAdmin(conversation, req.user.id)) return res.status(403).json({ msg: 'Only group admins can manage admins' });

        const targetId = req.params.userId;
        if (!isParticipant(conversation, targetId)) return res.status(400).json({ msg: 'User is not a member of this group' });

        const adminSet = new Set((conversation.admins || []).map(String));
        if (adminSet.has(targetId)) {
            adminSet.delete(targetId);
        } else {
            adminSet.add(targetId);
        }
        conversation.admins = Array.from(adminSet);
        await conversation.save();

        const populated = await conversation.populate('participants', 'name email photo role department lastSeenAt');
        res.json(await hydrateConversation(populated, req.user.id));
    } catch (err) {
        console.error('Error toggling admin:', err.message);
        res.status(500).json({ msg: 'Server error toggling admin' });
    }
});

// @route   DELETE api/conversations/:id/participants/me
// @desc    Leave a group
// @access  Private
router.delete('/:id/participants/me', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (conversation.type !== 'group') return res.status(400).json({ msg: 'Cannot leave a direct message' });
        if (!isParticipant(conversation, req.user.id)) return res.status(403).json({ msg: 'Access denied' });

        conversation.participants = conversation.participants.filter(p => String(p) !== req.user.id);
        conversation.admins = (conversation.admins || []).filter(a => String(a) !== req.user.id);
        await conversation.save();
        res.json({ msg: 'Left group' });
    } catch (err) {
        console.error('Error leaving group:', err.message);
        res.status(500).json({ msg: 'Server error leaving group' });
    }
});

// @route   DELETE api/conversations/:id/participants/:userId
// @desc    Remove a specific member from a group
// @access  Private (group admins only)
router.delete('/:id/participants/:userId', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (conversation.type !== 'group') return res.status(400).json({ msg: 'Cannot remove members from a direct message' });
        if (!isAdmin(conversation, req.user.id)) return res.status(403).json({ msg: 'Only group admins can remove members' });

        const targetId = req.params.userId;
        if (targetId === req.user.id) return res.status(400).json({ msg: 'Use the leave-group action to remove yourself' });

        conversation.participants = conversation.participants.filter(p => String(p) !== targetId);
        conversation.admins = (conversation.admins || []).filter(a => String(a) !== targetId);
        await conversation.save();

        const populated = await conversation.populate('participants', 'name email photo role department lastSeenAt');
        res.json(await hydrateConversation(populated, req.user.id));
    } catch (err) {
        console.error('Error removing participant:', err.message);
        res.status(500).json({ msg: 'Server error removing participant' });
    }
});

// @route   POST api/conversations/:id/typing
// @desc    Ping "I'm typing" — expires on its own after a few seconds
// @access  Private (must be a participant)
router.post('/:id/typing', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (!isParticipant(conversation, req.user.id)) return res.status(403).json({ msg: 'Access denied' });

        await TypingStatus.findOneAndUpdate(
            { conversation: conversation._id, user: req.user.id },
            { typingUntil: new Date(Date.now() + TYPING_TTL_MS) },
            { upsert: true }
        );

        res.json({ msg: 'ok' });
    } catch (err) {
        console.error('Error updating typing status:', err.message);
        res.status(500).json({ msg: 'Server error updating typing status' });
    }
});

// @route   GET api/conversations/:id/messages
// @desc    Get a page of the thread (newest-first cursor via ?before=<messageId>),
//          mark delivered/read, and return who's currently typing.
// @access  Private (must be a participant)
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants', 'name email photo role department lastSeenAt')
            .populate('admins', '_id');
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (!isParticipant(conversation, req.user.id)) return res.status(403).json({ msg: 'Access denied' });

        const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 100);
        const query = { conversation: conversation._id };

        if (req.query.before && mongoose.Types.ObjectId.isValid(req.query.before)) {
            const beforeMessage = await Message.findById(req.query.before);
            if (beforeMessage) {
                query.createdAt = { $lt: beforeMessage.createdAt };
            }
        }

        const page = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'name email photo role department')
            .populate({
                path: 'replyTo',
                select: 'text sender',
                populate: { path: 'sender', select: 'name' }
            });
        const hasMore = page.length === limit;
        const messages = page.reverse();

        // Delivered = this participant's client has now fetched the thread.
        await Message.updateMany(
            { conversation: conversation._id, sender: { $ne: req.user.id }, deliveredTo: { $ne: req.user.id } },
            { $addToSet: { deliveredTo: req.user.id } }
        );

        // Opening the thread means catching up — mark everything seen.
        await Message.updateMany(
            { conversation: conversation._id, sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
            { $addToSet: { readBy: req.user.id } }
        );

        const typingRows = await TypingStatus.find({
            conversation: conversation._id,
            user: { $ne: req.user.id },
            typingUntil: { $gt: new Date() }
        }).populate('user', 'name');

        res.json({
            conversation: await hydrateConversation(conversation, req.user.id),
            messages: shapeMessages(messages, conversation, req.user.id),
            hasMore,
            typingUsers: typingRows.map(t => ({ _id: t.user._id, name: t.user.name }))
        });
    } catch (err) {
        console.error('Error fetching thread:', err.message);
        res.status(500).json({ msg: 'Server error fetching thread' });
    }
});

// @route   POST api/conversations/:id/messages
// @desc    Send a message in a conversation (optionally replying to another)
// @access  Private (must be a participant)
router.post('/:id/messages', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants', 'name fcmToken');
        if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });
        if (!isParticipant(conversation, req.user.id)) return res.status(403).json({ msg: 'Access denied' });

        const { text, replyTo } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ msg: 'Message text is required' });
        if (text.trim().length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ msg: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)` });
        }

        let replyToId = null;
        if (replyTo) {
            if (!mongoose.Types.ObjectId.isValid(replyTo)) return res.status(400).json({ msg: 'Invalid replyTo id' });
            const original = await Message.findById(replyTo);
            if (!original || String(original.conversation) !== req.params.id) {
                return res.status(400).json({ msg: 'Message being replied to was not found in this conversation' });
            }
            replyToId = original._id;
        }

        let message = await Message.create({
            conversation: conversation._id,
            sender: req.user.id,
            text: text.trim(),
            replyTo: replyToId,
            readBy: [req.user.id],
            deliveredTo: [req.user.id]
        });

        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        // The sender is, by definition, no longer "typing" once they've sent.
        TypingStatus.deleteOne({ conversation: conversation._id, user: req.user.id }).catch(() => {});

        // Best-effort push — never blocks the send response.
        (async () => {
            try {
                const senderName = conversation.participants.find(p => String(p._id) === req.user.id)?.name || 'Someone';
                const tokens = conversation.participants
                    .filter(p => String(p._id) !== req.user.id && p.fcmToken)
                    .map(p => p.fcmToken);
                if (tokens.length > 0) {
                    await messaging.sendEachForMulticast({
                        tokens,
                        notification: {
                            title: conversation.type === 'group' ? `${senderName} in ${conversation.name}` : senderName,
                            body: text.trim().slice(0, 120)
                        },
                        data: { conversationId: String(conversation._id) }
                    });
                }
            } catch (pushErr) {
                console.error('Chat push notification error:', pushErr);
            }
        })();

        message = await message.populate('sender', 'name email photo role department');
        if (replyToId) {
            message = await message.populate({
                path: 'replyTo',
                select: 'text sender',
                populate: { path: 'sender', select: 'name' }
            });
        }

        res.status(201).json({
            _id: message._id,
            text: message.text,
            createdAt: message.createdAt,
            sender: message.sender,
            replyTo: message.replyTo ? {
                _id: message.replyTo._id,
                text: message.replyTo.text,
                senderName: message.replyTo.sender?.name
            } : null,
            deliveredCount: 0,
            readCount: 0,
            totalRecipients: conversation.participants.length - 1
        });
    } catch (err) {
        console.error('Error sending message:', err.message);
        res.status(500).json({ msg: 'Server error sending message' });
    }
});

module.exports = router;
