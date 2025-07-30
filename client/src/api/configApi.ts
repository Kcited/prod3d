// /client/src/api/configApi.ts

export async function saveConfiguration(config: any) {
  const res = await fetch("/api/configurations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    throw new Error("Failed to save configuration");
  }

  const data = await res.json();
  return data.id; // Return saved config ID
}

export async function getConfiguration(id: string) {
  const res = await fetch(`/api/configurations/${id}`);

  if (!res.ok) {
    throw new Error("Configuration not found");
  }

  const config = await res.json();
  return config;
}
