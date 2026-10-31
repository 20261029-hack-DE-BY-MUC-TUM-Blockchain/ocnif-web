"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api/client";
import {
  type Capabilities,
  type Conversation,
  type Locale,
  parseEvent,
  type RuntimeEvent,
  type User,
} from "@/lib/types/runtime";
import {
  applyEvent,
  applySubmission,
  initialState,
  type RunState,
} from "./state";
export function useWorkspace(
  locale: Locale,
  onEvent: (event: RuntimeEvent) => void,
) {
  const router = useRouter();
  const socket = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [user, setUser] = useState<User | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [list, setList] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("");
  const [state, setState] = useState<RunState>(initialState);
  const [connection, setConnection] = useState("connecting");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all([api.session(), api.conversations()])
      .then(([session, items]) => {
        if (!alive) return;
        setUser(session.user);
        setCapabilities(session.capabilities);
        setList(items);
        if (items[0]) setSelected(items[0].id);
        else
          api
            .createConversation()
            .then((item) => {
              if (alive) {
                setList([item]);
                setSelected(item.id);
              }
            })
            .catch(() => setConnection("disconnected"));
      })
      .catch((error) => {
        if (error instanceof api.ApiError && error.status === 401)
          router.replace("/");
        else setConnection("disconnected");
      });
    return () => {
      alive = false;
    };
  }, [router]);
  useEffect(() => {
    void retry; // An explicit reconnect creates a new WebSocket and reloads persisted history.
    if (!selected) return;
    let alive = true;
    let ws: WebSocket | null = null;
    setConnection("connecting");
    setState(initialState);
    api
      .history(selected)
      .then((history) => {
        if (!alive) return;
        let restored = { ...initialState, messages: history.messages };
        for (const event of history.events)
          restored = applyEvent(restored, event);
        setState({ ...restored, messages: history.messages });
        ws = new WebSocket(api.socketUrl(selected));
        socket.current = ws;
        ws.onopen = () => setConnection("connected");
        ws.onclose = () => {
          if (alive) setConnection("disconnected");
        };
        ws.onerror = () => {
          if (alive) setConnection("disconnected");
        };
        ws.onmessage = (message) => {
          try {
            const event = parseEvent(JSON.parse(message.data));
            if (event.type === "sync.required") {
              setRetry((value) => value + 1);
              return;
            }
            setState((current) => applyEvent(current, event));
            onEventRef.current(event);
          } catch {
            setState((current) => ({
              ...current,
              error: "Invalid server event",
            }));
          }
        };
      })
      .catch(() => {
        if (alive) setConnection("disconnected");
      });
    return () => {
      alive = false;
      ws?.close();
      socket.current = null;
    };
  }, [selected, retry]);
  const send = useCallback(
    (content: string, requestId = crypto.randomUUID()) => {
      if (!content.trim() || socket.current?.readyState !== WebSocket.OPEN)
        return false;
      socket.current.send(
        JSON.stringify({
          type: state.active ? "steer" : "message",
          content: content.trim(),
          locale,
          request_id: requestId,
        }),
      );
      setState((current) =>
        applySubmission(current, content, requestId, new Date().toISOString()),
      );
      return true;
    },
    [locale, state.active],
  );
  function control(payload: Record<string, string>) {
    if (socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(JSON.stringify(payload));
  }
  async function newConversation() {
    try {
      const item = await api.createConversation();
      setList((current) => [item, ...current]);
      setSelected(item.id);
    } catch {
      setConnection("disconnected");
    }
  }
  async function signOut() {
    await api.logout();
    router.push("/");
  }
  return {
    user,
    capabilities,
    list,
    selected,
    setSelected,
    state,
    connection,
    send,
    control,
    newConversation,
    signOut,
    reconnect: () => setRetry((value) => value + 1),
  };
}
