// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const Home = () => {
  const [users, setUsers] = useState([]);

  const fetchPlayers = async () => {
    try {
      // Fetch documents from the 'users' collection
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
                <table className='stats'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.name}>
                                <td className='name-cell'>{user.name}</td>
                                <td className='net-cell' >${user.net}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}</div>

    );
};

export default Home;