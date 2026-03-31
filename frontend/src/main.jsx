/**
 * @file main.jsx
 * @description Archivo del sistema main.jsx.
 * @module Module
 * @path /frontend/src/main.jsx
 * @lastUpdated 2026-03-25
 * @author Sistema (Auto-Generated)
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import './i18n'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

// Configure TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider defaultTheme="light" storageKey="theme">
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
)
