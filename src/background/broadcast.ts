const chan = new BroadcastChannel("learnflow");
export const bus = {
  emit: (type: string, payload?: any) => chan.postMessage({ type, payload }),
  on  : (cb: (msg: { type: string; payload: any }) => void) =>
    chan.addEventListener("message", (e) => cb(e.data))
};
