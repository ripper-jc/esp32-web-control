export type PinConfig = {
  label: string;
  mode: string;
  lastValue: number;
  category: string;
};

export type Device = {
  deviceId: string;
  deviceKey: string;
  mode: number;
  sensorReadings?: Record<string, unknown>;
  name?: string;
  roomId?: string;
  pins?: Record<string, PinConfig>;
  floorX?: number;
  floorY?: number;
};

export type Room = {
  roomId: string;
  name: string;
};

export type ScheduleSlot = {
  time: string;
  temperature: number;
};

export type Schedule = ScheduleSlot[][];

export type Scene = {
  sceneId: string;
  name: string;
  icon: string;
  actions: SceneAction[];
};

export type SceneAction = {
  deviceId: string;
  pin: string;
  value: number;
};

export type PinGroup = {
  groupId: string;
  name: string;
  icon: string;
  members: { deviceId: string; pin: string }[];
};

export type WeatherData = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
};

export type UsageStats = {
  devices: {
    deviceId: string;
    name: string;
    pinCount: number;
    eventsDay: number;
    eventsWeek: number;
  }[];
};
