import React, { useState, useEffect } from 'react';
import "../styles/user_auction.css";
import axios from 'axios';
import UserNavBar from './UserNavBar.js';
import Countdown from 'react-countdown';

const UserAuctionPage = () => {
  const [userCollection, setUserCollection] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);


  const [startPrice, setStartPrice] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');


  const [durationDays, setDurationDays] = useState(0);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [bidAmounts, setBidAmounts] = useState({});

  useEffect(() => {
      fetchAllAuctions();
  },[]);
  

  const fetchAllAuctions = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`http://localhost:5000/getAllAuctions` , { headers: { Authorization: `Bearer ${token}` },});
        setAuctions(response.data);
        //console.log(response.data);
        
        // Initialize bidAmounts based on auction data
        const initialBidAmounts = response.data.reduce((acc, auction) => {
          // Parse the currentBid to an integer
          //const currentBid = parseInt(auction.currentBid, 10);
          acc[auction.auctionMarket_id] = auction.currentBid+10;
          return acc;
        }, {});
        setBidAmounts(initialBidAmounts);
      } catch (error) {
        console.error('Error searching for auction:', error);
      }
  };


  function convertToISOFormat(dateString,timeString) {
    const parts = dateString.split(' ');
  
    // Extract date and time parts
    const datePart = parts[0].split('.').reverse().join('-');
  
    // Combine and add seconds
    const isoFormat = `${datePart}T${timeString}:00.000`;
  
    return isoFormat;
  }
  

  const submitForm = async (e) => {
    
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');

    // Check if all duration fields are zero
    if (durationDays === 0 && durationHours === 0 && durationMinutes === 0) {
      setError('Auction duration must be greater than zero.');
      return;
    }
    try {
      // Assuming 'currentDate' is already a Date object or can be converted to a Date object
        let startTime = new Date();
      
        // Add days, hours, and minutes to startTime
        startTime.setDate(startTime.getDate());
        startTime.setHours(startTime.getHours());
        startTime.setMinutes(startTime.getMinutes());

        // Create startTime in your local timezone
        let startTimeTurkey = startTime.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });

        let turkeyTimezoneStart = convertToISOFormat(new Date(startTimeTurkey).toLocaleDateString(),new Date(startTimeTurkey).toLocaleTimeString())
        
        // Create dueDate in your local timezone

        let dueDate = new Date();
      
        // Add days, hours, and minutes to dueDate
        dueDate.setDate(dueDate.getDate() + parseInt(durationDays, 10));
        dueDate.setHours(dueDate.getHours() + parseInt(durationHours, 10));
        dueDate.setMinutes(dueDate.getMinutes() + parseInt(durationMinutes, 10));
        
        let endTimeTurkey = dueDate.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
        let turkeyTimezoneEnd = convertToISOFormat(new Date(endTimeTurkey).toLocaleDateString(),new Date(endTimeTurkey).toLocaleTimeString())
        

        console.log("Start Time turkeey:  ",turkeyTimezoneStart)
        console.log("End Time turkeey:  ",turkeyTimezoneEnd)
        
      
        // Set the timezone for Turkey
        const turkeyTimezone = 'Europe/Istanbul';

        // Get the current date and time in Turkey's timezone
        const currentDatetime = new Date();
        
        // Format the date and time in Turkey's timezone
        const turkey_start_time = currentDatetime.toLocaleString('en-US', {
          timeZone: turkeyTimezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        });

        console.log(turkey_start_time);
    
        console.log(currentDatetime.getDate()+   "+ "+ durationDays);  
        console.log(currentDatetime.getHours()+   "+ "+ durationHours);  
        console.log(currentDatetime.getMinutes()+  "+ "+durationMinutes);  
      
        // Convert days and hours to minutes and add them to the current date
        const totalMinutes = (durationDays * 24 * 60) + (durationHours * 60) + durationMinutes;
        const endDate = new Date(currentDatetime);
        endDate.setMinutes(endDate.getMinutes() + totalMinutes);

        // Format the updated date and time in Turkey's timezone
        const turkey_end_time = endDate.toLocaleString('en-US', {
          timeZone: turkeyTimezone,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        });

        console.log(turkey_end_time);

        
          const formData = new FormData();
          formData.append('startTime', turkeyTimezoneStart);
          formData.append('dueDate', turkeyTimezoneEnd); // Convert to ISO string for proper storage
          formData.append('startPrice', startPrice);
          formData.append('cardId', selectedCard.id);
          formData.append('auctionMarket_id', selectedCard.usercards_id);

          const response = await axios.post('http://localhost:5000/AddNewAuction', formData, { headers: { Authorization: `Bearer ${token}` },});
          console.log(response.data);
          setStartPrice('');
          setDurationDays(0);
          setDurationHours(0);
          setDurationMinutes(0);
          setSelectedCard(null);
          setShowForm(false);
          window.location.reload();
      } catch (error) {
        console.error('Error starting auction:', error);
      }
  };
    
  const openForm = () => {
    const token = localStorage.getItem('token');

    // Fetch user's collection data from the server
    axios.get('http://localhost:5000/userCollections', { headers: { Authorization: `Bearer ${token}` },})
      .then(response => {
        setUserCollection(response.data); // Assuming the server responds with an array of collection items
      })
      .catch(error => {
        console.error('Error fetching user collection:', error);
    });
    setShowForm(true);
  };   
     
  const closeForm = () => {
    setShowForm(false);
  };

  const changeCard = () => {
    setSelectedCard(null);
  };

  const handleCardSelection = (card) => {
    setSelectedCard(card);
    setStartPrice((card.price+1));
    console.log("selected card: ",card);
  };

  const bidAuction = async (auctionMarket_id,currentBid,bid_user_id) => {
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('auctionMarket_id', auctionMarket_id);
        formData.append('currentBid', currentBid); 
        formData.append('bid_user_id', bid_user_id); 

        const response = await axios.post('http://localhost:5000/bidAuction', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchAllAuctions();
        console.log(response);
        window.location.reload();
      } catch (error) {
        console.error('Error starting auction:', error);
      }
  };


  const cancelAuction = async (auctionMarket_id) => {
    try {
      const formData = new FormData();
      formData.append('auctionMarket_id', auctionMarket_id); 

      const response = await axios.post('http://localhost:5000/cancelAuction', formData);
      console.log(response);
      window.location.reload();
    } catch (error) {
      console.error('Error calceling auction:', error);
    }
  };

  const handleBidChange = (auctionId, newBid) => {
    // Update the bid amount for the specified auction
    setBidAmounts((prevBidAmounts) => ({
      ...prevBidAmounts,
      [auctionId]: newBid,
    }));
  };

  

  const endAuction = async (item) => {
    try {
      const formData = new FormData();
      formData.append('card_id', item.card_id); 
      formData.append('auctionMarket_id', item.auctionMarket_id);

      const response = await axios.post('http://localhost:5000/endAuction', formData);
      console.log(response);
      window.location.reload();
    } catch (error) {
      console.error('Error ending auction:', error);
    }
  };

  const showAuctionCard = (auction) => {

    //console.log("id: ",auction.auctionMarket_id,"  date : ",new Date(auction.endingDate));
    // Assuming the time zone is 'UTC' for illustration purposes   
    return (
      <Countdown
        owner={auction.user_id}
        date={new Date(auction.endingDate)}
        bidAuction={() => bidAuction()}
        endAuction={() => endAuction(auction)}
        item={auction}
        renderer={renderer}
      />
    );
  };
  
  const renderer = ({ days, hours, minutes, seconds, completed, props }) => {
      if (completed) {
        endAuction(props.item)
        return null;
      }
      return (
          <div className={`card auctionCard user_card_${props.item.rarity}`}>
            <p className="display-5">Current Bid: ${props.item.currentBid}</p>
            <p className="display-6">Bid Owner: {props.item.username}</p>
            <div className="card_auction_time">
                <h5>
                  {days} day: {hours} hr: {minutes} min: {seconds} sec
                </h5>
              </div> 
            <p className="card_auction_title">{props.item.title}</p>
            <p className="card_auction_collection">{props.item.collectionName}</p>
            <p className="card_auction_collection">{props.item.rarity}</p>
            <img className='selectedCard_img' src={props.item.fileURL} alt=""/>
            {/*<div
              style={{
                height: '150px',
                backgroundImage: `url(${props.item.fileURL})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                radius: '5px',
              }}
              className="w-100"
            />  */}

            <div className="card_auction_body">
              <div>
                {!(props.item.user_id === props.item.current_user_id)? ( 
                  <div className='bid_progressbar'>
                    <div>
                      <label className='bid_amount' htmlFor={`bidSlider-${props.item.auctionMarket_id}`}>Bid Amount: ${bidAmounts[props.item.auctionMarket_id]}</label>
                        <input
                          type="range"
                          id={`bidSlider-${props.item.auctionMarket_id}`}
                          min={props.item.currentBid+10}
                          max={props.item.balance}
                          step={1}
                          value={bidAmounts[props.item.auctionMarket_id]}
                          onChange={(e) => handleBidChange(props.item.auctionMarket_id, parseInt(e.target.value, 10))}
                        />
                    </div>
                    <div onClick={() => bidAuction(props.item.auctionMarket_id, bidAmounts[props.item.auctionMarket_id],props.item.current_user_id)} className="btn btn-outline-secondary bid_button">
                      Bid
                    </div>
                  </div>
                ) : props.owner === props.item.user_id ? (
                  <div
                    onClick={() => cancelAuction(props.item.auctionMarket_id)}
                    className="btn btn-outline-secondary cancel_auction cancel_button"
                  >
                    Cancel Auction
                  </div>
                ):(null)}
              </div>
            </div>
          </div>
      );
    };


  return (
    <div className="user_container">

      <div className="user_navbar">
        <UserNavBar />
      </div>

      <div className='user_auction_div'>
        <div className="auctionButton">
          <div onClick={openForm} className="start-auction-button">
            Add to Auction
          </div>
        </div>

        {/* Display the form conditionally based on the state */}
        {showForm && selectedCard &&(
          <form className='Form' onSubmit={submitForm}>
            {selectedCard && (
              <div className='selectedCard'>
                <div className='selectedCard_left'>
                  <img className='selectedCard_img' src={selectedCard.fileURL} alt="" style={{ maxWidth: '10%' }} /><br />
                </div>
                <div className='selectedCard_right'>
                  <strong className="selectedCard_title">Card Title :&nbsp;&nbsp;{selectedCard.title}</strong>
                  <strong className="selectedCard_Price">Card Price :&nbsp;&nbsp;${selectedCard.price}</strong>    
                
                  <label className='selectedCard_startprice'>
                    <strong className="selectedCard_title">Start Price : &nbsp;</strong>
                    <input type="number"  min={selectedCard.price} value={startPrice} onChange={(e) => setStartPrice(e.target.value)} required />
                  </label>
                   
                   
                  <strong className="selectedCard_auction">Auction Duration</strong>
                  <div className="selectedCard_Duration">
                    <label className='selectedCard_counter'>
                      Days :
                      <input type="number" min="0" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required />
                    </label>
                    <label className='selectedCard_counter'>
                      Hours :
                      <input type="number" min="0" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} required />
                    </label>
                    <label className='selectedCard_counter'>
                      Minutes :
                      <input type="number" min="0" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
                    </label>
                  </div>
                </div>
              </div>
            )}
              {/* Display the error message */}
              {error && <div className="error-message">{error}</div>}
              <div>
                <button type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit">
                  Submit
                </button>
                <button type="button" onClick={changeCard}>
                  Change
                </button>
              </div>
            </form>
        )}

        {/* Display the user's cards only when the auction button is pressed */}
        {showForm && !selectedCard &&(
          <div className="card-list-window">
            {userCollection.map(card => (
              <div key={card.usercards_id} className= "cardd" onClick={() => handleCardSelection(card)}>
              <div className={`card_content user_card_${card.rarity}`}> 
                <h2 className="auctionUI_title">{card.title}</h2>
                <img src={card.fileURL} alt="" className="card__img" />
                <div className="card_details">
                  <h3 className="auctionUI_collectionName">{card.collectionName}</h3>
                    <div className='card_details_pr'>             
                      <div>
                      <h3 className="auctionUI_price">${card.price}</h3> 
                      </div>
                      <div>
                      <h3 className="auctionUI_rarity">{card.rarity}</h3> 
                      </div> 
                    </div>
                </div>
              </div>
            </div>
            ))}  
          </div>
        )}
        
        {!showForm && auctions && (
          <div className="rendered_card_container auction__container">
            {auctions.map((auction) => (
              <div className="cards_in_auction" key={auction.auctionMarket_id}>
                {/* console.log('Auction:', auction) */}
                <>
                  {showAuctionCard(auction)}
                </>
              </div>
            ))}
          </div>
        )}
       </div> 
      
    </div>
  );
};

export default UserAuctionPage;

