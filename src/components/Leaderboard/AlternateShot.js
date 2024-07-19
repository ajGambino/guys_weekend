import React, { useState, useEffect } from 'react';
import { ref, set, onValue, get, update } from 'firebase/database';
import { rtdb, auth } from '../../firebase';

const AlternateShot = ({ users }) => {
	const [localScores, setLocalScores] = useState(Array(9).fill(''));
	const [teamScores, setTeamScores] = useState({
		team1: Array(9).fill(0),
		team2: Array(9).fill(0),
		team3: Array(9).fill(0),
		team4: Array(9).fill(0),
	});

	const currentUser = auth.currentUser;
	const userId = currentUser.uid;
	const teamId = users[userId]?.teamId;
	const authorizedUID = 'riyzNX38qTQ04YtB2tHOM5EP7Aj1';

	const parValues = [4, 4, 3, 4, 4, 5, 3, 4, 4]; // Par values for each hole

	useEffect(() => {
		if (teamId) {
			const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
			onValue(teamScoresRef, (snapshot) => {
				const data = snapshot.val();
				if (data) {
					const fetchedScores = Array(9).fill(0);
					Object.keys(data).forEach((hole) => {
						fetchedScores[hole - 1] = data[hole];
					});
					setTeamScores((prev) => ({ ...prev, [teamId]: fetchedScores }));
				}
			});
		}
	}, [teamId]);

	useEffect(() => {
		const updateTeamScores = () => {
			const teams = ['team1', 'team2', 'team3', 'team4'];
			teams.forEach((teamId) => {
				const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
				onValue(teamScoresRef, (snapshot) => {
					const data = snapshot.val();
					if (data) {
						const fetchedScores = Array(9).fill(0);
						Object.keys(data).forEach((hole) => {
							fetchedScores[hole - 1] = data[hole];
						});
						setTeamScores((prev) => ({ ...prev, [teamId]: fetchedScores }));
					}
				});
			});
		};

		updateTeamScores();
	}, []);

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
		const userId = currentUser.uid;
		const teamId = users[userId]?.teamId;

		const scoresToSubmit = newScores.map((score) =>
			score === '' ? '0' : score
		);
		const totalScore = scoresToSubmit.reduce(
			(acc, score) => acc + Number(score),
			0
		);

		const userScoresRef = ref(rtdb, `scores/alternateShot/${userId}/holes`);
		await set(
			userScoresRef,
			scoresToSubmit.reduce((acc, score, index) => {
				acc[index + 1] = Number(score);
				return acc;
			}, {})
		);

		await set(ref(rtdb, `scores/alternateShot/${userId}/total`), totalScore);

		const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
		const teamSnapshot = await get(teamScoresRef);
		const teamData = teamSnapshot.val() || {};
		const updatedTeamData = { ...teamData };

		scoresToSubmit.forEach((score, index) => {
			updatedTeamData[index + 1] = Number(score);
		});

		await set(teamScoresRef, updatedTeamData);
	};

	const calculateRelativeToPar = (teamScores) => {
		const playedHoles = teamScores.filter((score) => score > 0).length;
		const totalScore = teamScores.reduce(
			(acc, score) => acc + (score > 0 ? score : 0),
			0
		);
		const parTotal = parValues
			.slice(0, playedHoles)
			.reduce((acc, par) => acc + par, 0);
		const relativeToPar = totalScore - parTotal;
		return { relativeToPar, holesCompleted: playedHoles };
	};

	const updateLeaderboard = async () => {
		if (userId !== authorizedUID) {
			alert('Only AJ can process leaderboard points');
			return;
		}

		const teamRowsData = [
			{ teamId: 'team1' },
			{ teamId: 'team2' },
			{ teamId: 'team3' },
			{ teamId: 'team4' },
		];

		const teamScoresArray = await Promise.all(
			teamRowsData.map(async ({ teamId }) => {
				const teamScores = await getTeamScores(teamId);
				const { relativeToPar } = calculateRelativeToPar(teamScores);
				return { teamId, relativeToPar };
			})
		);

		teamScoresArray.sort((a, b) => a.relativeToPar - b.relativeToPar);

		const pointsDistribution = [5, 3, 1, 0];
		let pointsArray = [0, 0, 0, 0];
		for (let i = 0; i < teamScoresArray.length; i++) {
			let tieCount = 1;
			let sumPoints = pointsDistribution[i];

			while (
				i + tieCount < teamScoresArray.length &&
				teamScoresArray[i].relativeToPar ===
					teamScoresArray[i + tieCount].relativeToPar
			) {
				sumPoints += pointsDistribution[i + tieCount];
				tieCount++;
			}

			const points = (sumPoints / tieCount).toFixed(2);
			for (let j = 0; j < tieCount; j++) {
				pointsArray[i + j] = points;
			}

			i += tieCount - 1;
		}

		for (let i = 0; i < teamScoresArray.length; i++) {
			const { teamId } = teamScoresArray[i];
			const points = pointsArray[i];

			const teamRef = ref(rtdb, `teams/${teamId}`);
			const snapshot = await get(teamRef);
			const teamData = snapshot.val();

			if (teamData) {
				const newPoints = parseFloat(points);
				const totalPoints =
					parseFloat(teamData['2man']) +
					parseFloat(teamData['4man']) +
					parseFloat(teamData.own) +
					parseFloat(teamData.shamble) +
					newPoints;

				await update(teamRef, {
					alternate: newPoints,
					Pts: totalPoints,
					total: totalPoints,
				});
			} else {
				console.log(`Team document with teamID ${teamId} does not exist`);
			}
		}
	};

	useEffect(() => {
		if (teamId) {
			const teamScoresRef = ref(rtdb, `scores/alternateShot/${teamId}/holes`);
			onValue(teamScoresRef, (snapshot) => {
				const data = snapshot.val();
				if (data) {
					const fetchedScores = Array(9).fill(0);
					Object.keys(data).forEach((hole) => {
						fetchedScores[hole - 1] = data[hole];
					});
					setTeamScores((prev) => ({ ...prev, [teamId]: fetchedScores }));
				}
			});
		}
	}, [teamId]);

	return (
		<div className='alt'>
			<div className='final'>
				<h3>Alternate Shot</h3>
				<button onClick={updateLeaderboard}>Final</button>
			</div>
			<table className='styled-table'>
				<thead>
					<tr>
						<th>Team</th>
						<th>Score</th>
						<th>Thru</th>
					</tr>
				</thead>
				<tbody>
					{teamRows.map(({ teamName, relativeToPar, holesCompleted }) => (
						<tr key={teamName}>
							<td>{teamName}</td>
							<td>
								{relativeToPar === 0
									? 'E'
									: relativeToPar > 0
									? `+${relativeToPar}`
									: relativeToPar}
							</td>
							<td>{holesCompleted}</td>
						</tr>
					))}
				</tbody>
			</table>

			<table className='styled-table'>
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
					{[
						{ teamName: 'AJ & Cleve', teamId: 'team1' },
						{ teamName: 'Craig & Det', teamId: 'team3' },
						{ teamName: 'NA$$TY & Aunkst', teamId: 'team2' },
						{ teamName: 'Greg & Turtle', teamId: 'team4' },
					].map(({ teamName, teamId }) => {
						const scores = teamScores[teamId];
						return (
							<tr key={teamId}>
								<td>{teamName}</td>
								{scores.map((score, index) => (
									<td key={index}>{score}</td>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>

			<h3 className='scorecard-title'>Scorecard</h3>
			<div className='scorecard-row'>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					{[...Array(9)].map((_, index) => (
						<div className='border input-container' key={index}>
							<label>Hole #{10 + index}:</label>
							<input
								type='number'
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

export default AlternateShot;
