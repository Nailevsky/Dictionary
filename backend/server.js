require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODBURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Define a model for storing words
const WordSchema = new mongoose.Schema({
    word: { type: String, unique: true },
    translation: String,
    user: String, // optional field for storing words for specific users
});

const Word = mongoose.model('Word', WordSchema);

// Translation endpoint using OpenAI API
app.post('/api/translate', async (req, res) => {
    try {
        let { word } = req.body;

        // Normalize the word (convert to lowercase and trim spaces)
        word = word.trim().toLowerCase();

        // Check if the normalized word is already in the database
        const existingWord = await Word.findOne({ word });
        if (existingWord) {
            // If the word already exists, return the existing translation
            return res.send({ translation: existingWord.translation });
        }

        // Use OpenAI API to get the translation if not found in the database
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: `Translate to Russian: ${word}` }
            ],
            max_tokens: 10,
            temperature: 0.5
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        // Extract the translated text
        const translatedText = response.data.choices[0].message.content.trim();

        // Save the translated word to MongoDB for future reference
        const newWord = new Word({ word, translation: translatedText });
        await newWord.save();

        // Send the translated word back to the client
        res.send({ translation: translatedText });
    } catch (error) {
        console.error('Error translating word:', error.response ? error.response.data : error.message);
        res.status(500).send({ error: 'Unable to translate word' });
    }
});


// Routes for creating, getting, and deleting words
app.post('/api/words', async (req, res) => {
    try {
        const { word, translation, user } = req.body;
        const newWord = new Word({ word, translation, user });
        await newWord.save();
        res.status(201).send(newWord);
    } catch (error) {
        res.status(500).send({ error: 'Unable to save the word' });
    }
});

app.get('/api/words', async (req, res) => {
    try {
        const words = await Word.find();
        res.send(words);
    } catch (error) {
        res.status(500).send({ error: 'Unable to fetch words' });
    }
});

app.delete('/api/words/:id', async (req, res) => {
    try {
        const word = await Word.findByIdAndDelete(req.params.id);
        if (!word) {
            return res.status(404).send({ error: 'Word not found' });
        }
        res.send(word);
    } catch (error) {
        res.status(500).send({ error: 'Unable to delete word' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});