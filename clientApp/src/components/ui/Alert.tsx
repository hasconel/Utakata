import { AlertMessage } from "@/types/app";

export default function Alert({ message, type }: AlertMessage) {
  const styles = {
    error: "text-red-500 dark:text-red-400",
    info: "text-gray-600 dark:text-gray-300",
    success: "text-green-500 dark:text-green-400",
    warning: "text-yellow-500 dark:text-yellow-400",
  };

  return (
    <p
      className={`text-center mb-4 ${styles[type]}`}
      aria-live="polite"
      role={type === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}