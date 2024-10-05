// Function to handle the translation
async function translateWord() {
    const word = document.getElementById('wordInput').value;
    if (!word) {
        alert("Please enter a word");
        return;
    }

    try {
        // Call the backend to get the translation from OpenAI API
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
        const translatedWord = translationData.translation;

        // Display the translated word on the page
        document.getElementById('result').innerText = `Translation: ${translatedWord}`;

        // Update the saved words list
        displaySavedWords();
    } catch (error) {
        console.error("Translation failed", error);
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