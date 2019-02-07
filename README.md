# Discord Twitter Bot

### Description

Discord bot that allows you to follow twitter users, then sends any tweets to a specific Discord channel.

### Installing

```shell
npm i
```

### Configuration

Create a `.env` file (or as environment variables) at the root of the repository with those keys from the Twitter API and the discord API:
```
CONSUMER_KEY=
CONSUMER_SECRET=
ACCESS_TOKEN_KEY=
ACCESS_TOKEN_SECRET=
DISCORD_TOKEN=
```

### Running the app
```shell
npm start
```

### Dependencies

```
"dependencies": {
    "discord.io": "github:izy521/discord.io",
    "dotenv": "^6.1.0",
    "twit": "^2.2.11"
}
```
