import React, { useState, useEffect } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const Scramble2 = ({ scores, teamTotals, users }) => {
    const [localScores, setLocalScores] = useState(Array(9).fill(''));

    const currentUser = auth.currentUser;
    const userId = currentUser.uid;
    const teamId = users[userId]?.teamId;

    const parValues = [3, 4, 3, 4, 5, 3, 5, 5, 4]; // Par values for each hole

    useEffect(() => {
        if (teamId) {
            const teamScoresRef = ref(rtdb, `scores/scramble2/${teamId}/holes`);
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
        const teamScoresRef = ref(rtdb, `scores/scramble2/${teamId}/holes`);
        const totalScore = localScores.reduce((acc, score) => acc + Number(score), 0);

        await set(teamScoresRef, localScores.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));

        await set(ref(rtdb, `scores/scramble2/${teamId}/total`), totalScore);

        // Update the team total
        const teamRef = ref(rtdb, `teams/${teamId}/scramble2Total`);
        await update(teamRef, { scramble2Total: totalScore });
    };

    const getTeamScores = (teamId) => {
        const teamScoresRef = ref(rtdb, `scores/scramble2/${teamId}/holes`);
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

    const calculateRelativeToPar = (teamScores) => {
        const playedHoles = teamScores.filter(score => score > 0).length;
        const totalScore = teamScores.reduce((acc, score) => acc + (score > 0 ? score : 0), 0);
        const parTotal = parValues.slice(0, playedHoles).reduce((acc, par) => acc + par, 0);
        const relativeToPar = totalScore - parTotal;
        return { relativeToPar, playedHoles };
    };

    const teamRows = [
        { teamName: 'AJJB', teamId: 'team1' },
        { teamName: 'CKCD', teamId: 'team3' },
        { teamName: 'BANA', teamId: 'team2' },
        { teamName: 'GMPM', teamId: 'team4' }
    ];

    const sortedTeamRows = teamRows.map(({ teamName, teamId }) => {
        const teamScores = getTeamScores(teamId);
        const { relativeToPar, playedHoles } = calculateRelativeToPar(teamScores);
        return {
            teamName,
            teamId,
            teamScores,
            relativeToPar,
            playedHoles
        };
    }).sort((a, b) => a.relativeToPar - b.relativeToPar);

    return (
        <div>
            <h1>2-man Scramble</h1>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {[...Array(9)].map((_, index) => (
                            <th key={index}>{10 + index}</th>
                        ))}
                        <th>Total</th>
                        <th>Thru</th>
                    </tr>
                    <tr>
                        <th>Yds</th>
                        <th>150</th>
                        <th>346</th>
                        <th>165</th>
                        <th>395</th>
                        <th>507</th>
                        <th>200</th>
                        <th>419</th>
                        <th>459</th>
                        <th>407</th>
                        <th>3048</th>
                        <th></th>
                    </tr>
                    <tr>
                        <th>Par</th>
                        {parValues.map((par, index) => (
                            <th key={index}>{par}</th>
                        ))}
                        <th>36</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamRows.map(({ teamName, teamId, teamScores, relativeToPar, playedHoles }) => (
                        <tr key={teamId}>
                            <td>{teamName}</td>
                            {teamScores.map((score, index) => (
                                <td key={index}>{score}</td>
                            ))}
                            <td>{relativeToPar === 0 ? 'E' : (relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar)}</td>
                            <td>{playedHoles}</td>
                        </tr>
                    ))}
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

export default Scramble2;
