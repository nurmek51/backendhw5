import ChatView from "@/modules/chat-view/ui/chat-view";
import { Routes, Route, Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import A2AChatView from "@/modules/a2a-chat/ui/a2a-chat-view";

function App() {
  return (
    <div className="flex flex-col h-screen">
      <nav className="p-4 bg-gray-900 text-white flex justify-center space-x-4">
        <Link to="/v2v">
          <Button variant="ghost" className="text-white hover:bg-gray-700">V2V Chat</Button>
        </Link>
        <Link to="/a2a">
          <Button variant="ghost" className="text-white hover:bg-gray-700">A2A Chat</Button>
        </Link>
      </nav>
      <main className="flex-grow">
        <Routes>
          <Route path="/v2v" element={<ChatView />} />
          <Route path="/a2a" element={<A2AChatView />} />
          <Route path="*" element={<ChatView />} /> {/* Default route */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
