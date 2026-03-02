'use server'

import { cookies } from 'next/headers'

const COOKIE_NAME = 'impersonating_tenant_id'

/**
 * Get the tenant ID being impersonated, or null if not impersonating.
 * This is a server-only function — the cookie is httpOnly and not accessible from the client.
 */
export async function getImpersonatingTenantId(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get(COOKIE_NAME)?.value || null
}

/**
 * Set the impersonating tenant ID cookie.
 * Security: the caller MUST verify super_admin role before calling this.
 */
export async function setImpersonatingTenantId(tenantId: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, tenantId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 4, // 4 hours max — auto-expires for safety
    })
}

/**
 * Clear the impersonation cookie.
 */
export async function clearImpersonation(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
