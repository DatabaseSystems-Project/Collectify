from flask import Flask, render_template, url_for, request, redirect, jsonify, make_response, session, Response
from datetime import datetime, timedelta
import mysql.connector # mysql
import tables
from flask_cors import CORS
import boto3, botocore
import os
import uuid
from werkzeug.utils import secure_filename
import threading
import json
import jwt
import time
import configparser


app = Flask(__name__) 
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'default_secret_key')

#app.secret_key = os.urandom(24)
CORS(app)

#CORS(app)
tables.create_database()

# MySQL database configuration

config = configparser.ConfigParser()
config.read('config.ini')

# Accessing values
db_config = {
    'host': config.get('database', 'host'),
    'user': config.get('database', 'user'),
    'password': config.get('database', 'password'),
    'database': config.get('database', 'database'),
    'port': config.getint('database', 'port'),
}
# Create a MySQL connection
db_connection = mysql.connector.connect(**db_config)
cursor = db_connection.cursor()

db_connection = mysql.connector.connect(**db_config)
cursor = db_connection.cursor()

# Create a lock to control access to the database
db_lock = threading.Lock()

app.config['S3_BUCKET'] = config.get('s3', 'S3_BUCKET')
app.config['S3_KEY'] = config.get('s3', 'S3_KEY')
app.config['S3_SECRET'] = config.get('s3', 'S3_SECRET')
app.config['S3_LOCATION'] = 'http://{}.s3.amazonaws.com/'.format(app.config['S3_BUCKET'])

try:
    s3 = boto3.client('s3',
        aws_access_key_id=app.config['S3_KEY'],
        aws_secret_access_key=app.config['S3_SECRET']
    )
except Exception as e:
    print(f"Error connecting to S3: {e}")



def checkToken(decoded_token):
    # Check if the token is still valid
    expiration_time = decoded_token.get('exp', 0)
    current_time = datetime.utcnow().timestamp()

    if current_time > expiration_time:
        print("Token has expired. Redirecting to login page or refreshing token.")
        
    else:
        print("Token is still valid. Proceed with the request.")



################################################################################################################  
##################### USER ######################### USER ########################## USER ######################
################################################################################################################   
@app.route("/userNavbarInfo", methods=["GET"])
def userNavbarInfo():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    
    try:
        # Acquire the lock
        db_lock.acquire()

        # Decode the token to retrieve user information
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]

        checkToken(data)

        if user_id: 
            query = """
                SELECT avatars.fileURL
                FROM avatars
                JOIN usersprofiles ON avatars.avatar_id = usersprofiles.avatar_id
                WHERE usersprofiles.user_id = %s
            """
            cursor.execute(query, (user_id,))
            # Fetch the result
            fileURL = cursor.fetchone()

            select_query = """
                    select username, balance, score 
                    from usersprofiles 
                    where user_id = %s
                """
            cursor.execute(select_query, (user_id,))
            user = cursor.fetchone()

            user_info = {
                'avatarURL': fileURL[0],
                'username': user[0],
                'balance': user[1],
                'score': user[2],
            }

            return jsonify(user_info)
            
        return jsonify({'message': 'Error processing the request'}), 500
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/getLeaderboard", methods=["GET"])
def getLeaderboard():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    
    try:
        # Acquire the lock
        db_lock.acquire()
        # Decode the token to retrieve user information
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)
          
        query = """
            SELECT *
            FROM usersprofiles
            ORDER BY score DESC;
        """
        cursor.execute(query)
        # Fetch the result
        users = cursor.fetchall()
        

        result = []
        for user in users:
            query = """
                SELECT avatars.fileURL
                FROM avatars
                JOIN usersprofiles ON avatars.avatar_id = usersprofiles.avatar_id
                WHERE usersprofiles.user_id = %s
            """
            cursor.execute(query, (user[1],))
            # Fetch the result
            fileURL = cursor.fetchone()

            cursor.execute("SELECT fileURL FROM cards WHERE card_id = %s", (user[8],))
            cardshowcase = cursor.fetchone()

            result.append({
                'profile_id': user[0],
                'user_id': user[1], 
                'email': user[2],
                'username': user[3],
                'date': user[4].isoformat(),
                'avatar_id': user[5],
                'balance': user[6],
                'score': user[7],
                'showcase_cardURL': cardshowcase[0] if cardshowcase and cardshowcase[0] else None,
                'avatarURL': fileURL[0] if user[0] else None,
            })
           
        return jsonify(result)
        
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()
        

# --------------------------------------------------------------------------------------------------------------------------------     

