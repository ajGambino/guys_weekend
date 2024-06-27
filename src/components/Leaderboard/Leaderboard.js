import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
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
    const [inputScores, setInputScores] = useState({ ownBall: [], alternateShot: [], scramble2: [], scramble4: [], shamble: [] });

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
        </div>
    );
};

export default Leaderboard;
