'use client'
import { useDisplayName } from '../hooks/useBasename'

interface PlayerNameProps {
    address: `0x${string}` | undefined
    className?: string
    showAvatar?: boolean
}

/**
 * PlayerName Component
 * 
 * Displays a player's Basename (if available) or a shortened address.
 * Optionally shows the avatar.
 * 
 * Usage:
 *   <PlayerName address={playerAddress} showAvatar />
 */
export function PlayerName({ address, className = '', showAvatar = false }: PlayerNameProps) {
    const { displayName, isBasename, avatar, isLoading } = useDisplayName(address)

    if (!address) {
        return <span className={className}>Unknown</span>
    }

    if (isLoading) {
        return (
            <span className={`${className} animate-pulse`}>
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
        )
    }

    return (
        <span className={`${className} inline-flex items-center gap-2`}>
            {showAvatar && avatar && (
                <img
                    src={avatar}
                    alt={displayName}
                    className="w-6 h-6 rounded-full"
                />
            )}
            <span className={isBasename ? 'font-medium text-blue-400' : ''}>
                {displayName}
            </span>
        </span>
    )
}

export default PlayerName
