# Octies Telegram Bot

Octies Telegram Bot is a Node.js application that interacts with users through Telegram, providing various functionalities such as user registration, referral system, subscription checking, and more.

## Features

- **User Registration:** Register users with their Telegram ID.
- **Referral System:** Generate referral codes and links, track referred users, and reward them.
- **Subscription Checking:** Check if users are subscribed to a specific Telegram channel and award coins accordingly.
- **User Data Management:** Update user information and calculate coins based on account age and subscription status.
- **Leaderboard:** View top users based on their coin count.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/kamardjoba/octiesback.git
    cd octiesback
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    PORT=3001
    TOKEN=your_telegram_bot_token
    MONGODB_URL=your_mongodb_connection_string
    CHANNEL_ID=your_telegram_channel_id
    ```

## Usage

1. Start the server:
    ```bash
    npm start
    ```

2. The server will run on `http://localhost:3001`.

## API Endpoints

- **GET /user-count:** Get the total number of registered users.
- **POST /generate-referral:** Generate a referral code for a user.
- **POST /check-subscription:** Check if a user is subscribed to the channel.
- **POST /add-referral:** Add a referred user and reward the referrer.
- **POST /check-subscription-and-update:** Check subscription status and update user data.
- **POST /get-referred-users:** Get a list of users referred by a specific user.
- **POST /get-coins:** Calculate and return the number of coins for a user.
- **GET /user-rank:** Get the rank of a user based on their coin count.
- **GET /leaderboard:** Get the top 50 users based on their coin count.
- **GET /get-user-data:** Get detailed data for a specific user.

## Contributing

Feel free to open issues or submit pull requests if you find any bugs or have feature suggestions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Node.js
- Express.js
- Mongoose
- Telegram Bot API
- dotenv
- axios

