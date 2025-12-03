import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, setHours, setMinutes } from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import './AdminCalendar.css'; 

const AdminCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'add', 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form State for Adding/Editing
  const [formData, setFormData] = useState({
    userEmail: '', service: 'Recording Session', startTime: '10:00', duration: 2, status: 'Confirmed'
  });

  // --- 1. REAL-TIME SYNC ---
  useEffect(() => {
    // We listen to the SAME collection as the users.
    const q = query(collection(db, "bookings"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBookings = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firebase Timestamp to JS Date object safely
          start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
        };
      });
      setBookings(loadedBookings);
    });
    return () => unsubscribe();
  }, []);

  // --- CRUD ACTIONS (Create, Update, Delete) ---

  const handleDelete = async (id) => {
    if (window.confirm("Delete this booking permanently?")) {
      await deleteDoc(doc(db, "bookings", id));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Calculate Timestamps
    const [hours, mins] = formData.startTime.split(':');
    let start = new Date(selectedDate);
    start = setHours(start, parseInt(hours));
    start = setMinutes(start, parseInt(mins));
    let end = new Date(start.getTime() + formData.duration * 60 * 60 * 1000);

    const bookingData = {
        userEmail: formData.userEmail,
        service: formData.service,
        date: format(start, 'yyyy-MM-dd'),
        time: format(start, 'hh:mm a'), // Standard format e.g., "10:00 AM"
        start: start,
        end: end,
        duration: formData.duration,
        status: formData.status
    };

    if (modalMode === 'add') {
        // Create new booking manually
        await addDoc(collection(db, "bookings"), {
            ...bookingData,
            bookingId: "ADM-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
            userName: "Walk-In / Admin",
            createdAt: new Date()
        });
    } else if (modalMode === 'edit') {
        // Update existing booking
        await updateDoc(doc(db, "bookings", editingId), bookingData);
    }

    setModalMode('view'); // Go back to list view
  };

  const openDayView = (day) => {
    setSelectedDate(day);
    setModalMode('view');
    setShowModal(true);
  };

  const startEdit = (booking) => {
    setEditingId(booking.id);
    setFormData({
        userEmail: booking.userEmail,
        service: booking.service,
        // Convert "10:00 AM" back to "10:00" for input
        startTime: format(booking.start, 'HH:mm'), 
        duration: booking.duration || 2,
        status: booking.status
    });
    setModalMode('edit');
  };

  // --- RENDER CALENDAR GRID ---
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        // Find bookings for this specific day
        const dayBookings = bookings.filter(b => isSameDay(b.start, cloneDay));
        
        days.push(
          <div
            className={`admin-cell ${!isSameMonth(day, monthStart) ? "faded" : ""}`}
            key={day}
            onClick={() => openDayView(cloneDay)}
          >
            <span className="number">{format(day, "d")}</span>
            <div className="dots">
                {dayBookings.map((b, idx) => (
                    // Little colored dots representing bookings
                    <span key={idx} className={`dot ${b.status}`}></span>
                ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="row" key={day}>{days}</div>);
      days = [];
    }
    return <div className="body">{rows}</div>;
  };

  return (
    <div className="admin-calendar">
      {/* Header Controls */}
      <div className="cal-top">
        <button onClick={() => setCurrentMonth(addDays(currentMonth, -30))}><FaChevronLeft/></button>
        <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))}><FaChevronRight/></button>
      </div>

      {/* The Grid */}
      <div className="cal-grid">
        <div className="days-row">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="day-name">{d}</div>)}
        </div>
        {renderCells()}
      </div>

      {/* --- DAY VIEW MODAL --- */}
      {showModal && (
        <div className="admin-modal-overlay">
            <div className="admin-modal-box">
                <div className="modal-top">
                    <h3>{format(selectedDate, 'MMMM dd, yyyy')}</h3>
                    <button className="close-x" onClick={() => setShowModal(false)}><FaTimes/></button>
                </div>

                {modalMode === 'view' ? (
                    <>
                        <div className="booking-list-scroll">
                            {bookings.filter(b => isSameDay(b.start, selectedDate)).length === 0 ? (
                                <p className="empty">No bookings for this day.</p>
                            ) : (
                                bookings.filter(b => isSameDay(b.start, selectedDate))
                                .sort((a,b) => a.start - b.start) // Sort by time
                                .map(b => (
                                    <div key={b.id} className="booking-row">
                                        <div className="b-info">
                                            <strong>{b.time}</strong>
                                            <span>{b.service}</span>
                                            <small>{b.userEmail}</small>
                                        </div>
                                        <div className="b-status">
                                            <span className={`badge ${b.status}`}>{b.status}</span>
                                        </div>
                                        <div className="b-actions">
                                            <button onClick={() => startEdit(b)} className="btn-icon edit"><FaEdit/></button>
                                            <button onClick={() => handleDelete(b.id)} className="btn-icon del"><FaTrash/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="add-btn-main" onClick={() => { setModalMode('add'); setFormData({userEmail:'', service:'Recording Session', startTime:'10:00', duration:2, status:'Confirmed'})}}>
                            <FaPlus/> Add Manual Booking
                        </button>
                    </>
                ) : (
                    // --- ADD / EDIT FORM ---
                    <form onSubmit={handleSave} className="admin-form">
                        <h4>{modalMode === 'add' ? 'New Booking' : 'Edit Booking'}</h4>
                        
                        <label>User / Email</label>
                        <input value={formData.userEmail} onChange={e=>setFormData({...formData, userEmail: e.target.value})} required placeholder="client@email.com"/>

                        <label>Service</label>
                        <select value={formData.service} onChange={e=>setFormData({...formData, service: e.target.value})}>
                            <option>Recording Session</option>
                            <option>Mix & Mastering</option>
                            <option>Rehearsal</option>
                            <option>Music Lesson</option>
                        </select>

                        <div className="flex-row">
                            <div>
                                <label>Time</label>
                                <input type="time" value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})} required/>
                            </div>
                            <div>
                                <label>Duration (Hrs)</label>
                                <input type="number" value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})}/>
                            </div>
                        </div>

                        <label>Status</label>
                        <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                            <option>Pending</option>
                            <option>Confirmed</option>
                            <option>Done</option>
                            <option>Cancelled</option>
                        </select>

                        <div className="form-btns">
                            <button type="button" onClick={() => setModalMode('view')} className="btn-back">Back</button>
                            <button type="submit" className="btn-save"><FaCheck/> Save</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendar;