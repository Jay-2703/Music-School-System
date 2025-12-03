import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../firebase'; 
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser'; 
import './AdminScanner.css'; 

const AdminScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Ready to Scan");
  const [scanAction, setScanAction] = useState("Check-in");
  const navigate = useNavigate();
  
  const scannerRef = useRef(null);

  const SERVICE_ID = "service_h9exr36";   
  const TEMPLATE_ID = "template_ioum2uf"; 
  const PUBLIC_KEY = "NFqrltbF3i2vRhImX";   

  useEffect(() => {
    const nav = document.querySelector('nav') || document.querySelector('.Nav1');
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';

    const readerElement = document.getElementById("reader");
    if (readerElement) readerElement.innerHTML = "";

    const initTimer = setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        scannerRef.current.render(onScanSuccess, onScanFailure);
    }, 100);

    const sendNotificationEmail = (name, email, service, bookingDate, bookingTime) => {
        const templateParams = {
            to_name: name,
            to_email: email,
            service_name: service,
            booking_date: bookingDate, 
            booking_time: bookingTime,
            scan_time: new Date().toLocaleString()
        };

        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then((response) => console.log('EMAIL SENT'), (err) => console.log('EMAIL FAILED', err));
    };

    async function onScanSuccess(decodedText) {
      if (scannerRef.current) {
          try { await scannerRef.current.clear(); } catch (e) {}
      }
      setStatusMessage("Processing...");

      // --- DEBUGGING LOGS (Check Console F12) ---
      console.log("Scanned Raw Text:", decodedText);

      try {
        const selectedAction = document.getElementById('actionSelector').value;

        // === SCENARIO A: BOOKING QR ===
        if (decodedText.startsWith("BookingID:")) {
            // 1. Extract and CLEAN the ID (Remove spaces)
            const rawBookingId = decodedText.split(":")[1].trim(); 
            
            console.log("Searching Database for BookingID:", rawBookingId);

            // 2. Search Firebase
            const q = query(collection(db, "bookings"), where("bookingId", "==", rawBookingId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const bookingDoc = querySnapshot.docs[0];
                const bookingRef = bookingDoc.ref;
                const bookingData = bookingDoc.data();

                if (bookingData.status === "Check-in" || bookingData.status === "Done") {
                    setScanResult({ success: false, msg: "QR Already Used" });
                    setStatusMessage("⚠️ Already Checked In.");
                } else {
                    await updateDoc(bookingRef, { status: selectedAction });

                    // Send Email
                   if (bookingData.userEmail) {
                        sendNotificationEmail(
                        bookingData.userEmail, 
                        bookingData.userEmail, 
                        bookingData.service,
                        bookingData.date || "N/A", 
                        bookingData.time || "N/A"
                    );
                    } else {
                        console.log("No email found for this user, skipping notification.");
                    }

                    setScanResult({ 
                        success: true, 
                        type: 'booking',
                        name: bookingData.service, 
                        id: rawBookingId,
                        action: selectedAction
                    });
                    setStatusMessage(`✅ Updated & Email Sent!`);
                    
                }
            } else {
                // *** THIS IS YOUR CURRENT ERROR ***
                // It means the ID in the QR code does not match any 'bookingId' field in Firebase.
                setScanResult({ success: false, msg: `Booking Not Found: ${rawBookingId}` });
                setStatusMessage(`❌ ID "${rawBookingId}" not found.`);
            }
        } 
        
        // === SCENARIO B: USER ID ===
        else {
            const userId = decodedText.trim();
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const userName = userData.username || "User";
                const userEmail = userData.email; 

                await addDoc(collection(db, "attendance"), {
                    userId: userId,
                    name: userName,
                    timestamp: new Date(),
                    type: "check-in"
                });

                if(userEmail) {
                    sendNotificationEmail(userName, userEmail, "General Check-in", "N/A", "N/A");
                }

                setScanResult({ success: true, type: 'attendance', name: userName });
                setStatusMessage(`✅ Welcome ${userName}.`);
            } else {
                setScanResult({ success: false, msg: "Invalid QR Code" });
            }
        }

            } catch (error) {
                console.error(error);
              // This prints the actual error message to the screen
                setStatusMessage(`❌ Error: ${error.message}`);
            }
    }

    function onScanFailure(error) {}

    return () => {
      clearTimeout(initTimer);
      if (scannerRef.current) scannerRef.current.clear().catch(e => {});
      if(readerElement) readerElement.innerHTML = "";
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  const handleReset = () => {
    window.location.reload(); 
  };

  return (
    <div className="scanner-page">
      <h1>Studio Scanner</h1>
      
      {!scanResult && (
        <div className="action-container">
            <label>Set Status To:</label>
            <select id="actionSelector" className="scan-dropdown" value={scanAction} onChange={(e) => setScanAction(e.target.value)}>
                <option value="Check-in">Check-in</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
            </select>
        </div>
      )}

      <p style={{color: statusMessage.includes("❌") ? "red" : "white"}}>{statusMessage}</p>
      
      {!scanResult ? (
        <div id="reader" style={{ width: '300px', margin: 'auto' }}></div>
      ) : (
        <div className="result-card">
          {scanResult.success ? (
            <>
              <h2 style={{color: '#4caf50'}}>SUCCESS!</h2>
              <p>Action: {scanResult.action || "Check-in"}</p>
              <p>Email Notification Sent!</p>
            </>
          ) : (
             <h2 style={{color: 'red'}}>ERROR: {scanResult.msg}</h2>
          )}
          <button onClick={handleReset} className="reset-btn">Scan Next</button>
        </div>
      )}

      
      
      <button onClick={() => navigate('/admin')} className="back-link">Exit Scanner</button>


     {/* <button onClick={() => {
            const templateParams = {
                to_name: "Test User",
                to_email: "your_real_email@gmail.com", 
                service_name: "Test Service",
                booking_date: bookingDate,  
                booking_time: bookingTime,  
                scan_time: new Date().toLocaleString()
            };

              // MAKE SURE THESE VARIABLES (SERVICE_ID, etc) ARE DEFINED AT THE TOP OF YOUR FILE
            emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
                .then(() => alert("Email Sent Successfully!"), (err) => alert("Failed: " + JSON.stringify(err)));
        }}
          tyle={{ marginTop: '20px', padding: '10px', background: 'orange' }}>TEST EMAIL ONLY</button> */}

    </div>
  );
};

export default AdminScanner;