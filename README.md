<h1><a href="https://call.hossain.cc"><img width="400" alt="LibreCall Logo" src="/doc/LibreCall.png"></a></h1>

#### [Demo](https://call.hossain.cc) &nbsp; · &nbsp; [Report a bug](https://github.com/kazisean/Libre-call/issues/new) &nbsp; · &nbsp; [Installation](#Installation)

Open-source, self-hosted platform for real-time video communication. 

---


## What is LibreCall?

LibreCall enables self-hosted, instant, anonymous video calls through WebRTC, achieving low latency calls without requiring user accounts or personal data. Perfect for teams and individuals who prioritize self-hosted and performance.

#### Key Features

- **Anonymous Communication**: No accounts, no tracking, just connect and communicate
- **Low Latency**: Smooth video conversations
- **Self-Hostable**: Full control over your communication infrastructure
- **Lightweight**: Minimal server requirements with most processing happening on clients
- **1 on 1 Meeting**: Currently supports only 1 on 1 meeting with multi-user calls coming soon

#### 🤖 Supported Platforms : 

- Chrome, Firefox, Safari and other WebRTC-compatible browsers
- Desktop and mobile devices
- Any platform capable of running modern web browsers

## 📚 Technical Architecture

LibreCall built on the following technologies to deliver a lightweight yet powerful communication platform:

- **Frontend**: React with TypeScript.
- **Build System**: Vite.
- **Communication**: WebRTC for direct audio/video streams
- **Signaling**: Firebase Firestore for efficient connection establishment
- **Deployment**: Static files that can be hosted anywhere


## Installation 

Setting up your own LibreCall instance takes just a few minutes:

1. **Clone the repository**
   ```bash
   git clone https://github.com/kazisean/Libre-call.git
   cd Libre-call
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore database in your project
   - Set up the following data model:
     - `calls` collection to store offer/answer objects
     - Each call document contains `answerCandidates` and `offerCandidates` subcollections


4. **Configure environment**
   - Create a `.env` file with your Firebase credentials & your own stun server link:
   ```
   VITE_API_KEY=
   VITE_AUTH_DOMAIN=
   VITE_PROJECT_ID=
   VITE_STORAGE_BUCKET=
   VITE_MESSAGING_SENDER_ID=
   VITE_APP_ID=
   VITE_MEASUREMENT_ID=
   VITE_STUN_SERVER_1 = 
   VITE_STUN_SERVER_2 = 
   ```

5. **Build and deploy**
   ```bash
   npm run build
   ```
   - Deploy the contents of the `dist` directory to any static hosting provider

To start the development server:
```bash
npm run dev
```


## 📧 Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, your help makes LibreCall better for everyone.

- **Report bugs** by opening an issue
- **Suggest features** that would make LibreCall more useful
- **Submit pull requests** with code / implementation improvements

-- TODO --
- [ ] Implement multi-user call feature.
- [ ] Implement end to end encryption.
- [ ] Fix auto-disconnect of user when 3rd user join.
- [ ] Implement screen sharing feature

## License

[MIT License]