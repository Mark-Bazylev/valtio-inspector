import { subscribe, snapshot } from "valtio";

export interface InspectorOptions {
  name?: string;
  readonly?: boolean;
}

// Helper to detect if a store is from derive-valtio (all getters, no setters)
function autoDetectDerived(store: any): boolean {
  try {
    const descriptors = Object.getOwnPropertyDescriptors(store);
    const keys = Object.keys(descriptors);
    if (keys.length === 0) return false;

    return keys.every(
      (key) =>
        typeof descriptors[key]?.get === "function" &&
        descriptors[key]?.set === undefined,
    );
  } catch (e) {
    return false;
  }
}

// Safely strips out symbols and converts functions to structured metadata
function sanitizePayload(payload: any) {
  try {
    return JSON.parse(
      JSON.stringify(payload, (_key, value) => {
        if (typeof value === "function") {
          return {
            __valtio_type: "function",
            name: value.name || "anonymous",
            isAsync: value.constructor.name === "AsyncFunction",
            args: value.length,
          };
        }
        if (typeof value === "symbol") {
          return value.toString();
        }
        return value;
      }),
    );
  } catch (error) {
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

  // 1. Auto-detect if it's derived/readonly!
  const isReadOnly =
    options.readonly !== undefined
      ? options.readonly
      : autoDetectDerived(store);

  // Helper to broadcast the current state (used on init and handshakes)
  const broadcastInit = () => {
    window.postMessage(
      sanitizePayload({
        source: "valtio-inspector-app",
        type: "INIT",
        store: storeName,
        readonly: isReadOnly,
        data: snapshot(store),
      }),
      "*",
    );
  };

  // 2. Broadcast the initial state
  broadcastInit();

  // 3. Broadcast updates
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

  // 4. Listen for Extension Commands (Time Travel & Handshakes)
  const messageListener = (event: MessageEvent) => {
    if (
      event.source !== window ||
      event.data?.source !== "valtio-inspector-ext"
    ) {
      return;
    }

    // Handshake: If the extension just opened, it will ask for the current state
    if (event.data.type === "REQUEST_INIT") {
      broadcastInit();
      return;
    }

    // Ensure the message is meant for this specific store
    if (event.data.store !== storeName) {
      return;
    }

    // Time Travel: Only allow restore if the store is NOT read-only
    if (event.data.type === "RESTORE" && !isReadOnly) {
      Object.assign(store, event.data.state);
    }
  };

  window.addEventListener("message", messageListener);

  return () => {
    unsubscribeStore();
    window.removeEventListener("message", messageListener);
  };
}
