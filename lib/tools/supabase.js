export async function supabaseQuery({ params, projectId }) {
  if (!projectId) throw new Error("projectId required");
  const { table, filter, select = "*", limit } = params || {};
  if (!table) throw new Error("table required");

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error("Supabase env vars missing");

  const path = `${base}/rest/v1/${projectId}_${table}`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    Prefer: "return=representation"
  };

  const qp = new URLSearchParams();
  qp.set("select", select);
  if (limit) qp.set("limit", String(limit));
  if (filter && filter.field && typeof filter.value !== "undefined") {
    qp.set(`${filter.field}`, `eq.${filter.value}`);
  }

  const url = `${path}?${qp.toString()}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
