"use client";
import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
  message?: string;
  onRetry?: () => void;
};

type State = { hasError: boolean; error: Error | null };

class Boundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Intentionally no toast here to avoid double messaging; callers may toast.
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught: ", error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    // Caller onRetry can trigger re-fetch in client components
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border rounded bg-red-50 text-red-700 text-sm p-3 flex items-center justify-between" role="alert" aria-live="polite">
          <div className="pr-3 truncate">
            {this.props.message || "Something went wrong loading this section."}
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="text-xs border rounded px-2 py-1 bg-white hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export default function ErrorBoundary(props: Props) {
  // Provide a default onRetry that refreshes the current route
  const router = useRouter();
  const onRetry = props.onRetry ?? (() => router.refresh());
  return <Boundary {...props} onRetry={onRetry} />;
}
