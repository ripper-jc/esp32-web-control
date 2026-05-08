import { Link } from "react-router-dom";

const steps = [
  {
    title: "1. Prepare your ESP32",
    content: "Get a NodeMCU-32S or compatible ESP32 board. Connect it to your computer via USB.",
  },
  {
    title: "2. Configure WiFi credentials",
    content: "Edit include/secrets.h in the firmware project. Set WIFI_SSID and WIFI_PASSWORD to your home WiFi network.",
  },
  {
    title: "3. Set WebSocket endpoint",
    content: "In secrets.h, set WS_HOST to your API Gateway endpoint (e.g. ffcridbwn6.execute-api.eu-north-1.amazonaws.com), WS_PORT to 443, and WS_URL to /dev?clientType=device&deviceId=YOUR_DEVICE_ID. Choose a unique deviceId.",
  },
  {
    title: "4. Flash the firmware",
    content: "Open the esp32-websockets project in PlatformIO. Click Upload (or run pio run --target upload). Wait for the flash to complete.",
  },
  {
    title: "5. Monitor the connection",
    content: "Open the Serial Monitor (115200 baud). You should see 'WiFi Connected' followed by 'WS Connected'. The built-in LED will turn solid.",
  },
  {
    title: "6. Configure pins",
    content: "Your device should now appear on the Devices page. Click 'Manage pins' to add GPIO pins — set the pin number, label, mode (output/input), and category.",
  },
  {
    title: "7. Assign to a room",
    content: "Click 'Edit' on the device card to give it a name and assign it to a room. You can create rooms in Settings.",
  },
  {
    title: "8. Start controlling",
    content: "Toggle output pins from the dashboard. Set up scenes for multi-device control. Create automation rules for hands-free operation.",
  },
];

export default function PairingWizard() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link to="/settings" className="hover:text-brand-400 transition-colors">Settings</Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400">Pair New Device</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Pair a New Device</h1>
      <p className="text-gray-500 mb-8">Follow these steps to connect an ESP32 to your smart home.</p>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="card">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/devices" className="btn-primary">Go to Devices</Link>
      </div>
    </div>
  );
}
