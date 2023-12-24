import React,{useState,useEffect} from "react";
import AdminNavBar from './AdminNavBar.js';
import "../styles/admin_home.css";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch} from '@fortawesome/free-solid-svg-icons'


const AdminHome = () => {
    const [cards, setCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null); // Track the selected card for update
    const [updateMode, setUpdateMode] = useState(false);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [isselectedCard, setIsSelectedCard] = useState(false);  
    const [searchTerm, setSearchTerm] = useState("");  

    useEffect(()=>{
        const fetcaysnc = async () => {
            await fetchAllCards(); // Wait for fetchCollections to complete before calling fetchDataAllCards
        };  
        fetcaysnc(); // Call the async function
    },[])

    const fetchAllCards = async () => {
        try {
          //setSelectedCards([]);
          //setSelectedCard([]);
          const response = await axios.get(`http://localhost:5000/getAllCards`);
          setCards(response.data);
        } catch (error) {
          console.error('Error searching for card:', error);
        }
    };

    const handleCardClick = async (cardId) => {
      if (deleteMode) {
        setSelectedCards((prevSelected) => {
          if (prevSelected.includes(cardId)) {
            return prevSelected.filter((id) => id !== cardId);
          } else {
            return [...prevSelected, cardId];
          }
        });
      } else if(updateMode){
        // Select the card for update
        setSelectedCard(cardId);
        try {
          const formData = new FormData();
          formData.append("card_id", cardId);
          console.log("card_id", cardId);
          const response = await axios.post(`http://localhost:5000/getCardbyId`, formData); 
          setSelectedCard(response.data);
          setIsSelectedCard(true);
          setDescription(response.data.description);
          setPrice(response.data.price);
          setQuantity(response.data.quantity);
        } catch (error) {
          console.error('Error searching for card:', error);
        }
      }
    };
  
    const handleDelete = () => {
      setDeleteMode(true);
    };

    const handleDeleteSelected = async () => {
      try {
        const formData = new FormData();
        // Convert the array to a JSON string and append it to FormData
        // Iterate over the selectedCards array and append each card id to the same key
        formData.append('selected_card_ids', JSON.stringify(selectedCards));
        // Send a request to your server to delete the selected cards
        const response = await axios.post("http://localhost:5000/deleteSelectedCards",formData);
        console.log(response.data);
  
        fetchAllCards();
      } catch (error) {
        console.error("Error deleting selected cards:", error);
      }
    };

    const handleCancel = () => {
      setDeleteMode(false);
      setUpdateMode(false);
      setIsSelectedCard(false);
      setSelectedCards([]);
      setSelectedCard([]);
    };

    const handleSelectAll = () => {
      setSelectedCards((prevSelected) =>
        prevSelected.length === cards.length ? [] : cards.map((card) => card.id)
      );
    };

    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', options);
    };

    const handleUpdate = () => {
      setUpdateMode(true);
      setDeleteMode(false);
    };

    const handleAllCards = () => {
      setUpdateMode(false);
      setDeleteMode(false);
      setIsSelectedCard(false);
      fetchAllCards();
    };


    const handleUpdateSelected = async (card) => {
      try {
        const formData = new FormData();
        formData.append("card_id", card.id);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("quantity", quantity);

        const response = await axios.post(`http://localhost:5000/updateCard`, formData);
        console.log(response.data);
        fetchAllCards();
        setSelectedCards([]);
        setSelectedCard([]);
        setIsSelectedCard(false);
      } catch (error) {
        console.error("Error updating card:", error);
      }
    };
  

    const handleDecrement = () => {
      if (quantity > 1) {
        setQuantity(prevQuantity => prevQuantity - 1);
      }
    }; 
    const handleIncrement = () => {
      if (quantity >= 0) {
          setQuantity(prevQuantity => prevQuantity + 1);
      }
    };

    // Filter the admin list based on the search term
    const filteredCards = cards.filter(user =>
      Object.values(user).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    const cardsByCollection = filteredCards.reduce((acc, card) => {
      if (!acc[card.collectionName]) {
        acc[card.collectionName] = [];
      }
      acc[card.collectionName].push(card);
      return acc;
    }, {});

    const renderedCollections = Object.keys(cardsByCollection).map(collectionName => (
      <div key={collectionName} className="scrollable-cards-container-admin">
        <h2 className='collectionNameHeader'>{collectionName}</h2>
        <div className="rendered_card_container">
          {cardsByCollection[collectionName].map((card) => (
           <div className={`admin_Cards_home ${selectedCards.includes(card.id) ? "selected" : ""}`}key={card.id} onClick={() => handleCardClick(card.id)}>
              
              <div className="card__content">
                      {deleteMode && (
                        <input type="checkbox" checked={selectedCards.includes(card.id)} onChange={(e) => e.stopPropagation()} />
                      )}
                      <div className="card__content_left">
                        <img src={card.fileURL} alt=""/>
                      </div>
                      
                      <div className="card__content_right">
                        <h2 className="card__title">{card.title}</h2>
                        <h4 className="card__collectionName">
                          {card.collectionName}
                        </h4>
                        <h4 className="card__price">Price: ${card.price}</h4>
                        <h4 className="card__rarity">Rarity: {card.rarity}</h4>
                        <h4 className="card__quantity">Quantity: {card.quantity}</h4>
                      </div>
              </div>

              <div className="card__body">
                <p className="card__description">{card.description}</p>
                <h3 className="card__date">{formatDate(card.date)}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));


    return (
      <div className="admin-container">
      <div className="admin-navbar">
        <AdminNavBar />
      </div>
  
      <div className="wrapper_admin">
        <div className="bulk-actions">
          {deleteMode || updateMode ? (
            <div>
              {deleteMode ? (
                <>
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedCards.length === cards.length}
                    onChange={handleSelectAll}
                    style={{ opacity: 0 }}
                  />
  
                  <label htmlFor="selectAll">Select All</label>
                  <button onClick={handleDeleteSelected}>Delete Selected</button>
                  <button onClick={handleCancel}>Cancel</button>
                </>
              ) : (
                <>
                  {isselectedCard ? (
                    <button
                      type="button"
                      className="updateSelected_button"
                      onClick={() => handleUpdateSelected(selectedCard)}
                    >
                      Update Card
                    </button>
                  ) : null}
                  <button onClick={handleCancel}>Cancel</button>
                  
                </>
              )}
            </div>
          ) : (
            <div className="header_buttons">
              <button className="delete_before" onClick={handleDelete}>
                Delete
              </button>
              <button className="update_button" onClick={handleUpdate}>
                Update
              </button>
              {searchTerm ? (
                    <button type="button" className="allCards_button" onClick={() => handleAllCards()}>All Cards </button>) : null}
                <input type="text" placeholder=" Search..." className='mycollections_search_button' value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}/>
                <FontAwesomeIcon icon={faSearch} className="icon"/>

            </div>

          )}
        </div>
        
        {searchTerm && renderedCollections.length > 0 ?  (
          renderedCollections
        ):(
          <>
          {!isselectedCard ? (
            <div className="scrollable-cards-container-admin">
              {cards &&
                cards.map((card) => (
                  <div className={`admin_Cards_home ${selectedCards.includes(card.id) ? "selected" : ""}`}key={card.id} onClick={() => handleCardClick(card.id)}>
                    <div className="card__content">
                      {deleteMode && (
                        <input type="checkbox" checked={selectedCards.includes(card.id)} onChange={(e) => e.stopPropagation()} />
                      )}
                      <div className="card__content_left">
                        <img src={card.fileURL} alt=""/>
                      </div>
                      
                      <div className="card__content_right">
                        <h2 className="card__title">{card.title}</h2>
                        <h4 className="card__collectionName">
                          {card.collectionName}
                        </h4>
                        <h4 className="card__price">Price: ${card.price}</h4>
                        <h4 className="card__rarity">Rarity: {card.rarity}</h4>
                        <h4 className="card__quantity">Quantity: {card.quantity}</h4>
                      </div>
                    </div>

                    <div className="card__body">
                      <p className="card__description">{card.description}</p>
                      <h3 className="card__date">{formatDate(card.date)}</h3>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="update-form">
              <div className="update-left-part">
                <h2 className="update_card_title">{selectedCard.title}: {selectedCard.collectionName}</h2>
                <img src={selectedCard.fileURL} alt="" className="update_card_image" />
                <div className="update_card_details">
                  
                  <h4 className="card__price">Price: ${selectedCard.price}</h4>
                  <h4 className="card__rarity">Rarity: {selectedCard.rarity}</h4>
                  <h4 className="card__quantity">Quantity: {selectedCard.quantity}</h4> 
                  <h4 className="card__date">Date: {formatDate(selectedCard.date)}</h4>
                  <p className="update_card_description"><h4>Description:</h4> {selectedCard.description}</p>
                </div>
              </div>

              <div className="update-form-fields">
                <h2 className="update_form_h2">Update Form</h2>
                <h3 style={{ color: "black" }}>Description</h3>
                <textarea
                  rows="7"
                  className="form-control"
                  placeholder="Please Enter Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
    
                <h3 style={{ color: "black" }}>Price</h3>
                <label htmlFor="price" className="form-label"></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Please Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />

                <label htmlFor="quantity" className='form-label'>Quantity</label>
                <div className="quantity-input">
                    <input
                    type="number"
                    className="form-control"
                    placeholder="Please Enter Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    required
                    />
                    <button type="quantity_button" onClick={handleDecrement}>-</button>
                    <button type="quantity_button" onClick={handleIncrement}>+</button>
                </div>
                

              </div>
            </div>
        )}
        </>
        )}         
      </div>
    </div>
    );    
}; 
  
export default AdminHome;