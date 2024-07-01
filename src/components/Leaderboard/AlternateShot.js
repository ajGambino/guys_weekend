import React, { useState, useEffect } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const AlternateShot = ({ scores, teamTotals, users }) => {
    const [localScores, setLocalScores] = useState(Array(9).fill(''));

    const currentUser = auth.currentUser;
    const userId = currentUser.uid;
    const teamId = users[userId]?.teamId;

    const parValues = [4, 4, 3, 4, 4, 5, 3, 4, 4]; // Par values for each hole

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
 // Allow empty input, which will be treated as zero
 if (value === '' || /^\d+$/.test(value)) {
    const newScores = [...localScores];
    newScores[holeIndex] = value === '' ? '0' : value; // Treat empty input as zero
    setLocalScores(newScores);
} else {
    alert('Please enter a valid score (0 or any positive whole number).');
}
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

    const calculateRelativeToPar = (teamScores) => {
        const playedHoles = teamScores.filter(score => score > 0).length;
        const totalScore = teamScores.reduce((acc, score) => acc + (score > 0 ? score : 0), 0);
        const parTotal = parValues.slice(0, playedHoles).reduce((acc, par) => acc + par, 0);
        const relativeToPar = totalScore - parTotal;
        return { relativeToPar, playedHoles };
    };

    const teamRows = [
        { teamName: 'AJ & Cleve', teamId: 'team1' },
        { teamName: 'Craig & Det', teamId: 'team3' },
        { teamName: 'NA$$TY & Aunkst', teamId: 'team2' },
        { teamName: 'Greg & Turtle', teamId: 'team4' }
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
        <div className="alt">
            <h3>Alternate Shot</h3>
            
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Score</th>
                        <th>Thru</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamRows.map(({ teamName, relativeToPar, playedHoles }) => (
                        <tr key={teamName}>
                            <td>{teamName}</td>
                            <td>{relativeToPar === 0 ? 'E' : (relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar)}</td>
                            <td>{playedHoles}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="styled-table">
                <thead>
                    <tr>
                        <th>#</th>
                        {[...Array(9)].map((_, index) => (
                            <th key={index}>{10 + index}</th>
                        ))}
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
                    </tr>
                    <tr>
                        <th>Par</th>
                        {parValues.map((par, index) => (
                            <th key={index}>{par}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamRows.map(({ teamName, teamId, teamScores }) => (
                        <tr key={teamId}>
                            <td>{teamName}</td>
                            {teamScores.map((score, index) => (
                                <td key={index}>{score}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3>Scorecard</h3>
            <div className="scorecard-row">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {[...Array(9)].map((_, index) => (
                    <div className="border" key={index}>
                        <label>Hole {10 + index}:</label>
                        <input
                            type="number"
                            value={localScores[index]}
                            onChange={(e) => handleChange(index, e.target.value)}
                            style={{ width: '40px' }} // Adjust width as needed
                        />
                    </div>
                ))}
                <button type="submit">Submit Scores</button>
            </form></div>
        </div>
    );
};

export default AlternateShot;
