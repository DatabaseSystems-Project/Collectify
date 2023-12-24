import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserNavBar from "./UserNavBar.js";
import UserAchievements from "./UserAchievements.js";
import "../styles/user_profile.css";
import axios from "axios";

const UserPage = () => {
  const [userInfo, setUserInfo] = useState({});
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatars, setAvatars] = useState(null);
  const [loadingAvatars, setLoadingAvatars] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/userProfileInfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(response.data);
    } catch (error) {
      console.error("Error fetching user information:", error);
    }
  };

  const handleAvatarClick = async () => {
    try {
      setLoadingAvatars(true);
      const response = await axios.get(`http://localhost:5000/getAvatars`);
      setAvatars(response.data);
      setLoadingAvatars(false);
      setShowAvatarModal(true);
    } catch (error) {
      console.error("Error fetching avatars:", error);
      setLoadingAvatars(false);
    }
  };

  const handleAvatarSelect = async (avatar_id) => {
    setShowAvatarModal(false);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append("avatar_id", avatar_id);
      const response = await axios.post(`http://localhost:5000/setAvatar`, formData, { headers: { Authorization: `Bearer ${token}` },});
      console.log(response.data);
      window.location.reload();
    } catch (error) {
      console.error("Error setting avatar:", error);
    }
  };



  return (
    <div className="user_container">
      <div className="user_navbar">
        <UserNavBar />
      </div>

      <div className="user_profile_div">
        <div className="profile_section">
          <img
            src={userInfo.avatarURL}
            alt="Avatar"
            className="profile_avatar"
            onClick={handleAvatarClick}
          />
          {/* Avatar Modal */}
          {showAvatarModal && (
            <div className="avatar-modal">
              <div  className="avatar_modal_top">
                <h3>Select Your Avatar</h3>
                <button className="close-button" onClick={() => setShowAvatarModal(false)}>
                Close
                </button>
              </div>
              <div className="avatar_modal_avatars">
              {loadingAvatars ? (
                <p>Loading avatars...</p>
              ) : (
                  <ul>
                    {avatars?.map((avatar) => (
                      <li
                        key={avatar.avatar_id}
                        onClick={() => handleAvatarSelect(avatar.avatar_id)}
                      >
                        <img src={avatar.fileURL} alt={`Avatar ${avatar.avatar_id}`} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <div className="user_info">
            <h1 className="welcome_text">Welcome, {userInfo.username}!</h1>
            <h4 className="username">Username: {userInfo.username}</h4>
            <h4 className="email">Mail Address: {userInfo.email}</h4>
            <h4 className="score">Score: {userInfo.score}</h4>
            <h4 className="date">Date Joined: {new Date(userInfo.date).toLocaleDateString()}</h4>
          </div>
          <div className="showcase_card_div">
            <img src={userInfo.showcase_cardURL} className="showcase_card" alt="" />
          </div>
        </div>
        {/* Button to open the UserAchievements component 
        <Link to="/user/achievements" className="button">
          Go to Achievements
        </Link>
        */}
        {/* Render the UserAchievements component */}
        {/* <UserAchievements /> */}
      </div>
    </div>
  );
};

export default UserPage;
