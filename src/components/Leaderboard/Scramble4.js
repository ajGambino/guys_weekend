import React, { useState, useEffect } from 'react';
import { ref, set, onValue, get, update } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const Scramble4 = ({ users }) => {
    const [localScores, setLocalScores] = useState(Array(9).fill(''));
    const [teamRows, setTeamRows] = useState([]);
    const [teamScores, setTeamScores] = useState({
        'teamScramble4_1': Array(9).fill(0),
        'teamScramble4_2': Array(9).fill(0),
    });
    const currentUser = auth.currentUser;
    const userId = currentUser.uid;
    const teamId = users[userId]?.teamId;
    const authorizedUID = "riyzNX38qTQ04YtB2tHOM5EP7Aj1"; 

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
                    setTeamScores(prev => ({ ...prev, [teamScramble4Id]: fetchedScores }));
                }
            });
        }
    }, [teamId]);

    useEffect(() => {
        const updateTeamRows = async () => {
            const teamRowsData = [
                { teamName: 'NA$$TY & Aunkst / Greg & Turtle', teamScramble4Id: 'teamScramble4_2' },
                { teamName: 'AJ & Cleve / Craig & Det', teamScramble4Id: 'teamScramble4_1' },
            ];

            const fetchedTeamRows = await Promise.all(
                teamRowsData.map(async ({ teamName, teamScramble4Id }) => {
                    const teamScores = await getTeamScores(teamScramble4Id);
                    const { relativeToPar, holesCompleted } = calculateRelativeToPar(teamScores);
                    return { teamName, teamScramble4Id, teamScores, relativeToPar, holesCompleted };
                })
            );

            fetchedTeamRows.sort((a, b) => a.relativeToPar - b.relativeToPar);
            setTeamRows(fetchedTeamRows);
        };

        updateTeamRows();
    }, [teamScores]);

    const handleChange = (holeIndex, value) => {
        if (value === '' || /^\d+$/.test(value)) {
            const newScores = [...localScores];
            newScores[holeIndex] = value;
            setLocalScores(newScores);
            handleSubmit(newScores); 
        } else {
            alert('Please enter a valid score (0 or any positive whole number).');
        }
    };

    const handleSubmit = async (newScores = localScores) => {
        const teamScramble4Id = teamId === 'team1' || teamId === 'team3' ? 'teamScramble4_1' : 'teamScramble4_2';
        const scoresToSubmit = newScores.map(score => (score === '' ? '0' : score));
        const totalScore = scoresToSubmit.reduce((acc, score) => acc + Number(score), 0);

        await set(ref(rtdb, `scores/scramble4/${teamScramble4Id}/total`), totalScore);
        await set(ref(rtdb, `scores/scramble4/${teamScramble4Id}/holes`), scoresToSubmit.reduce((acc, score, index) => {
            acc[index + 1] = Number(score);
            return acc;
        }, {}));
    };

    const getTeamScores = async (teamScramble4Id) => {
        const teamScoresRef = ref(rtdb, `scores/scramble4/${teamScramble4Id}/holes`);
        const snapshot = await get(teamScoresRef);
        const data = snapshot.val() || {};
        const teamScores = Array(9).fill(0);
        Object.keys(data).forEach(hole => {
            teamScores[hole - 1] = data[hole];
        });
        return teamScores;
    };

    const calculateRelativeToPar = (teamScores) => {
        const par = [4, 4, 5, 3, 4, 4, 4, 4, 3];
        let relativeToPar = 0;
        let holesCompleted = 0;
        teamScores.forEach((score, index) => {
            if (score !== 0) {
                relativeToPar += score - par[index];
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

        const teamScores1 = await getTeamScores('teamScramble4_1');
        const teamScores2 = await getTeamScores('teamScramble4_2');

        const { relativeToPar: relativeToPar1 } = calculateRelativeToPar(teamScores1);
        const { relativeToPar: relativeToPar2 } = calculateRelativeToPar(teamScores2);

        let results = [
            { teamID: 'team1', points: 0 },
            { teamID: 'team2', points: 0 },
            { teamID: 'team3', points: 0 },
            { teamID: 'team4', points: 0 },
        ];

        if (relativeToPar1 < relativeToPar2) {
            results[0].points = 3; // team1
            results[2].points = 3; // team3
        } else if (relativeToPar1 > relativeToPar2) {
            results[1].points = 3; // team2
            results[3].points = 3; // team4
        }

        for (const result of results) {
            const teamRef = ref(rtdb, `teams/${result.teamID}`);
            const snapshot = await get(teamRef);
            const teamData = snapshot.val();

            if (teamData) {
                const updatedTeam = {
                    ...teamData,
                    '4man': result.points,
                    'Pts': teamData['2man'] + result.points + teamData.alternate + teamData.own + teamData.shamble
                };
                await update(teamRef, updatedTeam);
            } else {
                console.log(`Team document with teamID ${result.teamID} does not exist`);
            }
        }
    };

    return (
        <div className='scramble4'>
            <div className='final'>
                <h3>4-man Scramble</h3>
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
                    {teamRows.map(({ teamName, relativeToPar, holesCompleted }, index) => (
                        <tr key={`${teamName}-${index}`}>
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
                        <th>4</th>
                        <th>4</th>
                        <th>5</th>
                        <th>3</th>
                        <th>4</th>
                        <th>4</th>
                        <th>4</th>
                        <th>4</th>
                        <th>3</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { teamName: 'NA$$TY & Aunkst / Greg & Turtle', teamScramble4Id: 'teamScramble4_2' },
                        { teamName: 'AJ & Cleve / Craig & Det', teamScramble4Id: 'teamScramble4_1' },
                    ].map(({ teamName, teamScramble4Id }, index) => (
                        <tr key={`${teamScramble4Id}-${index}`}>
                            <td>{teamName}</td>
                            {teamScores[teamScramble4Id].map((score, i) => (
                                <td key={i}>{score}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 className="scorecard-title">Scorecard</h3>
            <div className='scorecard-row'>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {[...Array(9)].map((_, index) => (
                        <div className="border input-container" key={index}>
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
        </div>
    );
};

export default Scramble4;
