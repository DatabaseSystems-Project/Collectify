import React,{useState,useEffect} from "react";
import AdminNavBar from './AdminNavBar.js';
import axios from 'axios';
import "../styles/admin_addcard.css";

const AdminAddCard = () => {

    /* collection */
    const [collections, setCollections] = useState([]);

    /* card infos */
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(""); 
    const [price, setPrice] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [fileURL,setFileURL] = useState("");
    const [collectionName, setCollectionName] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [rarity, setRarity] = useState("");

    useEffect(()=>{
        const fetcaysnc = async () => {
            await fetchCollections();
            };  
        fetcaysnc(); // Call the async function
    },[])

    const fetchCollections = async () => {
        try {
          const response = await axios.get('http://localhost:5000/getCollections', {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          setCollections(response.data);
        } catch (error) {
          console.error(error);
        }
    };
    
    const insertCard = async (card) =>{
        try {
            const formData = new FormData();
            formData.append("image", image);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("previewUrl", previewUrl);
            formData.append("collectionName", collectionName);
            formData.append("quantity", quantity);
            formData.append("rarity", rarity);
        
            const response = await axios.post(`http://localhost:5000/addCard`, formData);
            console.log(response.data)
            
            // Clear the form fields after inserting the card
            setTitle("");
            setDescription("");
            setPrice("");
            setImage(null);
            setPreviewUrl(""); 
            setCollectionName("");
            setQuantity(1);
            setRarity("");
        
            // Reset the file input value to clear it
            document.getElementById("fileInput").value = "";
        
        } catch (error) {
            console.error("Error inserting card:", error);
        }
    };

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        setImage(selectedFile);
        // If you want to preview the image, you can create a URL for the selected file
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const handleIncrement = () => {
        if (quantity >= 0) {
            setQuantity(prevQuantity => prevQuantity + 1);
        }
      };
    
      const handleDecrement = () => {
        if (quantity > 1) {
          setQuantity(prevQuantity => prevQuantity - 1);
        }
      };    

    return (
    <div className="admin-container">

        <div className="admin-navbar">
            <AdminNavBar/>
        </div>
        
        <div className="admin-addcard-div">
            <div className="form_container">
            <div className='form'>
                {/* Close button with a cross sign */}
                <label htmlFor="image" className='form-label'>Image</label>
                <input
                type="file"
                className="form-control"
                placeholder="Choose a file"
                width={150}
                height={150}
                border={50}
                onChange={(e) => { handleImageChange(e); }}
                required
                accept="image/*"
                />

                <label htmlFor="collectionName" className='form-label'>Collection Name</label>
                <select
                className="form-coll-select"
                id="selectedCollection"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                >
                <option value="" disabled> Select a collection </option>
                {collections.map((collection) => ( 
                    <option key={collection.id} value={collection.collectionName}>
                    {collection.collectionName}
                    </option>
                ))}
                </select>

                <label htmlFor="title" className='form-label'>Title</label>
                <input
                type="text"
                className="form-control"
                placeholder="Please Enter title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                />

                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                rows="2"
                className="form-control"
                placeholder="Please Enter Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                />

                <label htmlFor="price" className='form-label'>Price</label>
                <input
                type="number"
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
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    required
                    />
                    <button type="quantity_button" onClick={handleDecrement}>-</button>
                    <button type="quantity_button" onClick={handleIncrement}>+</button>
                </div>
                
                <label htmlFor="rarity" className='form-label'>Rarity</label>
                <select
                className="form-coll-select"
                id="selectedRarity"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                >
                <option value="" disabled> Rarity </option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="legendary">Legendary</option>
                </select>

                <div className='addcard-div'>
                <button onClick={insertCard} className="admin-addcard-button">Add Card</button>
                </div>

            </div>

            <div className='show-prewiewUrl'>
                {previewUrl === "" || previewUrl === null ? "" : (
                <img
                    src={previewUrl}
                    alt=''
                    className="card_show"
                    
                />
                )}
            </div>
            </div>
        </div>
    </div>
    );
};
  
export default AdminAddCard;