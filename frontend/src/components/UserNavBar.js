import React,{useState,useEffect} from "react";
import { Link, useLocation } from 'react-router-dom';
import "../styles/user_navbar.css";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faIdCard, faMoneyBill, faDoorOpen, faAward, faBasketShopping, faShop, faGavel, faSimCard, faClapperboard,faList } from '@fortawesome/free-solid-svg-icons';


const UserNavBar = () => {
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({});
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`http://localhost:5000/userNavbarInfo`,{ headers: { Authorization: `Bearer ${token}` },});
        setUserInfo(response.data); // Assuming your backend returns user information in the response.data object
      } catch (error) {
        console.error('Error fetching user information:', error);
      }
    };

    fetchUserInfo();
  }, []);


  return (
    <nav>
      <h1 className="user_navbar_h1" >Collectify</h1>
      <div className="user_navbar_info">
          <div className="user_navbar_info_avatar">
            {userInfo.avatarURL && <img src={userInfo.avatarURL} alt="Avatar" className="navbar-avatar" />}
          </div>
          <div className="user_navbar_info_items"> 
            <h4 className="navbar-info-item"><FontAwesomeIcon icon={faUser} className="money_icon"/> {userInfo.username}</h4>
            <h4 className="navbar-info-item"><FontAwesomeIcon icon={faMoneyBill} className="money_icon"/>${userInfo.balance}</h4>
            <h4 className="navbar-info-item"><FontAwesomeIcon icon={faAward} className="money_icon"/> {userInfo.score}</h4>
          </div>
          
      </div>
      <ul>
        <li>
          <Link to="/user/home" className={`navbar-links ${isActive('/user/home')}`}>
            <FontAwesomeIcon icon={faHome} className="icon"/>
            Home
          </Link>
        </li>
        <li>
          <Link to="/user/mycollection" className={`navbar-links ${isActive('/user/mycollection')}`}>
            <FontAwesomeIcon icon={faList} className="icon"/>
            My Collection
          </Link>
        </li>
        <li>
          <Link to="/user/market" className={`navbar-links ${isActive('/user/market')}`}>
            <FontAwesomeIcon icon={faShop} className="icon"/>
            Market
          </Link>
        </li>
        <li>
          <Link to="/user/auction" className={`navbar-links ${isActive('/user/auction')}`}>
            <FontAwesomeIcon icon={faGavel} className="icon"/>
            Auction
          </Link>
        </li>
        <li>
          <Link to="/user/pazar" className={`navbar-links ${isActive('/user/pazar')}`}>
            <FontAwesomeIcon icon={faBasketShopping} className="icon"/>
            Bazaar
          </Link>
        </li>
        
        <li>
          <Link to="/user/profile" className={`navbar-links ${isActive('/user/profile')}`}>
            <FontAwesomeIcon icon={faIdCard} className="icon"/>
            Profile
          </Link>
        </li>
        <li>
        <Link to="/login"  className={`navbar-links ${isActive('/')}`}>
          <FontAwesomeIcon icon={faDoorOpen} className="icon" />
          Log Out
        </Link>
        </li>
        
      </ul>
      
    </nav>
  );
};

export default UserNavBar;
