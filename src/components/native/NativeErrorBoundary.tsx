import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isNative, appLifecycle } from '@/lib/capacitor';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NativeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  private handleRestart = async () => {
    if (isNative()) {
      // On native, exit and let OS restart
      await appLifecycle.exitApp();
    } else {
      // On web, reload
      window.location.reload();
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          
          <h1 className="text-xl font-semibold mb-2">
            Noget gik galt
          </h1>
          
          <p className="text-muted-foreground mb-6 max-w-sm">
            Vi beklager ulejligheden. Prøv venligst at genstarte appen.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={this.handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Prøv igen
            </Button>
            
            <Button onClick={this.handleRestart} className="gap-2">
              Genstart App
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-8 p-4 bg-muted rounded-lg text-xs text-left overflow-auto max-w-full">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
