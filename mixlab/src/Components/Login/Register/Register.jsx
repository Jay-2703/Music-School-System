import React, { useState } from 'react';
import './Register.css'; 
import { auth, googleProvider, db } from "../../../firebase"; // Go up 3 levels to src/
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '', firstName: '', lastName: '', email: '',
    birthday: '', contactNumber: '', address: '',
    password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      // 1. Create Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Save Data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        birthday: formData.birthday,
        contactNumber: formData.contactNumber,
        address: formData.address,
        createdAt: new Date()
      });

      alert("Account Created Successfully!");
      navigate('/home'); 

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
       await signInWithPopup(auth, googleProvider);
       // Note: Google sign in might not capture Address/Phone, 
       // you might want to redirect them to a profile completion page later.
       navigate('/home');
    } catch(err) {
       console.error(err);
    }
  }

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h1>Register</h1>
        <p className="subtitle">Create your MixLab Studio account</p>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="Enter your username" onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="input-group half-width">
              <label>First Name</label>
              <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
            </div>
            <div className="input-group half-width">
              <label>Last Name (Optional)</label>
              <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="Enter your email" onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="input-group half-width">
              <label>Birthday (Optional)</label>
              <input type="date" name="birthday" onChange={handleChange} />
            </div>
            <div className="input-group half-width">
              <label>Contact Number</label>
              <input type="tel" name="contactNumber" placeholder="+63 9123456789" onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>Home Address (Optional)</label>
            <input type="text" name="address" placeholder="e.g., 23 Sampaguita St..." onChange={handleChange} />
            <span className="helper-text">Format: Street/Block/Lot, Barangay, City/Municipality</span>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="Enter your password"
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <span className="helper-text">Must be at least 8 characters with special character (@$!%*?&_-)</span>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                placeholder="Confirm your password"
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="login-btn">Register</button>
        </form>

        <div className="divider"><span>or sign up with</span></div>

        <div className="social-buttons">
          <button className="social-btn google" onClick={handleGoogleRegister}><FaGoogle className="icon" /> Google</button>
          <button className="social-btn facebook"><FaFacebookF className="icon" /> Facebook</button>
        </div>

        <div className="register-link">
          Already have an account? <Link to="/Login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;