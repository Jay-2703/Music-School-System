import React, { useState, useEffect } from 'react';
import './Booking.css';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, writeBatch, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser'; 
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, isSameDay, isSameMonth, addWeeks, setHours, setMinutes, 
  isBefore, startOfToday, isSunday 
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaCalendarPlus, FaClock } from 'react-icons/fa';

const Booking = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [service, setService] = useState('Recording Session');
  const [startTime, setStartTime] = useState(''); 
  const [duration, setDuration] = useState(2); 
  const [recurrence, setRecurrence] = useState('single'); 
  const [loading, setLoading] = useState(false);

  const SERVICE_ID = "service_h9exr36";      
  const TEMPLATE_ID = "template_587lizb"; 
  const PUBLIC_KEY = "NFqrltbF3i2vRhImX";

  const timeSlots = [
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '17:00', label: '05:00 PM' },
    { value: '18:00', label: '06:00 PM' },
    { value: '19:00', label: '07:00 PM' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("Please log in to book a session.");
        navigate('/login');
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Safely convert Timestamp to JS Date
          start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
          end: data.end?.toDate ? data.end.toDate() : new Date(data.end)
        };
      });
      setBookings(loadedBookings);
    });
    return () => unsubscribe();
  }, []);

  // --- 1. UPDATED LOGIC: CHECK RANGES ---
  const isSlotBooked = (timeValue) => {
    // Convert the dropdown time (e.g. "10:00") into a real Date object for the selected day
    const [h, m] = timeValue.split(':');
    const slotTime = new Date(selectedDate);
    slotTime.setHours(parseInt(h), parseInt(m), 0, 0);

    // Check if this specific slot falls INSIDE any existing booking
    return bookings.some(b => {
        if (b.status === 'Cancelled') return false;
        
        // Is the slot time >= booking start AND < booking end?
        // Example: Booking is 10:00 - 12:00.
        // 10:00 >= 10:00 && 10:00 < 12:00 -> TRUE (Occupied)
        // 11:00 >= 10:00 && 11:00 < 12:00 -> TRUE (Occupied)
        // 12:00 >= 10:00 && 12:00 < 12:00 -> FALSE (Free)
        return slotTime >= b.start && slotTime < b.end;
    });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if(!startTime) {
        alert("Please select a time.");
        setLoading(false);
        return;
    }

    const [hours, mins] = startTime.split(':');
    let baseStart = new Date(selectedDate);
    baseStart = setHours(baseStart, parseInt(hours));
    baseStart = setMinutes(baseStart, parseInt(mins));
    
    let baseEnd = new Date(baseStart.getTime() + duration * 60 * 60 * 1000);

    const batch = writeBatch(db); 
    let bookingSlots = [];

    if (recurrence === 'single') {
        bookingSlots.push({ start: baseStart, end: baseEnd });
    } else if (recurrence === 'semester') {
        for (let i = 0; i < 16; i++) {
            const nextStart = addWeeks(baseStart, i);
            const nextEnd = addWeeks(baseEnd, i);
            bookingSlots.push({ start: nextStart, end: nextEnd });
        }
    }

    // --- 2. UPDATED CONFLICT CHECK (Precise Range Overlap) ---
    const checkConflict = (newStart, newEnd) => {
        return bookings.some(b => 
            b.status !== 'Cancelled' && 
            (newStart < b.end && newEnd > b.start) // Standard Overlap Logic
        );
    };

    for (let slot of bookingSlots) {
        if (checkConflict(slot.start, slot.end)) {
            alert(`Conflict detected on ${format(slot.start, 'MMM dd, yyyy')}! This time range overlaps with an existing booking.`);
            setLoading(false);
            return; 
        }
    }

    try {
        const mainBookingId = Math.random().toString(36).substr(2, 9).toUpperCase();

        bookingSlots.forEach((slot, index) => {
            const newRef = doc(collection(db, "bookings"));
            batch.set(newRef, {
                bookingId: `${mainBookingId}-${index + 1}`, 
                groupId: mainBookingId, 
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || "User",
                service,
                start: slot.start, 
                end: slot.end,     
                date: format(slot.start, 'yyyy-MM-dd'), 
                time: format(slot.start, 'hh:mm a'),
                duration: duration,
                status: 'Pending',
                type: recurrence,
                createdAt: new Date()
            });
        });

        await batch.commit(); 

        const templateParams = {
            to_name: user.displayName || "User",
            to_email: user.email,
            service_name: service,
            booking_date: format(baseStart, 'MMMM dd, yyyy'),
            booking_time: format(baseStart, 'hh:mm a'),
            ref_id: mainBookingId,
            type: recurrence === 'semester' ? 'Semester (16 Sessions)' : 'Single Session'
        };

        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then(() => console.log("Email Sent!"))
            .catch((err) => console.error("Email Failed", err));
        
        navigate('/booking-success', { 
            state: { 
                bookingId: mainBookingId, 
                service: service,
                date: format(baseStart, 'yyyy-MM-dd'),
                time: format(baseStart, 'hh:mm a')
            } 
        });

    } catch (err) {
        console.error("Error saving booking:", err);
        alert("An error occurred while processing your booking.");
    } finally {
        setLoading(false);
    }
  };

  const renderHeader = () => {
    return (
      <div className="cal-header">
        <div className="cal-nav-btn" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}><FaChevronLeft /></div>
        <div className="cal-month-title">
          <span>{format(currentMonth, 'MMMM yyyy')}</span>
        </div>
        <div className="cal-nav-btn" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}><FaChevronRight /></div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return <div className="cal-row cal-days-header">{days.map(d => <div className="cal-col cal-center" key={d}>{d}</div>)}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const today = startOfToday(); 

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dayBookings = bookings.filter(b => isSameDay(b.start, cloneDay) && b.status !== 'Cancelled');
        // A day is "Fully Booked" if there are > 8 bookings (Approx 16 hours / 2 hour sessions)
        const isFull = dayBookings.length >= 8; 
        
        const isPast = isBefore(day, today);
        const isNotCurrentMonth = !isSameMonth(day, monthStart);
        const isSundayDay = isSunday(day);

        const isDisabled = isPast || isNotCurrentMonth || isSundayDay;

        days.push(
          <div
            className={`cal-col cal-cell ${isDisabled ? "disabled" : isSameDay(day, selectedDate) ? "selected" : ""}`}
            key={day}
            onClick={() => { if (!isDisabled) { setSelectedDate(cloneDay); setShowModal(true); setStartTime(''); }}}
          >
            <span className="cal-number">{formattedDate}</span>
            
            {!isNotCurrentMonth && !isPast && (
                <>
                    {isSundayDay ? (
                        <div className="cal-status-badge closed">Closed</div>
                    ) : (
                        <div className={`cal-status-badge ${isFull ? 'full' : 'avail'}`}>
                            {isFull ? 'Fully Booked' : 'Available'}
                        </div>
                    )}
                </>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="cal-row" key={day}>{days}</div>);
      days = [];
    }
    return <div className="cal-body">{rows}</div>;
  };

  if (!user) return null; 

  return (
    <div className="booking-wrapper">
      <div className="booking-container-cal">
        <h1>Book a Session</h1>
        <p className="subtitle-cal">Select a date to begin scheduling.</p>
        <div className="calendar-box">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
            <div className="modal-box bounce-in">
                <div className="modal-header">
                    <h3><FaCalendarPlus /> Book for {format(selectedDate, 'MMMM dd')}</h3>
                    <button className="close-btn-text" onClick={() => setShowModal(false)}>✕</button>
                </div>
                
                <form onSubmit={handleBook}>
                    <div className="input-group-cal">
                        <label>Service Type</label>
                        <select value={service} onChange={e=>setService(e.target.value)}>
                            <option>Recording Session</option>
                            <option>Mix & Mastering</option>
                            <option>Rehearsal</option>
                            <option>Music Lesson</option>
                        </select>
                    </div>

                    <div className="row-inputs-cal">
                        <div className="input-group-cal">
                            <label><FaClock /> Start Time</label>
                            
                            <select 
                                value={startTime} 
                                onChange={e=>setStartTime(e.target.value)} 
                                required
                                style={{ backgroundColor: '#121212', color: 'white' }}
                            >
                                <option value="" disabled>Select Slot</option>
                                {timeSlots.map((slot) => {
                                    // This checks if the slot falls inside ANY existing booking duration
                                    const isTaken = isSlotBooked(slot.value);
                                    return (
                                        <option 
                                            key={slot.value} 
                                            value={slot.value} 
                                            disabled={isTaken} 
                                            style={isTaken ? { backgroundColor: '#3f0f0f', color: '#ff6b6b' } : {}}
                                        >
                                            {slot.label} {isTaken ? '(Occupied)' : ''}
                                        </option>
                                    );
                                })}
                            </select>

                        </div>
                        <div className="input-group-cal">
                            <label>Duration (Hours)</label>
                            <input type="number" value={duration} onChange={e=>setDuration(e.target.value)} min="1" max="8" required />
                        </div>
                    </div>

                    <div className="input-group-cal" style={{ marginTop: '20px' }}>
                        <label style={{ color: '#ffd700' }}>Booking Frequency</label>
                        <select value={recurrence} onChange={e=>setRecurrence(e.target.value)} style={{ borderColor: '#ffd700' }}>
                            <option value="single">One-time Session</option>
                            <option value="semester">Entire Semester (16 Weeks)</option>
                        </select>
                    </div>

                    <div className="modal-actions-cal">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-cancel-cal" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-save-cal" disabled={loading}>
                            {loading ? "Processing..." : "Confirm Booking"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Booking;