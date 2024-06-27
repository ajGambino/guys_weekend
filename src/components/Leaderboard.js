// src/components/Leaderboard.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [player, setPlayer] = useState('');
  const [score, setScore] = useState('');

  useEffect(() => {
    const fetchScores = async () => {
      const querySnapshot = await getDocs(collection(db, 'scores'));
      const scoresList = querySnapshot.docs.map(doc => doc.data());
      setScores(scoresList);
    };

    fetchScores();
  }, []);

  const addScore = async () => {
    try {
      await addDoc(collection(db, 'scores'), { player, score });
      setScores([...scores, { player, score }]);
    } catch (e) {
      console.error('Error adding score: ', e);
    }
  };

  return (
    <div>
      <input type="text" value={player} onChange={(e) => setPlayer(e.target.value)} placeholder="Player Name" />
      <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" />
      <button onClick={addScore}>Add Score</button>
      <ul>
        {scores.map((s, index) => (
          <li key={index}>{s.player}: {s.score}</li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
