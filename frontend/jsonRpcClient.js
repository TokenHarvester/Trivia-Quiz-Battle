const RPC_URL = "https://rpc.gorbagana.wtf";

export async function sendRpcRequest(method, params) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  };

  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.error) {
    console.error("RPC Error:", json.error);
    throw json.error;
  }
  return json.result;
}
