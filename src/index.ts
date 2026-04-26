import { subscribe, snapshot } from "valtio";

export interface InspectorOptions {
  name?: string;
}

// Safely strips out functions, symbols, and non-cloneable data
function sanitizePayload(payload: any) {
  try {
    return JSON.parse(
      JSON.stringify(payload, (_key, value) => {
        if (typeof value === "function") {
          return `[Function: ${value.name || "anonymous"}]`;
        }
        if (typeof value === "symbol") {
          return value.toString();
        }
        return value;
      }),
    );
  } catch (error) {
    // Fallback if there is a massive circular reference issue
    return {
      source: "valtio-inspector-app",
      type: "ERROR",
      message:
        "State contains circular references that could not be serialized.",
    };
  }
}

export function inspectValtio(store: object, options: InspectorOptions = {}) {
  const storeName = options.name || "valtio-store";

  // 1. Broadcast the initial state (entire object sanitized)
  window.postMessage(
    sanitizePayload({
      source: "valtio-inspector-app",
      type: "INIT",
      store: storeName,
      data: snapshot(store),
    }),
    "*",
  );

  // 2. Broadcast updates (entire object sanitized, including ops!)
  const unsubscribeStore = subscribe(
    store,
    (ops) => {
      window.postMessage(
        sanitizePayload({
          source: "valtio-inspector-app",
          type: "STATE_UPDATE",
          store: storeName,
          operations: ops,
          data: snapshot(store),
        }),
        "*",
      );
    },
    true,
  );

  // 3. Listen for Time Travel
  const messageListener = (event: MessageEvent) => {
    if (
      event.source !== window ||
      event.data?.source !== "valtio-inspector-ext" ||
      event.data?.store !== storeName
    ) {
      return;
    }

    if (event.data.type === "RESTORE") {
      Object.assign(store, event.data.state);
    }
  };

  window.addEventListener("message", messageListener);

  return () => {
    unsubscribeStore();
    window.removeEventListener("message", messageListener);
  };
}
