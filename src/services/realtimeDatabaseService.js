import { ref, set, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

const updateLeaderboard = (playerId, score) => {
  set(ref(rtdb, 'leaderboard/' + playerId), {
    score: score,
  });
};

const subscribeToLeaderboard = (callback) => {
  const leaderboardRef = ref(rtdb, 'leaderboard');
  onValue(leaderboardRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
};

export { updateLeaderboard, subscribeToLeaderboard };
