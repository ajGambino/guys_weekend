import React, { useState, useEffect } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const Scramble4 = ({ scores, teamTotals, users }) => {
    const [localScores, setLocalScores] = useState(Array(9).fill(''));

    const currentUser = auth.currentUser;
    const userId = currentUser.uid;
    const teamId = users[userId]?.teamId;

    useEffect(() => {
        if (teamId) {
            const teamScramble4Id = teamId === 'team1' || teamId === 'team3' ? 'teamScramble4_1' : 'teamScramble4_2';
            const teamScoresRef = ref(rtdb, `scores/scramble4/${teamScramble4Id}/holes`);
            onValue(teamScoresRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const fetchedScores = Array(9).fill('');
                    Object.keys(data).forEach(hole => {
                        fetchedScores[hole - 1] = data[hole];
                    });
                    setLocalScores(fetchedScores);
                }
            });
        }
    }, [teamId]);

    const handleChange = (holeIndex, value) => {
        const newScores = [...localScores];
        newScores[holeIndex] = value;
        setLocalScores(newScores);
    };

    const handleSubmit = async () => {
        if (!teamId) return;
        const teamScramble4Id = teamId === 'team1' || teamId === 'team3' ? 'teamScramble4_1' : 'teamScramble4_2';
        const teamScoresRef = ref(rtdb, `scores/scramble4/${teamScramble4Id}/holes`);
        const totalScore = localScores.reduce((acc, score) => acc + Number(score), 0);

        await set(teamScoresRef, localScores.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));

        await set(ref(rtdb, `scores/scramble4/${teamScramble4Id}/total`), totalScore);

        // Update the team total
        const teamRef = ref(rtdb, `teams/${teamScramble4Id}/scramble4Total`);
        await update(teamRef, { scramble4Total: totalScore });
    };

    return (
        <div>
            <h1>4-man Scramble</h1>
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

            <h2>4-man Scramble Scores</h2>
            <ul>
                {Object.entries(scores).map(([teamId, team]) => (
                    <li key={teamId}>
                        {teamId}: {team.total}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Scramble4;
