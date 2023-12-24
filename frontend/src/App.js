import LoginPage from './components/LoginPage.js';
import AdminHome from './components/AdminHome.js';
import AdminAddCard from './components/AdminAddCard.js';
import AdminViewUsers from './components/AdminViewUsers.js';
import AdminViewAvatars from './components/AdminViewAvatars.js';
import UserPage from './components/UserPage.js';
import UserMyCollection from './components/UserMyCollection.js';
import UserAuction from './components/UserAuction.js';
import UserMarket from './components/UserMarket.js';
import UserPazar from './components/UserPazar.js';
import UserProfile from './components/UserProfile.js';
import UserAchievements from './components/UserAchievements.js';
import {Route, HashRouter, Routes} from 'react-router-dom';
import AdminAddCollection from './components/AdminAddCollection.js';
import AdminUpdateCard from './components/AdminUpdateCard.js';


function App() {
  return (
    <HashRouter>
      <Routes>
        <Route exact path="/" element={<LoginPage />}/>
        <Route exact path="/login" element={<LoginPage />}/>

        <Route exact path="/admin/home" element={<AdminHome />}/>
        <Route exact path="/admin/viewusers" element={<AdminViewUsers />}/>
        <Route exact path="/admin/viewavatars" element={<AdminViewAvatars />}/>
        <Route exact path="/admin/addcard" element={<AdminAddCard />}/>
        <Route exact path="/admin/addcollection" element={<AdminAddCollection />}/>
        <Route exact path="/admin/updateCard" element={<AdminUpdateCard />}/>


        <Route exact path="/user/home" element={<UserPage />}/>
        <Route exact path="/user/mycollection" element={<UserMyCollection />}/>
        <Route exact path="/user/auction" element={<UserAuction />}/>
        <Route exact path="/user/market" element={<UserMarket />}/>
        <Route exact path="/user/pazar" element={<UserPazar />}/>
        <Route exact path="/user/profile" element={<UserProfile />}/>
        <Route exact path="/user/achievements" element={<UserAchievements />}/>
      </Routes>
    </HashRouter>
  );
}

export default App;
