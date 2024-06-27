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

    const getTeamScores = (teamScramble4Id) => {
        const teamScoresRef = ref(rtdb, `scores/scramble4/${teamScramble4Id}/holes`);
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
        { teamName: 'AJJB CKCD', teamScramble4Id: 'teamScramble4_1' },
        { teamName: 'BANA GMPM', teamScramble4Id: 'teamScramble4_2' }
    ];

    return (
        <div>
            <h1>4-man Scramble</h1>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>#</th>
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
                    {teamRows.map(({ teamName, teamScramble4Id }) => {
                        const teamScores = getTeamScores(teamScramble4Id);
                        const teamTotal = teamScores.reduce((acc, score) => acc + score, 0);
                        return (
                            <tr key={teamScramble4Id}>
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

         
        </div>
    );
};

export default Scramble4;
