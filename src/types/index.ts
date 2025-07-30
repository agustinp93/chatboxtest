export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Prefs = {
  name: string;
  country: string;
  continent: string;
  destination: string;
};
