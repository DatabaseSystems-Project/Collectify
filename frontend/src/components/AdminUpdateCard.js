import React, { useState, useEffect } from "react";
import UserNavBar from './UserNavBar.js';
import "../styles/user_home.css";
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const AdminUpdateCard = (props) => {

  // Use useLocation hook to get location object
  const location = useLocation();
  // Access the state object to get the selectedCard data
  const selectedCard = location.state?.cardId || null;
  console.log("selected cardddd: ", selectedCard);

  
  const [description, setDescription] = useState(selectedCard.description);
  const [price, setPrice] = useState(selectedCard.price);

  

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="user_container">
      <div className="user_navbar">
        <UserNavBar />
      </div>
      <div className="user_home_div">
        <div className="update-card-container">
          <div className="selected-card">
            {selectedCard && (
              <>
                <div className="card__content">
                  <img src={selectedCard.fileURL} alt="" className="card__img" />
                  <div className="card__details">
                    <h2 className="card__title">{selectedCard.title}</h2>
                    <h3 className="card__collectionName">{selectedCard.collectionName}</h3>
                    <h3 className="card__price">$ {selectedCard.price}</h3>
                    <h3 className="card__rarity">{selectedCard.rarity}</h3>
                    <h3 className="card__quantity">{selectedCard.quantity}</h3>
                  </div>
                </div>
                <div className="card__body">
                    <p className="card__description">{selectedCard.description}</p>
                    <h3 className="card__date">{formatDate(selectedCard.date)}</h3>
                </div>
              </>
            )}
          </div>
          <div className="update-form">
            <h2 className="update-form">Update Form</h2>
            <h2 className="card__title">{selectedCard.title}</h2>
            <h3  style={{color: 'black' }} className="card__collectionName">{selectedCard.collectionName}</h3>
            
            <h3  style={{color: 'black' }} >Description</h3>
            <textarea
              rows="2"
              className="form-control"
              placeholder="Please Enter Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            
            <h3  style={{color: 'black' }}>Price</h3>
            <label htmlFor="price" className='form-label'>Price</label>
            <input
              type="text"
              className="form-control"
              placeholder="Please Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdateCard;
