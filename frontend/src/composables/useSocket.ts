import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

let socket: Socket | null = null

export function useSocket() {
    const auth = useAuthStore()

    function connect() {
        if (socket?.connected) return
        socket = io('http://localhost:3000', {
            auth: { token: auth.token },
        })
    }

    function disconnect() {
        socket?.disconnect()
        socket = null
    }

    function on(event: string, handler: (...args: any[]) => void) {
        socket?.on(event, handler)
    }

    function off(event: string, handler: (...args: any[]) => void) {
        socket?.off(event, handler)
    }

    return { connect, disconnect, on, off }
}
