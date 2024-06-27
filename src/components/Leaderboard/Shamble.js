import React, { useState, useEffect } from 'react';
import { ref, set, get, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const Shamble = ({ scores, teamTotals, users }) => {
    const [localScores, setLocalScores] = useState(Array(9).fill(''));
    const currentUser = auth.currentUser;
    const userId = currentUser.uid;

    useEffect(() => {
        const userScoresRef = ref(rtdb, `scores/shamble/${userId}/holes`);
        onValue(userScoresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const fetchedScores = Array(9).fill('');
                Object.keys(data).forEach(hole => {
                    fetchedScores[hole - 1] = data[hole];
                });
                setLocalScores(fetchedScores);
            }
        });
    }, [userId]);

    const handleChange = (holeIndex, value) => {
        const newScores = [...localScores];
        newScores[holeIndex] = value;
        setLocalScores(newScores);
    };

    const handleSubmit = async () => {
        const userScoresRef = ref(rtdb, `scores/shamble/${userId}/holes`);
        const totalScore = localScores.reduce((acc, score) => acc + Number(score), 0);

        await set(userScoresRef, localScores.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));

        await set(ref(rtdb, `scores/shamble/${userId}/total`), totalScore);

        // Update the team total
        const userRef = ref(rtdb, `users/${userId}`);
        onValue(userRef, async (snapshot) => {
            const user = snapshot.val();
            const teamId = user.teamId;
            const teamScoresRef = ref(rtdb, `teams/${teamId}/shambleTotal`);

            const teamSnapshot = await get(teamScoresRef);
            const teamTotal = teamSnapshot.val() || 0;
            const newTeamTotal = teamTotal + totalScore;

            await update(teamScoresRef, { shambleTotal: newTeamTotal });
        }, { onlyOnce: true });
    };

    const getTeamScores = (teamId) => {
        const teamMembers = Object.entries(users).filter(([userId, user]) => user.teamId === teamId);
        const teamScores = Array(9).fill(0).map(() => [0, 0]); // Array of [player1, player2] scores
        teamMembers.forEach(([userId], memberIndex) => {
            const userHoles = scores[userId]?.holes || {};
            Object.keys(userHoles).forEach(hole => {
                teamScores[hole - 1][memberIndex] = userHoles[hole];
            });
        });
        return teamScores;
    };

    const calculateRelativeToPar = (teamScores) => {
        const par = [4, 4, 4, 4, 3, 5, 4, 4, 3];
        let relativeToPar = 0;
        let holesCompleted = 0;
        teamScores.forEach((scores, index) => {
            if (scores[0] !== 0 && scores[1] !== 0) { // Ensure both players have scores
                relativeToPar += (scores[0] + scores[1]) - 2 * par[index];
                holesCompleted += 1;
            }
        });
        return { relativeToPar, holesCompleted };
    };

    const teamRows = [
        { teamName: 'AJJB', teamId: 'team1' },
        { teamName: 'CKCD', teamId: 'team3' },
        { teamName: 'BANA', teamId: 'team2' },
        { teamName: 'GMPM', teamId: 'team4' }
    ];

    const sortedTeamRows = teamRows
        .map(({ teamName, teamId }) => {
            const teamScores = getTeamScores(teamId);
            const { relativeToPar, holesCompleted } = calculateRelativeToPar(teamScores);
            return { teamName, teamId, teamScores, relativeToPar, holesCompleted };
        })
        .sort((a, b) => a.relativeToPar - b.relativeToPar);

    return (
        <div>
            <h1>Shamble</h1>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {[...Array(9)].map((_, index) => (
                            <th key={index}>{index + 1}</th>
                        ))}
                        <th>Total</th>
                        <th>Thru</th>
                    </tr>
                    <tr>
                        <th>Yds</th>
                        <th>380</th>
                        <th>342</th>
                        <th>367</th>
                        <th>384</th>
                        <th>189</th>
                        <th>474</th>
                        <th>363</th>
                        <th>378</th>
                        <th>140</th>
                        <th>3017</th>
                    </tr>
                    <tr>
                        <th>Par</th>
                        <th>4</th>
                        <th>4</th>
                        <th>4</th>
                        <th>4</th>
                        <th>3</th>
                        <th>5</th>
                        <th>4</th>
                        <th>4</th>
                        <th>3</th>
                        <th>35</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamRows.map(({ teamName, teamId, teamScores, relativeToPar, holesCompleted }) => (
                        <tr key={teamId}>
                            <td>{teamName}</td>
                            {teamScores.map((scores, index) => (
                                <td key={index}>{scores[0] + scores[1]}</td>
                            ))}
                            <td>{relativeToPar === 0 ? 'E' : relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar}</td>
                            <td>{holesCompleted}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
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

            <h2>Shamble Scores</h2>
            <ul>
                {Object.entries(scores).map(([userId, user]) => (
                    <li key={userId}>
                        {users[userId]?.name || userId}: {user.total}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Shamble;
