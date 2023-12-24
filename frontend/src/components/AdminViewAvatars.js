import React, { useEffect, useState } from 'react';
import AdminNavBar from './AdminNavBar.js';
import AvatarEditor from 'react-avatar-editor';
import "../styles/admin_viewavatars.css";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDeleteLeft} from '@fortawesome/free-solid-svg-icons'

const AdminViewAvatars = () => {
    const [avatarList, setAvatarList] = useState([]);
    const [newAvatar, setNewAvatar] = useState(null);
    const [editor, setEditor] = useState(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        fetchAvatarList();
    }, []);

    const fetchAvatarList = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/getAvatarlist`);
            console.log(response.data);

            // Assuming the response is an array of user objects
            setAvatarList(response.data);
        } catch (error) {
            console.error('Error fetching user list:', error);
        }
    };

    const handleNewAvatarChange = (event) => {
        const file = event.target.files[0];
        setNewAvatar(file);
    };

    const handleUploadAvatar = async () => {
        try {
            const formData = new FormData();
            formData.append('avatar', newAvatar);
            const response = await axios.post(`http://localhost:5000/uploadAvatar`, formData);
            console.log(response.data)

            // Fetch the updated avatar list after the new avatar is uploaded
            fetchAvatarList();
            // Reset the newAvatar state to clear the file input
            setNewAvatar(null);
        } catch (error) {
            console.error('Error uploading avatar:', error);
        }
    };

    const handleDeleteAvatar = async (avatar_id) => {
        try{
            const formData = new FormData();
            formData.append('avatar_id', avatar_id);
            const response = await axios.post(`http://localhost:5000/deleteAvatar`, formData);
            console.log(response)
            // Fetch the updated avatar list after the new avatar is uploaded
            fetchAvatarList();
        }catch (error) {
            console.error('Error deleting avatar:', error);
        }
    }

    return (
        <div className="admin-container">
            <div className="admin-navbar">
                <AdminNavBar/>
            </div>
            <div className="admin-viewavatars-div">
                <h2 className='avatarlist_title'>Avatar List</h2>
                <div className='avatarlist'>          
                    {avatarList.map((avatar) => (
                        <div key={avatar.avatar_id}>
                            {/* Assuming each avatar has an 'imageURL' property */}
                            <img src={avatar.fileURL} alt={`Avatar ${avatar.avatar_id}`} />
                            <button className="avatar_delete_button"  onClick={() => handleDeleteAvatar(avatar.avatar_id)}>
                                X
                            </button>
                        </div>
                    ))}
                </div>

                <div className='admin-addAvatar'>
                    <h2>Add New Avatar</h2>
                    <input type="file" accept="image/*" onChange={handleNewAvatarChange} />
                {newAvatar && (
                    <div>
                        <AvatarEditor
                            ref={(editorInstance) => setEditor(editorInstance)}
                            image={newAvatar}
                            width={120}
                            height={120}
                            border={5}
                            color={[0, 0, 0, 0.6]} // RGBA color for the editor border
                            scale={scale}
                            onImageChange={() => console.log('Image changed')}
                        />
                        <div>
                            <label>Scale:</label>
                            <input
                                type="range"
                                min="1"
                                max="2"
                                step="0.01"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                            />
                        </div>
                        <button onClick={handleUploadAvatar}>Upload Avatar</button>
                    </div>
                )}
                </div>
            </div>
        </div>
    )
};

  
export default AdminViewAvatars;