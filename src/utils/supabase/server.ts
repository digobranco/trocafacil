import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            global: {
                fetch: (url, options) => {
                    return fetch(url, {
                        ...options,
                        // @ts-ignore - Some environments support highwatermark or low-level tweaks
                        // but standard fetch doesn't have a direct "retry" here.
                        // We just ensure standard options are passed.
                        next: { revalidate: 0 } // Ensure no accidental caching at fetch level for auth
                    })
                }
            }
        }
    )
}
