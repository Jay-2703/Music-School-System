import { useState, useEffect } from 'react';
import './AdminInstructors.css';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function InstructorManagement() {
  const initialInstructors = [
    {
      id: 'inst_001',
      name: "Maria Santos",
      email: "maria.santos@musicschool.com",
      phone: "+63917-123-4567",
      instrument: "piano",
      bio: "Certified piano instructor with 10 years of experience. Specializes in classical and contemporary music.",
      students: [
        {
          id: 'std_001',
          name: "Juan Dela Cruz",
          email: "juan.delacruz@email.com",
          phone: "+63917-234-5678",
          age: 16,
          sessionsAttended: 8,
          totalSessions: 12,
          notes: "Excellent progress. Ready for advanced pieces.",
          checkInHistory: [
            { timestamp: new Date(Date.now() - 86400000).toISOString() },
            { timestamp: new Date(Date.now() - 172800000).toISOString() }
          ]
        },
        {
          id: 'std_002',
          name: "Ana Reyes",
          email: "ana.reyes@email.com",
          phone: "+63917-345-6789",
          age: 14,
          sessionsAttended: 5,
          totalSessions: 12,
          notes: "Working on sight reading. Needs more practice.",
          checkInHistory: [
            { timestamp: new Date(Date.now() - 259200000).toISOString() }
          ]
        }
      ]
    },
    {
      id: 'inst_002',
      name: "Carlos Mendoza",
      email: "carlos.mendoza@musicschool.com",
      phone: "+63917-456-7890",
      instrument: "guitar",
      bio: "Professional guitarist. Expert in acoustic and electric guitar. Teaches all levels.",
      students: [
        {
          id: 'std_003',
          name: "Miguel Santos",
          email: "miguel.santos@email.com",
          phone: "+63917-567-8901",
          age: 17,
          sessionsAttended: 12,
          totalSessions: 12,
          notes: "Completed all sessions. Excellent technique.",
          checkInHistory: [
            { timestamp: new Date(Date.now() - 345600000).toISOString() },
            { timestamp: new Date(Date.now() - 432000000).toISOString() }
          ]
        },
        {
          id: 'std_004',
          name: "Rosa Garcia",
          email: "rosa.garcia@email.com",
          phone: "+63917-678-9012",
          age: 15,
          sessionsAttended: 3,
          totalSessions: 12,
          notes: "New student. Learning basic chords.",
          checkInHistory: []
        }
      ]
    },
    {
      id: 'inst_003',
      name: "Patricia Lim",
      email: "patricia.lim@musicschool.com",
      phone: "+63917-789-0123",
      instrument: "violin",
      bio: "Violin instructor with background in orchestra. Teaches classical music.",
      students: [
        {
          id: 'std_005',
          name: "David Tan",
          email: "david.tan@email.com",
          phone: "+63917-890-1234",
          age: 13,
          sessionsAttended: 6,
          totalSessions: 12,
          notes: "Good progress with bow control.",
          checkInHistory: [
            { timestamp: new Date(Date.now() - 518400000).toISOString() }
          ]
        }
      ]
    }
  ];

  const [instructors, setInstructors] = useState(initialInstructors);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [currentInstructorId, setCurrentInstructorId] = useState(null);
  const [activeStudentCardId, setActiveStudentCardId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [instructorFilter, setInstructorFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [instructorFormData, setInstructorFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instrument: '',
    bio: ''
  });
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    notes: ''
  });

  // Fetch instructors and students from Firebase
  const fetchInstructorsFromFirebase = async () => {
    try {
      // Fetch all users with role 'instructor'
      const usersRef = collection(db, 'users');
      const instructorsQuery = query(usersRef, where('role', '==', 'instructor'));
      const instructorsSnapshot = await getDocs(instructorsQuery);
      
      // If no instructors found in Firebase, use sample data
      if (instructorsSnapshot.empty) {
        console.log('No instructors found in Firebase, using sample data');
        return false;
      }
      
      const instructorsList = [];
      
      for (const instructorDoc of instructorsSnapshot.docs) {
        const instructorData = instructorDoc.data();
        
        // Fetch students for this instructor
        const studentsRef = collection(db, 'users');
        const studentsQuery = query(studentsRef, where('assignedInstructor', '==', instructorDoc.id));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        const students = studentsSnapshot.docs.map(studentDoc => ({
          id: studentDoc.id,
          name: studentDoc.data().name || 'Unknown',
          email: studentDoc.data().email || '',
          phone: studentDoc.data().phone || '',
          age: studentDoc.data().age || 0,
          sessionsAttended: studentDoc.data().sessionsAttended || 0,
          totalSessions: studentDoc.data().totalSessions || 12,
          notes: studentDoc.data().notes || '',
          checkInHistory: studentDoc.data().checkInHistory || []
        }));
        
        instructorsList.push({
          id: instructorDoc.id,
          name: instructorData.name || 'Unknown',
          email: instructorData.email || '',
          phone: instructorData.phone || '',
          instrument: instructorData.instrument || '',
          bio: instructorData.bio || '',
          students: students
        });
      }
      
      setInstructors(instructorsList);
      localStorage.setItem('instructorsData', JSON.stringify(instructorsList));
      return true;
    } catch (error) {
      console.error('Error fetching instructors from Firebase:', error);
      return false;
    }
  };

  // Load data on mount
  useEffect(() => {
    // Try to fetch from Firebase first, if it fails use initial sample data
    fetchInstructorsFromFirebase().catch(() => {
      // If Firebase fetch fails, use the initial sample data
      setInstructors(initialInstructors);
      localStorage.setItem('instructorsData', JSON.stringify(initialInstructors));
    });
  }, []);

  // Save data whenever instructors change
  useEffect(() => {
    if (instructors.length > 0) {
      localStorage.setItem('instructorsData', JSON.stringify(instructors));
    }
  }, [instructors]);

  // Calculate statistics
  const stats = {
    totalInstructors: instructors.length,
    totalStudents: instructors.reduce((sum, inst) => sum + inst.students.length, 0),
    totalSessions: instructors.reduce((sum, inst) => 
      sum + inst.students.reduce((s, student) => s + (student.sessionsAttended || 0), 0), 0
    ),
    avgProgress: (() => {
      const totalPossible = instructors.reduce((sum, inst) => 
        sum + inst.students.reduce((s, student) => s + (student.totalSessions || 0), 0), 0
      );
      const totalSessions = instructors.reduce((sum, inst) => 
        sum + inst.students.reduce((s, student) => s + (student.sessionsAttended || 0), 0), 0
      );
      return totalPossible > 0 ? Math.round((totalSessions / totalPossible) * 100) : 0;
    })()
  };

  const getCurrentStudent = () => {
    if (!currentStudentId) return null;
    const instructor = instructors.find(i => i.id === currentStudentId.instructorId);
    if (!instructor) return null;
    const student = instructor.students.find(s => s.id === currentStudentId.studentId);
    return { instructor, student };
  };

  const openStudentProfile = (instructorId, studentId) => {
    const instructor = instructors.find(i => i.id === instructorId);
    const student = instructor.students.find(s => s.id === studentId);
    
    if (!student) return;

    setCurrentInstructorId(null);
    setCurrentStudentId({ instructorId, studentId });
    setActiveStudentCardId(studentId);
    setStudentFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      age: student.age.toString(),
      notes: student.notes || ''
    });
    setSidebarOpen(true);
  };

  const closeProfile = () => {
    setSidebarOpen(false);
    setActiveStudentCardId(null);
    setCurrentStudentId(null);
    setCurrentInstructorId(null);
  };

  const openInstructorProfile = (instructorId) => {
    const instructor = instructors.find(i => i.id === instructorId);
    
    if (!instructor) return;

    setCurrentStudentId(null);
    setActiveStudentCardId(null);
    setCurrentInstructorId(instructorId);
    setInstructorFormData({
      name: instructor.name,
      email: instructor.email || '',
      phone: instructor.phone || '',
      instrument: instructor.instrument || '',
      bio: instructor.bio || ''
    });
    setSidebarOpen(true);
  };

  const saveInstructorProfile = () => {
    if (!currentInstructorId) return;

    setInstructors(prev => prev.map(instructor => {
      if (instructor.id !== currentInstructorId) return instructor;
      
      return {
        ...instructor,
        name: instructorFormData.name,
        email: instructorFormData.email,
        phone: instructorFormData.phone,
        instrument: instructorFormData.instrument,
        bio: instructorFormData.bio
      };
    }));

    alert('Instructor profile saved successfully!');
  };

  const handleInstructorFormChange = (field, value) => {
    setInstructorFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateStudentSessions = (change) => {
    if (!currentStudentId) return;

    setInstructors(prev => prev.map(instructor => {
      if (instructor.id !== currentStudentId.instructorId) return instructor;
      
      return {
        ...instructor,
        students: instructor.students.map(student => {
          if (student.id !== currentStudentId.studentId) return student;
          
          // Only allow increasing sessions, never decreasing
          const newAttended = Math.min(student.totalSessions, Math.max(student.sessionsAttended, student.sessionsAttended + change));
          return { ...student, sessionsAttended: newAttended };
        })
      };
    }));
  };

  const saveStudentProfile = () => {
    if (!currentStudentId) return;

    setInstructors(prev => prev.map(instructor => {
      if (instructor.id !== currentStudentId.instructorId) return instructor;
      
      return {
        ...instructor,
        students: instructor.students.map(student => {
          if (student.id !== currentStudentId.studentId) return student;
          
          return {
            ...student,
            name: studentFormData.name,
            email: studentFormData.email,
            phone: studentFormData.phone,
            age: parseInt(studentFormData.age) || student.age,
            notes: studentFormData.notes
          };
        })
      };
    }));

    alert('Profile saved successfully!');
  };

  const handleFormChange = (field, value) => {
    setStudentFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentData = getCurrentStudent();
  const currentStudent = currentData?.student;
  const currentInstructor = currentData?.instructor;

  // Filter instructors and their students
  const filteredInstructors = instructors
    .filter(instructor => 
      instructor.name.toLowerCase().includes(instructorFilter.toLowerCase())
    )
    .map(instructor => ({
      ...instructor,
      students: instructor.students.filter(student =>
        student.name.toLowerCase().includes(studentFilter.toLowerCase())
      )
    }));

  return (
    <div className="instructor-management">
      <div className="instructor-container">
        {/* Filter Section - Sticky at Top */}
        <div className="filter-section">
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              Search Instructor
            </label>
            <input
              type="text"
              placeholder="Enter instructor name..."
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              Search Student
            </label>
            <input
              type="text"
              placeholder="Enter student name..."
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalInstructors}</div>
            <div className="stat-label">Total Instructors</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalSessions}</div>
            <div className="stat-label">Sessions Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.avgProgress}%</div>
            <div className="stat-label">Average Progress</div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`main-content ${sidebarOpen ? 'with-sidebar' : ''}`}>
          {/* Instructor Profile Sidebar */}
          {sidebarOpen && currentInstructorId && (
            <div className="profile-sidebar">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-title">{instructorFormData.name}</div>
                <button 
                  onClick={closeProfile}
                  className="close-profile-btn"
                >
                  ×
                </button>
              </div>

              {/* Personal Information */}
              <div className="profile-section">
                <div className="profile-section-title">Personal Information</div>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Full Name:</span>
                    <input
                      type="text"
                      value={instructorFormData.name}
                      onChange={(e) => handleInstructorFormChange('name', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <input
                      type="email"
                      value={instructorFormData.email}
                      onChange={(e) => handleInstructorFormChange('email', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <input
                      type="tel"
                      value={instructorFormData.phone}
                      onChange={(e) => handleInstructorFormChange('phone', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Instrument:</span>
                    <input
                      type="text"
                      value={instructorFormData.instrument}
                      onChange={(e) => handleInstructorFormChange('instrument', e.target.value)}
                      className="info-input"
                    />
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="profile-section">
                <div className="profile-section-title">Specializations</div>
                <textarea
                  value={instructorFormData.bio}
                  onChange={(e) => handleInstructorFormChange('bio', e.target.value)}
                  placeholder="Add specializations, certifications, or expertise areas..."
                  className="info-textarea"
                />
              </div>

              {/* Save Button */}
              <div className="profile-actions">
                <button
                  onClick={saveInstructorProfile}
                  className="profile-btn-save"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Student Profile Sidebar */}
          {sidebarOpen && currentStudent && (
            <div className="profile-sidebar">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-title">{currentStudent.name}</div>
                <button 
                  onClick={closeProfile}
                  className="close-profile-btn"
                >
                  ×
                </button>
              </div>

              {/* Attendance Section */}
              <div className="attendance-section">
                <div className="profile-section-title">Session Attendance</div>
                
                {/* Simple Session Count */}
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: '20px' }}>
                  {currentStudent.sessionsAttended} / {currentStudent.totalSessions}
                </div>
                
                {/* History Section */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {currentStudent.checkInHistory && currentStudent.checkInHistory.length > 0 ? (
                      currentStudent.checkInHistory.map((checkIn, idx) => (
                        <div key={idx} style={{ 
                          padding: '10px', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '14px'
                        }}>
                          <span style={{ color: '#27ae60', fontWeight: '600' }}>✓ QR Check-In</span>
                          <span style={{ color: '#666', fontSize: '12px' }}>{new Date(checkIn.timestamp).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                        No check-ins yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="profile-section">
                <div className="profile-section-title">Personal Information</div>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Full Name:</span>
                    <input
                      type="text"
                      value={studentFormData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <input
                      type="email"
                      value={studentFormData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <input
                      type="tel"
                      value={studentFormData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Age:</span>
                    <input
                      type="number"
                      value={studentFormData.age}
                      onChange={(e) => handleFormChange('age', e.target.value)}
                      className="info-input"
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Instrument:</span>
                    <span className="info-value">{currentInstructor?.instrument.toUpperCase()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Instructor:</span>
                    <span className="info-value">{currentInstructor?.name}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="profile-section">
                <div className="profile-section-title">Notes</div>
                <textarea
                  value={studentFormData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Add notes about the student's progress, goals, or important information..."
                  className="info-textarea"
                />
              </div>

              {/* Save Button */}
              <div className="profile-actions">
                <button
                  onClick={saveStudentProfile}
                  className="profile-btn-save"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Instructors Grid */}
          <div className="instructors-grid">
            {filteredInstructors.map(instructor => (
              <div key={instructor.id} className="instructor-card">
                {/* Instructor Header */}
                <div className="instructor-card-header">
                  <div className="instructor-avatar">
                    {instructor.name.split(' ').map(word => word[0]).join('').toUpperCase()}
                  </div>
                  <div className="instructor-info">
                    <div 
                      className="instructor-name" 
                      onClick={() => openInstructorProfile(instructor.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {instructor.name}
                    </div>
                    <span className={`instrument-badge ${instructor.instrument}`}>
                      {instructor.instrument.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Students Section */}
                <div className="students-section">
                  <div className="section-title">
                    Students ({instructor.students.length})
                  </div>
                  {instructor.students.length > 0 ? (
                    instructor.students.map(student => (
                      <div
                        key={student.id}
                        onClick={() => openStudentProfile(instructor.id, student.id)}
                        className={`student-card ${activeStudentCardId === student.id ? 'active' : ''}`}
                      >
                        <div className="student-header">
                          <div className="student-name">{student.name}</div>
                          <div className="sessions-badge">
                            {student.sessionsAttended}/{student.totalSessions}
                          </div>
                        </div>
                        <div className="student-quick-info">
                          {student.email} | {student.phone}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-students">
                      No students assigned yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}