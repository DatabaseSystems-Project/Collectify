import React,{useState,useEffect} from "react";
import UserNavBar from './UserNavBar.js';
import "../styles/user_mycollection.css";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch} from '@fortawesome/free-solid-svg-icons'

const UserMyCollection = () => {
  const [userCollection, setUserCollection] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  let keyCounter = 0;


  useEffect(() => {
    getCards();
  }, []); // Empty dependency array ensures the effect runs once on mount

  const getCards = () => {
    const token = localStorage.getItem('token');

    // Fetch user's collection data from the server
    axios.get('http://localhost:5000/userCollections', { headers: { Authorization: `Bearer ${token}` },})
      .then(response => {
        setUserCollection(response.data); // Assuming the server responds with an array of collection items
      })
      .catch(error => {
        console.error('Error fetching user collection:', error);
      });
  };



  // Filter the user list based on the search term
  const filteredCollection = userCollection.filter(user =>
    Object.values(user).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );


  const handleCardClick = (cardId) => {
    setSelectedCard(cardId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const Modal = ({ card, onClose, onSell }) => {
    const [sellingPrice, setSellingPrice] = useState(card.price);

    return (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={onClose}>&times;</span>
          <h2>{card.title}</h2>
          <p>{card.description}</p>

          <div className="sell_in_pazar_button">
              {/* Input field for selling price */}
              <label htmlFor="sellingPrice">Enter Selling Price: </label>
                <input
                    type="number"
                    min = {card.price}
                    id="sellingPrice"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                />
              <button onClick={() => onSell(card, sellingPrice)}>Sell in Bazaar</button>
              <button onClick={() => showcaseCard(card)}>Show in Profile</button>
          </div>
          
        
        </div>
      </div>
    );
  };

  const showcaseCard = async (card) => {
    closeModal();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('card_id', card.id);

    const response = await axios.post('http://localhost:5000/setShowcase', formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(response);
  };


  const handleSell = async (card, current_price) => {
    closeModal();
    
    console.log("cardd id");
    console.log(card.id);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('card_id', card.id);
    formData.append('current_price', current_price);
    formData.append('usercards_id', card.usercards_id);

    const response = await axios.post('http://localhost:5000/userSellInPazar', formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(response);
    window.location.reload();
  };


  const cardsByCollection = filteredCollection.reduce((acc, card) => {
    if (!acc[card.collectionName]) {
      acc[card.collectionName] = [];
    }
    acc[card.collectionName].push(card);
    return acc;
  }, {});

  const renderedCollections = Object.keys(cardsByCollection).map(collectionName => (
    <div key={collectionName} className="rendered_cards_container">
      <h2>{collectionName}</h2>
      <div className="rendered_card_container">
        {cardsByCollection[collectionName].map(card => (
          <div key={card.id} className={`user_card user_card_${card.rarity}`} onClick={() => handleCardClick(card)}>
              <div className="user_card_content_collection">
                  <img src={card.fileURL} alt={card.title} className="user_card_img" />
                  <div className="user_card_body">
                    <h4>Card Name</h4>
                    <p className="user_card_title">{card.title}</p>
                    <h4>Collection Name</h4>
                    <p className="user_card_collectionName">{card.collectionName}</p>
                    <h4>Rarity</h4>
                    <p className="user_card_rarity">{card.rarity}</p>
                  </div>
                  <div className="user_card_details">
                    <p className="user_card_description">{card.description}</p>
                  </div>
                </div>
          </div>
        ))}
      </div>
    </div>
  ));
  

  return (
    <div className="user_container">
      <div className="user_navbar">
        <UserNavBar />
      </div>

      <div className="user_mycollection_div">
        <div className="user_search_button_div">
            <input
                  className="mycollections_search_button"
                  type="text"
                  placeholder="Search Cards"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon icon={faSearch} className="icon"/>
          </div>
        {renderedCollections}

        {showModal && (
          <Modal
            card={selectedCard}
            onClose={closeModal}
            onSell={handleSell}
          />
        )}
      </div>
    </div>
  )};
  
  export default UserMyCollection;