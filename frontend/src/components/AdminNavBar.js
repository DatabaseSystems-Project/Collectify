import React from "react";
import { Link, useLocation } from 'react-router-dom';
import "../styles/admin_navbar.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faFaceGrinSquint, faIdCard, faDoorOpen } from '@fortawesome/free-solid-svg-icons';

const AdminNavBar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="admin_navbar">
      <h1 className="collectify_header">Collectify</h1>
      <ul>
        <li>
          <Link to="/admin/home" className={`admin_navbar_links ${isActive('/admin/home')}`}>
            <FontAwesomeIcon icon={faHome} className="icon"/>
            Home
          </Link>
        </li>
        <li>
          <Link to="/admin/viewusers" className={`admin_navbar_links ${isActive('/admin/viewusers')}`}>
            <FontAwesomeIcon icon={faUser} className="icon"/>
            View Users
          </Link>
        </li>
        <li>
          <Link to="/admin/viewavatars" className={`admin_navbar_links ${isActive('/admin/viewavatars')}`}>
            <FontAwesomeIcon icon={faFaceGrinSquint} className="icon"/>
            View Avatars
          </Link>
        </li>
        <li>
          <Link to="/admin/addcard" className={`admin_navbar_links ${isActive('/admin/addcard')}`}>
            <FontAwesomeIcon icon={faIdCard} className="icon"/>
            Add New Card
          </Link>
        </li>
        <li>
          <Link to="/admin/addcollection" className={`admin_navbar_links ${isActive('/admin/addcollection')}`}>
            <FontAwesomeIcon icon={faUser} className="icon"/>
            Add New Collection
          </Link>
        </li>
        <li>
        <Link to="/login"  className={`admin_navbar_links ${isActive('/')}`}>
          <FontAwesomeIcon icon={faDoorOpen} className="icon" />
          Log Out
        </Link>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNavBar;
