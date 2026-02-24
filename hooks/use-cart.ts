"use client"

import { useState, useEffect } from "react"

export interface CartItem {
  productId: string
  name: string
  price: number // Price in INR (decimal)
  imageUrl?: string
  quantity: number
}

const CART_STORAGE_KEY = "merceton_cart"

export function useCart(storeSlug: string) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const storageKey = `${CART_STORAGE_KEY}_${storeSlug}`

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setCart(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load cart:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart))
      } catch (error) {
        console.error("Failed to save cart:", error)
      }
    }
  }, [cart, storageKey, isLoaded])

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setCart((current) => {
      const existing = current.find((i) => i.productId === item.productId)
      if (existing) {
        return current.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...current, { ...item, quantity }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  return {
    cart,
    isLoaded,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }
}
