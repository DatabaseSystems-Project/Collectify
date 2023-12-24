import React, {useState} from "react";
import "../styles/login.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faUser, faLock} from '@fortawesome/free-solid-svg-icons'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ( ) => {
    const [actionn,setAction] = useState("Sign Up");
    const [username, setUserame] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [responseData,setResponseData] = useState("");
    const navigate = useNavigate();

    const handleNameChange = (e) => {
        setUserame(e.target.value);
    };
    
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleAuthentication = async (event) => {
        event.preventDefault();
        try{
          // Check for empty values

          const formData = new FormData();
          formData.append('actionn', actionn);
          formData.append('username', username);
          formData.append('email', email);
          formData.append('password', password);
          const response = await axios.post(`http://localhost:5000/handleAuthentication`, formData);
          
          if (response.status === 200){
            const responseData = response.data; // Axios parses JSON
            
            if(responseData.status_code === 1){ 
              // Store the token (e.g., in cookies or local storage)
              localStorage.setItem('token', responseData.token);
              //setResponseData(""); 
                         
              if(responseData.isAdmin  === "YES"){
                // Redirect to /adminpage after successful authentication
                navigate('/admin/home');
              }
              else if(responseData.isAdmin === "NO"){
                // Redirect to /userpage after successful authentication
                navigate('/user/home');
              }
            }else if(responseData.status_code === 4){ //
                console.log("here");
              setResponseData("Sign up is completed. Please Login.");
            }
            else{
              setResponseData(responseData);
              
            }   
            window.location.reload();
            setUserame("");
            setEmail("");
            setPassword("");
          }
          
        } catch (error) {
          console.error('Error handleAuthentication: ', error);
        }
    };
    

    return (
    <div className="parent"> 
        <div className="leftpart">
            <div className="writings">
                <h1>Welcome to COLLECTIFY</h1> {/**&nbsp;&nbsp; */}
                <h3>Welcome to our online community, where you can explore the exciting world of collecting! Here, you can have a lot of fun gathering things. Join auctions, buy and sell cards. Come and be a part of our exciting journey to grow your special collections! Join us now!</h3>
            </div>
        </div>
        <div className="rightpart">

        <div className="logo-container"> </div>

            <div className="submit_form">
                <form onSubmit={handleAuthentication}>
                        <div className="header">
                            <div className="text">{actionn}</div>
                            <div className="underline"></div>
                        </div>
                        <div className="inputs">
                            {actionn==="Login"?<div></div>:<div className="input">
                                <FontAwesomeIcon icon={faUser} className="icon"/>
                                <input type="text" placeholder="Username" name = "username" value={username} onChange={handleNameChange} required/>
                            </div>}
                            
                            <div className="input">
                                <FontAwesomeIcon icon={faEnvelope}  className="icon"/>
                                <input type="email" placeholder="Email" name = "email" value={email} onChange={handleEmailChange} required/>
                            </div>
                            <div className="input">
                                <FontAwesomeIcon icon={faLock} className="icon"/>
                                <input type="password" placeholder="Password" name = "password" value={password} onChange={handlePasswordChange} required />
                            </div>
                            <div>{responseData && <p className="responseData">{responseData.message}</p>}</div>
                        </div>
                        {/*{actionn==="Sign Up"?<div></div>:<div className="forgot-password">Forget Password?<span> Click Here!</span></div>}   */}       
                        <div className="submit-container">
                            {actionn === "Sign Up" ? (
                                <React.Fragment>
                                    <button type="submit" className="submit_button" onClick={() => {setAction("Sign Up");}}>Sign Up</button>
                                    <p className="login-link">Already have an account?{" "}<span onClick={() => {setAction("Login");setResponseData(null);}}>Login</span></p>
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <button type="submit" className="submit_button" onClick={() => {setAction("Login");}}>Login</button>
                                    <p className="login-link">Don't have an account?{" "}<span onClick={() => {setAction("Sign Up");setResponseData(null);}}>Sign Up</span></p>
                                </React.Fragment>
                            )}
                        </div>
                </form>
            </div>
        </div>
    </div>
    );
}

export default Login;