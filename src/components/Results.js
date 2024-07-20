import React, { useEffect, useState } from 'react';
import {
	collection,
	query,
	orderBy,
	getDocs,
	doc,
	updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const Results = () => {
	const [results, setResults] = useState([]);

	useEffect(() => {
		const fetchResults = async () => {
			try {
				const betsQuery = query(
					collection(db, 'bets'),
					orderBy('timestamp', 'desc')
				);
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

	const handleConfirmBet = async (betId, result) => {
		const currentUser = auth.currentUser;
		const currentUserId = currentUser.uid;

		const isWinner = [result.winnerId, result.additionalWinnerId].includes(
			currentUserId
		);

		if (isWinner) {
			alert('Sorry, you cannot confirm a bet you won.');
			return;
		}

		try {
			const betRef = doc(db, 'bets', betId);
			await updateDoc(betRef, {
				confirmed: true,
				confirmedBy: currentUser.displayName,
			});

			setResults((prevResults) =>
				prevResults.map((res) => {
					if (res.id === betId) {
						return {
							...res,
							confirmed: true,
							confirmedBy: currentUser.displayName,
						};
					}
					return res;
				})
			);
		} catch (error) {
			console.error('Error confirming bet:', error);
		}
	};

	const handleVoidBet = async (betId, result) => {
		const currentUser = auth.currentUser;
		const currentUserId = currentUser.uid;

		const isLoser = [result.loserId, result.additionalLoserId].includes(
			currentUserId
		);

		if (isLoser) {
			alert('Sorry, you cannot void a bet you lost.');
			return;
		}

		try {
			await updateDoc(doc(db, 'bets', betId), { void: true });
			setResults((prevResults) =>
				prevResults.map((res) => {
					if (res.id === betId) {
						return { ...res, void: true };
					}
					return res;
				})
			);
		} catch (error) {
			console.error('Error voiding bet:', error);
		}
	};

	const currentUser = auth.currentUser;

	return (
		<div className='results-page'>
			<h2>History</h2>
			<div className='results-container'>
				{results.map((result, index) => {
					const matchNumber = results.length - index;
					return (
						<div className='result-item' key={result.id}>
							<h3>
								Match {matchNumber} -{' '}
								{result.timestamp?.toDate()?.toLocaleString()}
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
										{result.void ? (
											<p>This bet has been voided.</p>
										) : (
											<>
												<button
													className='confirm'
													onClick={() => handleConfirmBet(result.id, result)}
												>
													Confirm?
												</button>
												<button
													className='void'
													onClick={() => handleVoidBet(result.id, result)}
												>
													Void
												</button>
											</>
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
