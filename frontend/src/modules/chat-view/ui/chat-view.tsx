import { Mic, StopCircle, Volume2, Video } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useVoiceChatStore } from "../model/voice-chat-store";
import { motion } from "framer-motion";

export default function ChatView() {
  const { status, isListening, toggle, response, stopPlayback, ws } = useVoiceChatStore();

  // Function to simulate sending a video chunk
  const sendVideoChunk = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const dummyVideoChunk = "base64_encoded_video_chunk_data_example"; // Replace with actual base64 data
      ws.send(JSON.stringify({
        type: "video_chunk",
        content: dummyVideoChunk
      }));
      console.log("Simulated video chunk sent!");
    } else {
      console.warn("WebSocket not open for sending video chunk.");
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex flex-col items-center justify-center px-6 py-10 font-mono">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 mb-12 tracking-widest text-center shadow-neon"
      >
        🎙️ SYNTHWAVE VOICE AI
      </motion.h1>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative rounded-full w-80 h-80 sm:w-96 sm:h-96 shadow-neon-lg bg-gray-900 border-4 border-fuchsia-500 flex items-center justify-center"
      >
        <div
          className={`absolute w-full h-full rounded-full transition-all duration-700 ease-in-out ${isListening
              ? "ring-8 ring-fuchsia-400 scale-110 animate-pulse shadow-neon-fuchsia"
              : "ring-4 ring-gray-700"}
          }`}
        />
        <Button
          onClick={toggle}
          disabled={status === "responding"}
          size="icon"
          className={`z-10 w-24 h-24 rounded-full p-6 shadow-neon-button transition-all duration-300 ${isListening
              ? "bg-fuchsia-600 hover:bg-fuchsia-700"
              : "bg-indigo-600 hover:bg-indigo-700"}
          }`}
        >
          <Mic className="w-10 h-10 text-white" />
        </Button>
      </motion.div>

      <div className="mt-8 text-cyan-400 text-2xl font-bold text-center animate-pulse-slow">
        {status === "responding"
          ? "Processing..."
          : isListening
          ? "Say something"
          : "Press to start"
        }
      </div>

      {response && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-6 bg-gray-800 rounded-xl shadow-neon-inner border-2 border-fuchsia-500 max-w-3xl text-center text-gray-100 flex items-center gap-4"
        >
          <Volume2 className="text-cyan-400 w-8 h-8 shrink-0" />
          <span className="text-lg sm:text-xl leading-relaxed">{response}</span>
        </motion.div>
      )}

      <div className="mt-8 flex space-x-4">
        <Button
          onClick={stopPlayback}
          variant="outline"
          className="flex items-center gap-3 bg-gray-800 text-fuchsia-400 border-2 border-fuchsia-500 hover:bg-gray-700 hover:text-fuchsia-300 shadow-neon-sm"
        >
          <StopCircle className="w-6 h-6" />
          STOP RESPONSE
        </Button>

        <Button
          onClick={sendVideoChunk}
          variant="outline"
          className="flex items-center gap-3 bg-gray-800 text-cyan-400 border-2 border-cyan-500 hover:bg-gray-700 hover:text-cyan-300 shadow-neon-sm"
        >
          <Video className="w-6 h-6" />
          SEND VIDEO
        </Button>
      </div>
    </div>
  );
}
