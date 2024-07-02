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

    const handleChange = async (holeIndex, value) => {
        if (value === '' || /^\d+$/.test(value)) {
            const newScores = [...localScores];
            newScores[holeIndex] = value;
            setLocalScores(newScores);

            const userId = currentUser.uid;
            const userScoresRef = ref(rtdb, `scores/shamble/${userId}/holes`);

            const scoresToSubmit = newScores.map(score => (score === '' ? '0' : score));
            const totalScore = scoresToSubmit.reduce((acc, score) => acc + Number(score), 0);

            await set(userScoresRef, scoresToSubmit.reduce((acc, score, index) => {
                acc[index + 1] = Number(score);
                return acc;
            }, {}));

            await set(ref(rtdb, `scores/shamble/${userId}/total`), totalScore);

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
        } else {
            alert('Please enter a valid score (0 or any positive whole number).');
        }
    };

    const getTeamScores = (teamId) => {
        const teamMembers = Object.entries(users)
            .filter(([userId, user]) => user.teamId === teamId)
            .sort(([aId], [bId]) => (users[aId].name < users[bId].name ? -1 : 1)); // Ensure sorting by name order
        const teamScores = Array(9).fill(0).map(() => [0, 0]);
        teamMembers.forEach(([userId], memberIndex) => {
            const userHoles = scores[userId]?.holes || {};
            Object.keys(userHoles).forEach(hole => {
                if (!teamScores[hole - 1]) {
                    teamScores[hole - 1] = [0, 0];
                }
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
            if (scores[0] !== 0 && scores[1] !== 0) {
                relativeToPar += (scores[0] + scores[1]) - 2 * par[index];
                holesCompleted += 1;
            }
        });
        return { relativeToPar, holesCompleted };
    };

    const teamRows = [
        { teamName: 'AJ & Cleve', teamId: 'team1' },
        { teamName: 'Craig & Det', teamId: 'team3' },
        { teamName: 'NA$$TY & Aunkst', teamId: 'team2' },
        { teamName: 'Greg & Turtle', teamId: 'team4' }
    ];

    const sortedTeamRows = teamRows
        .map(({ teamName, teamId }) => {
            const teamScores = getTeamScores(teamId);
            const { relativeToPar, holesCompleted } = calculateRelativeToPar(teamScores);
            return { teamName, teamId, teamScores, relativeToPar, holesCompleted };
        })
        .sort((a, b) => a.relativeToPar - b.relativeToPar);

    return (
        <div className="shamble">
            <h3>Shamble</h3>

            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Score</th>
                        <th>Thru</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamRows.map(({ teamName, relativeToPar, holesCompleted }) => (
                        <tr key={teamName}>
                            <td>{teamName}</td>
                            <td>{relativeToPar === 0 ? 'E' : relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar}</td>
                            <td>{holesCompleted}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="styled-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {[...Array(9)].map((_, index) => (
                            <th key={index}>{index + 1}</th>
                        ))}
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
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamRows.map(({ teamName, teamId, teamScores }) => (
                        <tr key={teamId}>
                            <td>{teamName}</td>
                            {teamScores.map((scores, index) => {
                                const [player1Score, player2Score] = scores;
                                return (
                                    <td key={index}>
                                        {player1Score !== 0 ? player1Score : ''}/{player2Score !== 0 ? player2Score : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3 className="scorecard-title">Scorecard</h3>
            <div className='own-container'>
                <div>
                    <form onSubmit={(e) => { e.preventDefault(); }}>
                        {[...Array(9)].map((_, index) => (
                            <div className='border input-container' key={index}>
                                <label>Hole #{index + 1}:</label>
                                <input
                                    type="number"
                                    value={localScores[index]}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                />
                            </div>
                        ))}
                    </form>
                </div>
                <div>
                    <h4>Shamble Scores</h4>
                    <ul>
                        {Object.entries(scores).map(([userId, user]) => (
                            <li key={userId}>
                                {users[userId]?.name || userId}: {user.total}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Shamble;
