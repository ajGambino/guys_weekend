import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Home = () => {
  const [users, setUsers] = useState([]);

  const fetchPlayers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const playersList = querySnapshot.docs.map(doc => doc.data());
      setUsers(playersList);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <div className='home-page'>
      <h1>GW '24</h1>
      {users.length === 0 ? (
        <p>No players available.</p>
      ) : (
        <div className='stats'>
          <div className='table-container'>
            <div className='name-column'>
              <h2>Name</h2>
              {users.map((user) => (
                <p key={user.name}>{user.name}</p>
              ))}
            </div>
            <div className='net-column'>
              <h2>Net</h2>
              {users.map((user) => (
                <p key={user.name}>${user.net}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
