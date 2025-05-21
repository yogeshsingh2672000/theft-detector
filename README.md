# Theft Detector with Indian Voice Alerts

A React application that detects potential theft or security threats using AI vision analysis, and provides voice alerts in Indian voices (both English and Hindi).

## Features

- **Camera Monitoring**: Capture images from your device's camera
- **AI Analysis**: Process images to detect potential security threats
- **Indian Voice Alerts**: Get spoken notifications with realistic Indian voices
  - Hindi voices: Male and Female
  - Indian English voices: Male and Female
- **Pricing Tiers**: Choose between standard (lower cost) or premium (real-time) voice options

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Configuration

### OpenAI Vision API

The application uses OpenAI's Vision API for image analysis. You'll need to enter your API key in the application.

### Azure Voice Configuration

For Indian voice support, you'll need:

1. An Azure Speech Service key
2. Select your region (Central India recommended for Indian voices)
3. Choose your pricing tier:
   - **Standard**: Lower cost, slightly slower response
   - **Premium**: Higher cost, real-time voice response

## Voice Options

### Hindi Voices

- Female (Swara Neural): Natural-sounding Hindi female voice
- Male (Madhur Neural): Natural-sounding Hindi male voice

### Indian English Voices

- Female (Neerja Neural): English with authentic Indian female accent
- Male (Prabhat Neural): English with authentic Indian male accent

## Usage Tips

- For the most natural-sounding alerts, use premium voices
- Hindi voices are best for Hindi-speaking users
- Indian English voices provide clear alerts with authentic Indian accents
- Adjust rate, pitch, and volume to customize the voice experience

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- OpenAI Vision API
- Azure Cognitive Services Speech SDK

## Privacy & Security

- Your OpenAI API key is stored only in your browser's local storage and is never sent to our servers
- Image processing occurs directly between your browser and OpenAI's servers
- No images or analysis results are stored beyond your current session

## Cost Management

To manage API costs, the application includes:

- Configurable analysis intervals (longer intervals = fewer API calls)
- Manual analysis mode to control when API calls are made
- Image compression before sending to the API
- Caching of recent results

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for providing the Vision API
- The React team for the incredible framework
- All contributors and users of this project
