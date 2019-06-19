<h1 align="center">Welcome to twitter-bot 👋</h1>
<p>
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
</p>

> Discord bot that allows you to follow twitter users, then sends any tweets to a specific Discord channel.

## Installing dependencies

```shell
npm i
```

## Configuration

Create a `.env` file (or as environment variables) at the root of the repository with those keys from the Twitter API, the discord API and the POSTGRESQL url:
```
CONSUMER_KEY=
CONSUMER_SECRET=
ACCESS_TOKEN_KEY=
ACCESS_TOKEN_SECRET=
DISCORD_TOKEN=
DATABASE_URL=
```

## Usage

```sh
npm run start
```

Once the bot is up and running, here is the discord commands:
```
!list // List followed users
!follow username // Adds a user to the list
!remove username // Removes a user from the list
```

## Dependencies

```
"dependencies": {
    "discord.io": "github:izy521/discord.io",
    "dotenv": "^6.1.0",
    "pg": "^7.10.0",
    "twit": "^2.2.11"
}
```

## Author

👤 **Patrice Lynde**

* Github: [@patricelynde](https://github.com/patricelynde)
