import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TheftDetector from "./components/TheftDetector";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <header className="bg-gray-800 p-4 shadow-md">
          <h1 className="text-2xl font-bold">Theft Detector</h1>
          <p className="text-sm text-gray-400">
            With Indian Voice Alerts (English &amp; Hindi)
          </p>
        </header>
        <main className="flex-grow p-4">
          <TheftDetector />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
