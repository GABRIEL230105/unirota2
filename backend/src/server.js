const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const rideParticipantRoutes = require("./routes/rideParticipantRoutes");
const messageRoutes = require("./routes/messageRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] } });

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.get("/", (req, res) => res.json({ message: "API UniRota funcionando!" }));
app.get("/health", (req, res) => res.json({ status: "online", service: "UniRota API", database: "PostgreSQL", timestamp: new Date() }));

app.use("/auth", authRoutes);
app.use("/rides", rideRoutes);
app.use("/ride-participants", rideParticipantRoutes);
app.use("/messages", messageRoutes);
app.use("/ratings", ratingRoutes);
app.use("/users", userRoutes);
app.use("/notifications", notificationRoutes);
app.use("/activities", activityRoutes);

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);
  socket.on("join_user_room", (userId) => socket.join(userId));
  socket.on("send_message", (data) => {
    const { receiverId, message } = data;
    io.to(receiverId).emit("receive_message", message);
  });
  socket.on("disconnect", () => console.log("Usuário desconectado:", socket.id));
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
