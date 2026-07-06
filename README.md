# EduGuide Bot

EduGuide Bot is an AI-powered educational assistant designed to provide a personalized and interactive learning experience. Originally developed during a hackathon and later improved as a personal project, it generates structured learning paths tailored to the user's chosen topic and skill level.

The application leverages the Groq API and the Llama 3.3 70B Versatile model to deliver fast, contextual, and interactive educational conversations.

---

## Features

- Personalized learning paths based on the selected topic
- Beginner, Intermediate, and Advanced learning levels
- AI-generated course roadmap
- Interactive lessons with comprehension questions
- Real-time streaming responses
- Context-aware conversations
- Automatic language adaptation based on the user's input
- Session statistics and learning progress tracking
- Responsive interface for desktop and mobile devices

---

## Installation

### Prerequisites

- Node.js 18 or later
- A Groq API key

### Setup

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/eduguide-bot.git
cd eduguide-bot
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_GROQ_API_KEY=your_groq_api_key
```

Start the development server:

```bash
npm run dev
```

Open your browser at:

```
http://localhost:5173
```

---

## Getting a Groq API Key

1. Create a free account on the Groq Console.
2. Generate a new API key.
3. Create a `.env` file in the project root.
4. Add your key:

```env
VITE_GROQ_API_KEY=your_groq_api_key
```

The `.env` file is ignored by Git and should never be committed to the repository.

---

## Project Structure

```
eduguide-bot/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── src/
    ├── main.ts
    ├── styles/
    │   └── main.css
    ├── types/
    │   └── index.ts
    └── utils/
        ├── gemini.ts
        └── helpers.ts
```

> **Note:** The file `gemini.ts` currently contains the Groq integration and can be renamed to `groq.ts` for better clarity.

---

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Application development |
| Vite | Build tool and development server |
| Groq SDK | AI inference |
| Llama 3.3 70B Versatile | Large Language Model |
| HTML5 & CSS3 | User interface |

---

## How It Works

1. Select a topic to learn.
2. Choose a difficulty level.
3. EduGuide generates a complete learning roadmap.
4. Lessons are presented sequentially.
5. After each lesson, the assistant asks a comprehension question.
6. The next lesson is unlocked only after the learner demonstrates understanding.

---

## Future Improvements

- User authentication
- Persistent learning history
- Progress dashboard
- Export lessons as PDF
- Voice interaction
- Multiple AI model support
- Quizzes and achievement badges

---

## Acknowledgements

This project was originally developed during a hackathon and later enhanced as a personal project to explore the use of Large Language Models in personalized education.

---

## License

This project is licensed under the MIT License.

---

Made with TypeScript, Vite, and Groq AI.