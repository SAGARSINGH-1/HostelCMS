"use client"

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react"
import { cn } from "../../lib/utils"

const PopoverContext = createContext(null)

// Root
function Popover({ children, open, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setOpen = (val) => {
    if (isControlled) {
      onOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  const triggerRef = useRef(null)
  const contentRef = useRef(null)

  return (
    <PopoverContext.Provider
      value={{ isOpen, setOpen, triggerRef, contentRef }}
    >
      {children}
    </PopoverContext.Provider>
  )
}

// Trigger
function PopoverTrigger({ children, asChild = false }) {
  const { setOpen, isOpen, triggerRef } = useContext(PopoverContext)

  const child = React.Children.only(children)

  return React.cloneElement(child, {
    ref: triggerRef,
    onClick: (e) => {
      setOpen(!isOpen)
      child.props.onClick?.(e)
    },
  })
}

// Anchor (optional dummy)
function PopoverAnchor({ children }) {
  return children
}

// Content
function PopoverContent({
  className,
  align = "start",
  sideOffset = 4,
  focusRef,
  children,
}) {
  const { isOpen, setOpen, triggerRef, contentRef } =
    useContext(PopoverContext)

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  })

  // Position calculation
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()

    let left = rect.left
    if (align === "center") {
      left = rect.left + rect.width / 2
    } else if (align === "end") {
      left = rect.right
    }

    setPosition({
      top: rect.bottom + sideOffset,
      left,
    })
  }, [isOpen, align, sideOffset])

  // Outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target) &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false)
        focusRef?.current?.focus()
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focus handling
  useEffect(() => {
    if (isOpen && focusRef?.current) {
      requestAnimationFrame(() => {
        focusRef.current.focus()
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 50,
      }}
      className={cn(
        "bg-white dark:bg-gray-800 cursor-pointer border rounded-md shadow-md p-4 w-72",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }