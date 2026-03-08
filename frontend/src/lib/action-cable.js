"use client";

import { createConsumer } from "@rails/actioncable";

const toCableUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_API_CABLE_URL;
  if (explicit) return explicit;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (!apiUrl) return "ws://localhost:3000/cable";

  const parsed = new URL(apiUrl);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  parsed.pathname = "/cable";
  parsed.search = "";
  parsed.hash = "";

  return parsed.toString();
};

let cableConsumer = null;

export const getCableConsumer = () => {
  if (!cableConsumer) {
    cableConsumer = createConsumer(toCableUrl());
  }

  return cableConsumer;
};
