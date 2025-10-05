import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "react-toastify";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            networkMode: "online", // fail immediately if offline
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // cache 5 min
            retry: 1,
            onError: (err) => {
                toast.error(err.message || "Something went wrong");
            },
        },
        mutations: {
            networkMode: "online", // fail immediately if offline
            retry: false,          // no retries for mutations like login/register
            onError: (error) => {
                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Something went wrong";

                toast.error(message);
            },
        }
    }
});

export const QueryProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};