import React, { useEffect, useState } from 'react';
import {  collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Import your initialized Firebase services

const Results = () => {
    const [results, setResults] = useState([]);

    useEffect(() => {
        // Fetch results from Firebase Firestore
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

    // Logic for confirming the bet
    const handleConfirmBet = async (betId, placedBy) => {
        const currentUser = auth.currentUser;

        if (currentUser.uid === placedBy) {
            console.error("Sorry, you cannot confirm a bet you recorded.");
            return;
        }

        try {
            // Update the Firestore document with the user's name in the confirmedBy field
            const betRef = doc(db, 'bets', betId);
            await updateDoc(betRef, {
                confirmed: true,
                confirmedBy: currentUser.displayName,
            });

            // Update the results state to reflect the updated confirmation
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

    const currentUser = auth.currentUser;

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
                                currentUser && (
                                    <>
                                        {currentUser.uid === result.placedBy ? (
                                            <p>Sorry, you cannot confirm a bet you recorded.</p>
                                        ) : (
                                            <button onClick={() => handleConfirmBet(result.id, result.placedBy)}>
                                                Confirm?
                                            </button>
                                        )}
                                    </>
                                )
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Results;
