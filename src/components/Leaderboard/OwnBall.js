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

    const getTeamScores = (teamId) => {
        const teamMembers = Object.entries(users).filter(([userId, user]) => user.teamId === teamId);
        const teamScores = Array(9).fill(0);
        teamMembers.forEach(([userId]) => {
            const userHoles = scores[userId]?.holes || {};
            Object.keys(userHoles).forEach(hole => {
                teamScores[hole - 1] += userHoles[hole];
            });
        });
        return teamScores;
    };

    const teamRows = [
        { teamName: 'AJ.JB', teamId: 'team1' },
        { teamName: 'CK.CD', teamId: 'team3' },
        { teamName: 'BA.NA', teamId: 'team2' },
        { teamName: 'GM.PM', teamId: 'team4' }
    ];

    return (
        <div>
            <h1>Own Ball</h1>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Hole</th>
                        {[...Array(9)].map((_, index) => (
                            <th key={index}>{index + 1}</th>
                        ))}
                        <th>Total</th>
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
                        <th>3012</th>
                    </tr>
                    <tr>
                        <th>Par</th>
                        <th>4</th>
                        <th>4</th>
                        <th>5</th>
                        <th>3</th>
                        <th>4</th>
                        <th>4</th>
                        <th>4</th>
                        <th>4</th>
                        <th>3</th>
                        <th>35</th>
                    </tr>
                </thead>
                <tbody>
                    {teamRows.map(({ teamName, teamId }) => {
                        const teamScores = getTeamScores(teamId);
                        const teamTotal = teamScores.reduce((acc, score) => acc + score, 0);
                        return (
                            <tr key={teamId}>
                                <td>{teamName}</td>
                                {teamScores.map((score, index) => (
                                    <td key={index}>{score}</td>
                                ))}
                                <td>{teamTotal}</td>
                            </tr>
                        );
                    })}
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

            <h2>Own Ball Scores</h2>
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

export default OwnBall;
