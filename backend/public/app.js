// Function to handle the translation
async function translateWord() {
    const word = document.getElementById('wordInput').value;
    if (!word) {
        alert("Please enter a word");
        return;
    }

    try {
        // Call the backend to get multiple translation options
        const translationResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word: word })
        });

        if (!translationResponse.ok) {
            throw new Error('Translation request failed');
        }

        const translationData = await translationResponse.json();
        const translationOptions = translationData.options;

        // Log the options to verify they are correctly received
        console.log("Translation options received from backend:", translationOptions);

        // Display the translation options to the user
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '';  // Clear previous results

        if (translationOptions.length > 0) {
            const heading = document.createElement('p');
            heading.innerText = 'Choose a translation:';
            resultDiv.appendChild(heading);
        }

        translationOptions.forEach((option) => {
            const optionButton = document.createElement('button');
            optionButton.innerText = option;
            optionButton.onclick = () => {
                console.log(`User selected translation: ${option}`);
                saveTranslation(word, option);
            };
            resultDiv.appendChild(optionButton);
        });
    } catch (error) {
        console.error("Translation failed", error);
    }
}

// Function to save the selected translation
async function saveTranslation(word, translation) {
    try {
        // Normalize the word and translation before saving
        word = word.trim().toLowerCase();
        translation = translation.trim();

        // Log what is being saved
        console.log(`Saving word: ${word}, translation: ${translation}`);

        // Call the backend to save the selected translation
        const response = await fetch('/api/save-translation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word, translation })
        });

        if (response.ok) {
            console.log('Translation saved successfully');
            // Update the saved words list
            displaySavedWords();
        } else {
            console.error('Failed to save translation');
        }
    } catch (error) {
        console.error("Error saving translation", error);
    }
}

// Fetch saved words from MongoDB
async function displaySavedWords() {
    try {
        const response = await fetch('/api/words');
        const words = await response.json();
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = '';

        words.forEach(item => {
            const li = document.createElement('li');
            li.innerText = `${item.word} - ${item.translation}`;
            li.appendChild(createDeleteButton(item._id));
            wordList.appendChild(li);
        });
    } catch (error) {
        console.error('Unable to fetch saved words', error);
    }
}

// Create a delete button for each saved word
function createDeleteButton(id) {
    const button = document.createElement('button');
    button.innerText = 'Delete';
    button.onclick = async () => {
        try {
            const response = await fetch(`/api/words/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                displaySavedWords();
            } else {
                console.error('Failed to delete word');
            }
        } catch (error) {
            console.error('Unable to delete word', error);
        }
    };
    return button;
}

// Load saved words when the page loads
document.addEventListener('DOMContentLoaded', displaySavedWords);