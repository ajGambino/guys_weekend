import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import PlayerForm from './PlayerForm';
import { useAuth } from './AuthContext';

const PlaceBet = () => {
    const { currentUser } = useAuth();
    const [betAmount, setBetAmount] = useState('');
    const [betWinner, setBetWinner] = useState('');
    const [additionalWinner, setAdditionalWinner] = useState('');
    const [betLoser, setBetLoser] = useState('');
    const [additionalLoser, setAdditionalLoser] = useState('');
    const [betDescription, setBetDescription] = useState('golf');
    const [bets, setBets] = useState([]);
    const [playerNames, setPlayerNames] = useState([]);
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [otherDescription, setOtherDescription] = useState('');

    const description = betDescription === 'other' ? otherDescription : betDescription;

    const handleBetAmountChange = (event) => {
        setBetAmount(event.target.value);
    };

    const handleBetWinnerChange = (event) => {
        setBetWinner(event.target.value);
    };

    const handleAdditionalWinnerChange = (event) => {
        setAdditionalWinner(event.target.value);
    };

    const handleBetLoserChange = (event) => {
        setBetLoser(event.target.value);
    };

    const handleAdditionalLoserChange = (event) => {
        setAdditionalLoser(event.target.value);
    };

    const handleBetDescriptionChange = (event) => {
        const selectedDescription = event.target.value;
        setBetDescription(selectedDescription);

        if (selectedDescription !== 'other') {
            setOtherDescription('');
        }
    };

    const handleTeamSelectionClick = () => {
        setShowAdditionalFields(!showAdditionalFields);
    };

    useEffect(() => {
        const fetchPlayerNames = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'users'));
                const fetchedPlayerNames = snapshot.docs.map((doc) => doc.data().name);
                setPlayerNames(fetchedPlayerNames);
            } catch (error) {
                console.error('Error fetching player names:', error);
            }
        };

        fetchPlayerNames();
    }, []);

    useEffect(() => {
        const fetchBets = async () => {
            try {
                const betsRef = collection(db, 'bets');
                const snapshot = await getDocs(betsRef);
                const betData = snapshot.docs.map((doc) => doc.data());
                setBets(betData);
            } catch (error) {
                console.error('Error fetching bets:', error);
            }
        };

        fetchBets();
    }, []);

    
    const handlePlaceBet = async () => {
        const amount = Number(betAmount);

        // Validate that bet amount is not zero or negative
        if (amount <= 0) {
            alert('Please enter a valid bet amount greater than zero.');
            return;
        }

        // Validate that both winner and loser are selected
        if (!betWinner || !betLoser) {
            alert('Please select both a winner and a loser.');
            return;
        }

        // Check if the winner and loser are the same name
        if (betWinner === betLoser) {
            alert('Winner and loser cannot be the same name.');
            return;
        }

        // Check if teams are selected and no name is used twice
        if (showAdditionalFields) {
            const teamMembers = [betWinner, additionalWinner, betLoser, additionalLoser];
            const uniqueTeamMembers = new Set(teamMembers);

            if (teamMembers.length !== uniqueTeamMembers.size) {
                alert('A player cannot be on both teams or used twice.');
                return;
            }
        }

        try {
            const timestamp = serverTimestamp();
            const amount = Number(betAmount);

            const winnerQuerySnapshot = await getDocs(query(collection(db, 'users'), where('name', 'in', [betWinner, additionalWinner])));

            if (winnerQuerySnapshot.empty) {
                console.error('Error placing bet: Invalid winner or additional winner.');
                return;
            }

            winnerQuerySnapshot.forEach(async (winnerDoc) => {
                const winnerNet = winnerDoc.data().net || 0;
                await updateDoc(doc(db, 'users', winnerDoc.id), { net: winnerNet + amount });
            });

            if (betLoser === 'ALL') {
                const playersQuerySnapshot = await getDocs(collection(db, 'users'));

                playersQuerySnapshot.forEach(async (playerDoc) => {
                    const playerId = playerDoc.id;
                    if (!winnerQuerySnapshot.docs.some((doc) => doc.id === playerId)) {
                        const playerNet = playerDoc.data().net || 0;
                        await updateDoc(doc(db, 'users', playerDoc.id), { net: playerNet - amount });
                    }
                });

                winnerQuerySnapshot.forEach(async (winnerDoc) => {
                    const winnerNet = winnerDoc.data().net || 0;
                    await updateDoc(doc(db, 'users', winnerDoc.id), { net: winnerNet + 7 * amount });
                });
            } else {
                const loserQuerySnapshot = await getDocs(query(collection(db, 'users'), where('name', 'in', [betLoser, additionalLoser])));

                if (loserQuerySnapshot.empty) {
                    console.error('Error placing bet: Invalid loser or additional loser.');
                    return;
                }

                loserQuerySnapshot.forEach(async (loserDoc) => {
                    const loserNet = loserDoc.data().net || 0;
                    await updateDoc(doc(db, 'users', loserDoc.id), { net: loserNet - amount });
                });
            }

            const betRef = await addDoc(collection(db, 'bets'), {
                additionalLoser,
                additionalWinner,
                amount,
                confirmedBy: "",
                description,
                loser: betLoser,
                placedBy: currentUser.uid,
                timestamp,
                winner: betWinner,
            });

            const betSnapshot = await getDoc(betRef);
            const newBet = {
                id: betSnapshot.id,
                ...betSnapshot.data(),
            };

            setBets((prevBets) => [newBet, ...prevBets]);

            console.log('Bet placed successfully!');
            setBetAmount('');
            setBetWinner('');
            setAdditionalWinner('');
            setBetLoser('');
            setAdditionalLoser('');
            setBetDescription('golf');
        } catch (error) {
            console.error('Error placing bet:', error);
        }
    };

    return (
        <div className='bet-page'>
            <div className='bet-container'>
                <h1>Place a Bet</h1>
                {currentUser ? (
                    <>
                        <div className='bet-form-container'>
                          
                           <div className='bet-form'>
                            <div>
                                <label id="bet-amount-label" htmlFor="amount">Bet Amount: </label>
                                <input
                                    type="number"
                                    id="amount"
                                    value={betAmount}
                                    onChange={handleBetAmountChange}
                                    placeholder="$"
                                /></div>
                            
                            <PlayerForm
                                label="Winner"
                                id="winner"
                                value={betWinner}
                                onChange={handleBetWinnerChange}
                                playerNames={playerNames}
                            />
                            {showAdditionalFields && (
                                <>
                                    <PlayerForm
                                        label="Additional Winner"
                                        id="additional-winner"
                                        value={additionalWinner}
                                        onChange={handleAdditionalWinnerChange}
                                        playerNames={playerNames}
                                    />
                                </>
                            )}
                            <PlayerForm
                                label="Loser"
                                id="loser"
                                value={betLoser}
                                onChange={handleBetLoserChange}
                                playerNames={playerNames}
                            />
                            {showAdditionalFields && (
                                <>
                                    <PlayerForm
                                        label="Additional Loser"
                                        id="additional-loser"
                                        value={additionalLoser}
                                        onChange={handleAdditionalLoserChange}
                                        playerNames={playerNames}
                                    />
                                </>
                            )}
                            
                            <div>
                                <label htmlFor="description">Description:</label>
                                <select
                                    id="description"
                                    value={betDescription}
                                    onChange={handleBetDescriptionChange}
                                >
                                    <option value="golf">Golf</option>
                                    <option value="pool">Pool</option>
                                    <option value="bags">Bags</option>
                                    <option value="other">Other</option>
                                </select>
                                <br/>
                                {betDescription === 'other' && (
                                    <input id='other-input'
                                        type="text"
                                        value={otherDescription}
                                        onChange={(event) => setOtherDescription(event.target.value)}
                                        placeholder="Enter the custom description"
                                    />
                                )}
                            </div>
                            
                            <button onClick={handleTeamSelectionClick}>
                                {showAdditionalFields ? 'Hide Teams' : 'Teams?'}
                            </button>
                            <button onClick={handlePlaceBet}>Place Bet</button>
                            
                            </div>
                            <div className='recent-bets'>
                                <h2>Recent Bets</h2>
                                {bets.length === 0 ? (
                                    <p>No bets placed yet.</p>
                                ) : (
                                    <ul>
                                        {bets.slice(0, 5).map((bet, index) => {
                                            let sentence = '';

                                            if (bet.additionalWinner && bet.additionalLoser) {
                                                sentence = `${bet.winner} and ${bet.additionalWinner} won $${bet.amount} each from ${bet.loser} and ${bet.additionalLoser} in ${bet.description}.`;
                                            } else if (bet.additionalWinner) {
                                                sentence = `${bet.winner} and ${bet.additionalWinner} won $${bet.amount} each from ${bet.loser} in ${bet.description}.`;
                                            } else if (bet.additionalLoser) {
                                                sentence = `${bet.winner} won $${bet.amount} from ${bet.loser} and ${bet.additionalLoser} in ${bet.description}.`;
                                            } else if (bet.loser === 'ALL') {
                                                sentence = `${bet.winner} won $${bet.amount} from everyone in ${bet.description}.`;
                                            } else {
                                                sentence = `${bet.winner} won $${bet.amount} from ${bet.loser} in ${bet.description}.`;
                                            }

                                            return <li key={index}>{sentence}</li>;
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <p>Please log in to place a bet.</p>
                )}
            </div>
        </div>
    );
};

export default PlaceBet;
