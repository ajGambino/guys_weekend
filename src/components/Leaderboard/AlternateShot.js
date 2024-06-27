import React, { useState, useEffect } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const AlternateShot = ({ scores, teamTotals, users }) => {
    const [localScores, setLocalScores] = useState(Array(9).fill(''));

    const currentUser = auth.currentUser;
    const userId = currentUser.uid;
    const teamId = users[userId]?.teamId;

    useEffect(() => {
        if (teamId) {
            const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
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
        const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
        const totalScore = localScores.reduce((acc, score) => acc + Number(score), 0);

        await set(teamScoresRef, localScores.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));

        await set(ref(rtdb, `scores/alternateShot/${teamId}/total`), totalScore);

        // Update the team total
        const teamRef = ref(rtdb, `teams/${teamId}/alternateShotTotal`);
        await update(teamRef, { alternateShotTotal: totalScore });
    };

    const getTeamScores = (teamId) => {
        const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
        let teamScores = Array(9).fill(0);
        onValue(teamScoresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                Object.keys(data).forEach(hole => {
                    teamScores[hole - 1] = data[hole];
                });
            }
        });
        return teamScores;
    };

    const teamRows = [
        { teamName: 'AJJB', teamId: 'team1' },
        { teamName: 'CKCD', teamId: 'team3' },
        { teamName: 'BANA', teamId: 'team2' },
        { teamName: 'GMPM', teamId: 'team4' }
    ];

    return (
        <div>
            <h1>Alternate Shot</h1>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {[...Array(9)].map((_, index) => (
                            <th key={index}>{10 + index}</th>
                        ))}
                        <th>Total</th>
                    </tr>
                    <tr>
                        <th>Yds</th>
                        <th>387</th>
                        <th>374</th>
                        <th>164</th>
                        <th>340</th>
                        <th>364</th>
                        <th>555</th>
                        <th>215</th>
                        <th>346</th>
                        <th>375</th>
                        <th>3120</th>
                    </tr>
                    <tr>
                        <th>Par</th>
                        <th>4</th>
                        <th>4</th>
                        <th>3</th>
                        <th>4</th>
                        <th>4</th>
                        <th>5</th>
                        <th>3</th>
                        <th>4</th>
                        <th>4</th>
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
                        <label>Hole {10 + index}:</label>
                        <input
                            type="number"
                            value={localScores[index]}
                            onChange={(e) => handleChange(index, e.target.value)}
                        />
                    </div>
                ))}
                <button type="submit">Submit Scores</button>
            </form>
        </div>
    );
};

export default AlternateShot;
