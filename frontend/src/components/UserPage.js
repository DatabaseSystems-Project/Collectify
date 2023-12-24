import React,{useState,useEffect} from "react";
import UserNavBar from './UserNavBar.js';
import "../styles/user_home.css";
import axios from 'axios';
import Modal from 'react-modal';


const UserPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  
  const [wheelPrice, setWheelPrice] = useState(null); // kazanılan
  const [rotationCompleted, setRotationCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeLimitInSeconds, setTimeLimitInSeconds] = useState(6 * 60 * 60); // Default: 6 hour,  FOR 10SECOND: useState(10);, FOR 6HOURS: useState(6*60*60) 

  useEffect(()=>{
    getLeaderboard();

    const lastSpinTimestamp = localStorage.getItem("lastSpinTimestamp");
    const currentTime = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds

    if (lastSpinTimestamp) {
      const elapsedTime = currentTime - parseInt(lastSpinTimestamp, 10);
      const remainingTime = Math.max(timeLimitInSeconds - elapsedTime, 0);
      setTimeRemaining(remainingTime);
    } else {
      setTimeRemaining(0);
    }

    const intervalId = setInterval(() => {
      setTimeRemaining((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  },[])


  const getLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("fetched");
      setLeaderboard([]);
      const response = await axios.get(`http://localhost:5000/getLeaderboard`,{
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };


  const handleUserClick = (user) => {
    // Update the selected user state
    openModal();
    setSelectedUser(user);
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleSpin = (user) => {

    if (timeRemaining <= 0) {
      try {
        const wheel = document.querySelector('.wheel');
        if (!wheel) {
          console.error('Wheel element not found.');
          return;
        }
        let pricee = 0;

        const spinAngle = 360 * 5 + Math.floor(Math.random() * 360); // Adjust the angle as needed
        // Calculate the final angle after the spin
        const finalAngle  = spinAngle % 360;
        
        // Get the corresponding value for the segment
        // Apply the transform to the wheel
        wheel.style.transition = 'transform 3s ease-out';
        wheel.style.transform = `rotate(${spinAngle}deg)`;
        
        // Rotation completes
        setTimeout(() => {
          
          //*  counterclockwise 
          if(finalAngle<=(22.5)) pricee = 100;
          else if(finalAngle<=(67.5)) pricee = 20;
          else if(finalAngle<=(112.5)) pricee = 5;
          else if(finalAngle<=(157.5)) pricee = 10;
          else if(finalAngle<=(202.5)) pricee = 500;
          else if(finalAngle<=(247.5)) pricee = 0;
          else if(finalAngle<=(292.5)) pricee = 50;
          else if(finalAngle<=(337.5)) pricee = 1;
          else if(finalAngle<=(360)) pricee = 100;

          setRotationCompleted(true);
          const price = pricee;
          // Log or handle the price as needed
          console.log('Price:', price);
          setWheelPrice(price);
        }, 3000); // Adjust the duration to match the transition duration  

        // Store the timestamp of the current spin
        const currentTime = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
        localStorage.setItem("lastSpinTimestamp", currentTime);
        

      }catch (error) {
        console.error('Error during spin:', error);
      }
    } else {
      console.log("Cannot spin yet. Please wait for the countdown.");
    }
  };

  const handleOkButtonClick = async () => {
    const token = localStorage.getItem('token');
    try {
      const formData = new FormData();  
      formData.append('wheelPrice', wheelPrice);

      await axios.post('http://localhost:5000/dailySpin', formData, { headers: { Authorization: `Bearer ${token}` },});  

      const wheel = document.querySelector('.wheel');
      wheel.style.transition = 'none';
      wheel.style.transform = 'rotate(0)';
      setWheelPrice(null);
      setRotationCompleted(true);

      // Reset the time remaining to start the countdown for the next spin
      const currentTime = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds
      localStorage.setItem("lastSpinTimestamp", currentTime);
      setTimeRemaining(timeLimitInSeconds);

      window.location.reload();
    } catch (error) {
      console.error('Error starting auction:', error);
    }

  };
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (remainingMinutes > 0) {
      return `${remainingMinutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Ensure the script runs after the DOM is ready
  
    return (
      <div className="user_container">
         <div className="user_navbar">
                <UserNavBar/>
          </div>
          <div className="user_home_div">
           
            
            <div className="user_home_dailyspin">
              {timeRemaining > 0 && (
                <div className="remaining_time">
                  <p>Next spin available in: {formatTime(timeRemaining)}</p>
                </div>
              )}
              
              <div className="rotationCompleted">
                  {rotationCompleted && (
                    <div className="result">
                      <p>You Won: {wheelPrice}$</p>
                      <button onClick={handleOkButtonClick}>OK</button>
                    </div>
                  )}
              </div>

              {!rotationCompleted && <div className="spinBtn_notCompleted" onClick={handleSpin}>Spin</div>}
              {rotationCompleted && <div className="spinBtn_Completed" >Spin</div>}
              <div className={`wheel {rotationCompleted ? 'gray' : ''}`}>
                <div className="number" style={{'--i': 1, '--clr':'linear-gradient(45deg, #164863, #164863)' }}>
                  <span>$100</span>
                </div>

                <div className="number" style={{'--i': 2, '--clr':'linear-gradient(45deg, #c59b3f, #c59b3f)' }}>
                  <span> $1</span>
                </div>

                <div className="number" style={{'--i': 3, '--clr':'linear-gradient(45deg, #164863, #164863)' }}>
                  <span>$50</span>
                </div>

                <div className="number" style={{'--i': 4, '--clr':'linear-gradient(45deg, #c59b3f, #c59b3f)' }}>
                  <span>$0</span>
                </div>

                <div className="number" style={{'--i': 5, '--clr':'linear-gradient(45deg, #164863, #164863)' }}>
                  <span>$500</span>
                </div>

                <div className="number" style={{'--i': 6, '--clr':'linear-gradient(45deg, #c59b3f, #c59b3f)' }}>
                  <span>$10</span>
                </div>

                <div className="number" style={{'--i': 7, '--clr':'linear-gradient(45deg, #164863, #164863)' }}>
                  <span>$5</span>
                </div>

                <div className="number" style={{'--i': 8, '--clr':'linear-gradient(45deg, #c59b3f, #c59b3f)' }}>
                  <span>$20</span>
                </div>
              </div>
            </div>
            
            
      

            <div className="user_home_leaderboard_div">
              <h2 className="user_home_leaderboard_h2">Leaderboard</h2>
              <div >
                <ul className="user_home_leaderboard">
                  {leaderboard.map((user, index) => (
                    <li key={user.user_id} onClick={() => handleUserClick(user)} className="leaderboard_names">
                        <p>
                          <span className="degree">{index + 1}. </span>
                          <img
                            src={user.avatarURL}
                            alt="Avatar"
                            className="leaderboard_img"
                          />
                          <p className="leaderboard_username">{user.username}</p>             <p>{user.score}</p> 
                        </p>
                    </li>
                  ))}
                </ul>
              </div>

              <Modal
                  className="leaderboard_modal"
                  isOpen={modalIsOpen}
                  onRequestClose={closeModal}
                >
                  <h3 style={{
                       textAlign:'center',
                       marginBottom: '10px',
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center',
                      }}>User Information  <button className="user_home_leaderboard_modal_button"  onClick={closeModal}>Close</button></h3>
                      
                  {selectedUser && (
                    <div 
                      style={{
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <img
                          src={selectedUser.avatarURL}
                          alt="Avatar"
                          style={{
                            width: '100px', // Adjust the width as needed
                            height: '100px', // Adjust the height as needed
                            borderRadius: '50%', // To make it a circular avatar, adjust as needed
                            marginRight: '5px',
                          }}
                        />
                        <div>
                          <p>Username: {selectedUser.username}</p>
                          <p>Score: {selectedUser.score}</p>
                          <p className="date">Date Joined: {new Date(selectedUser.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <img
                          src={selectedUser.showcase_cardURL}
                          alt=""
                          className="leaderboard_showcase"
                        /> 
                    </div>
                  )}
                  
                </Modal>
            </div>
          </div>
      </div>
    )
};
  
  export default UserPage;