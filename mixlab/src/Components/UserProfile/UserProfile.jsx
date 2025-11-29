import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import { auth, db } from '../../firebase'; // Adjust path to your firebase config
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Auth user
  const [userData, setUserData] = useState({}); // Firestore data
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const [loading, setLoading] = useState(true);

  // Form State for editing
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    address: '',
    birthday: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        navigate('/login'); // Redirect if not logged in
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setFormData({
            username: data.username || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            contactNumber: data.contactNumber || '',
            address: data.address || '',
            birthday: data.birthday || ''
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, {
            ...formData
        });
        setUserData({ ...userData, ...formData }); // Update local view
        setIsEditing(false);
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile.");
    }
  };

  if (loading) return <div className="profile-loading">Loading Profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
            <div className="avatar-section">
                <FaUserCircle className="avatar-icon" />
                <h2>{userData.username || 'User'}</h2>
                <span className="role-badge">{userData.role || 'Member'}</span>
            </div>
            
            <div className="action-buttons">
                {!isEditing ? (
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                        <FaEdit /> Edit Profile
                    </button>
                ) : (
                    <>
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                            <FaTimes /> Cancel
                        </button>
                        <button className="save-btn" onClick={handleSave}>
                            <FaSave /> Save Changes
                        </button>
                    </>
                )}
            </div>
        </div>

        <div className="profile-details">
            <div className="detail-group">
                <label>Email Address (Read Only)</label>
                <input type="text" value={userData.email} disabled className="read-only" />
            </div>

            <div className="form-row">
                <div className="detail-group half">
                    <label>First Name</label>
                    <input 
                        type="text" 
                        name="firstName" 
                        value={isEditing ? formData.firstName : userData.firstName} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                    />
                </div>
                <div className="detail-group half">
                    <label>Last Name</label>
                    <input 
                        type="text" 
                        name="lastName" 
                        value={isEditing ? formData.lastName : userData.lastName} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                    />
                </div>
            </div>

            <div className="detail-group">
                <label>Username</label>
                <input 
                    type="text" 
                    name="username" 
                    value={isEditing ? formData.username : userData.username} 
                    onChange={handleInputChange} 
                    disabled={!isEditing} 
                />
            </div>

            <div className="form-row">
                <div className="detail-group half">
                    <label>Contact Number</label>
                    <input 
                        type="text" 
                        name="contactNumber" 
                        value={isEditing ? formData.contactNumber : userData.contactNumber} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                    />
                </div>
                <div className="detail-group half">
                    <label>Birthday</label>
                    <input 
                        type="date" 
                        name="birthday" 
                        value={isEditing ? formData.birthday : userData.birthday} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                    />
                </div>
            </div>

            <div className="detail-group">
                <label>Address</label>
                <textarea 
                    name="address" 
                    rows="3"
                    value={isEditing ? formData.address : userData.address} 
                    onChange={handleInputChange} 
                    disabled={!isEditing} 
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;