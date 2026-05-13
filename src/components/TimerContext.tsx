import { createContext, useContext, useEffect, useRef, useState } from "react";
import { addMinutesForToday, getMinutesForToday } from "../utils/focusMinutesStorage";

type Mood = "Low" | "Medium" | "High";

interface Session {
  id: number;
  minutes: number;
  completed: boolean;
  isTest: boolean;
  timeStr: string;
  mood: Mood;
}

interface TimerContextType {
  secondsLeft: number | null;
  sessionDuration: number;
  isRunning: boolean;
  totalMinutes: number;
  sessions: Session[];
  mood: Mood;
  setMood: (m: Mood) => void;
  startWithMinutes: (minutes: number) => void;
  stopTimer: () => void;
  addTestMinutes: () => void;
  isBreak: boolean;
  startBreakTimer: () => void;
  showProgressBar: boolean;
  setShowProgressBar: (show: boolean) => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState(() => getMinutesForToday());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mood, setMood] = useState<Mood>("Medium");
  const [isBreak, setIsBreak] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(true);

  const [endTime, setEndTime] = useState<number | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  const sessionStartRef = useRef<number | null>(null);
  const isBreakRef = useRef(false);

  useEffect(() => {
    sessionStartRef.current = sessionStart;
  }, [sessionStart]);

  useEffect(() => {
    isBreakRef.current = isBreak;
  }, [isBreak]);

  useEffect(() => {
    alarmRef.current = new Audio("/bell.mp3");
  }, []);

  const playAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.currentTime = 0;

      alarmRef.current
        .play()
        .catch((err) => console.log("Audio play blocked:", err));
    }
  };

  const finishSession = (
    completed: boolean,
    isTest = false,
    opts?: { skipFocusStats?: boolean }
  ) => {
    const start = sessionStartRef.current;

    const elapsedMs = start ? Date.now() - start : 0;

    const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60000));

    const skipFocusStats = opts?.skipFocusStats ?? false;

    if (!skipFocusStats) {
      addMinutesForToday(elapsedMinutes);
      setTotalMinutes(getMinutesForToday());

      const now = new Date();

      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setSessions((prev) => [
        {
          id: Date.now(),
          minutes: elapsedMinutes,
          completed,
          isTest,
          timeStr,
          mood,
        },
        ...prev,
      ]);
    }

    setSessionStart(null);
    sessionStartRef.current = null;
    setEndTime(null);
  };

  useEffect(() => {
    if (!isRunning || !endTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);

        setSecondsLeft(0);
        setIsRunning(false);

        playAlarm();

        if (!isBreak) {
          finishSession(true);
        }

        setIsBreak(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, endTime]);

  const startWithMinutes = (minutes: number) => {
    const start = Date.now();
    const duration = minutes * 60;
    const end = start + duration * 1000;

    setSecondsLeft(duration);
    setSessionDuration(duration);
    setSessionStart(start);
    sessionStartRef.current = start;
    setEndTime(end);
    setIsBreak(false);
    setIsRunning(true);
  };

  const startBreakTimer = () => {
    const start = Date.now();
    const duration = 15 * 60;
    const end = start + duration * 1000;

    setIsBreak(true);
    setSecondsLeft(duration);
    setSessionDuration(duration);
    setSessionStart(start);
    sessionStartRef.current = start;
    setEndTime(end);
    setIsRunning(true);
  };

  const stopTimer = () => {
    const onBreak = isBreakRef.current;
    setIsRunning(false);
    finishSession(false, false, { skipFocusStats: onBreak });
    setSecondsLeft(null);
    setSessionDuration(0);
    setIsBreak(false);
  };

  const addTestMinutes = () => {
    addMinutesForToday(15);
    setTotalMinutes(getMinutesForToday());
  };

  return (
    <TimerContext.Provider
      value={{
        secondsLeft,
        sessionDuration,
        isRunning,
        totalMinutes,
        sessions,
        mood,
        setMood,
        startWithMinutes,
        stopTimer,
        addTestMinutes,
        isBreak,
        startBreakTimer,
        showProgressBar,
        setShowProgressBar,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimer() {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used inside TimerProvider");
  }

  return context;
}
