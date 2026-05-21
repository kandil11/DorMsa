import api from './api';

// ─── Listings ────────────────────────────────────────────────────────────────
export const listingService = {
  getAll:          (params)      => api.get('/listings', { params }),
  getById:         (id)          => api.get(`/listings/${id}`),
  getStats:        ()            => api.get('/listings/stats'),
  getExternal:     (params)      => api.get('/listings/external', { params }),
  getMyListings:   ()            => api.get('/listings/my-listings'),
  getBrokerStats:  ()            => api.get('/listings/broker-stats'),              // FR24, FR25
  create:          (data)        => api.post('/listings', data),
  update:          (id, data)    => api.put(`/listings/${id}`, data),
  delete:          (id)          => api.delete(`/listings/${id}`),
  trackContact:    (id, type)    => api.post(`/listings/${id}/track-contact`, { type }), // FR25
  bulkUpdate:      (ids, update) => api.put('/listings/bulk', { ids, update }),     // FR26
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  login:            (data)      => api.post('/auth/login', data),
  register:         (data)      => api.post('/auth/register', data),
  getProfile:       ()          => api.get('/auth/profile'),
  updateProfile:    (data)      => api.put('/auth/profile', data),
  requestOTP:       (phone)     => api.post('/auth/request-otp', { phone }),
  verifyOTP:        (data)      => api.post('/auth/verify-otp', data),
  forgotPassword:   (phone)     => api.post('/auth/forgot-password', { phone }),   // FR06
  resetPassword:    (data)      => api.post('/auth/reset-password', data),          // FR06
  uploadIdDocument: (formData)  => api.post('/auth/upload-id', formData, {          // FR27, FR49
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const userService = {
  getFavorites:       ()     => api.get('/users/favorites'),
  addFavorite:        (id)   => api.post(`/users/favorites/${id}`),
  removeFavorite:     (id)   => api.delete(`/users/favorites/${id}`),
  getNotifications:   ()     => api.get('/users/notifications'),
  markRead:           (id)   => api.put(`/users/notifications/${id}/read`),
  markAllRead:        ()     => api.put('/users/notifications/read-all'),
  getSavedSearches:   ()     => api.get('/users/saved-searches'),
  createSavedSearch:  (data) => api.post('/users/saved-searches', data),
  deleteSavedSearch:  (id)   => api.delete(`/users/saved-searches/${id}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminService = {
  getUsers:         (params)         => api.get('/admin/users', { params }),
  deleteUser:       (id)             => api.delete(`/admin/users/${id}`),
  getAnalytics:     ()               => api.get('/admin/analytics'),
  getPendingBrokers:()               => api.get('/admin/pending-brokers'),
  verifyBroker:     (id)             => api.put(`/admin/verify-broker/${id}`),
  rejectBroker:     (id, reason)     => api.put(`/admin/reject-broker/${id}`, { reason }), // FR28
  suspendUser:      (id)             => api.put(`/admin/suspend/${id}`),
  approveIdDoc:     (id, approve, reason) => api.put(`/admin/users/${id}/approve-id`, { approve, reason }), // FR49
  getListings:      (params)         => api.get('/admin/listings', { params }),
  moderateListing:  (id, action)     => api.put(`/admin/listings/${id}/moderate`, { action }),
  updateListingStatus: (id, status)  => api.put(`/admin/listings/${id}/moderate`, { status }),
  deleteListing:    (id)             => api.delete(`/admin/listings/${id}`),
  getFraudFlags:    ()               => api.get('/admin/fraud-flags'),             // FR33
  getAuditLogs:     (params)         => api.get('/admin/audit-logs', { params }), // FR37
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingService = {
  create:           (data)         => api.post('/bookings', data),
  getMyBookings:    ()             => api.get('/bookings/my-bookings'),
  getBrokerBookings:()             => api.get('/bookings/broker-bookings'),
  updateStatus:     (id, status)   => api.put(`/bookings/${id}/status`, { status }),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const paymentService = {
  initiate:    (data)   => api.post('/payments/initiate', data),      // FR17
  getHistory:  (params) => api.get('/payments/history', { params }),  // FR44
};

// ─── Support Tickets ─────────────────────────────────────────────────────────
export const supportService = {
  createTicket:  (data)   => api.post('/support/tickets', data),       // FR45
  getMyTickets:  ()       => api.get('/support/tickets'),
  // Admin
  getAllTickets:  (params) => api.get('/support/admin/tickets', { params }),
  updateTicket:  (id, data) => api.put(`/support/admin/tickets/${id}`, data),
};

// ─── Contracts ───────────────────────────────────────────────────────────────
export const contractService = {
  generate: (bookingId) => api.get(`/contracts/${bookingId}`, {        // FR43
    responseType: 'text',
  }),
};
