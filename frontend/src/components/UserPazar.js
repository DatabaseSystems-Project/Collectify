import React,{useState,useEffect, useRef} from "react";
import UserNavBar from './UserNavBar.js';
import "../styles/user_pazar.css";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch} from '@fortawesome/free-solid-svg-icons'



const UserPazar = () => {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  let keyCounter = 0;

  useEffect(()=>{
    fetchCards();
  },[])


  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("fetched");
      setCards([]);
      const response = await axios.get(`http://localhost:5000/PazarGetAllCardsUser`,{
        headers: { Authorization: `Bearer ${token}` },
      });


      setCards(response.data);
      


    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  // Filter the user list based on the search term
  const filteredCards = cards.filter(user =>
    Object.values(user).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleBuy = async (card_id, user_id, current_price, market_id) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('card_id', card_id);
      formData.append('user_id', user_id);
      formData.append('current_price', current_price);
      formData.append('fixedpricemarket_id', market_id);
  
      // Send a buy request to the server
      const response = await axios.post('http://localhost:5000/userHandleBuyPazar', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response);

      window.location.reload();
    } catch (error) {
      console.error('Error searching for card:', error);
    }
  };

    const cardsByCollection = filteredCards.reduce((acc, card) => {
      if (!acc[card.collectionName]) {
        acc[card.collectionName] = [];
      }
      acc[card.collectionName].push(card);
      return acc;
    }, {});


    const renderedCollections = Object.keys(cardsByCollection).map(collectionName => (
      <div key={keyCounter++} className="rendered_cards_container">
        <h2>{collectionName}</h2>
        <div className="rendered_card_container">
          {cardsByCollection[collectionName].map((card) => (
            <div className={`user_card user_card_${card.rarity}`} key={keyCounter++}>
              <div className="user_card_content">
                <img src={card.fileURL} alt={card.title} className="user_card_img" />
                <div className="user_card_body">
                  <h4>Card Name</h4>
                  <p className="user_card_title">{card.title}</p>
                  <h4>Collection Name</h4>
                  <p className="user_card_collectionName">{card.collectionName}</p>
                </div>
                <div className="user_card_details">
                    <div className="user_card_details_img">
                        <img className="userBazaarAvatar" src={card.avatarURL} alt="User Avatar" />
                        <p className="user_card_username">Username: {card.username}</p>
                    </div>
                  <p className="user_card_description">{card.description}</p>
                </div>
              </div>
              <div className="user_market_buy_button">
                <h4 className="user_card_rarity">{card.rarity}</h4>
                <button className="user_card_price" onClick={() => handleBuy(card && card.id, card && card.user_id, card && card.current_price, card && card.fixedpricemarket_id)}>
                  Buy for ${card.current_price}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));



    return (
      <div className="user_container">
         <div className="user_navbar">
                <UserNavBar/>
          </div>

          <div className="user_market_div">
            <div className="user_search_button_div">
              <input
                    className="mycollections_search_button"
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FontAwesomeIcon icon={faSearch} className="icon"/>
            </div>
            {renderedCollections}
          </div>
          
      </div>
    )
};
  
  export default UserPazar;