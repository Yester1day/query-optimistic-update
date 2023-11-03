import * as React from 'react'
import axios from 'axios'

import {
    useQuery,
    useQueryClient,
    useMutation,
} from '@tanstack/react-query'




type Todos = {
    items: readonly {
        id: string
        text: string
    }[]
    ts: number
}

async function fetchTodos(): Promise<Todos> {
    const res = await axios.get('/api/data')
    return res.data
}

function useTodos() {
    return useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
}

export function Todo() {
    const queryClient = useQueryClient()
    const [text, setText] = React.useState('')
    const { isFetching, ...queryInfo } = useTodos()

    const addTodoMutation = useMutation({
        mutationFn: (newTodo) => axios.post('/api/data', { text: newTodo }),
        // When mutate is called:
        onMutate: async (newTodo: string) => {
            setText('')
            await queryClient.cancelQueries({ queryKey: ['todos'] })

            const previousTodos = queryClient.getQueryData<Todos>(['todos'])

            // ниже реализация оптимистик апдейт
            if (previousTodos) {
                queryClient.setQueryData<Todos>(['todos'], {
                    ...previousTodos,
                    items: [
                        ...previousTodos.items,
                        { id: Math.random().toString(), text: newTodo },
                    ],
                })
            }

            return { previousTodos }
        },
        //в случае провала мутации..
        onError: (err, variables, context) => {
            if (context?.previousTodos) {
                queryClient.setQueryData<Todos>(['todos'], context.previousTodos)
            }
        },
        // перезапись после успеха или ошибки
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['todos'] })
        },
    })

    return (
        <div>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    addTodoMutation.mutate(text)
                }}
            >
                <input
                    type="text"
                    onChange={(event) => setText(event.target.value)}
                    value={text}
                />
                <button disabled={addTodoMutation.isLoading}>Create</button>
            </form>
            <br />
            {queryInfo.isSuccess && (
                <>
                    <div>
                        Updated At: {new Date(queryInfo.data.ts).toLocaleTimeString()}
                    </div>
                    <ul>
                        {queryInfo.data.items.map((todo) => (
                            <li key={todo.id}>{todo.text}</li>
                        ))}
                    </ul>
                    {isFetching && <div>Updating in background...</div>}
                </>
            )}
            {queryInfo.isLoading && 'Loading'}
            {queryInfo.error instanceof Error && queryInfo.error.message}
        </div>
    )
}
