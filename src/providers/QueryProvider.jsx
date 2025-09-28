import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "react-toastify";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // cache 5 min
            retry: 1,
            onError: (err) => {
                toast.error(err.message || "Something went wrong");
            },
        },
        mutations: {
            onError: (err) => {
                toast.error(err.message || "Something went wrong");
            }
        }
    },
    mutations: {
        retry: false,
    },
});

export const QueryProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};