# BullRun Financial Simulator

This is a Next.js-based financial learning and trading simulation application built with Firebase and Genkit.

## Getting Started Locally

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) (which comes with Node.js)

### 1. Install Dependencies

Once you have the codebase on your laptop, navigate to the root directory of the project in your terminal and run the following command to install all the necessary packages listed in `package.json`:

```bash
npm install
```

### 2. Set Up Environment Variables

For the application's Firebase and Generative AI features to work correctly, you need to provide credentials and API keys.

1.  Create a new file in the root directory named `.env.local`.
2.  Add the following variables to your `.env.local` file:

    ```env
    # For client-side AI features (if any)
    NEXT_PUBLIC_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # For server-side AI features and Firebase Admin SDK
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/firebase-service-account-key.json"
    ```

**How to get these values:**
*   `GEMINI_API_KEY`: You can get this from [Google AI Studio](https://aistudio.google.com/app/apikey).
*   `GOOGLE_APPLICATION_CREDENTIALS`: This is for the Firebase Admin SDK used in server-side actions.
    1.  Go to your Firebase project settings in the [Firebase Console](https://console.firebase.google.com/).
    2.  Navigate to the "Service accounts" tab.
    3.  Click "Generate new private key" to download a JSON file.
    4.  Save this file on your computer and update the path in `.env.local` to point to its location.

**Important**: The `.env.local` file should not be committed to version control. It is included in the `.gitignore` file by default in Next.js projects.

### 3. Run the Development Server

After installing the dependencies and setting up your environment variables, you can start the application with the following command:

```bash
npm run dev
```

This will start the Next.js development server. You can now open your web browser and navigate to **http://localhost:9002** to see your application in action.

The terminal window where you ran the command will show logs and any errors that occur. The application will automatically reload if you make changes to the code.
