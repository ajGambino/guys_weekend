import React, { useState, useEffect } from 'react';
import { updateLeaderboard, subscribeToLeaderboard } from '../services/realtimeDatabaseService';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState({});

  useEffect(() => {
    subscribeToLeaderboard(setLeaderboard);
  }, []);

  const handleUpdateScore = (playerId, score) => {
    updateLeaderboard(playerId, score);
  };

  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {Object.keys(leaderboard).map((playerId) => (
          <li key={playerId}>
            Player {playerId}: {leaderboard[playerId].score}
          </li>
        ))}
      </ul>
      {/* Add UI to update scores */}
    </div>
  );
};

export default Leaderboard;
