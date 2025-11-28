import React, { useState } from 'react';
import './Login.css'; 
import { auth, googleProvider } from '../../firebase'; // Adjust path if needed
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate

function Login() {
  const navigate = useNavigate(); // 2. Initialize the hook
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // --- HANDLE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Firebase checks credentials
      await signInWithEmailAndPassword(auth, email, password);
      
      // 3. IF SUCCESSFUL -> REDIRECT TO HOME ('/')
      // Change '/' to '/home' if your home route is different
      navigate('/'); 
      
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  };

  // --- HANDLE GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      
      // 3. REDIRECT TO HOME ON GOOGLE SUCCESS TOO
      navigate('/'); 
      
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h2>Login</h2>
          <p>Sign in to your MixLab Studio account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="form-group">
            <label>Email or Username</label>
            <div className="input-container">
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-icon" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="login-submit-btn">Login</button>

          <Link to="/forgot-password" class="forgot-password">Forgot password?</Link>
        </form>

        <div className="divider">
          <span>or sign in with</span>
        </div>

        <div className="social-login">
          <button className="social-btn" onClick={handleGoogleLogin}>
            <FaGoogle color="#DB4437" /> Google
          </button>
          <button className="social-btn">
            <FaFacebookF color="#4267B2" /> Facebook
          </button>
        </div>

        <div className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;