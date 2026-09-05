import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/auth-context";

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const instance = io(window.location.origin, {
      query: {
        userId: user.id,
        role: user.role || "agent",
      },
      transports: ["polling", "websocket"],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    instance.on("connect", () => {
      console.log("🟢 Global socket connected:", instance.id);
    });

    instance.on("disconnect", () => {
      console.log("🔴 Global socket disconnected");
    });

    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
