import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

async function validateToken(target: string) {
  const token = localStorage.getItem("userToken");
  const userId = localStorage.getItem("userId");

  console.debug("[validateToken] token:", token);
  console.debug("[validateToken] userId:", userId);
  console.debug("[validateToken] target:", target);

  if (!token || !userId) {
    console.warn("[validateToken] Token ou userId ausente");
    return false;
  }

  try {
    const response = await fetch("http://10.151.1.54:8000/v1/valid/authorization/token", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target, userId }),
    });

    console.debug("[validateToken] status:", response.status);

    if (response.status === 204) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("[validateToken] erro na requisição:", error);
    return false;
  }
}

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  // ❗ Prevenção de loop infinito: garante que o toast só será exibido uma vez
  const toastShownRef = useRef(false);

  useEffect(() => {
    const check = async () => {
      console.debug("[ProtectedRoute] Validando token para rota:", location.pathname);

      const ok = await validateToken(location.pathname);

      console.debug("[ProtectedRoute] Resultado da validação:", ok);

      setIsValid(ok);
    };

    check();
  }, [location.pathname]);

  // Fallback durante validação
  if (isValid === null) {
    console.debug("[ProtectedRoute] estado isValid = null, exibindo fallback...");
    return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 animate-pulse">
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary"></div>
            <div className="h-3 w-3 rounded-full bg-primary/70"></div>
            <div className="h-3 w-3 rounded-full bg-primary/40"></div>
        </div>
        <p className="text-sm text-muted-foreground">Aguarde...</p>
        </div>
    );
  }

  // Caso inválido → mostrar toast apenas 1 vez → redirecionar
  if (!isValid) {
    if (!toastShownRef.current) {
      toastShownRef.current = true;

      toast({
        title: "Erro!",
        description:
          "Você não tem permissão para acessar esta página. Redirecionando para a home...",
      });

      console.warn("[ProtectedRoute] Acesso negado para a rota:", location.pathname);
    }

    return <Navigate to="/login" replace />;
  }

  console.debug("[ProtectedRoute] Acesso permitido. Renderizando componente.");
  return children;
};
