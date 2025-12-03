import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import { CheckCircle } from 'lucide-react'; // Ensure you have lucide-react installed
import './Booking.css'; 

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Get the data passed from the Booking Form
  const bookingData = location.state;

  // Safety Check: If someone goes here directly without booking, send them home
  if (!bookingData) {
    return (
      <div className="booking-container">
        <div className="booking-card">
          <h2>No Booking Data Found</h2>
          <button className="booking-btn" onClick={() => navigate('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    // 1. Use 'booking-wrapper' to center the whole page vertically and horizontally
    <div className="booking-wrapper">
      
      {/* 2. Use 'booking-container-cal' or a specific card style to center the box */}
      <div 
        className="booking-card" 
        style={{ 
          textAlign: 'center', 
          maxWidth: '400px', 
          width: '100%',
          display: 'flex',       // Flexbox to center items inside the card
          flexDirection: 'column',
          alignItems: 'center',  // Centers content horizontally
          justifyContent: 'center'
        }}
      >
        
        {/* Success Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <CheckCircle size={60} color="#4caf50" />
        </div>
        
        <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#fff' }}>Booking Request Sent!</h1>
        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '14px' }}>
          Please save this QR Code. You will present this at the studio.
        </p>

        {/* QR CODE DISPLAY */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '30px',
          width: 'fit-content', // Only take up necessary space
          display: 'flex',      // Flex to center the QR inside the white box
          justifyContent: 'center'
        }}>
          <QRCode 
            value={`BookingID:${bookingData.bookingId}`} 
            size={180} 
          />
        </div>

        {/* Booking Details Summary */}
        <div style={{ 
          backgroundColor: '#2b2b2b', 
          padding: '20px', 
          borderRadius: '8px', 
          textAlign: 'left',
          marginBottom: '20px',
          width: '100%' // Ensure the details box takes full width of the card
        }}>
          {/* ... (Keep your existing details code here) ... */}
          <p style={{ margin: '5px 0', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Reference ID</p>
          <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', letterSpacing: '1px', color: '#ffd700' }}>{bookingData.bookingId}</p>
          
          <p style={{ margin: '5px 0', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Service</p>
          <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: 'white' }}>{bookingData.service}</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '5px 0', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Date</p>
              <p style={{ margin: '0', fontWeight: 'bold', color: 'white' }}>{bookingData.date}</p>
            </div>
            <div>
              <p style={{ margin: '5px 0', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Time</p>
              <p style={{ margin: '0', fontWeight: 'bold', color: 'white' }}>{bookingData.time}</p>
            </div>
          </div>
        </div>

        <button 
          className="booking-btn" 
          onClick={() => navigate('/')}
          style={{ width: '100%' }} // Make button full width
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default BookingSuccess;