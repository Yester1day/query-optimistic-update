import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './App.css'
import {Todo} from "./todo";


const client = new QueryClient()

export default function App() {
    return (
        <QueryClientProvider client={client}>
            <Todo/>
            <ReactQueryDevtools initialIsOpen/>
        </QueryClientProvider>
    )
}