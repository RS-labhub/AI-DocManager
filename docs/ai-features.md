# AI Features

R's DocManager integrates AI directly into your document workflow. Use your own API keys with no vendor lock-in.

## Supported providers

| Provider | Free tier | Best for |
|----------|-----------|----------|
| Groq | Yes | Fast inference, getting started |
| OpenAI | No | Highest quality output |
| Anthropic | No | Long documents, nuanced analysis |

## Setting up your API key

1. Click your profile avatar then **AI API Keys**
2. Select a provider and paste your API key
3. Your key is encrypted with **AES-256-GCM** before storage

## Available actions

### Summarize

Generates a concise summary of the document content.

### Analyze Sentiment

Determines the tone: positive, negative, neutral, or mixed.

### Extract Key Points

Pulls out the most important takeaways as a structured list.

### Improve Writing

Suggests improvements for clarity, grammar, and style.

### Translate

Translates content to another language of your choice.

### Generate Q and A

Creates questions and answers from the document content.

### Custom Prompt

Run any custom instruction against your document. Examples:

- Extract all dates and deadlines
- Rewrite in a formal tone
- List all action items
- Create a presentation outline

## How it works

1. Click an AI action on any document
2. Your encrypted API key is decrypted in memory
3. Document content is sent to your chosen provider
4. Results are displayed alongside the document in real-time

Your document content is sent to the AI provider you configured. R's DocManager does not store AI responses.

## Tips

- Groq is free and fast, great for getting started
- Longer documents produce better summaries
- Custom prompts are the most flexible option
