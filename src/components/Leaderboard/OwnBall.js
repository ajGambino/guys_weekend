import React, { useState, useEffect } from 'react';
import { ref, set, get, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const OwnBall = ({ scores, teamTotals, users, userScores, onInputChange }) => {
    const currentUser = auth.currentUser;
    const [localScores, setLocalScores] = useState(Array(9).fill(''));

    useEffect(() => {
        if (userScores && userScores.length > 0) {
            setLocalScores(userScores);
        } else {
            const userId = currentUser.uid;
            const userScoresRef = ref(rtdb, `scores/ownBall/${userId}/holes`);
            onValue(userScoresRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const fetchedScores = Array(9).fill('');
                    Object.keys(data).forEach(hole => {
                        fetchedScores[hole - 1] = data[hole];
                    });
                    setLocalScores(fetchedScores);
                    onInputChange(fetchedScores);
                }
            });
        }
    }, [currentUser, userScores, onInputChange]);

    const handleChange = (holeIndex, value) => {
        const newScores = [...localScores];
        newScores[holeIndex] = value;
        setLocalScores(newScores);
    };

    const handleSubmit = async () => {
        const userId = currentUser.uid;
        const userScoresRef = ref(rtdb, `scores/ownBall/${userId}/holes`);
        const totalScore = localScores.reduce((acc, score) => acc + Number(score), 0);

        await set(userScoresRef, localScores.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));

        await set(ref(rtdb, `scores/ownBall/${userId}/total`), totalScore);

        // Update the team total
        const userRef = ref(rtdb, `users/${userId}`);
        onValue(userRef, async (snapshot) => {
            const user = snapshot.val();
            const teamId = user.teamId;
            const teamScoresRef = ref(rtdb, `teams/${teamId}/ownBallTotal`);

            const teamSnapshot = await get(teamScoresRef);
            const teamTotal = teamSnapshot.val() || 0;
            const newTeamTotal = teamTotal + totalScore;

            await update(teamScoresRef, { ownBallTotal: newTeamTotal });
        }, { onlyOnce: true });

        // Update the parent component with the new scores
        onInputChange(localScores);
    };

    return (
        <div>
            <h1>Own Ball</h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {[...Array(9)].map((_, index) => (
                    <div key={index}>
                        <label>Hole {index + 1}:</label>
                        <input
                            type="number"
                            value={localScores[index]}
                            onChange={(e) => handleChange(index, e.target.value)}
                        />
                    </div>
                ))}
                <button type="submit">Submit Scores</button>
            </form>

            <h2>Own Ball Scores</h2>
            <ul>
                {Object.entries(scores).map(([userId, user]) => (
                    <li key={userId}>
                        {users[userId]?.name || userId}: {user.total}
                    </li>
                ))}
            </ul>

            <h2>Own Ball Team Totals</h2>
            <ul>
                {Object.entries(teamTotals).map(([teamId, total]) => (
                    <li key={teamId}>
                        {teamId}: {total}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default OwnBall;
