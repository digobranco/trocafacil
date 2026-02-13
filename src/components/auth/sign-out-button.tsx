'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SignOutButton() {
    const router = useRouter()
    const supabase = createClient()

    async function signOut() {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <Button variant="ghost" onClick={signOut}>
            Sair
        </Button>
    )
}
