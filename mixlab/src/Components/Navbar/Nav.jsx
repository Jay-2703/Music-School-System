import './Nav.css'
import { useState, useEffect } from 'react';
import Hamburger from '../Hamburger/Hamburger';
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate

import { auth } from "../../firebase"; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

function Nav() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); 

  // 1. Listen to Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to home after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  // --- Sticky Header Logic (Kept exactly as you had it) ---
  const [isSticky, setIsSticky] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return; // Safety check
    const headerHeight = header.offsetHeight + 30;

    const handleScroll = () => {
      const windowTop = window.pageYOffset;

      if (windowTop >= headerHeight) {
        setIsSticky(true);
        if (windowTop < lastScrollTop) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsSticky(false);
        setIsVisible(true);
      }

      setLastScrollTop(windowTop);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollTop]);


  return (
    <>
        <nav className='Nav1'>
            <header className={`${isSticky ? 'cs_gescout_sticky' : ''} ${isVisible ? 'cs_gescout_show' : ''}`}>
              
              {/* Logo Area */}
              <div className="logo">
                 {/* You can add an <img /> here later */}
              </div>

              <ul className='ul1'>
                  <li className='li1'><Link to="/" className="li1">Home</Link></li>
                  <li className='li1'><Link to="/service" className="li1">Services</Link></li>
                  <li className='li1'><Link to="/tc" className="li1">Divisions</Link></li>
                  <li className='li1'><Link to="/Contact" className="li1">Contact</Link></li>
                  <li className='li1'><Link to="/about" className="li1">About</Link></li>

                  {/* --- NEW LOGIN / LOGOUT MAPPING --- */}
                  {user ? (
                    // IF LOGGED IN: Show Logout
                    <li className='li1'>
                       <button onClick={handleLogout} className="nav-logout-btn">
                         Log Out
                       </button>
                    </li>
                  ) : (
                    // IF LOGGED OUT: Show Login
                    <li className='li1'>
                      <Link to="/login" className="li1" style={{color: '#ffd700'}}>Log In</Link>
                    </li>
                  )}
                  {/* ---------------------------------- */}
            </ul> 

            <div className="hamburger">
                <Hamburger/>
            </div>
            </header>
        </nav>
    </>
  )
}

export default Nav