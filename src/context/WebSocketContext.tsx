import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useAuth } from "./AuthContext";

type WebSocketContextType = {
  sendMessage: (msg: string) => void;
  lastMessage: MessageEvent | null;
  readyState: ReadyState;
  wsConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType>(null!);

const WS_URL = (import.meta.env.VITE_WEBSOCKET_URL as string) || null;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const { lastMessage, sendMessage, readyState } = useWebSocket(
    isAuthenticated ? WS_URL : null,
    { shouldReconnect: () => true, reconnectInterval: 3000 },
  );

  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  const stableSend = useRef((msg: string) => sendMessageRef.current(msg)).current;

  return (
    <WebSocketContext.Provider value={{ sendMessage: stableSend, lastMessage, readyState, wsConnected: readyState === ReadyState.OPEN }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWS() {
  return useContext(WebSocketContext);
}
