import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

type ApiError = {
    mensage: string;
}

export function useApiError() {
  const { toast } = useToast();

  function handleError(error: unknown) {
    toast({
      variant: "destructive",
      title: "Erro",
      description: getErrorMessage(error),
    });
  }

  return { handleError };
}