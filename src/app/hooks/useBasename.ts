'use client'
import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { base } from 'wagmi/chains'
import { type Address } from 'viem'

/**
 * Basenames Hook for Base Chain
 * 
 * Uses direct contract calls to Base's ENS infrastructure to resolve
 * Basenames (e.g., "alice.base.eth") from wallet addresses.
 * 
 * Usage:
 *   const { basename, isLoading } = useBasename(address)
 */

// Base mainnet contract addresses
const REVERSE_REGISTRAR = '0x79EA96012eEa67A83431F1701B3dFf7e37F9E282' as const
const ENS_REGISTRY = '0xb94704422c2a1e396835a571837aa5ae53285a95' as const

// ABI for ReverseRegistrar.node(address)
const REVERSE_REGISTRAR_ABI = [
    {
        inputs: [{ name: 'addr', type: 'address' }],
        name: 'node',
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'pure',
        type: 'function',
    },
] as const

// ABI for Registry.resolver(bytes32)
const REGISTRY_ABI = [
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'resolver',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// ABI for Resolver.name(bytes32)
const RESOLVER_ABI = [
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

export interface BasenameResult {
    basename: string | null
    avatar: string | null
    isLoading: boolean
    error: Error | null
}

export function useBasename(address: `0x${string}` | undefined): BasenameResult {
    const [basename, setBasename] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const publicClient = usePublicClient({ chainId: base.id })

    useEffect(() => {
        if (!address || !publicClient) {
            setBasename(null)
            return
        }

        const fetchBasename = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Step 1: Get the reverse node for this address
                const node = await publicClient.readContract({
                    address: REVERSE_REGISTRAR,
                    abi: REVERSE_REGISTRAR_ABI,
                    functionName: 'node',
                    args: [address],
                })

                // Step 2: Get the resolver for this node from the registry
                const resolver = await publicClient.readContract({
                    address: ENS_REGISTRY,
                    abi: REGISTRY_ABI,
                    functionName: 'resolver',
                    args: [node],
                })

                // Step 3: If resolver exists, get the name
                if (resolver && resolver !== '0x0000000000000000000000000000000000000000') {
                    const name = await publicClient.readContract({
                        address: resolver,
                        abi: RESOLVER_ABI,
                        functionName: 'name',
                        args: [node],
                    })

                    setBasename(name && name !== '' ? name : null)
                } else {
                    setBasename(null)
                }
            } catch (e) {
                console.debug('Basename resolution failed:', e)
                setError(e as Error)
                setBasename(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBasename()
    }, [address, publicClient])

    return {
        basename,
        avatar: null, // Avatar requires additional implementation
        isLoading,
        error,
    }
}

/**
 * Display a shortened address or Basename
 */
export function useDisplayName(address: `0x${string}` | undefined): {
    displayName: string
    isBasename: boolean
    avatar: string | null
    isLoading: boolean
} {
    const { basename, avatar, isLoading } = useBasename(address)

    if (!address) {
        return {
            displayName: '',
            isBasename: false,
            avatar: null,
            isLoading: false,
        }
    }

    // If we have a Basename, use it; otherwise show shortened address
    const displayName = basename || `${address.slice(0, 6)}...${address.slice(-4)}`

    return {
        displayName,
        isBasename: !!basename,
        avatar,
        isLoading,
    }
}
