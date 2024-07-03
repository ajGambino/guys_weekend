import React, { useState, useEffect } from 'react';
import { ref, set, get, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const OwnBall = ({ users }) => {
    const currentUser = auth.currentUser;
    const [localScores, setLocalScores] = useState(Array(9).fill(''));
    const [teamRows, setTeamRows] = useState([]);
    const [userScores, setUserScores] = useState({});

    const userId = currentUser.uid;
    const teamId = users[userId]?.teamId;
    const authorizedUID = "riyzNX38qTQ04YtB2tHOM5EP7Aj1";

    const parValues = [4, 4, 5, 3, 4, 4, 4, 4, 3];

    useEffect(() => {
        if (userId) {
            const userScoresRef = ref(rtdb, `scores/ownBall/${userId}/holes`);
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

            // Fetch all user scores
            const scoresRef = ref(rtdb, 'scores/ownBall');
            onValue(scoresRef, (snapshot) => {
                const scoresData = snapshot.val();
                if (scoresData) {
                    setUserScores(scoresData);
                }
            });
        }
    }, [userId]);

    useEffect(() => {
        const updateTeamRows = async () => {
            const teamRowsData = [
                { teamName: 'AJ & Cleve', teamId: 'team1' },
                { teamName: 'Craig & Det', teamId: 'team3' },
                { teamName: 'NA$$TY & Aunkst', teamId: 'team2' },
                { teamName: 'Greg & Turtle', teamId: 'team4' }
            ];

            const fetchedTeamRows = await Promise.all(
                teamRowsData.map(async ({ teamName, teamId }) => {
                    const teamScores = await getTeamScores(teamId);
                    const { relativeToPar, holesCompleted } = calculateRelativeToPar(teamScores);
                    return { teamName, teamId, teamScores, relativeToPar, holesCompleted };
                })
            );

            fetchedTeamRows.sort((a, b) => a.relativeToPar - b.relativeToPar);
            setTeamRows(fetchedTeamRows);
        };

        updateTeamRows();
    }, [userScores]);

    const handleChange = async (holeIndex, value) => {
        if (value === '' || /^\d+$/.test(value)) {
            const newScores = [...localScores];
            newScores[holeIndex] = value;
            setLocalScores(newScores);

            const userId = currentUser.uid;
            const userScoresRef = ref(rtdb, `scores/ownBall/${userId}/holes`);

            const scoresToSubmit = newScores.map(score => (score === '' ? '0' : score));
            const totalScore = scoresToSubmit.reduce((acc, score) => acc + Number(score), 0);

            await set(userScoresRef, scoresToSubmit.reduce((acc, score, index) => {
                acc[index + 1] = Number(score);
                return acc;
            }, {}));

            await set(ref(rtdb, `scores/ownBall/${userId}/total`), totalScore);

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
        } else {
            alert('Please enter a valid score (0 or any positive whole number).');
        }
    };

    const getTeamScores = async (teamId) => {
        const teamMembers = Object.entries(users)
            .filter(([userId, user]) => user.teamId === teamId)
            .sort(([aId], [bId]) => (users[aId].name < users[bId].name ? -1 : 1)); // Ensure sorting by name order
        const teamScores = Array(9).fill(0).map(() => [0, 0]);
        await Promise.all(teamMembers.map(async ([userId], memberIndex) => {
            const userScoresRef = ref(rtdb, `scores/ownBall/${userId}/holes`);
            const snapshot = await get(userScoresRef);
            const userHoles = snapshot.val() || {};
            Object.keys(userHoles).forEach(hole => {
                if (!teamScores[hole - 1]) {
                    teamScores[hole - 1] = [0, 0];
                }
                teamScores[hole - 1][memberIndex] = userHoles[hole];
            });
        }));
        return teamScores;
    };

    const calculateRelativeToPar = (teamScores) => {
        let relativeToPar = 0;
        let holesCompleted = 0;
        teamScores.forEach((scores, index) => {
            const totalScore = scores.reduce((acc, score) => acc + score, 0);
            if (totalScore !== 0) {
                relativeToPar += totalScore - 2 * parValues[index];
                holesCompleted += 1;
            }
        });
        return { relativeToPar, holesCompleted };
    };

    const updateLeaderboard = async () => {
        if (userId !== authorizedUID) {
            alert("Only AJ can process leaderboard points");
            return;
        }

        const teamRowsData = [
            { teamId: 'team1' },
            { teamId: 'team2' },
            { teamId: 'team3' },
            { teamId: 'team4' }
        ];

        const teamScoresArray = await Promise.all(
            teamRowsData.map(async ({ teamId }) => {
                const teamScores = await getTeamScores(teamId);
                const { relativeToPar } = calculateRelativeToPar(teamScores);
                return { teamId, relativeToPar };
            })
        );

        teamScoresArray.sort((a, b) => a.relativeToPar - b.relativeToPar);

        const pointsDistribution = [5, 3, 1, 0];
        let pointsArray = [0, 0, 0, 0];
        for (let i = 0; i < teamScoresArray.length; i++) {
            let tieCount = 1;
            let sumPoints = pointsDistribution[i];

            while (i + tieCount < teamScoresArray.length && teamScoresArray[i].relativeToPar === teamScoresArray[i + tieCount].relativeToPar) {
                sumPoints += pointsDistribution[i + tieCount];
                tieCount++;
            }

            const points = (sumPoints / tieCount).toFixed(2);
            for (let j = 0; j < tieCount; j++) {
                pointsArray[i + j] = points;
            }

            i += tieCount - 1;
        }

        for (let i = 0; i < teamScoresArray.length; i++) {
            const { teamId } = teamScoresArray[i];
            const points = pointsArray[i];

            const teamRef = ref(rtdb, `teams/${teamId}`);
            const snapshot = await get(teamRef);
            const teamData = snapshot.val();

            if (teamData) {
                const newPoints = parseFloat(points);
                const totalPoints = parseFloat(teamData['2man']) + parseFloat(teamData['4man']) + parseFloat(teamData.own) + parseFloat(teamData.alternate) + newPoints;

                await update(teamRef, {
                    'own': newPoints,
                    'Pts': totalPoints,
                    'total': totalPoints
                });
            } else {
                console.log(`Team document with teamID ${teamId} does not exist`);
            }
        }
    };

    return (
        <div className='own-ball'>
            <div className='final'>
                <h3>Own Ball</h3>
                <button onClick={updateLeaderboard}>Final</button>
            </div>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Score</th>
                        <th>Thru</th>
                    </tr>
                </thead>
                <tbody>
                    {teamRows.map(({ teamName, relativeToPar, holesCompleted }) => (
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
                        <th>392</th>
                        <th>292</th>
                        <th>481</th>
                        <th>169</th>
                        <th>410</th>
                        <th>437</th>
                        <th>318</th>
                        <th>356</th>
                        <th>157</th>
                    </tr>
                    <tr>
                        <th>Par</th>
                        {parValues.map((par, index) => (
                            <th key={index}>{par}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {teamRows.map(({ teamName, teamId, teamScores }) => (
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
                <div >
                    <h4>Own Ball Scores</h4>
                    <ul className="solo-scores">
                        {Object.entries(userScores)
                            .filter(([userId]) => !userId.startsWith('team'))
                            .map(([userId, user]) => (
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

export default OwnBall;