@app.route("/userProfileInfo", methods=["GET"])
def userProfileInfo():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    
    try:
        # Acquire the lock
        db_lock.acquire()

        """
        user_id = session.get('user_id')
        print(user_id)
        print("session:")
        print(session)
        """
        # Decode the token to retrieve user information
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]

        checkToken(data)
        
        if user_id: 
            query = """
                SELECT avatars.fileURL
                FROM avatars
                JOIN usersprofiles ON avatars.avatar_id = usersprofiles.avatar_id
                WHERE usersprofiles.user_id = %s
            """
            cursor.execute(query, (user_id,))
            # Fetch the result
            fileURL = cursor.fetchone()
            
            select_query = 'SELECT profile_id,user_id,email,username,date,avatar_id,balance,score,showcase_card FROM usersprofiles WHERE user_id = %s'
            cursor.execute(select_query, (user_id,))
            user = cursor.fetchone()
            
            # Retrieve card details and user balance
            cursor.execute("SELECT fileURL FROM cards WHERE card_id = %s", (user[8],))
            cardshowcase = cursor.fetchone()
            
            if user:
                user_info = {
                    'profile_id': user[0],
                    'user_id': user[1], 
                    'email': user[2],
                    'username': user[3],
                    'date': user[4].isoformat(),
                    'avatar_id': user[5],
                    'balance': user[6],
                    'score': user[7],
                    'showcase_cardURL': cardshowcase if cardshowcase else None,
                    'avatarURL': fileURL[0] if user[0] else None,
                }
                return jsonify(user_info)
            
        return jsonify({'message': 'Error processing the request'}), 500
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
def increaseScore(user_id, card_id):
    cursor.execute("SELECT rarity FROM cards WHERE card_id = %s", (card_id,))
    rarity = cursor.fetchone()[0]
    # Define the score values for each rarity
    rarity_scores = {
        'common': 5,
        'uncommon': 15,
        'rare': 50,
        'legendary': 150
    }
    # Fetch the current score from the database
    cursor.execute("SELECT score FROM usersprofiles WHERE user_id = %s", (user_id,))
    old_score = cursor.fetchone()[0]
    # Get the score to be added based on the rarity
    score_increment = rarity_scores.get(rarity, 0)
    # Calculate the new score
    new_score = old_score + score_increment


    # Update the score in the database
    cursor.execute("UPDATE usersprofiles SET score = %s WHERE user_id = %s", (new_score, user_id))
    db_connection.commit()
    

def decreaseScore(user_id, card_id):
    cursor.execute("SELECT rarity FROM cards WHERE card_id = %s", (card_id,))
    rarity = cursor.fetchone()[0]
    # Define the score values for each rarity
    rarity_scores = {
        'common': -5,
        'uncommon': -15,
        'rare': -50,
        'legendary': -150
    }
    # Fetch the current score from the database
    cursor.execute("SELECT score FROM usersprofiles WHERE user_id = %s", (user_id,))
    old_score = cursor.fetchone()[0]
    # Get the score to be added based on the rarity
    score_increment = rarity_scores.get(rarity, 0)
    # Calculate the new score
    new_score = old_score + score_increment
    cursor.execute("UPDATE usersprofiles SET score = %s WHERE user_id = %s", (new_score, user_id))
    db_connection.commit()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/userHandleBuy", methods=["POST"])
def userHandleBuy():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        # Retrieve form data
        card_id = request.form.get('card_id')

        # Retrieve card details and user balance
        cursor.execute("SELECT * FROM cards WHERE card_id = %s", (card_id,))
        card = cursor.fetchone()

        cursor.execute("SELECT balance FROM usersprofiles WHERE user_id = %s", (user_id,))
        user_balance = cursor.fetchone()[0]

    
        # Check if the user has enough balance to buy the card
        card_price = card[3] 
        if user_balance < card_price:
            return jsonify({'message': 'Insufficient balance'}), 400
        
        card_quantity = card[10] 
        if card_quantity < 1:
            return jsonify({'message': 'Insufficient card quantity'}), 400


        # Update user balance
        new_balance = user_balance - card_price
        cursor.execute("UPDATE usersprofiles SET balance = %s WHERE user_id = %s", (new_balance, user_id))

        # Save the card to the user's cards
        cursor.execute("INSERT INTO usercards (user_id, card_id) VALUES (%s, %s)", (user_id, card_id))

        # Decrease card quantity in the cards table
        new_quantity = card[10] - 1
        cursor.execute("UPDATE cards SET quantity = %s WHERE card_id = %s", (new_quantity, card_id))
        db_connection.commit()


        increaseScore(user_id, card_id)
        

        # GET UPDATED INFO
        select_query = 'SELECT * FROM cards'
        cursor.execute(select_query)
        cards = cursor.fetchall()
        
        result = []
        for card in cards:
            result.append({
                'id': card[0],
                'title': card[1], 
                'description': card[2],
                'price': card[3],
                'date': card[4].isoformat(),
                'filename': card[5],  
                'fileURL': card[6],
                'filepath': card[7],
                'collectionName': card[8],
                'rarity': card[9],
                'quantity': card[10] if card[0] else None,
            })
        #handle_message()
        # Notify clients about the updated card information using WebSocket
        #socketio.emit('cardInfoUpdated', json.dumps({'cards': result}), namespace='/')
        return jsonify(result),200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------

@app.route("/userHandleBuyPazar", methods=["POST"])
def userHandleBuyPazar():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        # Retrieve form data
        card_id = request.form.get('card_id')
        card_owner_user_id = request.form.get('user_id')
        current_price = request.form.get('current_price')
        fixedpricemarket_id = request.form.get('fixedpricemarket_id')

        # Retrieve card details and user balance
        cursor.execute("SELECT * FROM cards WHERE card_id = %s", (card_id,))
        card = cursor.fetchone()

        cursor.execute("SELECT balance FROM usersprofiles WHERE user_id = %s", (user_id,))
        user_balance = cursor.fetchone()[0]
    

        float_number=float(current_price)
        float_number2=float(user_balance)
        # Check if the user has enough balance to buy the card
        if float_number2 < float_number:
            return jsonify({'message': 'Insufficient balance'}), 400
        

        # Update user balance
        new_balance = float_number2 - float_number
        cursor.execute("UPDATE usersprofiles SET balance = %s WHERE user_id = %s", (new_balance, user_id))

        if int(card_owner_user_id) != int(user_id):
            cursor.execute("SELECT balance FROM usersprofiles WHERE user_id = %s", (card_owner_user_id,))
            card_owner_user_balance = cursor.fetchone()[0]
            float_number3=float(card_owner_user_balance)
            new_balance2 = float_number3 + float_number
            cursor.execute("UPDATE usersprofiles SET balance = %s WHERE user_id = %s", (new_balance2, card_owner_user_id))


        # Save the card to the user's cards
        cursor.execute("INSERT INTO usercards (user_id, card_id) VALUES (%s, %s)", (user_id, card_id))
        
        # Commit the changes to the database
        db_connection.commit()


        # Delete the card from the database
        delete_query = 'DELETE FROM fixedPriceMarket WHERE fixedpricemarket_id = %s'
        cursor.execute(delete_query, (fixedpricemarket_id,))
        db_connection.commit()

        
        increaseScore(user_id, card_id)

        # GET UPDATED INFO
        select_query = 'SELECT * FROM cards'
        cursor.execute(select_query)
        cards = cursor.fetchall()
        
        result = []
        for card in cards:
            result.append({
                'id': card[0],
                'title': card[1], 
                'description': card[2],
                'price': card[3],
                'date': card[4].isoformat(),
                'filename': card[5],  
                'fileURL': card[6],
                'filepath': card[7],
                'collectionName': card[8],
                'rarity': card[9],
                'quantity': card[10] if card[0] else None,
            })
        #handle_message()
        # Notify clients about the updated card information using WebSocket
        #socketio.emit('cardInfoUpdated', json.dumps({'cards': result}), namespace='/')
        return jsonify(result),200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------

