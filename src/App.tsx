import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

//const socket: Socket = io("http://localhost:3001"); // Asegúrate de que el backend esté corriendo
const socket: Socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:3001");

interface Message {
  userId: string;
  username: string;
  message: string;
}

const App: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  useEffect(() => {
    socket.on("messageHistory", (history: Message[]) => {
      setMessages(history);
    });

    socket.on("message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // Mostrar "escribiendo" cuando otro usuario está escribiendo
    socket.on("typing", (username: string) => {
      setTypingUser(username);
    });

    // Ocultar "escribiendo" cuando el usuario deja de escribir
    socket.on("stopTyping", () => {
      setTypingUser(null);
    });

    return () => {
      socket.off("messageHistory")
      socket.off("message");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, []);

  const sendUsername = () => {
    if (username.trim()) {
      socket.emit("setUsername", username);
      setIsUsernameSet(true);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("message", {
        username: username,
        message: message,
      });
      setMessage("");
      socket.emit("stopTyping");
    }
  };

  const handleTyping = () => {
    socket.emit("typing", username);

    // Enviar "stopTyping" si no se escribe en 2 segundos
    setTimeout(() => {
      socket.emit("stopTyping");
    }, 2000);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Chat en Tiempo Real</h1>

      {!isUsernameSet ? (
        <>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Escribe tu nombre..."
          />
          <button onClick={sendUsername}>Entrar al chat</button>
        </>
      ) : (
        <>
          <div>
            {messages.map((msg, index) => (
              <p key={index}>
                <strong>{msg.username}:</strong> {msg.message}
              </p>
            ))}
            {typingUser && (
              <p style={{ fontStyle: "italic", color: "gray" }}>
                {typingUser} está escribiendo...
              </p>
            )}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
          }}
            placeholder="Escribe un mensaje..."
          />
          <button onClick={sendMessage}>Enviar</button>
        </>
      )}
    </div>
  );
};

export default App;
