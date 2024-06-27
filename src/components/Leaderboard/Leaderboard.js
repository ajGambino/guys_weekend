import React, { useState, useEffect } from 'react';
import { ref, onValue, get, update } from 'firebase/database';
import { rtdb } from '../../firebase';
import AlternateShot from './AlternateShot';
import OwnBall from './OwnBall';
import Scramble2 from './Scramble2';
import Scramble4 from './Scramble4';
import Shamble from './Shamble';

const Leaderboard = () => {
    const [currentFormat, setCurrentFormat] = useState('ownBall');
    const [users, setUsers] = useState({});
    const [scores, setScores] = useState({});
    const [teams, setTeams] = useState({});

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
    }, []);

    const calculateTeamTotals = () => {
        const teamTotals = {};
        for (const userId in scores) {
            const userScore = scores[userId];
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

    const teamTotals = calculateTeamTotals();

    const renderCurrentFormat = () => {
        switch (currentFormat) {
            case 'ownBall':
                return <OwnBall scores={scores} teamTotals={teamTotals} users={users} />;
            case 'alternateShot':
                return <AlternateShot scores={scores} teamTotals={teamTotals} users={users} />;
            case 'scramble2':
                return <Scramble2 scores={scores} teamTotals={teamTotals} users={users} />;
            case 'scramble4':
                return <Scramble4 scores={scores} teamTotals={teamTotals} users={users} />;
            case 'shamble':
                return <Shamble scores={scores} teamTotals={teamTotals} users={users} />;
            default:
                return <OwnBall scores={scores} teamTotals={teamTotals} users={users} />;
        }
    };

    const getUserName = (userId) => {
        return users[userId]?.name || userId;
    };

    return (
        <div>
            <h1>GW Leaderboard</h1>
            <nav>
                <button onClick={() => setCurrentFormat('ownBall')}>Own Ball</button>
                <button onClick={() => setCurrentFormat('alternateShot')}>Alternate Shot</button>
                <button onClick={() => setCurrentFormat('scramble2')}>Scramble 2</button>
                <button onClick={() => setCurrentFormat('scramble4')}>Scramble 4</button>
                <button onClick={() => setCurrentFormat('shamble')}>Shamble</button>
            </nav>
            {renderCurrentFormat()}

            <h2>Scores</h2>
            <ul>
                {Object.entries(scores).map(([userId, scoreData]) => (
                    <li key={userId}>
                        {getUserName(userId)}: {scoreData.total}
                    </li>
                ))}
            </ul>

            <h2>Team Totals</h2>
            <ul>
                {Object.entries(teamTotals).map(([teamId, total]) => (
                    <li key={teamId}>
                        {teams[teamId]?.name || teamId}: {total}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Leaderboard;
