import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Results from './components/Results';
import Login from './components/Login';
import Signup from './components/Signup';
import { AuthProvider } from './components/AuthContext';
import PlaceBet from './components/PlaceBet';
import Leaderboard from './components/Leaderboard/Leaderboard';
import './App.css'


const App = () => {
  return (
    <Router>
      <AuthProvider>
  
        <div className="app-container">
         <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/place-bet" element={<PlaceBet />} />
            <Route path="/results" element={<Results />} />
            <Route path='/leaderboard' element = {<Leaderboard />} />
          </Routes>
         
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
