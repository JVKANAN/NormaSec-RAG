export async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    let detail = 'Não foi possível concluir a operação.'
    try { detail = (await res.json()).detail ?? detail } catch { /* corpo não-JSON */ }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}
