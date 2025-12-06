import { io } from "socket.io-client";
import { BASE_URL } from "../src/config";

const API_URL = process.env.REACT_APP_API_URL || BASE_URL;

export const socket = io(API_URL, {
  transports: ["websocket"],
});
