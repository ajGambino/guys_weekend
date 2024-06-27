import React from 'react';


const PlayerForm = ({ label, id, value, onChange, playerNames }) => {
    let placeholder = '';
    if (id === 'winner') {
        placeholder = 'Select a winner';
    } else if (id === 'additional-winner') {
        placeholder = 'Select an additional winner';
    } else if (id === 'additional-loser') {
        placeholder = 'Select an additional loser';
    } else {
        placeholder = 'Select a loser';
    }

    const handleOnChange = (event) => {
        // Check if the input value is a number for the bet amount field
        if (id === 'amount' && isNaN(event.target.value)) {
            alert('Please enter a valid number for the bet amount.');
        } else {
            onChange(event);
        }
    };

    const handleOnBlur = () => {
        // Check if a winner and loser are both selected and not the same name
        if (id === 'winner' || id === 'loser') {
            const winnerValue = document.getElementById('winner').value;
            const loserValue = document.getElementById('loser').value;

            if (winnerValue === loserValue) {
                alert('Winner and loser cannot be the same name.');
            }
        }

        // Check if teams are selected and no name is used twice
        if (id === 'additional-winner' || id === 'additional-loser') {
            const teamMembers = [document.getElementById('winner').value, document.getElementById('loser').value, value];

            // Check if additional winner/loser is selected and not the same name as winner/loser
            if (teamMembers.includes(value)) {
                alert('A player cannot be on both teams.');
            }
        }
    };

    return (
        <div className='form'>
            <label htmlFor={id}>{label}:</label>
            <select
                id={id}
                value={value}
                onChange={handleOnChange}
                onBlur={handleOnBlur} // onBlur event to trigger validation after focus is lost
            >
                <option value=''>{placeholder}</option>
                {/* Render options from playerNames */}
                {playerNames.map((playerName, index) => (
                    <option key={index} value={playerName}>
                        {playerName}
                    </option>
                ))}
                {/* Add the 'ALL' option for the loser dropdown */}
                {id === 'loser' && <option value='ALL'>ALL</option>}
            </select>
        </div>
    );
};

export default PlayerForm;
