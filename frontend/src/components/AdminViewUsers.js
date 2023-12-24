import React, { useEffect, useState } from 'react';
import AdminNavBar from './AdminNavBar.js';
import "../styles/admin_viewusers.css";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch} from '@fortawesome/free-solid-svg-icons'

const AdminViewUsers = () => {
    const [userList, setUserList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUserList = async () => {
            try {
                const response = await fetch('http://localhost:5000/getUserlist');
                const data = await response.json();

                // Assuming the response is an array of user objects
                setUserList(data);
            } catch (error) {
                console.error('Error fetching user list:', error);
            }
        };

        fetchUserList();
    }, []);


    const makeAdminHandler = async (user_id) => {
        try{
            const formData = new FormData();
            formData.append('user_id', user_id);
            const response = await axios.post(`http://localhost:5000/makeAdmin`, formData);
            console.log(response)
            window.location.reload();
        }catch (error) {
            console.error('Error making admin:', error);
        }
    }     

    const deleteUserHandler = async (user_id) => {
        try{
            const formData = new FormData();
            formData.append('user_id', user_id);
            const response = await axios.post(`http://localhost:5000/deleteUser`, formData);
            console.log(response)
            window.location.reload();
        }catch (error) {
            console.error('Error making admin:', error);
        }
    }  

    // Filter the user list based on the search term
    const filteredUserList = userList.filter(user =>
        Object.values(user).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="admin-container">
            <div className="admin-navbar">
                <AdminNavBar/>
            </div>
            <div className="admin-viewusers-div">
            <div className="user_search_button_div">
                <input
                    className="user_search_button"
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FontAwesomeIcon icon={faSearch} className="icon"/>
            </div>
            
            <table>
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Email</th>
                            <th>Username</th>
                            <th>Date</th>
                            <th>Avatar ID</th>
                            <th>Balance</th>
                            <th>Score</th>
                            <th>Showcase Card</th>
                            <th>isAdmin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUserList.map(user => (
                            <tr className="table_row" key={user.user_id}>
                                <td>{user.user_id}</td>
                                <td>{user.email}</td>
                                <td>{user.username}</td>
                                <td>{user.date}</td>
                                <td>{user.avatar_id}</td>
                                <td>{user.balance}</td>
                                <td>{user.score}</td>
                                <td>{user.showcase_card}</td>
                                <td>{user.isAdmin}</td>
                                <div className="table_row_buttons">
                                    <button className="table_row_button" onClick={() => makeAdminHandler(user.user_id)}>
                                        Make Admin
                                    </button>
                                    <button className="table_row_button" onClick={() =>deleteUserHandler(user.user_id)}>
                                        Delete User
                                    </button>
                                </div>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};

  
export default AdminViewUsers;