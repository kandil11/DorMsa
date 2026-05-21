import SupportTicket from '../models/SupportTicket.js';

/**
 * @desc    Create a new support ticket
 * @route   POST /api/support/tickets
 * @access  Private
 * FR45 — TroubleShoot: Submit technical support tickets
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, description, category = 'other', priority = 'medium' } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
      category,
      priority,
    });

    res.status(201).json({
      message: 'Support ticket submitted successfully. Our team will respond within 24 hours.',
      ticket: {
        _id: ticket._id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get the logged-in user's own tickets
 * @route   GET /api/support/tickets
 * @access  Private
 * FR45 — TroubleShoot: View own tickets
 */
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort('-createdAt')
      .select('-adminNotes');

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all tickets (admin view)
 * @route   GET /api/support/admin/tickets
 * @access  Private (Admin)
 * FR45 — Admin support queue
 */
export const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 30, status, priority, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('user', 'name phone email role')
        .populate('resolvedBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(query),
    ]);

    res.json({ tickets, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a ticket (admin: change status, add notes)
 * @route   PUT /api/support/admin/tickets/:id
 * @access  Private (Admin)
 * FR45 — Admin closes/resolves tickets
 */
export const updateTicket = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedBy = req.user._id;
      ticket.resolvedAt = new Date();
    }

    await ticket.save();
    res.json({ message: 'Ticket updated', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
