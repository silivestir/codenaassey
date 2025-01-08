let dictionary = [];
let chosenCharacters = [];
let speechSynthesisAvailable = true;
let recognition;

// Function to load the dictionary from the file
async function loadDictionary() {
    const response = await fetch("file.txt");
    const data = await response.text();

    // Split data into lines and filter out comments and metadata
    const entries = data
        .split('\n')
        .filter(line => line.trim() !== '') // Remove empty lines
        .map(line => {
            // Match lines in the format: character pinyin pronunciation definition
            const match = line.match(/^([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+)$/);
            if (match) {
                return {
                    character: match[1],
                    pinyin: match[2].trim(),
                    pronunciation: match[3].trim(),
                    definition: match[4].trim()
                };
            }
        })
        .filter(Boolean); // Remove any null entries

    dictionary = entries;
}

// Function to check speech synthesis support
function checkSpeechSynthesis() {
    speechSynthesisAvailable = 'speechSynthesis' in window;
}

// Function to speak the Pinyin
function speak(pinyin) {
    if (speechSynthesisAvailable) {
        const utterance = new SpeechSynthesisUtterance(pinyin);
        window.speechSynthesis.speak(utterance);
    } else {
        alert('Speech synthesis not supported in this browser.');
    }
}

// Function to initialize speech recognition
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'zh-CN'; // Set to simplified Chinese
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            alert(`You said: ${transcript}`);
            validateSpeech(transcript);
        };

        recognition.onerror = (event) => {
            alert('Speech recognition error: ' + event.error);
        };
    } else {
        alert('Speech recognition not supported in this browser.');
    }
}

// Function to validate the recognized speech
function validateSpeech(transcript) {
    const correctPinyin = chosenCharacters.map(entry => entry.pinyin).join(' ');
    if (transcript === correctPinyin) {
        alert('Correct pronunciation! You level up!');
        chosenCharacters = [];
        displayRandomWord(); // Proceed with the next character
    } else {
        alert('Incorrect pronunciation, try again!');
    }
}

// Function to display a random word from the dictionary
function displayRandomWord() {
    const randomIndex = Math.floor(Math.random() * dictionary.length);
    const wordEntry = dictionary[randomIndex];

    document.getElementById('chinese-word').textContent = wordEntry.character;
    document.getElementById('pinyin').textContent = `Pinyin: ${wordEntry.pinyin}`;
    document.getElementById('definition').textContent = `Definition: ${wordEntry.definition}`;

    chosenCharacters.push(wordEntry);

    // After 5 characters, show generated sentence
    if (chosenCharacters.length === 5) {
        generateSentence();
    } else {
        const svg = document.getElementById('character-svg');
        svg.innerHTML = ''; // Clear previous SVG
        generatePath(wordEntry.character);
    }
}

// Function to generate a sentence from selected characters
function generateSentence() {
    const combinedCharacters = chosenCharacters.map(entry => entry.character).join('');
    const combinedPinyin = chosenCharacters.map(entry => entry.pinyin).join(' ');

    const sentenceDisplay = document.createElement('h2');
    sentenceDisplay.textContent = combinedCharacters;
    document.body.appendChild(sentenceDisplay);

    const pinyinOptions = generatePinyinOptions(combinedPinyin);
    displayPinyinOptions(pinyinOptions, combinedPinyin);
}

// Function to generate Pinyin options
function generatePinyinOptions(correctPinyin) {
    const options = new Set();
    options.add(correctPinyin);

    while (options.size < 4) {
        const randomIndex = Math.floor(Math.random() * dictionary.length);
        const randomPinyin = dictionary[randomIndex].pinyin.trim();
        options.add(randomPinyin);
    }

    return Array.from(options).sort(() => Math.random() - 0.5);
}

// Function to display Pinyin options
function displayPinyinOptions(options, correctAnswer) {
    const optionContainer = document.createElement('div');
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.addEventListener('click', () => {
            checkAnswer(option, correctAnswer);
        });
        optionContainer.appendChild(button);
    });
    document.body.appendChild(optionContainer);
}

// Function to check the user's answer
function checkAnswer(selected, correctAnswer) {
    if (selected === correctAnswer) {
        alert('Correct! You level up!');
        chosenCharacters = [];
        displayRandomWord();
    } else {
        alert('Incorrect! Try again.');
    }
}

// Function to generate the SVG path for a character
function generatePath(character) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = '48px SimSun';
    ctx.fillText(character, 0, 48);

    const svgData = new XMLSerializer().serializeToString(canvas);
    const svg = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg);

    const img = new Image();
    img.onload = () => {
        const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement.setAttribute("d", `M0,0 ${ctx.measureText(character).width} ${ctx.measureText(character).actualBoundingBoxAscent}`);
        pathElement.setAttribute("stroke", "black");
        pathElement.setAttribute("stroke-width", 2);
        pathElement.setAttribute("fill", "none");
        document.getElementById('character-svg').appendChild(pathElement);
        animateDrawing(pathElement);
    };

    img.src = url;
}

// Function to animate the drawing of a character
function animateDrawing(pathElement) {
    const animationDuration = 3000; // 3 seconds
    const steps = animationDuration / 10; // Define steps based on duration
    let currentStep = 0;

    const animate = () => {
        currentStep++;
        const percent = currentStep / steps;
        pathElement.setAttribute('stroke-dasharray', `${percent * 100} ${100}`);
        if (percent < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// Event listeners for the buttons
document.getElementById('next-word').addEventListener('click', displayRandomWord);
document.getElementById('speak-button').addEventListener('click', () => {
    const pinyinText = document.getElementById('pinyin').textContent.replace('Pinyin: ', '');
    speak(pinyinText);
});
document.getElementById('recognize-button').addEventListener('click', () => {
    if (recognition) {
        recognition.start();
    }
});

// Load the dictionary and display the first word
loadDictionary().then(() => {
    displayRandomWord();
    checkSpeechSynthesis();
    initializeSpeechRecognition();
});