import React, { useState } from 'react';
import { ref, set, update, get, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const OwnBall = ({ scores, teamTotals, users }) => {
    const [userScores, setUserScores] = useState(Array(9).fill(''));

    const currentUser = auth.currentUser;

    const handleChange = (holeIndex, value) => {
        const newScores = [...userScores];
        newScores[holeIndex] = value;
        setUserScores(newScores);
    };

    const handleSubmit = async () => {
        const userId = currentUser.uid;
        const userScoresRef = ref(rtdb, `scores/${userId}/holes`);
        const totalScore = userScores.reduce((acc, score) => acc + Number(score), 0);

        await set(userScoresRef, userScores.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));

        await set(ref(rtdb, `scores/${userId}/total`), totalScore);

        // Update the team total
        const userRef = ref(rtdb, `users/${userId}`);
        onValue(userRef, async (snapshot) => {
            const user = snapshot.val();
            const teamId = user.teamId;
            const teamScoresRef = ref(rtdb, `teams/${teamId}/total`);

            const teamSnapshot = await get(teamScoresRef);
            const teamTotal = teamSnapshot.val() || 0;
            const newTeamTotal = teamTotal + totalScore;

            await update(teamScoresRef, { total: newTeamTotal });
        }, { onlyOnce: true });
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
                            value={userScores[index]}
                            onChange={(e) => handleChange(index, e.target.value)}
                        />
                    </div>
                ))}
                <button type="submit">Submit Scores</button>
            </form>

            <h2> Own Ball Scores</h2>
            <ul>
                {Object.entries(scores).map(([userId, user]) => (
                    <li key={userId}>
                        {users[userId]?.name || userId}: {user.total}
                    </li>
                ))}
            </ul>

            <h2>OB Team Totals</h2>
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
