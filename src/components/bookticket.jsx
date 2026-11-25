// src/components/BookingTicket.jsx
import React from 'react';

const BookingTicket = ({ bookingData, onClose }) => {
  // If no booking data exists, don't render anything
  if (!bookingData) return null;

  // Trigger the browser's print/save as PDF dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ticket-overlay">
      <div className="ticket-card" id="printable-ticket">
        
        {/* Ticket Header */}
        <div className="ticket-header">
          <h2>✈️ TravelEase Booking Confirmation</h2>
          <span className="status-badge">Confirmed</span>
        </div>

        {/* Ticket Body Details */}
        <div className="ticket-body">
          <div className="ticket-row">
            <div>
              <p className="label">Booking ID</p>
              <p className="value">{bookingData.bookingId || `TE-${Math.floor(100000 + Math.random() * 900000)}`}</p>
            </div>
            <div>
              <p className="label">Booking Date</p>
              <p className="value">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <hr className="ticket-divider" />

          <div className="ticket-row">
            <div>
              <p className="label">Traveler Name</p>
              <p className="value">{bookingData.userName || 'Valued Guest'}</p>
            </div>
            <div>
              <p className="label">Destination</p>
              <p className="value">{bookingData.destination || 'Selected Destination'}</p>
            </div>
          </div>

          <div className="ticket-row">
            <div>
              <p className="label">Travel Date</p>
              <p className="value">{bookingData.travelDate || 'N/A'}</p>
            </div>
            <div>
              <p className="label">Guests</p>
              <p className="value">{bookingData.guests || 1} Person(s)</p>
            </div>
          </div>

          <div className="ticket-row">
            <div>
              <p className="label">Total Amount Paid</p>
              <p className="value amount">${bookingData.price || '250.00'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="ticket-footer no-print">
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Print / Save PDF
          </button>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default BookingTicket;