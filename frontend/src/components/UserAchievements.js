import React,{useState,useEffect} from "react";
import UserNavBar from './UserNavBar.js';
import "../styles/user_home.css";
import axios from 'axios';

const UserAchievements = () => {
    return (
      <div className="user_container">
         <div className="user_navbar">
                <UserNavBar/>
          </div>
          <div className="user_achievements_div">
          </div>
      </div>
    )
};
  
  export default UserAchievements;