@app.route("/userCollections", methods=["GET"])
def userCollections():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        query = """
            SELECT u.usercards_id, c.card_id, c.title, c.description, c.price,
                c.date, c.filename, c.fileURL, c.filepath,
                c.collectionName, c.rarity, c.quantity
            FROM usercards u
            JOIN cards c ON u.card_id = c.card_id
            WHERE u.user_id = %s
            ORDER BY c.price DESC, c.card_id ASC
        """

        cursor.execute(query, (user_id,))
        results = cursor.fetchall()


        formatted_results = [
            {
                'usercards_id': result[0],
                'id': result[1],
                'title': result[2],
                'description': result[3],
                'price': result[4],
                'date': result[5].isoformat(),
                'filename': result[6],
                'fileURL': result[7],
                'filepath': result[8],
                'collectionName': result[9],
                'rarity': result[10],
                'quantity': result[11] if result[1] else None,
            }
            for result in results
        ]

        return jsonify(formatted_results)

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/userSellInPazar", methods=["POST"])
def userSellInPazar():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        card_id = request.form.get('card_id')
        current_price = request.form.get('current_price')
        usercards_id = request.form.get('usercards_id')

        insert_query = 'INSERT INTO fixedPriceMarket (card_id,user_id,currentPrice) VALUES (%s, %s,%s)'
        data = (card_id,user_id,current_price)
        cursor.execute(insert_query, data)
        db_connection.commit()



        # Delete the card from user collection
        delete_query = 'DELETE FROM usercards WHERE usercards_id = %s'
        cursor.execute(delete_query, (usercards_id,))
        db_connection.commit()


        select_query = 'SELECT showcase_card FROM usersprofiles where user_id = %s'
        cursor.execute(select_query, (user_id,))
        showcase_card = cursor.fetchone()[0]    



        if  showcase_card != None  and (int(showcase_card) == int(card_id)):
            update_query = 'UPDATE usersprofiles SET showcase_card = NULL where user_id = %s'
            data = (user_id,)
            cursor.execute(update_query, data)
            db_connection.commit()


        decreaseScore(user_id, card_id)

        return jsonify({'success': True}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/PazarGetAllCardsUser", methods=["GET"])
def pazar_get_All_cards_User():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)
        
        
        select_query = """
            SELECT f.*, c.price
            FROM fixedPriceMarket f
            JOIN cards c ON f.card_id = c.card_id
            ORDER BY c.price ASC
        """
        cursor.execute(select_query)
        pazarcards = cursor.fetchall()
        

        result = []
        for x in pazarcards:
            select_query = 'SELECT * FROM usersprofiles where user_id = %s'
            cursor.execute(select_query, (x[1],))
            user = cursor.fetchone()

            select_query = 'SELECT * FROM cards where card_id = %s'
            cursor.execute(select_query, (x[0],))
            card = cursor.fetchone()

            select_query = 'SELECT fileURL FROM avatars where avatar_id = %s'
            cursor.execute(select_query, (user[5],))
            avatarURL = cursor.fetchone()

            current_price = x[2]
            fixedpricemarket_id = x[3]

            result.append({
                'fixedpricemarket_id': fixedpricemarket_id,
                'current_price': current_price,
                'user_id': user[1],
                'username': user[3],
                'avatarURL': avatarURL,
                'id': card[0],
                'title': card[1], 
                'description': card[2],
                'price': card[3],
                'date': card[4].isoformat(),
                'filename': card[5],  
                'fileURL': card[6],
                'filepath': card[7],
                'collectionName': card[8],
                'rarity': card[9],
                'quantity': card[10] if card[0] else None,
            })
        return jsonify(result)

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/getAllCardsUser", methods=["GET"])
def get_All_cards_User():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)
        
        
        select_query = 'SELECT * FROM cards where quantity > 0 order by price'
        cursor.execute(select_query)
        cards = cursor.fetchall()
        
        result = []
        for card in cards:
            result.append({
                'id': card[0],
                'title': card[1], 
                'description': card[2],
                'price': card[3],
                'date': card[4].isoformat(),
                'filename': card[5],  
                'fileURL': card[6],
                'filepath': card[7],
                'collectionName': card[8],
                'rarity': card[9],
                'quantity': card[10] if card[0] else None,
            })
        return jsonify(result)

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/AddNewAuction", methods=["POST"])
def add_Auction():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)
        
        # Retrieve form data
        startTime = request.form.get('startTime')
        dueDate = request.form.get('dueDate')
        

        startPrice = request.form.get('startPrice')
        startPrice = float(startPrice)
        
        card_id = request.form.get('cardId')
        auctionMarket_id = request.form.get('auctionMarket_id')

          
        select_query = 'SELECT * FROM cards where card_id = %s'
        cursor.execute(select_query, (card_id,))
        card_by_id = cursor.fetchone()
        
        
        if startPrice < card_by_id[3]:
            return jsonify({'message': 'Start Price can not be smaller than card\'s price'}), 400


        pieces = startTime.split('-')
        
        if len(pieces[0])==4:
            insert_query = 'INSERT INTO auctionMarket (auctionMarket_id,card_id,user_id,startingDate,endingDate,startingPrice,currentBid,bid_user_id) VALUES (%s, %s, %s,%s, %s, %s, %s, %s)'
            data = (auctionMarket_id,card_id,user_id,startTime,dueDate,startPrice,startPrice,user_id)
            cursor.execute(insert_query, data)
            db_connection.commit()         
        
        else: 
            # Remove the last three characters (milliseconds) from the timestamp strings
            startTime = startTime[:-4]
            dueDate = dueDate[:-4]

            # Convert strings to datetime objects
            startTime = datetime.strptime(startTime, "%m/%d/%YT%I:%M:%S %p:%f")
            dueDate = datetime.strptime(dueDate, "%m/%d/%YT%I:%M:%S %p:%f")

            # Assuming startTime and dueDate are datetime objects
            formatted_start_time = startTime.strftime('%Y-%m-%d %H:%M:%S')
            formatted_due_date = dueDate.strftime('%Y-%m-%d %H:%M:%S')

            
            insert_query = 'INSERT INTO auctionMarket (auctionMarket_id,card_id,user_id,startingDate,endingDate,startingPrice,currentBid,bid_user_id) VALUES (%s, %s, %s,%s, %s, %s, %s, %s)'
            data = (auctionMarket_id,card_id,user_id,formatted_start_time,formatted_due_date,startPrice,startPrice,user_id)
            cursor.execute(insert_query, data)
            db_connection.commit()
        
        delete_query = 'delete from usercards where usercards_id = %s'
        cursor.execute(delete_query, (auctionMarket_id,))
        db_connection.commit()    

        select_query = 'SELECT showcase_card FROM usersprofiles where user_id = %s'
        cursor.execute(select_query, (user_id,))
        showcase_card = cursor.fetchone()[0]    

        if  showcase_card != None  and (int(showcase_card) == int(card_id)):
            update_query = 'UPDATE usersprofiles SET showcase_card = NULL where user_id = %s'
            data = (user_id,)
            cursor.execute(update_query, data)
            db_connection.commit()


        decreaseScore(user_id,card_id)


        """
        select_query = 'SELECT * FROM auctionMarket ORDER BY auctionMarket_id DESC LIMIT 1'
        cursor.execute(select_query)
        last_added_card = cursor.fetchone()

        # Now 'last_added_card' contains the data of the last added card
        print(last_added_card)
        
        if last_added_card:
        """
        return jsonify({'message': 'succesfull.'})

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/getAllAuctions", methods=["GET"])
def get_All_Auctions():
    
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)
             
        select_query = 'SELECT * FROM auctionMarket'
        cursor.execute(select_query)
        auctions = cursor.fetchall()      
        
        result = []

        for auction in auctions:
            select_query = 'SELECT * FROM cards where card_id = %s'
            cursor.execute(select_query, (auction[1],))
            card = cursor.fetchone()
            
            select_query = 'SELECT * FROM usersprofiles where user_id = %s'
            cursor.execute(select_query, (auction[7],))
            user = cursor.fetchone()
            
            select_query = 'SELECT balance FROM usersprofiles where user_id = %s'
            cursor.execute(select_query, (user_id,))
            mebalance = cursor.fetchone()[0]
            
            result.append({
                'auctionMarket_id': auction[0],
                'card_id': auction[1],
                'user_id': auction[2], 
                'startingDate': auction[3].isoformat(),
                'endingDate': auction[4].isoformat(),
                'startingPrice': auction[5],
                'currentBid': auction[6],  
                'bid_user_id': auction[7],
                'id': card[0],
                'title': card[1], 
                'description': card[2],
                'price': card[3],
                'date': card[4].isoformat(),
                'filename': card[5],  
                'fileURL': card[6],
                'filepath': card[7],
                'collectionName': card[8],
                'rarity': card[9],
                'quantity': card[10],
                'current_user_id':user_id,
                'username':user[3],
                'balance':mebalance if auction[0] else None,
            })
        return jsonify(result) 
        
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()
        
        
# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/bidAuction", methods=["POST"])
def bidAuction():
    try:
        tokenn = request.headers.get('Authorization').split(' ')[1]
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        # Acquire the lock
        db_lock.acquire()
        auctionMarket_id = request.form.get('auctionMarket_id')
        currentBid = request.form.get('currentBid')
        bid_user_id = request.form.get('bid_user_id')

        update_query = 'UPDATE auctionMarket SET currentBid = %s where auctionMarket_id = %s'
        data = (currentBid,auctionMarket_id)
        cursor.execute(update_query, data)
        db_connection.commit()
        
        update_query = 'UPDATE auctionMarket SET bid_user_id = %s where auctionMarket_id = %s'
        data = (user_id,auctionMarket_id)
        cursor.execute(update_query, data)
        db_connection.commit()
       
        return jsonify({'success': True}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()



# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/cancelAuction", methods=["POST"])
def cancelAuction():
    try:
        # Acquire the lock
        db_lock.acquire()
        auctionMarket_id = request.form.get('auctionMarket_id')
        
        
        select_query = 'SELECT * FROM auctionMarket where auctionMarket_id = %s'
        cursor.execute(select_query,(auctionMarket_id,))
        card = cursor.fetchone()
       
         
        insert_query = 'insert into usercards (user_id,card_id,usercards_id) values (%s,%s,%s)'
        data = (card[2],card[1],card[0])
        cursor.execute(insert_query, data)
        db_connection.commit()

        increaseScore(card[2],card[1])

        delete_query = 'delete from auctionMarket where auctionMarket_id = %s'
        cursor.execute(delete_query, (auctionMarket_id,))
        db_connection.commit()
       
        return jsonify({'success': True}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/endAuction", methods=["POST"])
def endAuction():
    try:
        # Acquire the lock
        db_lock.acquire()
        
        card_id = request.form.get('card_id')
        auctionMarket_id = request.form.get('auctionMarket_id')
        

        select_query = 'SELECT bid_user_id, user_id, currentBid FROM auctionMarket where auctionMarket_id = %s'
        cursor.execute(select_query,(auctionMarket_id,))
        query = cursor.fetchone()


        if query is None:
            # Handle the case where no records were found
            return jsonify({'message': 'Auction not found'}), 404
        else:
            bid_user_id = query[0]
            user_id = query[1]
            currentBid = query[2]


            cursor.execute("SELECT balance FROM usersprofiles WHERE user_id = %s", (bid_user_id,))
            user_balance = cursor.fetchone()[0]

            float_number=float(currentBid)
            float_number2=float(user_balance)

            if float_number2 < float_number:
                return jsonify({'message': 'Insufficient balance'}), 400

            new_balance = float_number2 - float_number
            cursor.execute("UPDATE usersprofiles SET balance = %s WHERE user_id = %s", (new_balance, bid_user_id))
            
            cursor.execute("SELECT balance FROM usersprofiles WHERE user_id = %s", (user_id,))
            card_owner_user_balance = cursor.fetchone()[0]
            float_number3=float(card_owner_user_balance)
            new_balance2 = float_number3 + float_number
            cursor.execute("UPDATE usersprofiles SET balance = %s WHERE user_id = %s", (new_balance2, user_id))


            
            insert_query = 'insert into usercards (user_id,card_id,usercards_id) values (%s,%s,%s)'
            data = (bid_user_id,card_id,auctionMarket_id)
            cursor.execute(insert_query, data)
            db_connection.commit()
            
            delete_query = 'delete from auctionMarket where auctionMarket_id = %s'
            cursor.execute(delete_query, (auctionMarket_id,))
            db_connection.commit()

            increaseScore(bid_user_id,card_id)
            
            return jsonify({'success': True}), 200
        
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()



# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/setShowcase", methods=["POST"])
def setShowcase():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        card_id = request.form.get('card_id')

        update_query = 'UPDATE usersprofiles SET showcase_card = %s where user_id = %s'
        data = (card_id,user_id)
        cursor.execute(update_query, data)
        db_connection.commit()
       
        return jsonify({'success': True}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/setAvatar", methods=["POST"])
def setAvatar():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)

        avatar_id = request.form.get('avatar_id')


        update_query = 'UPDATE usersprofiles SET avatar_id = %s where user_id = %s'
        data = (avatar_id,user_id)
        cursor.execute(update_query, data)
        db_connection.commit()
       
        return jsonify({'success': True}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/getAvatars", methods=["GET"])
def getAvatars():
    try:
        # Acquire the lock
        db_lock.acquire()
               
        select_query = 'SELECT * FROM avatars'
        cursor.execute(select_query)
        avatars = cursor.fetchall()
        
        
        result = []
        for avatar in avatars:
            result.append({
                'avatar_id': avatar[0],
                'fileURL': avatar[1],
            })
        return jsonify(result)

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/dailySpin", methods=["POST"])
def dailySpin():
    tokenn = request.headers.get('Authorization').split(' ')[1]
    try:
        # Acquire the lock
        db_lock.acquire()
        data = jwt.decode(tokenn, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = data['user_id'][0]
        checkToken(data)
        

        wheelPrice = request.form.get('wheelPrice')
        
        # Fetch the current score from the database
        cursor.execute("SELECT balance FROM usersprofiles WHERE user_id = %s", (user_id,))
        old_balance = cursor.fetchone()[0]
        # Calculate the new score
        new_balance = float(old_balance) + float(wheelPrice)
    
        update_query = "UPDATE usersprofiles SET balance = %s WHERE user_id = %s"
        data = (new_balance,user_id)
        cursor.execute(update_query, data)
        db_connection.commit()

        return jsonify({'success': True}), 200
        
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()




################################################################################################################  
##################### ADMIN ######################### ADMIN ######################### ADMIN ####################
################################################################################################################     
# ------------------------------------------ CARDS ------------------------------------------
@app.route("/getAllCards", methods=["GET"])
def get_All_cards():
    
    try:
        # Acquire the lock
        db_lock.acquire()
               
        select_query = 'SELECT * FROM cards'
        cursor.execute(select_query)
        cards = cursor.fetchall()
        
        result = []
        for card in cards:
            result.append({
                'id': card[0],
                'title': card[1], 
                'description': card[2],
                'price': card[3],
                'date': card[4].isoformat(),
                'filename': card[5],  
                'fileURL': card[6],
                'filepath': card[7],
                'collectionName': card[8],
                'rarity': card[9],
                'quantity': card[10] if card[0] else None,
            })
        return jsonify(result)

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()
        

# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/getCollectionNames", methods=["GET"])
def getCollectionNames():
    try:
        # Acquire the lock
        db_lock.acquire()
               
        select_query = 'SELECT * FROM collections'
        cursor.execute(select_query)
        collections = cursor.fetchall()
        

        result = []
        for collection in collections:
            result.append({
                'collectionName': collection[0],
            })

        return jsonify(result)

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/getCardbyId", methods=["POST"])
def get_cards_by_id():
    try:
        # Acquire the lock
        db_lock.acquire()
        # Retrieve form data
        card_id = request.form.get('card_id')
        
        select_query = 'SELECT * FROM cards where card_id = %s'
        cursor.execute(select_query, (card_id,))
        card_by_id = cursor.fetchone()

        if card_by_id:
            card_dict = {
                'id': card_by_id[0],
                'title': card_by_id[1], 
                'description': card_by_id[2],
                'price': card_by_id[3],
                'date': card_by_id[4].isoformat(),
                'filename': card_by_id[5],  
                'fileURL': card_by_id[6],
                'filepath': card_by_id[7],
                'collectionName': card_by_id[8],
                'rarity': card_by_id[9],
                'quantity': card_by_id[10] if card_by_id[0] else None,
            }
            return jsonify(card_dict)
        return jsonify({'message': 'Failed to fetch the newly added card.'}), 500

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/addCard", methods=["POST"])
def add_card():
    try:    
        # Acquire the lock
        db_lock.acquire()
    
        # Retrieve form data
        title = request.form.get('title')
        title = title.strip()
        description = request.form.get('description')
        price = request.form.get('price')
        previewUrl = request.form.get('previewUrl')
        collectionName = request.form.get('collectionName')
        rarity = request.form.get('rarity')
        quantity = request.form.get('quantity')
        
        # Retrieve file data
        image = request.files.get('image')
        
        
        # Generate a unique filename to avoid overwriting existing files
        filename = secure_filename(image.filename)
        unique_filename = f"{str(uuid.uuid4())}_{filename}"
        
        # Save the file to a temporary location
        temp_filepath = os.path.join('temp', unique_filename)
        image.save(temp_filepath)
        
        # Upload the file to S3
        s3.upload_file(
            temp_filepath,
            app.config['S3_BUCKET'],
            unique_filename
        )
        # Construct the S3 image URL
        s3_image_url = f"http://{app.config['S3_BUCKET']}.s3.amazonaws.com/{unique_filename}"

        insert_query = 'INSERT INTO cards (title,description,price,filename,fileURL,filepath,collectionName,rarity,quantity) VALUES (%s, %s,%s, %s, %s, %s, %s, %s, %s)'
        data = (title,description,price,unique_filename,s3_image_url,temp_filepath,collectionName,rarity,quantity)
        cursor.execute(insert_query, data)
        db_connection.commit()
        # Remove the temporary file
        os.remove(temp_filepath)
    
        # Fetch the newly added card
        select_query = 'SELECT * FROM cards WHERE card_id = %s'
        cursor.execute(select_query, (cursor.lastrowid,))
        new_card = cursor.fetchone()

        if new_card:
            new_card_dict = {
                'id': new_card[0],
                'title': new_card[1], 
                'description': new_card[2],
                'price': new_card[3],
                'date': new_card[4].isoformat(),
                'filename': new_card[5],  
                'fileURL': new_card[6],
                'filepath': new_card[7],
                'collectionName': new_card[8],
                'rarity': new_card[9],
                'quantity': new_card[10] if new_card[0] else None,
            }
            return jsonify(new_card_dict)
        return jsonify({'message': 'Failed to fetch the newly added card.'}), 500

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()
 

# --------------------------------------------------------------------------------------------------------------------------------
# Delete card by ID
@app.route("/deleteSelectedCards", methods=["POST"])
def delete_card():
    try:
        # Acquire the lock
        db_lock.acquire()
        
        # Retrieve the string from the form data
        selected_card_ids_str = request.form.get('selected_card_ids')

        # Load the string as a JSON array
        selected_card_ids = json.loads(selected_card_ids_str)
   
        if not selected_card_ids:
            return jsonify({'message': 'No selected cards provided'})
        
        deleted_cards = []
        
        for card_id in selected_card_ids:
            # Fetch the card to be deleted
            
            select_query = 'SELECT * FROM cards WHERE card_id = %s'
            cursor.execute(select_query, (card_id,))
            deleted_card = cursor.fetchone()
            
            if not deleted_card:
                # Handle the case where the card with the specified ID is not found
                return jsonify({'message': f'Card with ID {card_id} not found'})
            
             # Convert the deleted card to a dictionary (or use your CardSchema)
            deleted_card_dict = {
                'id': deleted_card[0],
                'title': deleted_card[1], 
                'description': deleted_card[2],
                'price': deleted_card[3],
                'date': deleted_card[4].isoformat(),
                'filename': deleted_card[5],  
                'fileURL': deleted_card[6],
                'filepath': deleted_card[7],
                'collectionName': deleted_card[8],
                'rarity': deleted_card[9],
                'quantity': deleted_card[10] if deleted_card[0] else None,
            }
        
            select_query = 'SELECT filename FROM cards WHERE card_id = %s'
            cursor.execute(select_query, (card_id,))
            filename = cursor.fetchone()
            
            # Delete the card from the database
            delete_query = 'DELETE FROM cards WHERE card_id = %s'
            cursor.execute(delete_query, (card_id,))
            db_connection.commit()
            
            s3.delete_object(Bucket='collectifybucket', Key=filename[0])
            
            deleted_cards.append(deleted_card_dict)

        # Return information about the deleted card
        return jsonify(deleted_card_dict)
    
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
# Update Card
@app.route("/updateCard", methods=["POST"])
def update_card():
    try:
        # Acquire the lock
        db_lock.acquire()
        
        description = request.form.get('description')
        price = request.form.get('price')
        card_id = request.form.get('card_id')
        quantity = request.form.get('quantity')

        update_query = 'UPDATE cards SET description = %s, price = %s, quantity = %s WHERE card_id = %s'
        data = (description,price,quantity,card_id)
        cursor.execute(update_query, data)
        db_connection.commit()
        
        # Fetch the updated card
        select_query = 'SELECT * FROM cards WHERE card_id = %s'
        cursor.execute(select_query, (card_id,))
        updated_card = cursor.fetchone()

        if updated_card:
            # Convert the card to a dictionary (or use your CardSchema)
            updated_card_dict = {
                'id': updated_card[0],
                'title': updated_card[1], 
                'description': updated_card[2],
                'price': updated_card[3],
                'date': updated_card[4].isoformat(),
                'filename': updated_card[5],  
                'fileURL': updated_card[6],
                'filepath': updated_card[7],
                'collectionName': updated_card[8],
                'rarity': updated_card[9],
                'quantity': updated_card[10] if updated_card[0] else None,
            }
            # Return the updated card data
            return jsonify(updated_card_dict)
        # If card not found, you may return an appropriate response
        return jsonify({'message': 'Card not found'})
        
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# ------------------------------------------ COLLECTIONS ------------------------------------------

@app.route("/getCollections", methods=["GET"])
def get_collections():
    try:
            
        # Acquire the lock
        db_lock.acquire()
    
        select_query = 'SELECT * FROM collections'
        cursor.execute(select_query)
        collections = cursor.fetchall()
        
        result = []
        for collection in collections:
            result.append({
                'id': collection[1],
                'collectionName': collection[0] if collection[0] else None,
            })
        return jsonify(result)
    
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()
    
# -------------------------------------------------------------------------------------------------------------------------------- 
@app.route("/addCollection", methods=["POST"])
def add_collection():
    try:    
        # Acquire the lock
        db_lock.acquire()
    
        # Retrieve form data
        collection_Name = request.form.get('collectionName')
        collection_Name = collection_Name.strip()
        
        insert_query = 'INSERT INTO collections (collectionName) VALUES (%s)'
        cursor.execute(insert_query, (collection_Name,))
        db_connection.commit()
        
        # Fetch the newly added collection
        select_query = 'SELECT * FROM collections WHERE collection_id = %s'
        cursor.execute(select_query, (cursor.lastrowid,))
        new_collection = cursor.fetchone()

        if new_collection:
            new_collection_dict = {
                'id': new_collection[1],
                'collectionName': new_collection[0] if new_collection[0] else None,
            }
            return jsonify(new_collection_dict)
        return jsonify({'message': 'Failed to fetch the newly added card.'}), 500

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()
    

# ------------------------------------------ USERS ------------------------------------------
@app.route("/getUserlist", methods=["GET"])
def getUserlist():
    try:
            
        # Acquire the lock
        db_lock.acquire()
    
        select_query = '''
                    SELECT usersprofiles.*
                    FROM usersprofiles
                    INNER JOIN users ON usersprofiles.user_id = users.user_id
                    WHERE users.isAdmin = 'NO'
                        '''
        cursor.execute(select_query,)
        usersprofiles = cursor.fetchall()

        result = []
        for usersprofile in usersprofiles:
            select_query = 'SELECT isAdmin FROM users where user_id = %s '
            cursor.execute(select_query,(usersprofile[1],))
            id = cursor.fetchone()
        
            result.append({
                'user_id': usersprofile[1],
                'email': usersprofile[2] if usersprofile[2] else None,
                'username': usersprofile[3] if usersprofile[3] else None,
                'date': usersprofile[4] if usersprofile[4] else None,
                'avatar_id': usersprofile[5] if usersprofile[5] else None,
                'balance': usersprofile[6] if usersprofile[6] else None,
                'score': usersprofile[7] if usersprofile[7] else None,
                'showcase_card': usersprofile[8] if usersprofile[8] else None,
                'isAdmin': id[0]
            })
        return jsonify(result)


    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/makeAdmin", methods=["POST"])
def makeAdmin():
    try:
        # Acquire the lock
        db_lock.acquire()
        user_id = request.form.get('user_id')

        print(user_id)
        cursor.execute("UPDATE users SET isAdmin = 'YES' WHERE user_id = %s", (user_id,))
        db_connection.commit()
        
        return jsonify({'message': 'Success'}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/deleteUser", methods=["POST"])
def deleteUser():
    try:
        # Acquire the lock
        db_lock.acquire()
        user_id = request.form.get('user_id')

        cursor.execute("DELETE FROM usersprofiles WHERE user_id = %s", (user_id,))
        db_connection.commit()

        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        db_connection.commit()
        
        return jsonify({'message': 'Success'}), 200

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()

# ------------------------------------------ AVATARS ------------------------------------------
@app.route("/getAvatarlist", methods=["GET"])
def getAvatarlist():
    try:
                
        # Acquire the lock
        db_lock.acquire()
    
        select_query = 'SELECT * FROM avatars'
        cursor.execute(select_query)
        avatars = cursor.fetchall()

        """
        select_query = 'SELECT * FROM users'
        cursor.execute(select_query)
        users = cursor.fetchall()
        """
        
        result = []
        for avatar in avatars:
            result.append({
                'avatar_id': avatar[0],
                'fileURL': avatar[1] if avatar[1] else None,
            })
        return jsonify(result)


    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route('/deleteAvatar', methods=['POST'])
def delete_avatar():
    try:
            
        # Acquire the lock
        db_lock.acquire()
    
        # Get the avatar_id from the form data
        avatar_id = request.form.get('avatar_id')
        select_query = 'SELECT filename FROM avatars WHERE avatar_id = %s'
        cursor.execute(select_query, (avatar_id,))
        filename = cursor.fetchone()

        
        cursor.execute("DELETE FROM avatars WHERE avatar_id = %s", (avatar_id,))
        db_connection.commit()
        
        # Delete the object from the S3 bucket
        response = s3.delete_object(Bucket='collectifybucket', Key=filename[0])
        
        # Respond with a success message
        return jsonify({'message': f'Avatar with ID {avatar_id} deleted successfully'})

    except Exception as e:
        # Handle exceptions and respond with an error message
        return jsonify({'error': str(e)}), 500

    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# --------------------------------------------------------------------------------------------------------------------------------
@app.route("/uploadAvatar", methods=["POST"])
def uploadAvatarlist():
    try:
            
        # Acquire the lock
        db_lock.acquire()
    
        # Retrieve file data
        avatar = request.files.get('avatar')
        
        
        # Generate a unique filename to avoid overwriting existing files
        filename = secure_filename(avatar.filename)
        unique_filename = f"{str(uuid.uuid4())}_{filename}"

        # Save the file to a temporary location
        temp_dir = 'temp'
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        
        # Save the file to a temporary location
        temp_filepath = os.path.join('temp', unique_filename)
        avatar.save(temp_filepath)
        
        # Upload the file to S3
        s3.upload_file(
            temp_filepath,
            app.config['S3_BUCKET'],
            unique_filename
        )
        # Construct the S3 avatar URL
        s3_image_url = f"http://{app.config['S3_BUCKET']}.s3.amazonaws.com/{unique_filename}"

        insert_query = 'INSERT INTO avatars (fileURL,filename ) VALUES (%s, %s)'
        cursor.execute(insert_query, (s3_image_url,unique_filename,))
        db_connection.commit()
        # Remove the temporary file
        os.remove(temp_filepath)
    
        
        # Fetch the newly added avatar
        select_query = 'SELECT * FROM avatars WHERE avatar_id = %s'
        cursor.execute(select_query, (cursor.lastrowid,))
        new_avatar = cursor.fetchone()

        if new_avatar:
            new_avatar_dict = {
                'avatar_id': new_avatar[0],
                'fileURL': new_avatar[1] if new_avatar[0] else None,
            }
            return jsonify(new_avatar_dict)
        return jsonify({'message': 'Failed to fetch the newly added card.'}), 500

    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()


# ------------------------------------------ LOGIN ------------------------------------------
@app.route("/handleAuthentication", methods=["POST"])
def handleAuthentication():
    try:
        
        # Acquire the lock
        db_lock.acquire()
        
        # Retrieve form data
        actionn = request.form.get('actionn')
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        username = username.strip()
        email = email.strip()
        password = password.strip()
        
        
        # check login
        if actionn == "Login":
            select_query = 'SELECT email, password FROM users WHERE email = %s and password = %s'
            cursor.execute(select_query, (email,password,))
            queries = cursor.fetchall()

            if len(queries) == 1:
                # get user_id
                cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
                user_id = cursor.fetchone()

                # Create a JWT token with user information
                tokenn = jwt.encode({'user_id': user_id, 'exp': datetime.utcnow() + timedelta(hours=1)}, app.config['SECRET_KEY'], algorithm='HS256')

                cursor.execute("SELECT isAdmin FROM users WHERE email = %s", (email,))
                isAdmin = cursor.fetchone()[0]
                

                response_data = {'message': 'Login Successful.', 'status_code': 1, 'isAdmin':isAdmin, 'token': tokenn}
                response = make_response(jsonify(response_data), 200)
                return response
            else: 
                response_data = {'message': 'Email or password is incorrect.', 'status_code': 2}
                response = make_response(jsonify(response_data), 200)
                return response

        elif actionn == "Sign Up":
            # check whether email is in already database or not
            select_query = 'SELECT email, password FROM users WHERE email = %s'
            cursor.execute(select_query, (email,))
            queries = cursor.fetchall()

            select_query = 'SELECT username FROM usersprofiles WHERE username = %s'
            cursor.execute(select_query, (username,))
            queries_useraname = cursor.fetchall()
            
            if len(queries) >= 1:
                response_data = {'message': 'You already have an account.', 'status_code': 3}
                response = make_response(jsonify(response_data), 200)
                return response
            
            elif len(queries_useraname)>=1:
                response_data = {'message': 'This username is already taken.', 'status_code': 3}
                response = make_response(jsonify(response_data), 200)
                return response
                
            else:
                insert_query = 'INSERT INTO users (email, password) VALUES (%s, %s)'
                data = (email, password)
                cursor.execute(insert_query, data)
                db_connection.commit()

                # get user_id
                cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
                user_id = cursor.fetchone()
                
                # Check if user_id is retrieved successfully
                if user_id:
                    # Insert into the 'usersprofiles' table
                    cursor.execute("INSERT INTO usersprofiles (user_id, email, username) VALUES (%s, %s, %s)", (user_id[0], email, username))
                    db_connection.commit()
                    response_data = {'message': 'Sign up is completed.', 'status_code': 4}
                    response = make_response(jsonify(response_data), 200)
                    return response
                else:
                    raise Exception("Failed to retrieve user_id.")
        
    except Exception as e:
        # Handle exceptions appropriately
        print(f"Error: {str(e)}")
        return jsonify({'message': 'Error processing the request'}), 500
    
    finally:
        # Release the lock in the finally block to ensure it's always released
        db_lock.release()



if __name__ == "__main__":
    app.run(debug=True)
    #socketio.run(app, debug=True,port=5001)
    #app.run(ssl_context='adhoc', debug=True)

    
    
    
    