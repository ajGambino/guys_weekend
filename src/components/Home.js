import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


const Home = () => {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        // Fetch players from Firebase Firestore
        const fetchPlayers = async () => {
            try {
                const snapshot = await firebase.firestore().collection('players').get();
                const playerData = snapshot.docs.map((doc) => doc.data());
                setPlayers(playerData);
            } catch (error) {
                console.error('Error fetching players:', error);
            }
        };

        fetchPlayers();
    }, []);

    return (
        <div className='home-page'>
            <h1>GW '24</h1>
            {players.length === 0 ? (
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
                        {players.map((player) => (
                            <tr key={player.name}>
                                <td className='name-cell'>{player.name}</td>
                                <td className='net-cell' >${player.net}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}</div>

    );
};

export default Home;
