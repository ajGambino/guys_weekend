import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Results = () => {
    const [results, setResults] = useState([]);

    const currentUser = auth.currentUser;  // Moved currentUser variable outside of functions

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const betsQuery = query(collection(db, 'bets'), orderBy('timestamp', 'desc'));
                const snapshot = await getDocs(betsQuery);
                const fetchedResults = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setResults(fetchedResults);
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };

        fetchResults();
    }, []);

    const handleConfirmBet = async (betId, placedBy, betData) => {
        if (betData.winner === currentUser.displayName || betData.additionalWinner === currentUser.displayName) {
            console.error("Sorry, you cannot confirm a bet you won.");
            return;
        }

        try {
            const betRef = doc(db, 'bets', betId);
            await updateDoc(betRef, {
                confirmed: true,
                confirmedBy: currentUser.displayName,
            });

            const amount = betData.amount;

            const updateNet = async (userId, netChange) => {
                const userRef = doc(db, 'users', userId);
                const userSnapshot = await getDoc(userRef);
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    const newNet = (userData.net || 0) + netChange;
                    await updateDoc(userRef, { net: newNet });
                }
            };

            const winnerQuery = query(collection(db, 'users'), where('name', 'in', [betData.winner, betData.additionalWinner]));
            const loserQuery = query(collection(db, 'users'), where('name', 'in', [betData.loser, betData.additionalLoser]));

            const winnerSnapshot = await getDocs(winnerQuery);
            const loserSnapshot = await getDocs(loserQuery);

            winnerSnapshot.forEach((doc) => updateNet(doc.id, amount));
            loserSnapshot.forEach((doc) => updateNet(doc.id, -amount));

            setResults((prevResults) =>
                prevResults.map((result) => {
                    if (result.id === betId) {
                        return { ...result, confirmed: true, confirmedBy: currentUser.displayName };
                    }
                    return result;
                })
            );
        } catch (error) {
            console.error('Error confirming bet:', error);
        }
    };

    const handleVoidBet = async (betId, betData) => {
        if (betData.loser === currentUser.displayName || betData.additionalLoser === currentUser.displayName) {
            console.error("Sorry, you cannot void a bet you lost.");
            return;
        }

        try {
            await deleteDoc(doc(db, 'bets', betId));
            setResults((prevResults) => prevResults.filter((result) => result.id !== betId));
        } catch (error) {
            console.error('Error voiding bet:', error);
        }
    };

    return (
        <div className="results-page">
            <h2>History</h2>
            <div className="results-container">
                {results.map((result, index) => {
                    const matchNumber = results.length - index;
                    return (
                        <div className='result-item' key={result.id}>
                            <h3>
                                Match {matchNumber} - {result.timestamp?.toDate()?.toLocaleString()}
                            </h3>
                            <p>
                                Winner: {result.winner}
                                {result.additionalWinner && `, ${result.additionalWinner}`}
                            </p>
                            <p>
                                Loser: {result.loser}
                                {result.additionalLoser && `, ${result.additionalLoser}`}
                            </p>
                            <p>Amount: ${result.amount}</p>
                            <p>Description: {result.description}</p>
                            {result.confirmed ? (
                                <p>Confirmed by: {result.confirmedBy}</p>
                            ) : (
                                <>
                                    {currentUser && currentUser.displayName !== result.winner && currentUser.displayName !== result.additionalWinner && (
                                        <button className='confirm' onClick={() => handleConfirmBet(result.id, result.placedBy, result)}>
                                            Confirm?
                                        </button>
                                    )}
                                    {currentUser && currentUser.displayName !== result.loser && currentUser.displayName !== result.additionalLoser && (
                                        <button className='void' onClick={() => handleVoidBet(result.id, result)}>
                                            Void?
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Results;
