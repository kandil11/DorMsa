import BookingRequest from '../models/BookingRequest.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';

/**
 * @desc    Generate a pre-filled digital lease contract
 * @route   GET /api/contracts/:bookingId
 * @access  Private (Student or Broker involved in the booking)
 * FR43 — Contract Template: generate downloadable digital lease for post-booking
 *
 * Returns an HTML string that the client renders then triggers window.print()
 * for a browser-native PDF download — no server-side PDF library needed.
 */
export const generateContract = async (req, res) => {
  try {
    const booking = await BookingRequest.findById(req.params.bookingId)
      .populate('student', 'name phone email studentId')
      .populate('listing', 'title price location roomType gender amenities contactPhone broker')
      .populate('broker', 'name phone email companyName licenseNumber');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Ensure only student or broker involved can access
    const userId = req.user._id.toString();
    if (
      booking.student._id.toString() !== userId &&
      booking.broker._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to access this contract' });
    }

    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const moveIn = booking.moveInDate
      ? new Date(booking.moveInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '________________';

    const listing = booking.listing;
    const student = booking.student;
    const broker = booking.broker;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DorMsa Lease Agreement — ${listing.title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #222; }
    h1 { text-align: center; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 32px; }
    h2 { font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td { padding: 6px 8px; vertical-align: top; }
    td:first-child { font-weight: bold; width: 200px; white-space: nowrap; }
    .clause { margin: 12px 0; }
    .clause strong { display: block; margin-bottom: 4px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig-block { width: 45%; }
    .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 6px; font-size: 12px; color: #555; }
    .watermark { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,0,0,0.05); z-index: -1; font-weight: bold; }
    @media print { .no-print { display: none; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="watermark">DorMsa</div>

  <div class="no-print" style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:8px;margin-bottom:24px;font-family:sans-serif;font-size:14px">
    📄 <strong>To download as PDF:</strong> Press <kbd>Ctrl+P</kbd> (or <kbd>⌘+P</kbd>) → choose "Save as PDF" as the destination.
  </div>

  <h1>🏠 DorMsa Residential Lease Agreement</h1>
  <p class="subtitle">Generated on ${today} · Booking ID: ${booking._id}</p>

  <h2>1. Parties</h2>
  <table>
    <tr><td>Landlord (Broker)</td><td>${broker.name}${broker.companyName ? ` — ${broker.companyName}` : ''}</td></tr>
    <tr><td>Broker Phone</td><td>${broker.phone || '________________'}</td></tr>
    <tr><td>License / ID</td><td>${broker.licenseNumber || '________________'}</td></tr>
    <tr><td>Tenant (Student)</td><td>${student.name}</td></tr>
    <tr><td>Tenant Phone</td><td>${student.phone || '________________'}</td></tr>
    <tr><td>Student ID</td><td>${student.studentId || '________________'}</td></tr>
  </table>

  <h2>2. Property</h2>
  <table>
    <tr><td>Property Name</td><td>${listing.title}</td></tr>
    <tr><td>Address</td><td>${listing.location?.address || '6th of October City, Giza, Egypt'}</td></tr>
    <tr><td>Room Type</td><td>${listing.roomType || '________________'}</td></tr>
    <tr><td>Gender Policy</td><td>${listing.gender || '________________'}</td></tr>
    <tr><td>Amenities</td><td>${(listing.amenities || []).join(', ') || 'As agreed'}</td></tr>
  </table>

  <h2>3. Financial Terms</h2>
  <table>
    <tr><td>Monthly Rent</td><td>${listing.price?.amount?.toLocaleString()} ${listing.price?.currency || 'EGP'} / ${listing.price?.period || 'month'}</td></tr>
    <tr><td>Deposit Paid</td><td>As per payment record on DorMsa platform</td></tr>
    <tr><td>Move-in Date</td><td>${moveIn}</td></tr>
    <tr><td>Duration</td><td>${booking.duration || '________________'}</td></tr>
  </table>

  <h2>4. Terms & Conditions</h2>
  <div class="clause"><strong>4.1 Payment</strong> Rent is due on the 1st of each month. A 5% late fee applies after the 5th day.</div>
  <div class="clause"><strong>4.2 Use of Property</strong> The property shall be used solely for residential purposes by the tenant and their immediate family/approved co-tenants.</div>
  <div class="clause"><strong>4.3 Maintenance</strong> The tenant agrees to keep the property in good condition. Major repairs are the landlord's responsibility. Minor repairs (under 500 EGP) are the tenant's responsibility.</div>
  <div class="clause"><strong>4.4 Termination</strong> Either party must provide 30 days written notice to terminate this agreement. The deposit is refundable within 30 days of vacating, subject to property inspection.</div>
  <div class="clause"><strong>4.5 Rules</strong> No subletting without prior written consent. No pets unless agreed. No illegal activities on the premises.</div>
  <div class="clause"><strong>4.6 Governing Law</strong> This agreement is governed by Egyptian civil law. Disputes shall be resolved in courts of Giza Governorate.</div>

  <h2>5. Signatures</h2>
  <p>Both parties confirm that they have read, understood, and agreed to the above terms.</p>
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">Landlord Signature<br>${broker.name}</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Tenant Signature<br>${student.name}</div>
    </div>
  </div>

  <p style="margin-top:48px;font-size:11px;color:#999;text-align:center">
    This contract was generated by the DorMsa Housing Platform. Both parties should retain a signed copy.
    DorMsa acts as a facilitator only and is not a party to this agreement.
  </p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
