import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb, db } from '../../firebase';
import AlternateShot from './AlternateShot';
import OwnBall from './OwnBall';
import Scramble2 from './Scramble2';
import Scramble4 from './Scramble4';
import Shamble from './Shamble';
import { collection, getDocs } from 'firebase/firestore';

const Leaderboard = () => {
    const [currentFormat, setCurrentFormat] = useState('ownBall');
    const [users, setUsers] = useState({});
    const [scores, setScores] = useState({});
    const [teams, setTeams] = useState({});
    const [inputScores, setInputScores] = useState({ ownBall: [], alternateShot: [], scramble2: [], scramble4: [], shamble: [] });
    const [teamData, setTeamData] = useState([]);

    useEffect(() => {
        const usersRef = ref(rtdb, 'users');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            setUsers(data || {});
        });

        const scoresRef = ref(rtdb, 'scores');
        onValue(scoresRef, (snapshot) => {
            const data = snapshot.val();
            setScores(data || {});
        });

        const teamsRef = ref(rtdb, 'teams');
        onValue(teamsRef, (snapshot) => {
            const data = snapshot.val();
            setTeams(data || {});
        });

        const fetchTeamsData = async () => {
            const querySnapshot = await getDocs(collection(db, "teams"));
            const teamsData = querySnapshot.docs.map(doc => doc.data());
            setTeamData(teamsData);
        };

        fetchTeamsData();
    }, []);

    const calculateTeamTotals = (format) => {
        const teamTotals = {};
        for (const userId in (scores[format] || {})) {
            const userScore = scores[format][userId];
            const user = users[userId];
            if (user) {
                const teamId = user.teamId;
                if (!teamTotals[teamId]) {
                    teamTotals[teamId] = 0;
                }
                teamTotals[teamId] += userScore.total;
            }
        }
        return teamTotals;
    };

    const handleInputChange = (format, userScores) => {
        setInputScores((prevInputScores) => ({
            ...prevInputScores,
            [format]: userScores,
        }));
    };

    const renderCurrentFormat = () => {
        const formatProps = {
            scores: scores[currentFormat] || {},
            teamTotals: calculateTeamTotals(currentFormat),
            users: users,
            userScores: inputScores[currentFormat],
            onInputChange: (userScores) => handleInputChange(currentFormat, userScores),
        };

        switch (currentFormat) {
            case 'ownBall':
                return <OwnBall {...formatProps} />;
            case 'alternateShot':
                return <AlternateShot {...formatProps} />;
            case 'scramble2':
                return <Scramble2 {...formatProps} />;
            case 'scramble4':
                return <Scramble4 {...formatProps} />;
            case 'shamble':
                return <Shamble {...formatProps} />;
            default:
                return <OwnBall {...formatProps} />;
        }
    };

    const sortedTeamData = [...teamData].sort((a, b) => b.Pts - a.Pts);

    return (
        <div className='leaderboard'>
            <h1>Leaderboard</h1>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>4-man</th>
                        <th>Alt</th>
                        <th>Own</th>
                        <th>Sham</th>
                        <th>2-man</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTeamData.map((team, index) => (
                        <tr key={index}>
                            <td>{team.TeamName}</td>
                            <td>{team['4man']}</td>
                            <td>{team.alternate}</td>
                            <td>{team.own}</td>
                            <td>{team.shamble}</td>
                            <td>{team['2man']}</td>
                            <td>{team.Pts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className='nav-container'>
            <nav>
                <h6>Fri. Elkdale:</h6>
                <button className="nav-btn" onClick={() => setCurrentFormat('scramble4')}>4-man Scramble</button>
                <button className="nav-btn" onClick={() => setCurrentFormat('alternateShot')}>Alternate Shot</button>
                <button className="nav-btn" onClick={() => setCurrentFormat('ownBall')}>Own Ball</button>
                </nav>
            <nav>    
                <h6>Sat. Holiday Valley:</h6>
                <button className="nav-btn" onClick={() => setCurrentFormat('shamble')}>Shamble</button>
                <button className="nav-btn" onClick={() => setCurrentFormat('scramble2')}>2-man Scramble</button>
            </nav>
            </div>
            {renderCurrentFormat()}
        </div>
    );
};

export default Leaderboard;
